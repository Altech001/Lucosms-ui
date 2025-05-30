/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, SVGProps } from "react";
import { useAuth } from "@clerk/clerk-react";
import PageMeta from "../../utils/common/PageMeta";
import { apiService, type ApiKey } from "../../lib/api-service";
import { JSX } from "react/jsx-runtime";
import Button from "../../utils/ui/button/Button";

interface ToastMessage {
  type: "success" | "error";
  message: string;
}

export default function Developer() {
  const { getToken } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadApiKeys();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const keys = await apiService.listApiKeys(getToken);
      setApiKeys(keys);
    } catch (error: any) {
      showToast(error.message || "Failed to load API keys", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.generateApiKey(getToken);
      await loadApiKeys();
      setIsCreateDialogOpen(false);
      showToast(result.message, "success");
    } catch (error: any) {
      showToast(error.message || "Failed to generate API key", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateKey = async (keyId: number) => {
    setIsLoading(true);
    try {
      await apiService.deactivateApiKey(keyId, getToken);
      await loadApiKeys();
      showToast("API key status updated", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to update API key status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!selectedKey) return;
    setIsLoading(true);
    try {
      await apiService.deleteApiKey(selectedKey.id, getToken);
      await loadApiKeys();
      setIsDeleteDialogOpen(false);
      showToast("API key deleted", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to delete API key", "error");
    } finally {
      setIsLoading(false);
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

  const toggleRevealKey = (id: number) => {
    setRevealedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 bg-gray-50 dark:bg-zinc-950 min-h-screen">
      <PageMeta title="Developer" description="Developer page" />

      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 rounded-lg  px-5 py-3 flex items-center gap-3 transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-600 dark:bg-green-700"
              : "bg-red-600 dark:bg-red-700"
          } text-white font-medium text-sm`}
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl  border border-gray-100 dark:border-zinc-800 transition-all duration-300">
          <div className="p-8 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-[Outfit]">
                  Lucosms Developer API Keys
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-[Outfit]">
                  Securely manage API keys for your applications with ease.
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 font-[Outfit]">
                  Remember API Keys Have access to use the lucosms wallet and misuse may lead to loss of funds.
                </p>
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all duration-300 shadow-md font-[Outfit] font-medium"
                disabled={isLoading}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create API Key
              </Button>
            </div>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-pulse">
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full dark:bg-zinc-700" />
                  <div className="mt-4 h-5 w-40 mx-auto bg-gray-200 rounded dark:bg-zinc-700" />
                  <div className="mt-3 h-4 w-56 mx-auto bg-gray-200 rounded dark:bg-zinc-700" />
                </div>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-16">
                <KeyIcon className="w-14 h-14 mx-auto text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white font-[Outfit]">
                  No API Keys Yet
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-[Outfit]">
                  Create your first API key to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border border-gray-100 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <KeyIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <span className="text-base font-semibold text-gray-900 dark:text-white font-[Outfit]">
                            Lucosms API Key #{key.id}
                          </span>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-[Outfit] ${
                              key.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-400"
                            }`}
                          >
                            {key.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg font-mono text-sm shadow-inner">
                          <code className="text-gray-900 dark:text-gray-300 flex-1 truncate">
                            {revealedKeys.has(key.id) ? key.full_key : `****-****-****-${key.key}`}
                          </code>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRevealKey(key.id)}
                              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                            >
                              {revealedKeys.has(key.id) ? (
                                <EyeOffIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyToClipboard(key.full_key, key.id)}
                              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                              disabled={isLoading}
                            >
                              {copiedId === key.id ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <ClipboardIcon className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateKey(key.id)}
                          className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 dark:hover:text-blue-400 rounded-md transition-all duration-300"
                          disabled={isLoading}
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
                          className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 dark:hover:text-red-400 rounded-md transition-all duration-300"
                          disabled={isLoading}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-gray-100/50 dark:border-zinc-800/50 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white font-[Outfit]">
                Create New API Key
              </h4>
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                disabled={isLoading}
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-[Outfit] leading-relaxed">
              Generate a new API key to securely integrate with your application.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-6 py-3 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-300 font-[Outfit] font-medium"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateKey}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all duration-300 shadow-md font-[Outfit] font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Key"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-gray-100/50 dark:border-zinc-800/50 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-red-600 dark:text-red-500 font-[Outfit]">
                Delete API Key
              </h4>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                disabled={isLoading}
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-[Outfit] leading-relaxed">
              Are you sure you want to delete this API key? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-6 py-3 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-300 font-[Outfit] font-medium"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleDeleteKey}
                className="px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-all duration-300 font-[Outfit] font-medium"
                disabled={isLoading}
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

// Icons (unchanged except for adding EyeIcon and EyeOffIcon)
const XIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckCircleIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const XCircleIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
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

const PowerIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const TrashIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ClipboardIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
);

const CheckIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const EyeIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path
      fillRule="evenodd"
      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
      clipRule="evenodd"
    />
  </svg>
);

const EyeOffIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
      clipRule="evenodd"
    />
    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 7.546a10.014 10.014 0 00-1.845 2.454C1.732 14.057 5.522 17 10 17a9.96 9.96 0 002.454-.303z" />
  </svg>
);