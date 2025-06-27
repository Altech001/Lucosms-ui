import { GoogleGenerativeAI } from '@google/generative-ai';
import { Node, Edge } from 'reactflow';
import { Transaction, SMSHistory } from '../lib/api-service';

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
export interface Template {
  name: string;
  body: string;
}

export interface UserProfile {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: { emailAddress: string }[];
    phoneNumbers: { phoneNumber: string }[];
}

// Helper to simplify data to avoid overly large prompts
function simplifyDataForPrompt(type: 'billing' | 'sms' | 'template' | 'user', data: (Transaction | SMSHistory | Template | UserProfile)[]): unknown {
  if (type === 'billing') {
    return (data as Transaction[]).slice(0, 5).map(t => ({ 
      id: t.id, 
      amount: t.amount, 
      status: t.status, 
      method: t.payment_method 
    }));
  } else if (type === 'sms') {
    return (data as SMSHistory[]).slice(0, 5).map(s => ({ 
      to: s.recipient, 
      status: s.status, 
      cost: s.cost 
    }));
  } else if (type === 'template') {
    return (data as Template[]).slice(0, 5).map(t => ({ 
      name: t.name, 
      body: t.body.substring(0, 30) + '...' 
    }));
  } else if (type === 'user') {
    const user = data[0] as UserProfile;
    return {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.emailAddresses?.[0]?.emailAddress,
      phone: user.phoneNumbers?.[0]?.phoneNumber,
    };
  }
  return {};
}

export async function generateFlowFromData(
  type: 'billing' | 'sms' | 'template' | 'user',
  data: (Transaction | SMSHistory | Template | UserProfile)[]
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const simplifiedData = simplifyDataForPrompt(type, data);
  let prompt = '';

  if (type === 'billing') {
    prompt = `
      Based on the following recent billing history data, create a flow chart diagram showing the movement of funds.
      Data: ${JSON.stringify(simplifiedData, null, 2)}
    `;
  } else if (type === 'sms') {
    prompt = `
      Based on the following recent SMS history data, create a flow chart diagram showing the message journey.
      Data: ${JSON.stringify(simplifiedData, null, 2)}
    `;
  } else if (type === 'template') {
    prompt = `
      Based on these message templates, create a flow chart showing a 'Template Library' connected to each template.
      Data: ${JSON.stringify(simplifiedData, null, 2)}
    `;
  } else if (type === 'user') {
    prompt = `
      Based on this user profile, create a flow chart visualizing the user's information.
      Data: ${JSON.stringify(simplifiedData, null, 2)}
    `;
  }

  if (!prompt) {
    return { nodes: [], edges: [] };
  }

  // Add instructions to the prompt for better structure
  const fullPrompt = prompt + `
    Instructions:
    - Create a main 'source' node (e.g., 'User', 'LucoSMS Platform').
    - For each item in the data, create a node and connect it logically.
    - Ensure all nodes are connected and the layout is clean.
    - Return a valid JSON with 'nodes' and 'edges' keys.
  `;

  return generateFlowFromPrompt(fullPrompt);
}
