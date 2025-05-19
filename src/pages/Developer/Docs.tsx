import { useState } from 'react';
import { SearchIcon, Book, Send, Users, ChevronDown } from 'lucide-react';
import PageMeta from "../../utils/common/PageMeta";
import Input from '../../utils/form/input/InputField';

interface DocSection {
  title: string;
  description: string;
  endpoints: {
    method: string;
    path: string;
    description: string;
    request?: string;
    response?: string;
  }[];
}

export default function Docs() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections: DocSection[] = [
    {
      title: "Authentication",
      description: "Learn how to authenticate your API requests using API keys",
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/auth/validate",
          description: "Validate your API key",
          request: `curl -X GET 'https://api.example.com/v1/auth/validate' \\
-H 'Authorization: Bearer YOUR_API_KEY'`,
          response: `{
  "status": "valid",
  "expires_at": "2024-12-31T23:59:59Z"
}`
        }
      ]
    },
    {
      title: "SMS",
      description: "Send SMS messages and check delivery status",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/sms/send",
          description: "Send an SMS message",
          request: `curl -X POST 'https://api.example.com/v1/sms/send' \\
-H 'Authorization: Bearer YOUR_API_KEY' \\
-H 'Content-Type: application/json' \\
-d '{
  "to": "+1234567890",
  "message": "Hello world"
}'`,
          response: `{
  "message_id": "msg_123abc",
  "status": "sent"
}`
        }
      ]
    }
  ];

  return (
    <div className="  p-4 sm:p-6 lg:p-8">
      <PageMeta title="Luco API Documentation" description="API documentation and guides" />

      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">API Documentation</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Explore our API endpoints and learn how to integrate with our services
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-10 pr-4 py-4"
                />
              </div>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="p-6 space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {section.title === "Authentication" ? (
                      <Book className="h-5 w-5 text-primary" />
                    ) : section.title === "SMS" ? (
                      <Send className="h-5 w-5 text-primary" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{section.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{section.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedSection === section.title ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {expandedSection === section.title && (
                  <div className="p-4 space-y-4">
                    {section.endpoints.map((endpoint, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                            endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm text-zinc-900 dark:text-gray-300">{endpoint.path}</code>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-gray-400">{endpoint.description}</p>
                        
                        {endpoint.request && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Request</p>
                            <pre className="p-3 bg-zinc-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
                              {endpoint.request}
                            </pre>
                          </div>
                        )}
                        
                        {endpoint.response && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Response</p>
                            <pre className="p-3 bg-zinc-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
                              {endpoint.response}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
