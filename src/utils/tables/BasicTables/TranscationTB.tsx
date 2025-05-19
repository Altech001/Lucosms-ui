// /* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";

interface Transaction {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: number;
  created_at: string;
}

interface CachedData {
  transactions: Transaction[];
  timestamp: number;
  page: number;
  totalItems: number;
}

export default function TranscationTB() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalItems, setTotalItems] = useState(0);

  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const userId = 1; // Replace with actual user ID when available

  const getCachedTransactions = (page: number): CachedData | null => {
    const cached = localStorage.getItem(`transactions_${userId}_${page}`);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached);
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(`transactions_${userId}_${page}`);
      return null;
    }

    return parsedCache;
  };

  const setCachedTransactions = (data: CachedData) => {
    localStorage.setItem(
      `transactions_${userId}_${data.page}`,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        
        // Check cache first
        const cached = getCachedTransactions(currentPage);
        if (cached) {
          setTransactions(cached.transactions);
          setTotalItems(cached.totalItems);
          setIsLoading(false);
          return;
        }

        const skip = (currentPage - 1) * itemsPerPage;
        const response = await fetch(
          `https://luco-sms-api.onrender.com/api/v1/transaction_history?user_id=${userId}&skip=${skip}&limit=${itemsPerPage}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data: Transaction[] = await response.json();
        
        const totalItems = data.length < itemsPerPage 
          ? currentPage * data.length 
          : (currentPage + 1) * itemsPerPage;

        // Cache the results
        setCachedTransactions({
          transactions: data,
          totalItems,
          page: currentPage,
          timestamp: Date.now(),
        });

        setTransactions(data);
        setTotalItems(totalItems);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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

  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className="border-b border-gray-100 dark:border-white/[0.05]">
        <div className="grid grid-cols-5 gap-4 px-5 py-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border-b border-gray-100 dark:border-white/[0.05]">
          <div className="grid grid-cols-5 gap-4 px-5 py-4">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-white/[0.05]">
        <div className="h-4 w-64 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] no-scrollbar">
      <div className="max-w-full overflow-x-auto no-scrollbar">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Transaction Type
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Transaction Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Credits
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Amount
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {transaction.transaction_type
                          .replace("sms_deduction", "SMS Deduction")
                          .replace("topup", "Top-up")}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {Math.abs(transaction.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={transaction.transaction_type === "topup" ? "success" : "error"}
                      >
                        {transaction.transaction_type === "topup" ? "Topup" : "Deduction"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount} UGX
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-white/[0.05]">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Previous
                  </button>
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1 + Math.max(0, currentPage - 3);
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}