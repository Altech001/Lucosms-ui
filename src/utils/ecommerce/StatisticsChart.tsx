import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

interface Transaction {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: number;
  created_at: string;
}

interface SmsHistory {
  id: number;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "pending";
  cost: number;
  created_at: string;
}

export default function StatisticsChart() {
  const { getToken } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const {
    data: transactions = [],
    isLoading: isTransLoading,
    error: transError,
  } = useQuery<Transaction[], Error>({
    queryKey: ["transactions", currentYear],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      const url = `${import.meta.env.VITE_API_URL}/user/api/v1/transaction_history?skip=0&limit=1000`;
      // console.log("Fetching transactions from:", url);

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
        // console.error("Fetch error:", errorData);
        if (response.status === 404) {
          throw new Error(errorData.detail || "Transactions not found");
        }
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      // console.log("Fetched transactions:", data);
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

  const {
    data: smsHistory = [],
    isLoading: isSmsLoading,
    error: smsError,
  } = useQuery<SmsHistory[], Error>({
    queryKey: ["sms-history", currentYear],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      const url = `${import.meta.env.VITE_API_URL}/user/api/v1/sms_history?skip=0&limit=1000`;
      // console.log("Fetching SMS history from:", url);

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
        // console.error("SMS fetch error:", errorData);
        if (response.status === 404) {
          throw new Error(errorData.detail || "SMS history not found");
        }
        throw new Error(`Failed to fetch SMS history: ${response.statusText}`);
      }

      const data = await response.json();
      // console.log("Fetched SMS history:", data);
      return Array.isArray(data) ? data : data.messages || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: Boolean(transactions.length),
  });

  const getChartData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const airtelData = new Array(12).fill(0);
    const mtnData = new Array(12).fill(0);

    transactions.forEach((transaction) => {
      // console.log("Processing transaction:", transaction); // Debug each transaction
      if (transaction.transaction_type === "sms_deduction") {
        const date = new Date(transaction.created_at);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          const absAmount = Math.abs(transaction.amount);

          // Match by created_at timestamp (within 1 second)
          const sms = smsHistory.find((s) => {
            const smsDate = new Date(s.created_at);
            const transDate = new Date(transaction.created_at);
            return Math.abs(smsDate.getTime() - transDate.getTime()) < 1000; // 1-second window
          });

          if (sms) {
            // console.log("Matched SMS for transaction", transaction.id, ":", sms); // Debug match
            const recipient = sms.recipient;
            if (/^\+256(70|75)/.test(recipient)) {
              airtelData[month] += absAmount;
            } else if (/^\+256(77|78)/.test(recipient)) {
              mtnData[month] += absAmount;
            }
          } else {
            // console.log("No SMS match for transaction", transaction.id, "at", transaction.created_at); // Debug mismatch
          }
        }
      }
    });

    // console.log("Airtel Data:", airtelData, "MTN Data:", mtnData); // Debug final data
    return {
      categories: months,
      series: [
        { name: "Airtel UG", data: airtelData },
        { name: "MTN UG", data: mtnData },
      ],
    };
  };

  const { categories, series } = (transactions.length && smsHistory.length) ? getChartData() : { categories: [], series: [] };

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontSize: "14px",
    },
    colors: ["#E3342F", "#F6E05E"], // Red for Airtel, Yellow for MTN
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth", // Smoother curves for better visual
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => (val > 0 ? `${val.toLocaleString()} UGX` : ""),
      style: {
        fontSize: "12px",
        fontFamily: "Outfit",
        colors: ["#333"],
      },
    },
    tooltip: {
      enabled: true,
      x: {
        format: "MMM yyyy",
      },
      y: {
        formatter: (val: number) => `${val.toLocaleString()} UGX`,
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (val: number) => `${val.toLocaleString()}`,
      },
      title: {
        text: "Amount (UGX)",
        style: {
          fontSize: "12px",
          fontFamily: "Outfit",
        },
      },
      min: 0, // Start at 0
      forceNiceScale: true, // Better scaling
    },
  };

  const handlePreviousYear = () => {
    const years = transactions.length
      ? [...new Set(transactions.map((t) => new Date(t.created_at).getFullYear()))]
      : [currentYear];
    if (currentYear > Math.min(...years)) {
      setCurrentYear(currentYear - 1);
    }
  };

  const handleNextYear = () => {
    if (currentYear < new Date().getFullYear()) {
      setCurrentYear(currentYear + 1);
    }
  };

  const ChartSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded dark:bg-gray-700 mb-2"></div>
      <div className="h-4 w-96 bg-gray-200 rounded dark:bg-gray-700 mb-8"></div>
      <div className="h-[310px] w-full bg-gray-200 rounded dark:bg-gray-700"></div>
      <div className="mt-4 flex justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="h-8 w-16 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="h-8 w-20 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-2">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Transaction Statistics
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Transaction amounts for Airtel and MTN in {currentYear}
        </p>
      </div>
      {isTransLoading || isSmsLoading ? (
        <ChartSkeleton />
      ) : transError || smsError ? (
        <div className="p-4 text-center text-red-500 dark:text-red-400">
          {transError?.message || smsError?.message}
        </div>
      ) : transactions.length === 0 || smsHistory.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No transactions or SMS history found for {currentYear}
        </div>
      ) : (
        <>
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px] xl:min-w-full">
              <Chart options={options} series={series} type="area" height={310} />
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-white/[0.05]">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing transactions for {currentYear}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousYear}
                disabled={transactions.length === 0 || currentYear <= Math.min(...transactions.map((t) => new Date(t.created_at).getFullYear()))}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  transactions.length === 0 || currentYear <= Math.min(...transactions.map((t) => new Date(t.created_at).getFullYear()))
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {currentYear}
              </span>
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
        </>
      )}
    </div>
  );
}