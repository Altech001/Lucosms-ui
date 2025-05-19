import { MetricCard } from '../ui/metric-card/MetricCard';
import { MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface MetricsData {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

interface EcommerceMetricsProps {
  data: MetricsData;
}

export default function EcommerceMetrics({ data }: EcommerceMetricsProps) {
  const getPercentage = (value: number) => {
    return data.total ? (value / data.total) * 100 : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Messages"
        value={data.total}
        icon={<MessageSquare className="h-6 w-6" />}
      />
      <MetricCard
        title="Delivered"
        value={data.delivered}
        trend={getPercentage(data.delivered)}
        trendColor="success"
        icon={<CheckCircle className="h-6 w-6" />}
      />
      <MetricCard
        title="Failed"
        value={data.failed}
        trend={getPercentage(data.failed)}
        trendColor="error"
        icon={<XCircle className="h-6 w-6" />}
      />
    </div>
  );
}