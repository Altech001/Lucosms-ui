import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, useAuth } from "@clerk/clerk-react";
import EcommerceMetrics from "../../utils/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../utils/ecommerce/MonthlySalesChart";
import RecentOrders from "../../utils/ecommerce/RecentOrders";
import DemographicCard from "../../utils/ecommerce/DemographicCard";
import PageMeta from "../../utils/common/PageMeta";
import { Skeleton } from "../../components/ui/skeleton";
import EmptyState from "../../components/common/EmptyState";

interface SMSHistory {
  id: number;
  recipient: string;
  message: string;
  status: string;
  cost: number;
  created_at: string;
}

interface MetricsData {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

function processMetricsData(data: SMSHistory[]): MetricsData {
  return data.reduce(
    (acc, item) => ({
      total: acc.total + 1,
      delivered: acc.delivered + (item.status === "sent" ? 1 : 0),
      failed: acc.failed + (item.status === "failed" ? 1 : 0),
      pending: acc.pending + (item.status === "pending" ? 1 : 0),
    }),
    { total: 0, delivered: 0, failed: 0, pending: 0 }
  );
}

// Skeleton loader for metrics
const MetricsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32" />
      </div>
    ))}
  </div>
);

// Skeleton loader for cards
const CardSkeleton = () => (
  <div className="p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <Skeleton className="h-4 w-full mb-4" />
    <Skeleton className="h-[200px] w-full" />
  </div>
);

export default function Home() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const {
    data: queryData,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["sms-history"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/user/api/v1/sms_history`,
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
        if (response.status === 404) {
          const errorData = await response.json();
          if (
            errorData.detail === "User not Found" ||
            errorData.detail === "No message found"
          ) {
            return { noMessages: true }; // Return a special object
          }
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch SMS history: ${response.status} ${errorText}`
        );
      }

      const data: SMSHistory[] = await response.json();
      return processMetricsData(data);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isMetricsLoading) {
    return (
      <>
        <PageMeta
          title={`Luco SMS - Welcome ${user?.firstName || "Back"}`}
          description="The lucosms is a simple to use dashboard for sending bulky sms."
        />
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || "User"}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <MetricsSkeleton />
            <CardSkeleton />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <CardSkeleton />
          </div>
          <div className="hidden md:grid col-span-12">
            <CardSkeleton />
          </div>
        </div>
      </>
    );
  }

  if (metricsError) {
    console.error("Dashboard data loading failed:", metricsError);
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-600">
          Something went wrong
        </h2>
        <p className="text-gray-500 mt-2">
          We couldn't load your dashboard data. Please try again later.
        </p>
      </div>
    );
  }

  if (queryData && "noMessages" in queryData && queryData.noMessages) {
    return (
      <>
        <PageMeta
          title={`Luco SMS - Welcome ${user?.firstName || "Back"}`}
          description="The lucosms is a simple to use dashboard for sending bulky sms."
        />
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome, {user?.firstName || "User"}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            It looks like you're new here! Send your first message to get
            started.
          </p>
        </div>
        <EmptyState />
      </>
    );
  }

  const deliveryReport = queryData as MetricsData;

  return (
    <>
      <PageMeta
        title={`Luco SMS - Welcome ${user?.firstName || "Back"}`}
        description="The lucosms is a simple to use dashboard for sending bulky sms."
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName || "User"}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Yello, Manage the Day to Day SMS activities of your business with ease.
        </p>
      </div>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics
            data={
              deliveryReport ?? { total: 0, delivered: 0, failed: 0, pending: 0 }
            }
          />
          <Suspense fallback={<CardSkeleton />}>
            <MonthlySalesChart />
          </Suspense>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="hidden md:grid col-span-12">
          <Suspense fallback={<CardSkeleton />}>
            <RecentOrders />
          </Suspense>
        </div>
      </div>
    </>
  );
}
