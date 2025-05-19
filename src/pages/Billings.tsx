import PageBreadcrumb from "../utils/common/PageBreadCrumb";
import PageMeta from "../utils/common/PageMeta";
import StatisticsChart from "../utils/ecommerce/StatisticsChart";
import TranscationTB from "../utils/tables/BasicTables/TranscationTB";

export default function Billings() {
  return (
    <div>
      <PageMeta title="LucoSMS" description="LucoSMS - SMS Billing Dashboard" />
      <PageBreadcrumb pageTitle="Billings" />
      <div className="min-h-auto rounded-xl border border-gray-200 bg-white py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
        <div className=" grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <TranscationTB />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <StatisticsChart />
          </div>
        </div>
      </div>
    </div>
  );
}
