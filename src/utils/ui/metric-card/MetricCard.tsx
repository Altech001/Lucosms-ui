import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  trend?: number;
  trendColor?: 'success' | 'error' | 'warning';
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend, trendColor = 'success', icon }: MetricCardProps) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {value.toLocaleString()}
        </h3>
        {trend !== undefined && (
          <span className={`text-sm ${
            trendColor === 'success' ? 'text-green-500' :
            trendColor === 'error' ? 'text-red-500' :
            'text-yellow-500'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
