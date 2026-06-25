import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // API routing
  app.post("/api/generate-job", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

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
        console.error("Scraping failed, falling back to URL-only prompt", scrapeError.message);
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
For the job description, write a compelling, professional overview of the role, the company context (if available), and the core responsibilities. Use rich markdown formatting (like bold text and paragraph breaks) to make it look like a premium job board listing. Return ONLY valid JSON in the structure defined by the schema.`;

      let aiResponse;
      let retries = 2;
      let currentModel = "gemini-3.5-flash";

      while (retries >= 0) {
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
        } catch (error: any) {
          console.error(`Error with model ${currentModel}:`, error.message);
          retries--;
          
          if (retries < 0) {
            throw error;
          }
          
          if (error.status === 503 || error.message?.includes("503") || error.message?.includes("high demand") || error.status === "UNAVAILABLE") {
            console.log(`Model overloaded, retrying... (${retries} retries left)`);
            if (retries === 0) {
              // Last attempt, fallback to a lighter model to ensure it works
              console.log("Falling back to gemini-3.1-flash-lite");
              currentModel = "gemini-3.1-flash-lite";
            }
            // Wait 1 second before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }

      const jsonStr = aiResponse?.text?.trim() || "{}";
      const parsedData = JSON.parse(jsonStr);

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate job listing" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: express v5 uses '*all' but here package.json shows 'express': '^4.21.2'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
