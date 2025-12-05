"use server";

import { GoogleGenAI } from "@google/genai";

// In a production environment, this should be in an environment variable
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function generateResponse(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return { text: response.text, error: null };
  } catch (error) {
    console.error("Error generating content:", error);
    return { text: null, error: error instanceof Error ? error.message : String(error) };
  }
}
