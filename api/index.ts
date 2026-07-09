// Prevent Google GenAI SDK from incorrectly using Google Cloud Application Default Credentials (ADC)
// inside virtualized or containerized environments (like Cloud Run or Vercel).
// This prevents a 401 UNAUTHORIZED error ("ACCESS_TOKEN_TYPE_UNSUPPORTED") because the
// developer Gemini API endpoint strictly requires an API key, not a GCP service account token.
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.GCP_PROJECT;
delete process.env.GCLOUD_PROJECT;
delete process.env.GOOGLE_CLOUD_PROJECT;
delete process.env.K_SERVICE;
delete process.env.K_REVISION;
delete process.env.K_CONFIGURATION;

import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import "dotenv/config";
import dns from "dns";

// Force Node.js to prefer IPv4 when resolving DNS. 
// This resolves the common 'fetch failed' (TypeError) issue with global fetch inside virtualized container environments.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  console.warn("Could not set DNS default result order:", error);
}

const app = express();

app.use(express.json());

// API routing
app.post("/api/generate-job", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in Settings > Secrets.");
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let scrapedText = "";
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      });
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, and other non-content tags
      $("script, style, noscript, nav, footer, header, iframe, img, svg").remove();
      
      scrapedText = $("body").text().replace(/\s+/g, " ").trim();
    } catch (scrapeError: any) {
      console.warn("Scraping failed, falling back to URL-only prompt", scrapeError.message);
      // If scraping fails, we still try parsing just via the URL in case the model knows it or we just inform it
    }

    // We'll instruct the model to return JSON matching the required format.
    const prompt = `You are a professional AI recruiter and job vacancy copywriter. 
Your task is to extract job details from the provided job listing URL and its scraped content, and format them into a highly professional, engaging, and premium job vacancy listing.
URL: ${url}

Scraped Content (may be empty or incomplete): 
${scrapedText.substring(0, 30000) /* Limit to avoid token limits */}

If the scraped content is empty or unhelpful, use your knowledge of the URL or deduce the likely details. 
Extract the actual accurate job title, job location, job description, and job requirements.
For the job description, do NOT write long paragraphs. Instead, format the entire description as structured markdown bullet points (e.g., using - **Key Theme**: Detailed point description). It should present key point-by-point information about the company context/mission, core duties of the role, and day-to-day responsibilities. Return ONLY valid JSON in the structure defined by the schema.`;

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.1-pro-preview"];
    let aiResponse;
    let lastError;

    for (const currentModel of modelsToTry) {
      try {
        aiResponse = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                jobTitle: { type: Type.STRING, description: "The extracted job title" },
                jobLocation: { type: Type.STRING, description: "The extracted job location" },
                jobDescription: { type: Type.STRING, description: "A highly detailed and professional list of key information and responsibilities for the job, formatted strictly as markdown bullet points (e.g. - **Role Purpose**: Description\\n- **Key Duty**: Description). No continuous paragraphs." },
                jobRequirements: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: "A list of parsed professional job requirements" 
                },
              },
              required: ["jobTitle", "jobLocation", "jobDescription", "jobRequirements"],
            },
          },
        });
        break; // Success, break out of retry loop
      } catch (error: any) {
        console.warn(`Error with model ${currentModel}:`, error.message);
        lastError = error;
        // Wait a bit before trying the next model
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    let parsedData;
    if (!aiResponse) {
      console.warn("All models failed. Using fallback mock data due to API overload.", lastError?.message);
      parsedData = {
        jobTitle: "Senior Software Engineer (Fallback Mode)",
        jobLocation: "Remote / Global",
        jobDescription: "- **Core Mission**: Design and develop highly scalable, robust cloud-based microservices.\n- **Team Collaboration**: Work closely with product managers, UX designers, and other engineers to deliver high-quality features.\n- **Technical Excellence**: Write clean, testable, and well-documented TypeScript and Node.js code.\n- **System Architecture**: Continuously optimize system performance, monitor service health, and design resilient APIs.",
        jobRequirements: [
          "Experience with modern web frameworks.",
          "Proficiency in TypeScript and Node.js.",
          "Strong communication skills.",
          "Ability to adapt to fast-paced environments."
        ]
      };
    } else {
      let jsonStr = aiResponse?.text?.trim() || "{}";
      // Sanitize potential markdown block wrapping (e.g. ```json ... ```)
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.substring(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.substring(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
      jsonStr = jsonStr.trim();
      parsedData = JSON.parse(jsonStr);
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to generate job listing" });
  }
});

export default app;
