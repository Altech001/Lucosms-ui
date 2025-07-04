import React, { useState, useEffect, useCallback } from "react";
import { UploadFile, Download, Delete } from "@mui/icons-material";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/utils/common/PageBreadCrumb";
import PageMeta from "@/utils/common/PageMeta";

const API_BASE_URL = "https://luco-service.onrender.com/aws";

interface S3File {
  key: string;
  last_modified: string;
  size: number;
  etag: string;
}

interface ErrorResponse {
  detail: string;
}

function Backup() {
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFiles = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedFiles = localStorage.getItem("cachedFiles");
      if (cachedFiles) {
        setFiles(JSON.parse(cachedFiles));
      }
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/files?max_items=100`);
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        let errorDetail = "Network response was not ok.";
        if (contentType && contentType.includes("application/json")) {
          const errorData = (await response.json()) as ErrorResponse;
          errorDetail = errorData.detail || errorDetail;
        } else {
          errorDetail =
            "Received an invalid response from the server. Please check the backend configuration.";
        }
        throw new Error(errorDetail);
      }

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Invalid content type: The server did not return JSON. Please check API and proxy settings."
        );
      }

      const data = (await response.json()) as S3File[];
      setFiles(data || []);
      localStorage.setItem("cachedFiles", JSON.stringify(data || []));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching files.";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFiles(true);
    setIsRefreshing(false);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw new Error(errorData.detail || "File upload failed");
      }

      setSnackbar({
        open: true,
        message: "File uploaded successfully!",
        severity: "success",
      });
      fetchFiles();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "File upload failed.";
      setSnackbar({ open: true, message, severity: "error" });
      console.error(err);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleFileDownload = async (fileName: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/presigned-url/${encodeURIComponent(fileName)}`
      );
      if (!response.ok) {
        throw new Error("Failed to get download link");
      }
      const data = (await response.json()) as { url: string };
      window.open(data.url, "_blank");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to get download link for ${fileName}.`;
      setSnackbar({ open: true, message, severity: "error" });
      console.error(err);
    }
  };

  const handleFileDelete = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/delete/${encodeURIComponent(fileName)}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponse;
          throw new Error(errorData.detail || "Failed to delete file");
        }
        setSnackbar({
          open: true,
          message: "File deleted successfully!",
          severity: "success",
        });
        fetchFiles();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : `Failed to delete ${fileName}.`;
        setSnackbar({ open: true, message, severity: "error" });
        console.error(err);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <PageMeta
        title="Luco File Backup"
        description="Manage your file backups with Luco. Upload, download, and delete files easily."
      />
      <PageBreadcrumb pageTitle="Luco File Backup" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Luco File Backup
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {isRefreshing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UploadFile className="w-5 h-5" />
                {uploading ? "Uploading..." : "Upload File"}
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 shadow'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 shadow'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <svg
                className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                No files found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-sm">
                Upload a file to get started.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {files.map((file) => (
                <motion.div
                  key={file.key}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <div
                    className={`flex-1 p-4 ${
                      viewMode === "list" ? "flex gap-4 items-center" : ""
                    }`}
                  >
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                      <p className="text-sm text-gray-800 dark:text-white mb-2 line-clamp-2">
                        {file.key}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          <svg
                            className="w-3 h-3 mr-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zM14 13h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zM4 21h6a1 1 0 001-1v-8a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zM14 21h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          <svg
                            className="w-3 h-3 mr-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 8v4l2 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          {new Date(file.last_modified).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        viewMode === "list"
                          ? ""
                          : "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <button
                        onClick={() => handleFileDownload(file.key)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4 mr-1 inline" />
                        Download
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.key)}
                        className="flex-1 px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Delete className="w-4 h-4 mr-1 inline" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {snackbar.open && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div
              className={`px-4 py-3 rounded-lg shadow-lg ${
                snackbar.severity === "success" ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {snackbar.message}
              <button
                onClick={handleCloseSnackbar}
                className="ml-4 text-white hover:text-gray-200"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
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
    </>
  );
}

export default Backup;
