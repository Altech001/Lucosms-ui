/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

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
  year: number;
}

export default function StatisticsChart() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [, setTotalYears] = useState(1); // Placeholder for total years
  const userId = 1; // Replace with actual user ID when available
  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

  const getCachedTransactions = (): CachedData | null => {
    const cached = localStorage.getItem(`statistics_${userId}`);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached);
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(`statistics_${userId}`);
      return null;
    }

    return parsedCache;
  };

  const setCachedTransactions = (transactions: Transaction[]) => {
    localStorage.setItem(
      `statistics_${userId}`,
      JSON.stringify({
        transactions,
        timestamp: Date.now(),
        year: currentYear,
      })
    );
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        
        // Check cache first
        const cached = getCachedTransactions();
        if (cached) {
          setTransactions(cached.transactions);
          const years = new Set(
            cached.transactions.map((t) => new Date(t.created_at).getFullYear())
          );
          setTotalYears(Math.max(years.size, 1));
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://luco-sms-api.onrender.com/api/v1/transaction_history?user_id=${userId}&skip=0&limit=1000`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data: Transaction[] = await response.json();
        
        // Cache the results
        setCachedTransactions(data);
        setTransactions(data);
        
        const years = new Set(
          data.map((t) => new Date(t.created_at).getFullYear())
        );
        setTotalYears(Math.max(years.size, 1));
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Aggregate data by month for the current year
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
      if (transaction.transaction_type === "sms_deduction") {
        const date = new Date(transaction.created_at);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          const absAmount = Math.abs(transaction.amount);
          
          // Extract network information from transaction data
          // Assuming the transaction has a network field or pattern
          // You might need to adjust this based on your actual data structure
          const isAirtel = transaction.id.toString().endsWith('0'); // Example pattern
          if (isAirtel) {
            airtelData[month] += absAmount;
          } else {
            mtnData[month] += absAmount;
          }
        }
      }
    });

    return {
      categories: months,
      series: [
        { name: "Airtel UG", data: airtelData },
        { name: "MTN UG", data: mtnData },
      ],
    };
  };

  const { categories, series } = getChartData();

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["red", "yellow"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
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
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
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
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const handlePreviousYear = () => {
    if (currentYear > Math.min(...transactions.map((t) => new Date(t.created_at).getFullYear()))) {
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
      {isLoading ? (
        <ChartSkeleton />
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <>
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px] xl:min-w-full">
              <Chart options={options} series={series} type="area" height={310} />
            </div>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-white/[0.05]">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing transactions for {currentYear}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousYear}
                disabled={currentYear <= Math.min(...transactions.map((t) => new Date(t.created_at).getFullYear()))}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  currentYear <= Math.min(...transactions.map((t) => new Date(t.created_at).getFullYear()))
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