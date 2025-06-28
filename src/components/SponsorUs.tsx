import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PaymentStatusDialog from "@/components/common/PaymentStatusDialog";
import { Coffee, Zap, Rocket, Gem, X } from "lucide-react";

export default function SponsorUs() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState(5000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    status: null as "success" | "failed" | "pending" | null,
    title: "",
    message: "",
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const sponsorshipPackages = [
    { id: "5000", title: "Coffee Supporter", amount: 5000, description: "Funds a coffee for a developer.", icon: <Coffee className="w-8 h-8 mx-auto mb-4 text-yellow-500" /> },
    { id: "10000", title: "Bronze Sponsor", amount: 10000, description: "Helps cover our server costs.", icon: <Zap className="w-8 h-8 mx-auto mb-4 text-orange-500" /> },
    { id: "25000", title: "Silver Sponsor", amount: 25000, description: "Contributes to new feature development.", icon: <Rocket className="w-8 h-8 mx-auto mb-4 text-gray-400" /> },
    { id: "custom", title: "Custom Sponsor", amount: customAmount, description: "Become a key project supporter.", icon: <Gem className="w-8 h-8 mx-auto mb-4 text-blue-500" /> },
  ];

  const currentPackage = sponsorshipPackages.find(p => p.id === selectedPackage);
  const amount = selectedPackage === "custom" 
    ? customAmount 
    : currentPackage?.amount || 0;

  const verifyPayment = useCallback(async (trackingId: string) => {
    setDialogState({ isOpen: true, status: "pending", title: "Verifying Payment...", message: "Please wait while we confirm your sponsorship." });
    try {
      const response = await fetch(`https://luco-service.onrender.com/v1/lucopay/payment-callback?OrderTrackingId=${trackingId}`);
      const result = await response.json();
      if (response.ok && result.status === "success" && result.payment_status_description?.toLowerCase() === "completed") {
        setDialogState({ isOpen: true, status: "success", title: "Sponsorship Successful!", message: "Thank you! Your contribution is greatly appreciated." });
      } else {
        throw new Error(result.message || "Payment verification failed.");
      }
    } catch (err) {
      setDialogState({ isOpen: true, status: "failed", title: "Verification Failed", message: err instanceof Error ? err.message : "An unexpected error occurred." });
    }
  }, []);

  useEffect(() => {
    const orderTrackingId = searchParams.get("OrderTrackingId");
    if (orderTrackingId) {
      verifyPayment(orderTrackingId);
      searchParams.delete("OrderTrackingId");
      searchParams.delete("OrderMerchantReference");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, verifyPayment]);

  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setIsPanelOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const nameParts = formData.name.split(" ");
    const paymentData = {
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      email: formData.email,
      phone_number: formData.phone,
      amount: amount,
    };

    try {
      const response = await fetch("https://luco-service.onrender.com/v1/lucopay/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(paymentData),
      });
      const result = await response.json();
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        throw new Error(result.message || "Payment initiation failed.");
      }
    } catch (err) {
      setDialogState({ isOpen: true, status: "failed", title: "Error", message: err instanceof Error ? err.message : "An unexpected error occurred." });
      setIsProcessing(false);
    }
  };

  const closeDialog = () => setDialogState({ ...dialogState, isOpen: false });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Support Our Project</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">Your contribution helps us continue to build and improve LucoSMS. Thank you!</p>
      </div>

      <PaymentStatusDialog {...dialogState} onClose={closeDialog} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sponsorshipPackages.map(pkg => (
            <div 
                key={pkg.id}
                className={`text-center border-2 rounded-xl p-6 cursor-pointer transition-all transform hover:-translate-y-1 ${selectedPackage === pkg.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handlePackageSelect(pkg.id)}
            >
                {pkg.icon}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{pkg.title}</h3>
                <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 my-2">UGX {pkg.amount.toLocaleString()}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm h-10">{pkg.description}</p>
            </div>
        ))}
      </div>

      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsPanelOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-100"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Sponsorship Details</h2>
                <button onClick={() => setIsPanelOpen(false)} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSponsor} className="flex flex-col flex-grow">
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{currentPackage?.title}</h3>
                    <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 my-2">UGX {amount.toLocaleString()}</p>
                  </div>

                  {selectedPackage === 'custom' && (
                      <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Amount (UGX)</label>
                          <input type="number" value={customAmount} onChange={(e) => setCustomAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" min="1000" />
                      </div>
                  )}

                  <div>
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Your Details</h4>
                    <div className="grid grid-cols-1 gap-4">
                        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                        <input type="tel" name="phone" placeholder="Phone Number (e.g., 07...)" value={formData.phone} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="submit" disabled={isProcessing} className="w-full px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
                      {isProcessing ? "Processing..." : `Sponsor UGX ${amount.toLocaleString()}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
