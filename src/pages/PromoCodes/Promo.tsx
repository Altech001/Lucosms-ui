/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Search, Plus, Copy, Clock, BarChart2, MoreVertical, X, Tag, Calendar, Users, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

// Define interfaces for type safety
interface PromoCode {
  id: number;
  code: string;
  discount_type: string;
  discount_value: string;
  expires_at: string;
  usage: string;
  status: 'Active' | 'Expired';
}

interface Notification {
  type: 'success' | 'error' | null;
  message: string | null;
}

const PromoManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [filteredPromoCodes, setFilteredPromoCodes] = useState<PromoCode[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newDiscountValue, setNewDiscountValue] = useState<string>('');
  const [newExpiresAt, setNewExpiresAt] = useState<string>('');
  const [newUsageLimit, setNewUsageLimit] = useState<string>('');
  const [notification, setNotification] = useState<Notification>({ type: null, message: null });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const userId: number = 1; // Hardcoded for now

  // Mock data for demonstration
  const mockPromoCodes: PromoCode[] = [
    { id: 1, code: 'WELCOMELUCO22', discount_type: 'GENERAL DISCOUNT', discount_value: '% 10% OFF', expires_at: '4/17/2025', usage: '0/10', status: 'Expired' },
    { id: 2, code: 'WELCOME22', discount_type: 'GENERAL DISCOUNT', discount_value: '% 12% OFF', expires_at: '4/17/2025', usage: '0/10', status: 'Active' },
    { id: 3, code: 'LUCO TEST', discount_type: 'GENERAL DISCOUNT', discount_value: '% 10% OFF', expires_at: '4/17/2025', usage: '0/400', status: 'Active' },
    { id: 4, code: 'REF120250417010851', discount_type: 'GENERAL DISCOUNT', discount_value: '% 10% OFF', expires_at: '4/17/2026', usage: '0/1', status: 'Active' },
  ];

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulating API call with mock data for demo purposes
      setTimeout(() => {
        setPromoCodes(mockPromoCodes);
        setFilteredPromoCodes(mockPromoCodes);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Fetch promo codes error:', error);
      showNotification('error', 'Failed to fetch promo codes. Please try again.');
      setPromoCodes(mockPromoCodes);
      setFilteredPromoCodes(mockPromoCodes);
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string): void => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: null }), 3000);
  };

  const handleCopyCode = (code: string): void => {
    navigator.clipboard.writeText(code);
    showNotification('success', `Copied "${code}" to clipboard!`);
  };

  const handleSearchAndFilter = (): void => {
    let filtered: PromoCode[] = promoCodes;
    if (searchQuery) {
      filtered = filtered.filter((promo) =>
        promo.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'All') {
      filtered = filtered.filter((promo) => promo.status === statusFilter);
    }
    setFilteredPromoCodes(filtered);
  };

  useEffect(() => {
    handleSearchAndFilter();
  }, [searchQuery, statusFilter, promoCodes]);

  const createPromoCode = (): void => {
    if (!newCode || !newDiscountValue || !newExpiresAt || !newUsageLimit) {
      showNotification('error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    // Simulate API call for demo
    setTimeout(() => {
      const newPromo: PromoCode = {
        id: promoCodes.length + 1,
        code: newCode,
        discount_type: 'GENERAL DISCOUNT',
        discount_value: `% ${newDiscountValue}% OFF`,
        expires_at: new Date(newExpiresAt).toLocaleDateString(),
        usage: `0/${newUsageLimit}`,
        status: new Date(newExpiresAt) > new Date() ? 'Active' : 'Expired',
      };
      
      const updatedPromoCodes: PromoCode[] = [...promoCodes, newPromo];
      setPromoCodes(updatedPromoCodes);
      setFilteredPromoCodes(updatedPromoCodes);
      showNotification('success', 'Promo code created successfully.');
      setNewCode('');
      setNewDiscountValue('');
      setNewExpiresAt('');
      setNewUsageLimit('');
      setIsModalOpen(false);
      setIsLoading(false);
    }, 1000);
  };

  const deactivatePromoCode = (id: number): void => {
    setIsLoading(true);
    // Simulate API call for demo
    setTimeout(() => {
      const updatedPromoCodes: PromoCode[] = promoCodes.filter((promo) => promo.id !== id);
      setPromoCodes(updatedPromoCodes);
      setFilteredPromoCodes(updatedPromoCodes);
      showNotification('success', 'Promo code deactivated successfully.');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-800">Promotional Codes</h1>
            <p className="text-gray-500 mt-1">Create and manage promotional codes for your customers</p>
          </div>

          {/* Notification */}
          {notification.message && (
            <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center ${
              notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {notification.type === 'success' ? 
                <CheckCircle className="h-5 w-5 mr-3" /> : 
                <AlertCircle className="h-5 w-5 mr-3" />
              }
              <p>{notification.message}</p>
            </div>
          )}

          {/* Search and Filter */}
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search promo codes..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 pr-8 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>Create Code</span>
              </button>
            </div>
          </div>

          {/* Promo Code List */}
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No promo codes found</h3>
                <p className="text-gray-500">Create a new promo code or adjust your search criteria.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span>Create Promo Code</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden shadow-sm border border-gray-100 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPromoCodes.map((promo) => (
                      <tr key={promo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{promo.code}</div>
                            <button 
                              onClick={() => handleCopyCode(promo.code)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copy code"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">{promo.discount_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{promo.discount_value}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{promo.expires_at}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <BarChart2 className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{promo.usage}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                            promo.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {promo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left group">
                            <button className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden groupapture:block z-10">
                              <div className="py-1" role="none">
                                <button
                                  onClick={() => deactivatePromoCode(promo.id)}
                                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Deactivate
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Promo Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900" id="modal-title">Create Promotional Code</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-white rounded-full p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700">
                      Promo Code
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="promo-code"
                        value={newCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCode(e.target.value)}
                        placeholder="e.g., WELCOME25"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="discount-value" className="block text-sm font-medium text-gray-700">
                      Discount (%)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="discount-value"
                        value={newDiscountValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDiscountValue(e.target.value)}
                        placeholder="e.g., 10"
                        className="block w-full pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700">
                      Expiration Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="expiration-date"
                        value={newExpiresAt}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpiresAt(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="usage-limit" className="block text-sm font-medium text-gray-700">
                      Usage Limit
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="usage-limit"
                        value={newUsageLimit}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUsageLimit(e.target.value)}
                        placeholder="e.g., 100"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse">
                <button
                  type="button"
                  onClick={createPromoCode}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : "Create Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoManagement;