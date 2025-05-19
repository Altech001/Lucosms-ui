import { useState } from "react";
import { useBalance } from "../../../context/BalanceContext";

interface AddSmsCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSmsCreditsModal({ isOpen, onClose }: AddSmsCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState("100");
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshBalance } = useBalance();

  const pricePerSms = 32; // UGX 32 per SMS

  const smsPackages = [
    { id: "10", label: "10 SMS", amount: 10 },
    { id: "20", label: "20 SMS", amount: 20 },
    { id: "custom", label: "Custom", amount: customAmount }
  ];

  const selectedAmount = selectedPackage === "custom" 
    ? customAmount 
    : smsPackages.find(pkg => pkg.id === selectedPackage)?.amount || 100;
    
  const totalCost = selectedAmount * pricePerSms;

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and limit to 10 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
  };

  const handlePurchase = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsPurchasing(true);
    setError(null);
    
    try {
      const response = await fetch(
        "https://luco-sms-api.onrender.com/api/v1/topup?user_id=1",
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: totalCost,
            phoneNumber: phoneNumber,
            paymentMethod: paymentMethod
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to top up credits");
      }

      // Refresh the balance from the database
      await refreshBalance();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full m-10  max-w-md overflow-hidden dark:bg-gray-800">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 p-2  ">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Add SMS Credits
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Purchase SMS credits for your account
          </p>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* SMS Package Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select SMS Package
            </label>
            <div className="grid grid-cols-3 gap-2">
              {smsPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors 
                    ${selectedPackage === pkg.id 
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-500 dark:bg-blue-800 dark:text-blue-200" 
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                >
                  {pkg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input (shown only if "Custom" is selected) */}
          {selectedPackage === "custom" && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter SMS Amount
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min="1"
                disabled={isPurchasing}
              />
            </div>
          )}

          {/* Phone Number Input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mobile Money Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                +256
              </span>
              <input
                type="text"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="7XXXXXXXX"
                disabled={isPurchasing}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the phone number linked to your mobile money account
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`flex flex-col items-center justify-center border rounded-lg p-2 cursor-pointer ${
                  paymentMethod === "mtn" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" 
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => setPaymentMethod("mtn")}
              >
                {/* <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mb-2">
                  <span className="font-bold text-xs text-blue-900">MTN</span>
                </div> */}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">MTN Mobile Money</span>
              </div>
              
              <div 
                className={`flex flex-col items-center justify-center border rounded-lg p-3 cursor-pointer ${
                  paymentMethod === "airtel" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" 
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => setPaymentMethod("airtel")}
              >
                {/* <image src="" /> */}
                {/* <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mb-2">
                  <span className="font-bold text-xs text-white">A</span>
                </div> */}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Airtel Money</span>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Price per SMS:</span>
              <span>UGX {pricePerSms}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mt-1">
              <span>Quantity:</span>
              <span>{selectedAmount} SMS</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2"></div>
            <div className="flex justify-between font-bold text-gray-800 dark:text-white">
              <span>Total Amount:</span>
              <span>UGX {totalCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={isPurchasing}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              className={`px-4 py-2 flex-1 text-sm font-medium text-white rounded-lg ${
                isPurchasing
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              }`}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : "Purchase Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}