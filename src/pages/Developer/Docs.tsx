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
    <div className="p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-white via-gray-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 min-h-screen">
      <PageMeta title="Luco API Documentation" description="API documentation and guides" />

      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white font-[Outfit]">
                  Lucosms Developer API Documentation
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-[Outfit] leading-relaxed">
                  Explore our comprehensive API endpoints and learn how to integrate seamlessly with our services.
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="p-8 space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 hover:from-gray-100 hover:via-white hover:to-gray-100 dark:hover:from-zinc-700 dark:hover:via-zinc-800 dark:hover:to-zinc-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {section.title === "Authentication" ? (
                      <Book className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    ) : section.title === "SMS" ? (
                      <Send className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    ) : (
                      <Users className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    )}
                    <div className="text-left">
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-white font-[Outfit]">
                        {section.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-[Outfit]">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                    expandedSection === section.title ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {expandedSection === section.title && (
                  <div className="p-6 space-y-6">
                    {section.endpoints.map((endpoint, index) => (
                      <div key={index} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm text-zinc-900 dark:text-gray-200 font-mono">
                            {endpoint.path}
                          </code>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 font-[Outfit]">
                          {endpoint.description}
                        </p>
                        
                        {endpoint.request && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-[Outfit]">
                              Request
                            </p>
                            <pre className="p-4 bg-zinc-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
                              {endpoint.request}
                            </pre>
                          </div>
                        )}
                        
                        {endpoint.response && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-[Outfit]">
                              Response
                            </p>
                            <pre className="p-4 bg-zinc-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
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