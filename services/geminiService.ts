
import { GoogleGenAI } from "@google/genai";

/**
 * AI-powered rating of contribution proofs.
 */
export const rateProofText = async (proofText: string): Promise<number> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rate the following proof title from 1 to 5 based on technical complexity and likely operational impact. Return only the digit.
      
      Proof: "${proofText}"`,
      config: {
        temperature: 0.1,
      }
    });

    const rating = parseInt(response.text?.trim() || "3");
    return isNaN(rating) ? 3 : Math.min(Math.max(rating, 1), 5);
  } catch (error) {
    console.error("[AXIS AI] Rating Failure:", error);
    return 3;
  }
};

/**
 * Generates technical operator summaries for profiles.
 */
export const generateProfileSummary = async (jobberData: any): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a one-sentence technical justification for this operator node: ${JSON.stringify(jobberData)}`,
      config: {
        systemInstruction: "You are the AXIS Network Core Intelligence. Be brief, professional, and technical.",
      }
    });

    return response.text || "Operator sync in progress.";
  } catch (error) {
    console.error("[AXIS AI] Summary Failure:", error);
    return "AI justification module offline.";
  }
};
