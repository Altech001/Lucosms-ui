import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Input from "../../utils/form/input/InputField";
import Button from "../../utils/ui/button/Button";
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Download, ArrowRight, Loader2 } from 'lucide-react';
import PageBreadcrumb from '@/utils/common/PageBreadCrumb';
import PageMeta from '@/utils/common/PageMeta';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import PaymentStatusDialog from '@/components/common/PaymentStatusDialog';

const Topup = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '5000'
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    status: null as 'success' | 'failed' | 'pending' | null,
    title: '',
    message: '',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const orderSummaryRef = useRef(null);
  const presetAmounts = [5000, 10000, 25000, 50000, 100000];

  useEffect(() => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        name: user.id || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    const orderTrackingId = searchParams.get('OrderTrackingId');

    const fetchPaymentStatus = async (trackingId: string) => {
      try {
        const response = await fetch(
          `https://luco-service.onrender.com/v1/lucopay/payment-callback?OrderTrackingId=${trackingId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `HTTP Error: ${response.status}`);
        }

        setDialogState({
          isOpen: true,
          status: result.status as 'success' | 'failed' | 'pending',
          title: result.title,
          message: result.message,
        });

        // If payment is completed, trigger wallet top-up
        if (result.status === 'success' && result.payment_status_description === 'Completed' && user?.id) {
          try {
            const topupResponse = await fetch(
              `https://lucosms-api.onrender.com/v1/admin/userwallet/${user.id}/topup`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({ amount: result.amount }),
              }
            );

            if (!topupResponse.ok) {
              throw new Error(`Failed to top up wallet: ${topupResponse.status}`);
              
            }

            console.log(`Wallet topped up successfully for user ${user.id}, amount: ${result.amount}`);
          } catch (topupError) {
            console.error('Wallet top-up error:', topupError);
            setDialogState((prev) => ({
              ...prev,
              message: `${prev.message}\nNote: Wallet update failed. Please contact support.`,
            }));
          }
        }
      } catch (err: unknown) {
        let errorMessage = 'An error occurred while checking payment status.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setDialogState({
          isOpen: true,
          status: 'failed',
          title: 'Error Checking Status',
          message: errorMessage,
        });
      } finally {
        searchParams.delete('OrderTrackingId');
        searchParams.delete('OrderMerchantReference');
        setSearchParams(searchParams);
      }
    };

    if (orderTrackingId) {
      fetchPaymentStatus(orderTrackingId);
    }
  }, [searchParams, setSearchParams, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePresetClick = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    const nameParts = formData.name.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const paymentData = {
      first_name,
      last_name,
      email: formData.email,
      phone_number: formData.phone,
      amount: parseFloat(formData.amount),
    };

    try {
      const response = await fetch('https://luco-service.onrender.com/v1/lucopay/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server Error: ${response.status}`);
      }

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        throw new Error('Payment initiation failed: No redirect URL received.');
      }
    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    const element = orderSummaryRef.current;
    if (!element || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('LucoSMS-Order-Preview.pdf');
    } catch (error) {
      console.error('Download Error:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const amountInUGX = formData.amount ? parseFloat(formData.amount) : 0;
  const smsCredits = Math.floor(amountInUGX / 32);

  const closeDialog = () => {
    setDialogState({ isOpen: false, status: null, title: '', message: '' });
  };

  return (
    <>
      <PaymentStatusDialog 
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        status={dialogState.status}
        title={dialogState.title}
        message={dialogState.message}
      />
      <div className="min-h-screen">
        <PageMeta
          title="Top Up Account | LucoSMS"
          description="Top up your account balance to send SMS."
        />
        <PageBreadcrumb pageTitle="Top Up" />
        
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Top Up Your Account</h1>
              <p className="text-gray-500 mt-2">Quickly add credits to your account to send SMS.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="md:col-span-3">
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-700">Your Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-medium text-gray-600">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <Input id="name" name="name" type="text" placeholder="e.g., John Doe" value={formData.name} onChange={handleChange} className="pl-10 h-11" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-medium text-gray-600">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <Input id="email" name="email" type="email" placeholder="e.g., john@example.com" value={formData.email} onChange={handleChange} className="pl-10 h-11" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="font-medium text-gray-600">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <Input id="phone" name="phone" type="tel" placeholder="e.g., +256 777 123456" value={formData.phone} onChange={handleChange} className="pl-10 h-11" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-medium text-gray-600">Choose an Amount (UGX)</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {presetAmounts.map((amount) => (
                            <Button
                              key={amount}
                              variant={formData.amount === amount.toString() ? 'primary' : 'outline'}
                              onClick={() => handlePresetClick(amount)}
                              className="h-11"
                            >
                              {amount.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                        <div className="relative pt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">UGX</span>
                          <Input id="amount" name="amount" type="number" placeholder="Or enter custom amount" min="32" value={formData.amount} onChange={handleChange} className="pl-14 h-11 text-lg" />
                        </div>
                      </div>
                      
                      <Button type="submit" variant="primary" className="w-full h-12 text-lg font-semibold" disabled={isProcessing}>
                        {isProcessing ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                        ) : (
                          <>Proceed to Payment <ArrowRight className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <div className="sticky top-24">
                  <Card ref={orderSummaryRef} className="bg-white shadow-lg border-gray-100">
                    <CardHeader className="bg-gray-50 rounded-t-lg">
                      <CardTitle className="text-xl font-semibold text-gray-700">Order Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-500">Name</p>
                          <p className="font-medium text-gray-800 text-right">{formData.name || '...'}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-500">Email</p>
                          <p className="font-medium text-gray-800 text-right">{formData.email || '...'}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-500">Phone</p>
                          <p className="font-medium text-gray-800 text-right">{formData.phone || '...'}</p>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-4"></div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-500">SMS Credits</p>
                          <p className="font-bold text-gray-800">{smsCredits.toLocaleString()} SMS</p>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-4"></div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-lg">
                            <p className="font-semibold text-gray-600">Total</p>
                            <p className="font-bold text-blue-600">
                              {`UGX ${amountInUGX.toLocaleString()}`}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 text-right">1 SMS = 32 UGX</p>
                        </div>
                        <Button onClick={handleDownload} disabled={isDownloading} className="w-full h-11 mt-6" variant="outline">
                          {isDownloading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
                          ) : (
                            <><Download className="mr-2 h-4 w-4" />Download Preview</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Topup;