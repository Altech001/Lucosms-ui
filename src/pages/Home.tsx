// import { useQuery } from 'react-query';
// import { MetricCard } from '../ui/metric-card/MetricCard';
import { MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { MetricCard } from '../utils/ui/metric-card/MetricCard';

interface DeliveryReport {
  id: number;
  status: 'delivered' | 'failed' | 'pending';
  timestamp: string;
}

interface EcommerceMetricsProps {
  data: DeliveryReport[];
}

export default function EcommerceMetrics({ data }: EcommerceMetricsProps) {
  const metrics = {
    total: data?.length || 0,
    delivered: data?.filter(item => item.status === 'delivered').length || 0,
    failed: data?.filter(item => item.status === 'failed').length || 0,
    pending: data?.filter(item => item.status === 'pending').length || 0,
  };

  const getPercentage = (value: number) => {
    return metrics.total ? (value / metrics.total) * 100 : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Messages"
        value={metrics.total}
        icon={<MessageSquare className="h-6 w-6" />}
      />
      <MetricCard
        title="Delivered"
        value={metrics.delivered}
        trend={getPercentage(metrics.delivered)}
        trendColor="success"
        icon={<CheckCircle className="h-6 w-6" />}
      />
      <MetricCard
        title="Failed"
        value={metrics.failed}
        trend={getPercentage(metrics.failed)}
        trendColor="error"
        icon={<XCircle className="h-6 w-6" />}
      />
    </div>
  );
}