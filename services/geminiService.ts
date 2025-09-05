import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateRelatedWords(word: string, existingWords: string[]): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate between 5 and 10 diverse but conceptually related words for the term "${word}". Do not include any of the following words in your response: ${existingWords.join(', ')}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A related word",
              },
            },
          },
          required: ["words"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && Array.isArray(result.words)) {
      // Perform a case-insensitive client-side check to ensure no duplicates are added
      const lowercasedExistingWords = new Set(existingWords.map(w => w.toLowerCase()));
      const uniqueNewWords = result.words.filter((newWord: string) => 
        !lowercasedExistingWords.has(newWord.toLowerCase())
      );
      return uniqueNewWords;
    }
    
    return [];

  } catch (error) {
    console.error("Error generating related words:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
}