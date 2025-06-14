/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getGeminiResponse(
  prompt: string,
  knowledgeBase: any
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const promptText = `You are LucoBot, a helpful assistant for LucoSMS.
Here's the knowledge base: ${JSON.stringify(knowledgeBase)}

Instructions:
1. ALWAYS check the knowledge base first for LucoSMS-specific questions
2. Use exact responses from knowledge base for menu options (1-5)
3. Be concise and friendly, limit to 150 words
4. Format responses with clear line breaks
5. For unknown topics, use knowledge base defaults

User Query: ${prompt}`;

    const result = await model.generateContent(promptText);
    if (!result?.response) {
      throw new Error('No response from Gemini');
    }

    const text = result.response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini');
    }
    
    return text;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return ''; // Return empty string to fallback to knowledge base
  }
}
