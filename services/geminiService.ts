
import { GoogleGenAI } from "@google/genai";

const AI_MODEL_TEXT = 'gemini-3-flash-preview';
const AI_MODEL_IMAGE = 'gemini-2.5-flash-image';
const AI_MODEL_VIDEO = 'veo-3.1-fast-generate-preview';

export class GeminiService {
  private static getClient() {
    // Directly using process.env.API_KEY as per instructions
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateMessage(recipient: string, mood: string): Promise<string> {
    const ai = this.getClient();
    const prompt = `Write a short, heartfelt Valentine's Day message for ${recipient || 'someone special'}. The mood should be ${mood}. Keep it under 200 characters. Return only the message text.`;
    
    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL_TEXT,
        contents: prompt,
      });
      return response.text?.trim() || "Happy Valentine's Day!";
    } catch (error) {
      console.error("Error generating message:", error);
      throw error;
    }
  }

  static async generateImage(prompt: string): Promise<string> {
    const ai = this.getClient();
    const finalPrompt = `A high-quality romantic background for a Valentine card. ${prompt}. Artistic, soft lighting.`;
    
    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL_IMAGE,
        contents: { parts: [{ text: finalPrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image generated.");
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  static async generateVideo(prompt: string, onProgress: (msg: string) => void): Promise<string> {
    // Re-instantiate to get latest key if changed via openSelectKey
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const finalPrompt = `A cinematic, romantic Valentine's Day scene: ${prompt}. Slow motion, beautiful lighting.`;
    
    try {
      onProgress("Warming up the AI cinematic engine...");
      let operation = await ai.models.generateVideos({
        model: AI_MODEL_VIDEO,
        prompt: finalPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        onProgress("The AI is rendering your romantic masterpiece... (typically 1-2 mins)");
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed.");

      onProgress("Perfecting the final cut...");
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) throw new Error("Failed to download video.");
      
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Video generation error:", error);
      throw error;
    }
  }
}
