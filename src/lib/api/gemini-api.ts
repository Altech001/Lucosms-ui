// Gemini API integration
// This file contains functions to interact with the Gemini API

const GEMINI_API_KEY = "AIzaSyBefEfnVTBw2BjHSoPgRx372NEuxh0irbM";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: message }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    // Assuming the response structure includes a 'candidates' array with 'content' and 'parts'
    const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from bot.';
    return botResponse;

  } catch (error) {
    console.error('Error sending message to Gemini API:', error);
    return 'Error: Could not get a response from the bot.';
  }
};
