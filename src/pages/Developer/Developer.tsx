/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, SVGProps } from "react";
import PageMeta from "../../utils/common/PageMeta";
import { apiService, type ApiKey } from "../../lib/api-service";
import { JSX } from "react/jsx-runtime";
import Button from "../../utils/ui/button/Button";

interface ToastMessage {
  type: "success" | "error";
  message: string;
}

export default function Developer() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApiKeys = async () => {
    try {
      const keys = await apiService.listApiKeys(1);
      setApiKeys(keys);
    } catch (error) {
      showToast("Failed to load API keys", "error");
    }
  };

  const handleGenerateKey = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.generateApiKey(1);
      await loadApiKeys();
      setIsCreateDialogOpen(false);
      showToast(result.message, "success");
    } catch (error) {
      showToast("Failed to generate API key", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateKey = async (keyId: number) => {
    try {
      await apiService.deactivateApiKey(1, keyId);
      await loadApiKeys();
      showToast("API key status updated", "success");
    } catch (error) {
      showToast("Failed to update API key status", "error");
    }
  };

  const handleDeleteKey = async () => {
    if (!selectedKey) return;
    try {
      await apiService.deleteApiKey(1, selectedKey.id);
      await loadApiKeys();
      setIsDeleteDialogOpen(false);
      showToast("API key deleted", "success");
    } catch (error) {
      showToast("Failed to delete API key", "error");
    }
  };

  const handleCopyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast("API key copied to clipboard", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      showToast("Failed to copy API key", "error");
    }
  };

  return (
    <div className="  p-4 sm:p-6 lg:p-8">
      <PageMeta title="Developer" description="Developer page" />

      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700">
          <div className="p-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  API Keys
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage API keys for your applications
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 "
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </div>
          </div>

          <div className="p-6">
            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <KeyIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                  No API keys
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Create an API key to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <KeyIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            API Key #{key.id}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              key.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {key.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-800 rounded-md font-mono text-sm">
                          <code className="text-zinc-900 dark:text-gray-300">
                            {key.key}
                          </code>
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyToClipboard(key.key, key.id)
                              }
                              className="p-1.5 text-gray-500 "
                              
                            >
                              {copiedId === key.id ? (
                                <CheckIcon className="w-4 h-4" />
                              ) : (
                                <ClipboardIcon className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                          onClick={() => handleDeactivateKey(key.id)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        //   title={key.is_active ? "Deactivate" : "Activate"}
                        >
                          <PowerIcon className="w-5 h-5" />
                        </Button>
                        <Button

                        variant="outline"
                        size="sm"
                          onClick={() => {
                            setSelectedKey(key);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-2"
                        //   title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Create API Key</h4>
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 mb-6">
              Generate a new API key for your application.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateKey}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? "Generating..." : "Generate Key"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-red-600">
                Delete API Key
              </h4>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this API key? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteKey}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add new icons
const XIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckCircleIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const XCircleIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    />
  </svg>
);

const PlusIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
      clipRule="evenodd"
    />
  </svg>
);

const KeyIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

const PowerIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const TrashIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ClipboardIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
);

const CheckIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
