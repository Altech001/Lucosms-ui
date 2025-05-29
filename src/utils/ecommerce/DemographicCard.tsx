import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";

type CountryType = "Uganda" | "Kenya" | "Rwanda";

interface SmsHistory {
  id: number;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "pending";
  cost: number;
  created_at: string;
  network?: string; // Optional, if API provides it
}

interface DeliveryReport {
  status: "sent" | "failed" | "pending";
}

interface NetworkData {
  name: string;
  logo: string;
  customers: number;
  deliveryRate: number;
}

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [country, setCountry] = useState<CountryType>("Uganda");
  const { getToken } = useAuth();
  
  const {
    data: smsHistory = [] as SmsHistory[],
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ["sms-history", 0, 1000, true], // Using fixed values since we want all records
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/user/api/v1/sms_history?skip=0&limit=1000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.detail);
        }
        throw new Error("Failed to fetch SMS history");
      }

      return await response.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message === "User not Found" || error.message === "No message found") {
        return false;
      }
      return failureCount < 2;
    },
  });

  const {
    data: deliveryReports = [] as DeliveryReport[],
    isLoading: isDeliveryLoading,
  } = useQuery({
    queryKey: ["delivery-reports", smsHistory],
    queryFn: async () => {
      if (!smsHistory.length) return [];
      const token = await getToken();
      const promises = smsHistory.map((sms: { id: unknown; }) => 
        fetch(`${import.meta.env.VITE_API_URL}/user/api/v1/delivery_report/${sms.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }).then(res => res.json())
      );
      return Promise.all<DeliveryReport>(promises);
    },
    enabled: Boolean(smsHistory.length),
    staleTime: 5 * 60 * 1000,
  });

  const countryPrefixes: Record<CountryType, string> = {
    Uganda: "+256",
    Kenya: "+254",
    Rwanda: "+250"
  };

  const getNetworkData = (): NetworkData[] => {
    // Filter SMS by country (based on recipient prefix)
    const filteredSms = smsHistory.filter((sms: { recipient: string; }) =>
      sms.recipient.startsWith(countryPrefixes[country])
    );
    const filteredDelivery = deliveryReports.slice(0, filteredSms.length);

    // Define networks based on country
    const networks = {
      Uganda: ["Airtel UG", "MTN UG"],
      Kenya: ["Safaricom KE", "Airtel KE"],
      Rwanda: ["MTN RW", "Airtel RW"]
    }[country];

    // Infer network from recipient prefix if no network field
    const getNetwork = (recipient: string): string => {
      if (country === "Uganda") {
        if (/^\+256(70|75)/.test(recipient)) return "Airtel UG";
        if (/^\+256(77|78)/.test(recipient)) return "MTN UG";
      } else if (country === "Kenya") {
        if (/^\+254(7[0-2]|10)/.test(recipient)) return "Safaricom KE";
        if (/^\+254(7[3-9]|11)/.test(recipient)) return "Airtel KE";
      } else if (country === "Rwanda") {
        if (/^\+250(78|79)/.test(recipient)) return "MTN RW";
        if (/^\+250(73)/.test(recipient)) return "Airtel RW";
      }
      return networks[0]; // Fallback
    };

    // Calculate network data
    const networkData: { [key: string]: { customers: Set<string>; sent: number; total: number } } = {};
    networks.forEach((network) => {
      networkData[network] = { customers: new Set(), sent: 0, total: 0 };
    });

    filteredSms.forEach((sms: { network: string; recipient: string; }, i: number) => {
      const network = sms.network || getNetwork(sms.recipient);
      if (networkData[network]) {
        networkData[network].customers.add(sms.recipient);
        networkData[network].total++;
        if (filteredDelivery[i]?.status === "sent") {
          networkData[network].sent++;
        }
      }
    });

    return networks.map((network) => {
      const stats = networkData[network];
      const deliveryRate = stats.total > 0 
        ? Math.round((stats.sent / stats.total) * 100)
        : 0;
      
      return {
        name: network,
        logo: network.includes("Airtel")
          ? "./images/country/airtel_logo1.png"
          : "./images/country/mtn_logo.svg",
        customers: stats.customers.size,
        deliveryRate,
      };
    });
  };

  const networkData = getNetworkData();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleCountryChange = (newCountry: CountryType) => {
    setCountry(newCountry);
    closeDropdown();
  };

  const NetworkSkeleton = () => (
    <div className="space-y-5 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-700"></div>
            <div>
              <div className="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="w-16 h-3 mt-2 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="h-2 w-full max-w-[100px] bg-gray-200 rounded-sm dark:bg-gray-700"></div>
            <div className="w-8 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Available Networks
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View the available {country} networks
          </p>
        </div>
        <div className="relative inline-block">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleDropdown}
          >
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <DropdownItem
              onItemClick={() => handleCountryChange("Uganda")}
              className="flex w-full px-3 py-2 text-sm text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Uganda
            </DropdownItem>
            <DropdownItem
              onItemClick={() => handleCountryChange("Kenya")}
              className="flex w-full px-3 py-2 text-sm text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Kenya
            </DropdownItem>
            <DropdownItem
              onItemClick={() => handleCountryChange("Rwanda")}
              className="flex w-full px-3 py-2 text-sm text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Rwanda
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {isLoading || isDeliveryLoading ? (
        <>
          <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800 sm:px-6">
            <div className="w-full h-[212px] bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
          </div>
          <NetworkSkeleton />
        </>
      ) : queryError ? (
        <div className="p-4 text-center text-red-500 dark:text-red-400">
          {queryError instanceof Error ? queryError.message : "An error occurred"}
        </div>
      ) : (
        <>
          <div className="px-4 py-6 my-1 overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800 sm:px-6">
            <div
              id="mapOne"
              className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
            >
              <CountryMap country={country} />
            </div>
          </div>

          <div className="space-y-5">
            {networkData.map((network) => (
              <div key={network.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="items-center w-6 h-6 rounded-full overflow-hidden">
                    <img
                      src={network.logo}
                      className="w-full h-full object-cover"
                      alt={network.name}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm dark:text-white/90">
                      {network.name}
                    </p>
                    <span className="block text-gray-500 text-xs dark:text-gray-400">
                      {network.customers.toLocaleString()} Customers
                    </span>
                  </div>
                </div>
                <div className="flex w-full max-w-[140px] items-center gap-3">
                  <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                    <div
                      className="absolute left-0 top-0 h-full rounded-sm bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(network.deliveryRate, 100)}%` }}
                    ></div>
                  </div>
                  <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                    {network.deliveryRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}