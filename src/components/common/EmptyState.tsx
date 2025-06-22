import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">It looks like you don't have any messages yet.</p>
      <p className="text-gray-500 dark:text-gray-400">Start by sending your first SMS message to see your dashboard in action!</p>
    </div>
  );
};

export default EmptyState;
