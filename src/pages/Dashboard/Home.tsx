import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import EcommerceMetrics from "../../utils/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../utils/ecommerce/MonthlySalesChart";
import RecentOrders from "../../utils/ecommerce/RecentOrders";
import DemographicCard from "../../utils/ecommerce/DemographicCard";
import PageMeta from "../../utils/common/PageMeta";
import { Skeleton } from "../../components/ui/skeleton";

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
  return data.reduce((acc, item) => ({
    total: acc.total + 1,
    delivered: acc.delivered + (item.status === 'sent' ? 1 : 0),
    failed: acc.failed + (item.status === 'failed' ? 1 : 0),
    pending: acc.pending + (item.status === 'pending' ? 1 : 0),
  }), { total: 0, delivered: 0, failed: 0, pending: 0 });
}

// Skeleton loader for metrics
const MetricsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
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
  const { data: deliveryReport, isLoading: isMetricsLoading, error: metricsError } = useQuery({
    queryKey: ['sms-history'],
    queryFn: async () => {
      const response = await fetch('https://luco-sms-api.onrender.com/api/v1/sms_history?user_id=1');
      if (!response.ok) throw new Error('Failed to fetch SMS history');
      const data: SMSHistory[] = await response.json();
      return processMetricsData(data);
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  if (metricsError) {
    return (
      <div className="text-red-500 p-4">
        Error loading dashboard data. Please try again later.
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Luco SMS - Bulk SMS Sender"
        description="The lucosms is a simple to use dashboard for sending bulky sms."
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <Suspense fallback={<MetricsSkeleton />}>
            {isMetricsLoading ? (
              <MetricsSkeleton />
            ) : (
              <EcommerceMetrics data={deliveryReport ?? { total: 0, delivered: 0, failed: 0, pending: 0 }} />
            )}
          </Suspense>

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
