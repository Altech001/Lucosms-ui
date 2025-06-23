/* eslint-disable react-hooks/exhaustive-deps */
import  { useState, useEffect } from 'react';
import { Search, Book, Send, Users, ChevronDown, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageMeta from '../../utils/common/PageMeta';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filteredSections, setFilteredSections] = useState<DocSection[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

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

  useEffect(() => {
    let result = [...sections];

    // Apply search
    if (searchQuery) {
      result = result
        .map(section => ({
          ...section,
          endpoints: section.endpoints.filter(
            endpoint =>
              section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }))
        .filter(section => section.endpoints.length > 0);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(section => section.title === filterCategory);
    }

    // Apply method filter
    if (filterMethod !== 'all') {
      result = result
        .map(section => ({
          ...section,
          endpoints: section.endpoints.filter(endpoint => endpoint.method === filterMethod)
        }))
        .filter(section => section.endpoints.length > 0);
    }

    setFilteredSections(result);
  }, [searchQuery, filterCategory, filterMethod]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Code copied to clipboard!' });
    setTimeout(() => setSnackbar({ open: false, message: '' }), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-6 sm:p-8 lg:p-10">
      <PageMeta title="Luco API Documentation" description="Comprehensive API documentation and guides for developers" />

      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white font-[Outfit]">
                  Lucosms Developer API Documentation
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-[Outfit] leading-relaxed">
                  Explore our comprehensive API endpoints and learn how to integrate seamlessly with Lucosms services.
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {sections.map(section => (
                      <option key={section.title} value={section.title}>{section.title}</option>
                    ))}
                  </select>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="p-8 space-y-4">
            <AnimatePresence>
              {filteredSections.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">No results found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters.</p>
                </motion.div>
              ) : (
                filteredSections.map((section) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 hover:from-gray-100 hover:via-white hover:to-gray-100 dark:hover:from-zinc-700 dark:hover:via-zinc-800 dark:hover:to-zinc-700 transition-all duration-300"
                      aria-expanded={expandedSection === section.title}
                      aria-controls={`section-${section.title}`}
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
                      <ChevronDown
                        className={`h-5 w-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          expandedSection === section.title ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSection === section.title && (
                        <motion.div
                          id={`section-${section.title}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-6 grid grid-cols- lg:grid-cols-2 gap-4 overflow-hidden"
                        >
                          {section.endpoints.map((endpoint, index) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-zinc-700 rounded-lg border border-gray-200 lg:w-[50em] sm:w-fit dark:border-zinc-700 p-4 shadow-sm"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <span
                                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    endpoint.method === 'GET'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}
                                >
                                  {endpoint.method}
                                </span>
                                <code className="text-sm text-zinc-900 dark:text-gray-200 font-mono">
                                  {endpoint.path}
                                </code>
                              </div>
                              <p className="text-sm  text-zinc-600 dark:text-zinc-300 font-[Outfit] mb-3">
                                {endpoint.description}
                              </p>

                              {endpoint.request && (
                                <div className="space-y-2 mb-3">
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-[Outfit]">
                                      Request
                                    </p>
                                    <button
                                      onClick={() => handleCopy(endpoint.request ?? '')}
                                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="Copy request"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <pre className="p-4 bg-zinc-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
                                    {endpoint.request}
                                  </pre>
                                </div>
                              )}

                              {endpoint.response && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-[Outfit]">
                                      Response
                                    </p>
                                    <button
                                      onClick={() => handleCopy(endpoint.response ?? '')}
                                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="Copy response"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <pre className="p-4 bg-zinc-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
                                    {endpoint.response}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {snackbar.open && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white">
            {snackbar.message}
            <button
              onClick={() => setSnackbar({ open: false, message: '' })}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
