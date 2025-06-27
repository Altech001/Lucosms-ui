import { GoogleGenerativeAI } from '@google/generative-ai';
import { Node, Edge } from 'reactflow';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateFlowFromPrompt(prompt: string): Promise<{ nodes: Node[]; edges: Edge[] }> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        responseMimeType: 'application/json',
      },
    });

    const fullPrompt = `
      You are an expert at creating flow chart diagrams.
      Based on the following description, generate a JSON object representing a flow chart with nodes and edges, compatible with React Flow.
      
      Description: "${prompt}"

      The JSON object must have two keys: "nodes" and "edges".

      For each node in the "nodes" array, provide:
      - "id": A unique string identifier.
      - "position": An object with "x" and "y" coordinates. Please arrange them logically.
      - "data": An object with a "label" (a concise title), "sublabel" (a short description), and "type" (e.g., 'input', 'output', 'database', 'service').

      For each edge in the "edges" array, provide:
      - "id": A unique string identifier (e.g., "e1-2").
      - "source": The "id" of the source node.
      - "target": The "id" of the target node.
      - "label": (Optional) A label for the edge.
      - "animated": (Optional) set to true for a moving effect.

      Ensure the JSON is valid and well-structured.
    `;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    if (!parsed.nodes || !parsed.edges) {
      throw new Error('Invalid JSON structure from Gemini');
    }

    return parsed;

  } catch (error) {
    console.error('Error with Gemini API:', error);
    // In case of error, return a single error node
    return {
      nodes: [
        {
          id: 'error-node',
          position: { x: 250, y: 150 },
          data: { 
            label: 'Error', 
            sublabel: 'Could not generate flow. Please check the console.',
            type: 'default'
          },
        },
      ],
      edges: [],
    };
  }
}

// Define interfaces for better type safety
interface SMSHistory {
  id: number;
  recipient: string;
  message: string;
  status: string;
  cost: number;
  created_at: string;
}

interface BillingHistory {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    payment_method: string;
    transaction_id: string;
}

export async function generateFlowFromData(
  type: 'billing' | 'sms',
  data: (BillingHistory | SMSHistory)[]
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  let prompt = '';

  if (type === 'billing') {
    prompt = `
      Based on the following recent billing history data, create a flow chart diagram showing the movement of funds for a couple of transactions.
      Start with a 'User' node, show the 'Payment Method', a 'Payment Gateway' service, and then the final 'Billed Amount' and 'Status'.
      Data: ${JSON.stringify(data, null, 2)}
    `;
  } else if (type === 'sms') {
    prompt = `
      Based on the following recent SMS history data, create a flow chart diagram showing the message journey for a few example messages.
      Start with 'LucoSMS Platform', show the message being sent to a 'Recipient', and then its final 'Delivery Status'.
      Represent different statuses (e.g., 'sent', 'failed') with different paths if possible.
      Data: ${JSON.stringify(data, null, 2)}
    `;
  }

  if (!prompt) {
    return { nodes: [], edges: [] };
  }

  return generateFlowFromPrompt(prompt);
}
