/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import Badge from "@/utils/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/utils/ui/table";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Download, RefreshCw } from "lucide-react";

interface HistoryItem {
  id: number | string;
  user?: {
    image?: string;
    name?: string;
    role?: string;
  };
  projectName?: string;
  team?: {
    images?: string[];
  };
  status?: string;
  budget?: string;
  message?: string;
  phoneNumber?: string;
  timestamp?: string;
  createdAt?: string;
}

function History() {
  const { getToken } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "pending" | "failed">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortOrder]);

  const {
    data: historyData = [],
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["history-data", currentPage, itemsPerPage],
    queryFn: async () => {
      const token = await getToken();
      const skip = (currentPage - 1) * itemsPerPage;
      const limit = itemsPerPage;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/user/api/v1/sms_history?skip=${skip}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch history data");
      }

      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (status: "all" | "sent" | "pending" | "failed") => {
    setStatusFilter(status);
  };

  const handleSort = (field: "date" | "name" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Safe string accessor helper
  const safeString = (value?: string | null): string => {
    return value || "";
  };

  // Safe status mapper
  const getStatusForFilter = (status?: string): string => {
    if (!status) return "pending";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("sent") || lowerStatus.includes("success")) return "sent";
    if (lowerStatus.includes("pending") || lowerStatus.includes("processing")) return "pending";
    if (lowerStatus.includes("failed") || lowerStatus.includes("error")) return "failed";
    return "pending";
  };

  // Safe badge color mapper
  const getBadgeColor = (status?: string): "success" | "warning" | "error" => {
    if (!status) return "warning";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("sent") || lowerStatus.includes("success") || lowerStatus.includes("active")) return "success";
    if (lowerStatus.includes("pending") || lowerStatus.includes("processing")) return "warning";
    return "error";
  };

  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "N/A";
    }
  };

  // Filtered and sorted data
  const processedData = useMemo(() => {
    const filtered = historyData.filter((item: HistoryItem) => {
      const projectName = safeString(item.projectName);
      const userName = safeString(item.user?.name);
      const message = safeString(item.message);
      const phoneNumber = safeString(item.phoneNumber);
      
      const matchesSearch = debouncedSearch === "" || [projectName, userName, message, phoneNumber]
        .some(field => field.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      const itemStatus = getStatusForFilter(item.status);
      const matchesStatus = statusFilter === "all" || itemStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortBy) {
        case "name":
          aValue = safeString(a.user?.name).toLowerCase();
          bValue = safeString(b.user?.name).toLowerCase();
          break;
        case "status":
          aValue = safeString(a.status).toLowerCase();
          bValue = safeString(b.status).toLowerCase();
          break;
        case "date":
          aValue = new Date(a.timestamp || a.createdAt || "").getTime() || 0;
          bValue = new Date(b.timestamp || b.createdAt || "").getTime() || 0;
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [historyData, debouncedSearch, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination helpers
  const getVisiblePageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Helper to render team images
  const renderTeamImages = (images?: string[]) => {
    if (!images || images.length === 0) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center dark:from-gray-600 dark:to-gray-700">
          <span className="text-xs text-gray-500 font-medium">0</span>
        </div>
      );
    }

    return (
      <div className="flex -space-x-2">
        {images.slice(0, 3).map((teamImage, index) => (
          <div
            key={index}
            className="w-8 h-8 overflow-hidden border-2 border-white rounded-full dark:border-gray-800 shadow-sm"
          >
            <img
              width={32}
              height={32}
              src={teamImage || "/default-avatar.png"}
              alt={`Team member ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-avatar.png";
              }}
            />
          </div>
        ))}
        {images.length > 3 && (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800 shadow-sm">
            +{images.length - 3}
          </div>
        )}
      </div>
    );
  };

  const statusOptions = [
    { value: "all", label: "All Status", count: processedData.length },
    { value: "sent", label: "Sent", count: processedData.filter((item: { status: string | undefined; }) => getStatusForFilter(item.status) === "sent").length },
    { value: "pending", label: "Pending", count: processedData.filter((item: { status: string | undefined; }) => getStatusForFilter(item.status) === "pending").length },
    { value: "failed", label: "Failed", count: processedData.filter((item: { status: string | undefined; }) => getStatusForFilter(item.status) === "failed").length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm backdrop-blur-sm">
        <div className="p-6 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                SMS History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track and manage your SMS communications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project, user, message, or phone..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilterChange(option.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    statusFilter === option.value
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Loading history...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 dark:text-red-400">⚠</span>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  {error instanceof Error ? error.message : "Failed to load history"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200/60 dark:border-gray-800/60">
                  <TableCell
                    isHeader
                    className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      User
                      {sortBy === "name" && (
                        <span className={`transform transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}>
                          ↑
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell isHeader className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                    Project/Message
                  </TableCell>
                  <TableCell isHeader className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                    Team
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    // onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortBy === "status" && (
                        <span className={`transform transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}>
                          ↑
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell isHeader className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                    Details
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-4 px-6 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    // onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortBy === "date" && (
                        <span className={`transform transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}>
                          ↑
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-12 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">No history items found</p>
                          <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item: HistoryItem) => (
                    <TableRow 
                      key={item.id} 
                      className="border-gray-200/60 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-900">
                              {item.user?.image ? (
                                <img
                                  width={40}
                                  height={40}
                                  src={item.user.image}
                                  alt={item.user.name || "User"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                                  <span className="text-white text-sm font-medium">
                                    {item.user?.name?.charAt(0) || "U"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.user?.name || "Unknown User"}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {item.user?.role || "User"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {item.projectName || "N/A"}
                          </p>
                          {item.message && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {item.message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {renderTeamImages(item.team?.images)}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge size="sm" color={getBadgeColor(item.status)}>
                          {item.status || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.budget || item.phoneNumber || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(item.timestamp || item.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200/60 dark:border-gray-800/60 bg-gray-50/30 dark:bg-gray-800/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, processedData.length)} to{" "}
                {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} items
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {getVisiblePageNumbers().map((pageNum, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                      disabled={pageNum === "..."}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        pageNum === currentPage
                          ? "bg-blue-500 text-white shadow-sm"
                          : pageNum === "..."
                          ? "text-gray-400 cursor-default"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {pageNum === "..." ? <MoreHorizontal className="w-4 h-4" /> : pageNum}
                    </button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;