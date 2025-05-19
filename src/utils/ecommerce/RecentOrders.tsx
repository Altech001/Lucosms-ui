import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

interface SmsHistory {
  id: number;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "pending";
  cost: number;
  created_at: string;
}

export default function RecentOrders() {
  const [smsHistory, setSmsHistory] = useState<SmsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "pending" | "failed">("all");
  const [showAll, setShowAll] = useState(false);

  const fetchSmsHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const skip = showAll ? 0 : (currentPage - 1) * itemsPerPage;
      const limit = showAll ? 1000 : itemsPerPage;
      const response = await fetch(
        `https://luco-sms-api.onrender.com/api/v1/sms_history?user_id=1&skip=${skip}&limit=${limit}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch SMS history");
      const data: SmsHistory[] = await response.json();
      setSmsHistory(data);
      setTotalItems(data.length < limit ? skip + data.length : skip + limit + 1);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, showAll]);

  useEffect(() => {
    fetchSmsHistory();
  }, [fetchSmsHistory]);

  const handleDelete = async (messageId: number) => {
    if (!window.confirm("Are you sure you want to delete this SMS?")) return;
    try {
      const response = await fetch(
        `https://luco-sms-api.onrender.com/api/v1/sms_history?message_id=${messageId}&user_id=1`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to delete SMS");
      await fetchSmsHistory(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleSeeAll = () => {
    setShowAll(true);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as "all" | "sent" | "pending" | "failed");
    setCurrentPage(1);
  };

  const filteredSmsHistory = smsHistory.filter((sms) => {
    const matchesSearch =
      sms.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sms.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sms.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedSmsHistory = showAll
    ? filteredSmsHistory
    : filteredSmsHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const totalPages = showAll ? 1 : Math.ceil(filteredSmsHistory.length / itemsPerPage);

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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            SMS Delivery Reports
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and manage your recent SMS messages
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by message or recipient..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
          />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={handleSeeAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-200"
          >
            See all
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    SMS Message
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    Total
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400"
                  >
                    Outbound
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
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedSmsHistory.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-4 text-center text-gray-500">
                      No SMS messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSmsHistory.map((sms) => (
                    <TableRow key={sms.id}>
                      <TableCell className="py-3 w-[40%]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p
                              className="font-medium text-gray-800 text-sm dark:text-white/90 truncate max-w-[200px]"
                              title={sms.message}
                            >
                              {sms.message}
                            </p>
                            <span className="text-gray-500 text-xs dark:text-gray-400">
                              To: {sms.recipient}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-sm dark:text-gray-400">
                        UGX {sms.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-sm dark:text-gray-400">
                        {sms.recipient.includes(",") ? "Group" : "Person"}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            sms.status === "sent"
                              ? "success"
                              : sms.status === "pending"
                              ? "warning"
                              : "error"
                          }
                        >
                          {sms.status.charAt(0).toUpperCase() + sms.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <button
                          onClick={() => handleDelete(sms.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
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
                  {Math.min(currentPage * itemsPerPage, filteredSmsHistory.length)} of{" "}
                  {filteredSmsHistory.length} SMS
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