/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
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
}

export default function TransactionDashboard() {
  const { getToken } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const userId = 1; // Replace with actual user ID when available

  const getCachedTransactions = (): CachedData | null => {
    const cached = localStorage.getItem(`transactions_${userId}`);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached);
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(`transactions_${userId}`);
      return null;
    }

    return parsedCache;
  };

  const setCachedTransactions = (data: Transaction[]) => {
    localStorage.setItem(
      `transactions_${userId}`,
      JSON.stringify({ transactions: data, timestamp: Date.now() })
    );
  };

  const {
    data: allTransactions = [],
    isLoading: isTransLoading,
    error: transError,
  } = useQuery<Transaction[], Error>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      const url = `${import.meta.env.VITE_API_URL}/user/api/v1/transaction_history?user_id=${userId}&skip=0&limit=1000`;
      console.log("Fetching transactions from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Fetch error:", errorData);
        if (response.status === 404) {
          throw new Error(errorData.detail || "Transactions not found");
        }
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched transactions:", data);
      setCachedTransactions(data);
      return Array.isArray(data) ? data : data.transactions || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes("not found") || error.message.includes("Authentication")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Paginate transactions client-side
  const transactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return allTransactions.slice(start, end);
  }, [allTransactions, currentPage, itemsPerPage]);

  const totalItems = allTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getChartData = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const deductionData = new Array(12).fill(0);
    const topupData = new Array(12).fill(0);

    allTransactions.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const absAmount = Math.abs(transaction.amount);

        if (transaction.transaction_type === "sms_deduction") {
          deductionData[month] += absAmount;
        } else if (transaction.transaction_type === "topup") {
          topupData[month] += absAmount;
        }
      }
    });

    console.log("Deduction Data:", deductionData, "Topup Data:", topupData);
    return {
      categories: months,
      series: [
        { name: "SMS Deduction", data: deductionData },
        { name: "Top-up", data: topupData },
      ],
    };
  };

  const { categories, series } = allTransactions.length ? getChartData() : { categories: [], series: [] };

  const options: ApexOptions = {
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit", fontSize: "14px" },
    colors: ["#EF4444", "#10B981"], // Red for Deduction, Green for Top-up
    chart: { fontFamily: "Outfit, sans-serif", height: 310, type: "area", toolbar: { show: false } },
    stroke: { curve: "smooth", width: [2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 4, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => (val > 0 ? `${val.toLocaleString()} UGX` : ""),
      style: { fontSize: "12px", fontFamily: "Outfit", colors: ["#333"] },
    },
    tooltip: { enabled: true, x: { format: "MMM yyyy" }, y: { formatter: (val: number) => `${val.toLocaleString()} UGX` } },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: { style: { colors: "#6B7280", fontSize: "12px" } },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] }, formatter: (val: number) => `${val.toLocaleString()}` },
      title: { text: "Amount (UGX)", style: { fontSize: "12px", fontFamily: "Outfit" } },
      min: 0,
      forceNiceScale: true,
    },
  };

  const handlePreviousYear = () => {
    const years = allTransactions.length
      ? [...new Set(allTransactions.map((t) => new Date(t.created_at).getFullYear()))]
      : [currentYear];
    if (currentYear > Math.min(...years)) setCurrentYear(currentYear - 1);
  };

  const handleNextYear = () => {
    if (currentYear < new Date().getFullYear()) setCurrentYear(currentYear + 1);
  };

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePageClick = (page: number) => setCurrentPage(page);

  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className="border-b border-gray-100 dark:border-white/[0.05]">
        <div className="grid grid-cols-5 gap-4 px-5 py-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded dark:bg-gray-700" />)}
        </div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border-b border-gray-100 dark:border-white/[0.05]">
          <div className="grid grid-cols-5 gap-4 px-5 py-4">
            {[...Array(5)].map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded dark:bg-gray-700" />)}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-white/[0.05]">
        <div className="h-4 w-64 bg-gray-200 rounded dark:bg-gray-700" />
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-8 bg-gray-200 rounded dark:bg-gray-700" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Billing Overview</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            SMS Deductions and Top-ups in {currentYear}
          </p>
        </div>
        {isTransLoading ? (
          <div className="h-[310px] bg-gray-200 rounded dark:bg-gray-700 animate-pulse" />
        ) : transError ? (
          <div className="p-4 text-center text-red-500 dark:text-red-400">{transError.message}</div>
        ) : allTransactions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No transactions found for {currentYear}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px] xl:min-w-full">
              <Chart options={options} series={series} type="area" height={310} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-white/[0.05]">
          <div className="text-xs text-gray-500 dark:text-gray-400">Showing transactions for {currentYear}</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousYear}
              disabled={allTransactions.length === 0 || currentYear <= Math.min(...allTransactions.map((t) => new Date(t.created_at).getFullYear()))}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                allTransactions.length === 0 || currentYear <= Math.min(...allTransactions.map((t) => new Date(t.created_at).getFullYear()))
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-white/90">{currentYear}</span>
            <button
              onClick={handleNextYear}
              disabled={currentYear >= new Date().getFullYear()}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                currentYear >= new Date().getFullYear()
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] no-scrollbar">
        <div className="max-w-full overflow-x-auto no-scrollbar">
          {isTransLoading ? (
            <TableSkeleton />
          ) : transError ? (
            <div className="p-4 text-center text-red-500">{transError.message}</div>
          ) : (
            <>
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Transaction Type
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Transaction Date
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Credits
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
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
    </div>
  );
}