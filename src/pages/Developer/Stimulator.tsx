import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon, PaperPlaneIcon, WifiIcon, SignalIcon, BatteryIcon } from '../../icons';
import { Settings as SettingsIcon } from 'lucide-react';
import SimulatorSidePanel from './SimulatorSidePanel';

// Define types
interface PhoneMessage {
  id: number;
  text: string;
}

const languageOptions: { [key: string]: string } = {
  python: 'Python',
  javascript: 'JavaScript',
  php: 'PHP',
  rust: 'Rust',
  ruby: 'Ruby',
  java: 'Java',
  csharp: 'C#',
  go: 'Go',
  curl: 'cURL',
};

const generateCodeSnippet = (
  language: string,
  apiKey: string,
  recipient: string,
  message: string
): string => {
  const url = 'https://lucosms-api.onrender.com/api/v1/client/send-sms';
  const safeApiKey = apiKey || 'YOUR_API_KEY';
  const safeRecipient = recipient || '+1234567890';
  const safeMessage = message || 'Testing API Request';

  const payload = {
    message: safeMessage,
    recipients: [safeRecipient],
  };
  const jsonString = JSON.stringify(payload, null, 2);
  // eslint-disable-next-line no-useless-escape
  const escapedJsonString = jsonString.replace(/"/g, '\"');

  switch (language) {
    case 'python':
      return `import requests\n\nurl = "${url}"\n\nheaders = {\n    "Content-Type": "application/json",\n    "accept": "application/json",\n    "X-API-Key": "${safeApiKey}"\n}\n\ndata = ${jsonString}\n\nresponse = requests.post(url, json=data, headers=headers)\n\nprint("Status Code:", response.status_code)\nprint("Response Body:", response.text)`;

    case 'javascript':
      return `const url = '${url}';\nconst apiKey = '${safeApiKey}';\n\nconst headers = {\n  'Content-Type': 'application/json',\n  'accept': 'application/json',\n  'X-API-Key': apiKey\n};\n\nconst data = ${jsonString};\n\nfetch(url, {\n  method: 'POST',\n  headers: headers,\n  body: JSON.stringify(data)\n})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;

    case 'php':
        return `<?php\n$url = '${url}';\n$apiKey = '${safeApiKey}';\n\n$data = json_decode('${jsonString}');\n\n$options = [\n    'http' => [\n        'header'  => "Content-type: application/json\r\n" .\n                     "accept: application/json\r\n" .\n                     "X-API-Key: " . $apiKey,\n        'method'  => 'POST',\n        'content' => json_encode($data)\n    ]\n];\n\n$context  = stream_context_create($options);\n$result = file_get_contents($url, false, $context);\n\nif ($result === FALSE) { /* Handle error */ }\n\nvar_dump($result);\n?>`;

    case 'rust':
        return `use reqwest::Client;\nuse serde_json::json;\n\n#[tokio::main]\nasync fn main() -> Result<(), reqwest::Error> {\n    let client = Client::new();\n    let url = "${url}";\n\n    let response = client.post(url)\n        .header("Content-Type", "application/json")\n        .header("accept", "application/json")\n        .header("X-API-Key", "${safeApiKey}")\n        .json(&json!(${jsonString}))\n        .send()\n        .await?;\n\n    println!("Status: {}", response.status());\n    let body = response.text().await?;\n    println!("Body: {}", body);\n\n    Ok(())\n}`;

    case 'ruby':
        return `require 'uri'\nrequire 'net/http'\nrequire 'json'\n\nurl = URI("${url}")\n\nhttp = Net::HTTP.new(url.host, url.port)\nhttp.use_ssl = true\n\nrequest = Net::HTTP::Post.new(url)\nrequest["Content-Type"] = 'application/json'\nrequest["accept"] = 'application/json'\nrequest["X-API-Key"] = '${safeApiKey}'\nrequest.body = JSON.dump(${jsonString})\n\nresponse = http.request(request)\nputs "Status Code: #{response.code}"\nputs "Response Body: #{response.read_body}"`;

    case 'java':
        return `import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\npublic class SendSms {\n    public static void main(String[] args) throws Exception {\n        HttpClient client = HttpClient.newHttpClient();\n        String json = "${escapedJsonString}";\n\n        HttpRequest request = HttpRequest.newBuilder()\n                .uri(URI.create("${url}"))\n                .header("Content-Type", "application/json")\n                .header("accept", "application/json")\n                .header("X-API-Key", "${safeApiKey}")\n                .POST(HttpRequest.BodyPublishers.ofString(json))\n                .build();\n\n        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n\n        System.out.println("Status Code: " + response.statusCode());\n        System.out.println("Response Body: " + response.body());\n    }\n}`;
    
    case 'csharp':
        return `using System;\nusing System.Net.Http;\nusing System.Text;\nusing System.Threading.Tasks;\n\nclass Program\n{\n    static async Task Main(string[] args)\n    {\n        var client = new HttpClient();\n        var request = new HttpRequestMessage(HttpMethod.Post, "${url}");\n        request.Headers.Add("accept", "application/json");\n        request.Headers.Add("X-API-Key", "${safeApiKey}");\n\n        var json = "${escapedJsonString}";\n        request.Content = new StringContent(json, Encoding.UTF8, "application/json");\n\n        var response = await client.SendAsync(request);\n        response.EnsureSuccessStatusCode();\n\n        var responseBody = await response.Content.ReadAsStringAsync();\n        Console.WriteLine($"Status Code: {response.StatusCode}");\n        Console.WriteLine($"Response Body: {responseBody}");\n    }\n}`;

    case 'go':
        return `package main\n\nimport (\n\t"bytes"\n\t"fmt"\n\t"io/ioutil"\n\t"net/http"\n)\n\nfunc main() {\n\turl := "${url}"\n\tjsonStr := []byte("${escapedJsonString}")\n\n\treq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))\n\n\treq.Header.Set("Content-Type", "application/json")\n\treq.Header.Add("accept", "application/json")\n\treq.Header.Add("X-API-Key", "${safeApiKey}")\n\n\tres, _ := http.DefaultClient.Do(req)\n\n\tdefer res.Body.Close()\n\tbody, _ := ioutil.ReadAll(res.Body)\n\n\tfmt.Println("Status Code:", res.StatusCode)\n\tfmt.Println("Response Body:", string(body))\n}`;

    case 'curl':
        return `curl -X POST '${url}' \\\n-H 'Content-Type: application/json' \\\n-H 'accept: application/json' \\\n-H 'X-API-Key: ${safeApiKey}' \\\n-d '${jsonString}'`;

    default:
      return 'Select a language to see the code snippet.';
  }
};

function Stimulator() {
  const [apiKey, setApiKey] = useState('Luco_I3jNV4wTVPjpzZvP7mp0fh8m4Oa89Jwk');
  const [recipient, setRecipient] = useState('+256708215305');
  const [message, setMessage] = useState('Testing API Request from Stimulator!');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [generatedCode, setGeneratedCode] = useState('');
  const [phoneMessages, setPhoneMessages] = useState<PhoneMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const getCodeFromGemini = async (
    language: string,
    userApiKey: string,
    userRecipient: string,
    userMessage: string
  ) => {
    setIsLoading(true);
    setError(null);

    // IMPORTANT: Replace with your actual Gemini API Key
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `Generate a code snippet in ${language} to send an SMS using the Lucosms API. 
    API Endpoint: https://lucosms-api.onrender.com/api/v1/client/send-sms
    API Key: "${userApiKey || 'Luco_API_KEY'}"
    Recipient: "${userRecipient || '+1234567890'}"
    Message: "${userMessage || 'Hello, world!'}"

    The request should be a POST request with a JSON body containing 'message' and 'recipients' (as an array of strings). The API key should be sent in the 'X-API-Key' header. Provide only the raw code, without any explanations or markdown formatting.`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch code from Gemini API.');
      }

      const data = await response.json();
      const code = data.candidates[0].content.parts[0].text.trim();
      setGeneratedCode(code);
    } catch (e) {
      setError('Could not generate code. Please check your API key and try again.');
      console.error(e);
      // Fallback to static generator on error
      const fallbackCode = generateCodeSnippet(language, userApiKey, userRecipient, userMessage);
      setGeneratedCode(fallbackCode);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey && recipient && message) {
      getCodeFromGemini(selectedLanguage, apiKey, recipient, message);
    }
  }, [selectedLanguage, apiKey, recipient, message]);

  const handleSimulate = async () => {
    if (!message.trim() || !recipient.trim() || !apiKey.trim()) {
      setError('API Key, Recipient, and Message cannot be empty.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('https://lucosms-api.onrender.com/api/v1/client/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          message: message,
          recipients: [recipient],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message. Check console for details.');
      }

      // On success, add message to phone
      const newMessage: PhoneMessage = {
        id: Date.now(),
        text: message,
      };
      setPhoneMessages(prev => [...prev, newMessage]);
      setMessage(''); // Clear input field on success
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  return (
    <div className="relative flex h-full bg-transparent dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Main Content */}
      <div className="flex-auto flex flex-col lg:flex-row p-1 gap-1 overflow-y-auto">
        {/* Phone Mockup */}
        <div className="lg:flex-1 flex justify-center items-center">
          <div className="w-80 h-[600px] bg-black rounded-[40px] border-[14px] border-black shadow-2xl relative overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-xl"></div>
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-10 px-4 flex justify-between items-center text-black dark:text-white text-xs z-10">
              <span className="text-xs">
                {new Date().toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-1">
                <SignalIcon className="w-4 h-4" />
                <WifiIcon className="w-4 h-4" />
                <BatteryIcon className="w-5 h-5" />
              </div>
            </div>
            {/* Screen Content */}
            <div className="p-4 h-full pt-10 bg-white dark:bg-gray-800 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {phoneMessages.map(msg => (
                  <div key={msg.id} className="flex justify-end">
                    <div className="bg-blue-500 text-white py-2 px-4 rounded-2xl max-w-xs shadow">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              {/* Message Input */}
              <div className="mt-2 flex items-center">
                <input type="text" readOnly value="" placeholder="iMessage" className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full py-2 px-4 focus:outline-none" />
                <button className="ml-2 p-2">
                  <PaperPlaneIcon className="w-6 h-6 text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="lg:flex-1 flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-gray-700/50 border-b border-gray-600/50">
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-gray-600 text-white border-gray-500 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.entries(languageOptions).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <button onClick={copyToClipboard} className="p-2 rounded-md hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors">
              <CopyIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-white text-lg">Generating Code...</div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10 p-4">
                <div className="text-white text-center">{error}</div>
              </div>
            )}
            <SyntaxHighlighter language={selectedLanguage} style={vscDarkPlus} customStyle={{ margin: 0, height: '100%', padding: '1rem' }}>
              {generatedCode}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      {/* Side Panel Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(true)}
        className="fixed top-1/2 right-0 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-40"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>

      <SimulatorSidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        recipient={recipient}
        setRecipient={setRecipient}
        message={message}
        setMessage={setMessage}
        handleSimulate={handleSimulate}
        isSending={isSending}
      />
    </div>
  );
}

export default Stimulator;