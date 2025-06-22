import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700">
      <div className="mx-auto mb-6 h-24 w-24 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Messages Yet</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
        It looks a bit empty in here. Why not start by sending your first message to a customer or friend?
      </p>
      <Link
        to="/compose"
        className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
      >
        Compose Message
      </Link>
    </div>
  );
};

export default EmptyState;
