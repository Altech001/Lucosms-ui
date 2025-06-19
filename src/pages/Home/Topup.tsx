
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Input from "../../utils/form/input/InputField";
import Button from "../../utils/ui/button/Button";
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Download, ArrowRight, Loader2 } from 'lucide-react';
import PageBreadcrumb from '@/utils/common/PageBreadCrumb';
import PageMeta from '@/utils/common/PageMeta';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Topup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '5000'
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const orderSummaryRef = useRef(null);
  const presetAmounts = [5000, 10000, 25000, 50000, 100000];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
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

  return (
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
            {/* Main Form */}
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
                        <Input id="name" name="name" type="text" placeholder="e.g., John Doe" value={formData.name} onChange={handleChange}  className="pl-10 h-11" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-medium text-gray-600">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <Input id="email" name="email" type="email" placeholder="e.g., john@example.com" value={formData.email} onChange={handleChange}  className="pl-10 h-11" />
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
                    
                    <Button variant="primary" className="w-full h-12 text-lg font-semibold">
                      Proceed to Payment <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
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
  );
};

export default Topup;