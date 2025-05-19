import React from 'react';

interface AlertBannerProps {
  type: 'warning' | 'error' | 'info';
  message: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, message }) => {
  const bgColor = {
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  }[type];

  return (
    <div className={`p-4 mb-4 border-l-4 ${bgColor}`}>
      <p className="font-medium">{message}</p>
    </div>
  );
};

export default AlertBanner;
