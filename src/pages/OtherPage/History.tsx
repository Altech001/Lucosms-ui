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
import { useState } from "react";

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
  // Add other possible fields from your actual API response
  message?: string;
  phoneNumber?: string;
  timestamp?: string;
}

function History() {
  const { getToken } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "sent" | "pending" | "failed"
  >("all");
  const [showAll] = useState(false);

  const {
    data: historyData = [],
    isLoading,
    error,
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
      
      // Ensure we return an array
      return Array.isArray(result) ? result : result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setStatusFilter(e.target.value as "all" | "sent" | "pending" | "failed");
    setCurrentPage(1);
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

  const filteredHistoryData = historyData.filter((item: HistoryItem) => {
    // Safe search matching
    const projectName = safeString(item.projectName);
    const userName = safeString(item.user?.name);
    const matchesSearch =
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Safe status matching
    const itemStatus = getStatusForFilter(item.status);
    const matchesStatus = statusFilter === "all" || itemStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const paginatedHistoryData = showAll
    ? filteredHistoryData
    : filteredHistoryData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const totalPages = showAll
    ? 1
    : Math.ceil(filteredHistoryData.length / itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Helper to render team images safely
  const renderTeamImages = (images?: string[]) => {
    if (!images || images.length === 0) {
      return (
        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center dark:bg-gray-700">
          <span className="text-xs text-gray-500">0</span>
        </div>
      );
    }

    return (
      <div className="flex -space-x-2">
        {images.slice(0, 3).map((teamImage, index) => (
          <div
            key={index}
            className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900"
          >
            <img
              width={24}
              height={24}
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
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
            +{images.length - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your SMS History
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by project or user..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
          />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading history...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error instanceof Error ? error.message : "Failed to load history"}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    User
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    Project/Message
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    Team
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    Details
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistoryData.length === 0 ? (
                  <TableRow>
                    <TableCell  className="py-8 text-center text-gray-500">
                      No history items found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistoryData.map((order: HistoryItem) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            {order.user?.image ? (
                              <img
                                width={40}
                                height={40}
                                src={order.user.image}
                                alt={order.user.name || "User"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/default-avatar.png";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-500 text-xs">
                                  {order.user?.name?.charAt(0) || "U"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {order.user?.name || "Unknown User"}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {order.user?.role || "User"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {order.projectName || order.message || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {order.team ? renderTeamImages(order.team.images) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center dark:bg-gray-700">
                            <span className="text-xs text-gray-500">0</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={getBadgeColor(order.status)}
                        >
                          {order.status || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {order.budget || order.phoneNumber || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!showAll && totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredHistoryData.length
                  )}{" "}
                  of {filteredHistoryData.length} items
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      currentPage === 1
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1 + Math.max(0, currentPage - 3);
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-2 py-1 text-xs font-medium rounded-lg ${
                          currentPage === page
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded ${
                      currentPage === totalPages
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default History;