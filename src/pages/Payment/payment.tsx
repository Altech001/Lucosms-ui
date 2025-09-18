import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Phone, Mail, MessageSquare, Copy, CheckCircle, ExternalLink, Zap, Users, Headphones, Clock, Globe } from "lucide-react";
import { useState } from "react";

interface SMSPack {
  id: string;
  name: string;
  messages: number;
  price: string;
  originalPrice?: string;
  description: string;
  rating: number;
  features: string[];
  popular?: boolean;
  badge?: string;
}

const smsPacks: SMSPack[] = [
  {
    id: "basic",
    name: "Basic Pack",
    messages: 100,
    price: "3,200 UGX",
    description: "Perfect for small businesses or testing",
    rating: 4.2,
    features: ["32 UGX per SMS", "Reliable delivery", "Email support"],
  },
  {
    id: "pro",
    name: "Pro Pack",
    messages: 500,
    price: "15,500 UGX",
    originalPrice: "16,000 UGX",
    description: "Ideal for growing businesses",
    rating: 4.5,
    features: ["31 UGX per SMS", "Reliable delivery", "Priority support"],
    popular: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    messages: 2000,
    price: "60,000 UGX",
    originalPrice: "64,000 UGX",
    description: "Best for large-scale campaigns",
    rating: 4.8,
    features: ["30 UGX per SMS", "Reliable delivery", "Dedicated support"],
    badge: "Best Value",
  },
];

const contactMethods = [
  {
    id: "phone1",
    type: "phone",
    label: "Primary Phone",
    value: "+256708215305",
    href: "tel:+256700123456",
    icon: Phone,
  },
  {
    id: "phone2",
    type: "phone",
    label: "Secondary Phone", 
    value: "256769030882",
    href: "tel:+256750987654",
    icon: Phone,
  },
  {
    id: "whatsapp",
    type: "whatsapp",
    label: "WhatsApp Business",
    value: "+256708215305",
    href: "https://wa.me/256700123456?text=Hi,%20I'm%20interested%20in%20your%20SMS%20packs",
    icon: MessageSquare,
  },
  {
    id: "email1",
    type: "email",
    label: "Sales Email",
    value: "sales@sms-service.com",
    href: "mailto:sales@sms-service.com?subject=SMS%20Pack%20Inquiry",
    icon: Mail,
  },
  {
    id: "email2",
    type: "email",
    label: "Support Email",
    value: "support@sms-service.com",
    href: "mailto:support@sms-service.com?subject=Technical%20Support",
    icon: Mail,
  },
];

function Payment() {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-gray-300 dark:text-gray-600 absolute" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 absolute" style={{ clipPath: "inset(0 50% 0 0)" }} />
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600" />);
      }
    }
    return stars;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [id]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [id]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const openWhatsApp = () => {
    const whatsappUrl = "https://wa.me/256708215305?text=Hi,%20I'm%20interested%20in%20your%20SMS%20packs.%20Could%20you%20please%20provide%20more%20information%20about%20pricing%20and%20features?";
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen  dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 border  dark:text-gray-300 px-4 py-2 rounded-full text-[12px] mb-4">
            <Zap className="w-4 h-4" />
            Reliable SMS Solutions
          </div>
          <h1 className="text-2xl font-bold  dark:text-white mb-6  bg-clip-text ">
            SMS Service Packs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Choose the perfect SMS pack for your business needs. Reliable delivery, competitive pricing, and excellent support.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="flex-1">
            {/* Features Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              {[
                { icon: Zap, text: "Instant Delivery" },
                { icon: Globe, text: "Uganda Coverage" },
                { icon: Headphones, text: "24/7 Support" },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-sm -sm border border-gray-200 dark:border-gray-700">
                  <feature.icon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* SMS Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {smsPacks.map((pack) => (
                <Card 
                  key={pack.id} 
                  className={`relative bg-white dark:bg-gray-900 border-2 -lg hover:-xl transition-all duration-300 transform hover:-translate-y-1 ${
                    pack.popular 
                      ? 'border-gray-500 ring-2 ring-gray-500 ring-opacity-20' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  {pack.badge && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white ${
                      pack.popular ? 'bg-gray-600' : 'bg-green-500'
                    }`}>
                      {pack.badge}
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {pack.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {renderStars(pack.rating)}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {pack.rating.toFixed(1)} rating
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-600 dark:text-gray-400">
                          {pack.messages.toLocaleString()}
                        </span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">SMS</span>
                      </div>
                      <div className="mt-2">
                        {pack.originalPrice && (
                          <span className="text-sm text-gray-400 line-through mr-2">
                            {pack.originalPrice}
                          </span>
                        )}
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {pack.price}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      {pack.description}
                    </p>

                    <div className="space-y-3">
                      {pack.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full py-3 font-semibold transition-all duration-300 ${
                        pack.popular
                          ? 'bg-gray-600 hover:bg-gray-700 text-white -lg hover:-xl'
                          : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white'
                      }`}
                      onClick={() => {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Get Started Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Enhanced Contact Sidebar */}
          <div className="xl:w-96">
            <div className="sticky top-8 space-y-6">
              {/* Contact Card */}
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 -lg" id="contact">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <Users className="w-5 h-5 text-gray-600" />
                    Contact Our Team
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ready to get started? Reach out through your preferred channel
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {contactMethods.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <contact.icon className={`w-5 h-5 ${
                          contact.type === 'whatsapp' ? 'text-green-500' : 'text-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {contact.label}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {contact.value}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(contact.value, contact.id)}
                        >
                          {copiedStates[contact.id] ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(contact.href, contact.type === 'whatsapp' ? '_blank' : '_self')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                      onClick={openWhatsApp}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat on WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-gray-500 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 font-medium py-3"
                      onClick={() => window.open('tel:+256700123456')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours Card */}
              <Card className=" dark:from-gray-900 dark:to-gray-900 border border-gray-200 dark:border-gray-90">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    <Clock className="w-5 h-5" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-800 dark:text-gray-200">
                    <span>Monday - Friday</span>
                    <span className="font-medium">8:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between text-gray-800 dark:text-gray-200">
                    <span>Saturday</span>
                    <span className="font-medium">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between text-gray-800 dark:text-gray-200">
                    <span>Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 italic">
                    WhatsApp available 24/7 for urgent inquiries
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;