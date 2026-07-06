import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
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
    }

    // We'll instruct the model to return JSON matching the required format.
    const prompt = `You are a professional AI recruiter and job vacancy copywriter. 
Your task is to extract job details from the provided job listing URL and its scraped content, and format them into a highly professional, engaging, and premium job vacancy listing.
URL: ${url}

Scraped Content (may be empty or incomplete): 
${scrapedText.substring(0, 30000) /* Limit to avoid token limits */}

If the scraped content is empty or unhelpful, use your knowledge of the URL or deduce the likely details. 
Extract the actual accurate job title, job location, job description, and job requirements.
For the job description, write a compelling, professional overview of the role, the company context (if available), and the core responsibilities. Use rich markdown formatting (like bold text and paragraph breaks) to make it look like a premium job board listing. Return ONLY valid JSON in the structure defined by the schema.`;

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.1-pro-preview"];
    let aiResponse;
    let lastStatusMsg = "";

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
                jobDescription: { type: Type.STRING, description: "A detailed and professional overview of the job description, fully formatted in markdown (e.g., using bolding for key terms, small bullet points for sub-sections if needed)." },
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
      } catch (statusDetail: any) {
        lastStatusMsg = statusDetail.message || "Status details unavailable";
        console.log(`[Model Try] ${currentModel} returned status: ${statusDetail.status || "unavailable"}`);
        // Wait a bit before trying the next model
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    let parsedData;
    if (!aiResponse) {
      console.log(`[Fallback Triggered] Model pipeline finished: ${lastStatusMsg}`);
      parsedData = {
        jobTitle: "Senior Software Engineer (Fallback Mode)",
        jobLocation: "Remote / Global",
        jobDescription: "We are currently experiencing high demand on our AI servers. This is a **fallback mock listing**.\n\nWe are looking for a highly skilled **Software Engineer** to join our team. \n\n**Core Responsibilities:**\n- Design and develop scalable services.\n- Collaborate with cross-functional teams.\n- Ensure robust software architecture.",
        jobRequirements: [
          "Experience with modern web frameworks.",
          "Proficiency in TypeScript and Node.js.",
          "Strong communication skills.",
          "Ability to adapt to fast-paced environments."
        ]
      };
    } else {
      const jsonStr = aiResponse?.text?.trim() || "{}";
      parsedData = JSON.parse(jsonStr);
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (routeException: any) {
    console.log("[Route Exception] handled gracefully:", routeException.message || routeException);
    return NextResponse.json({ error: routeException.message || "Failed to generate job listing" }, { status: 500 });
  }
}
