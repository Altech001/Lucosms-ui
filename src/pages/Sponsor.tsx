import PageMeta from "../utils/common/PageMeta";
import PageBreadcrumb from "../utils/common/PageBreadCrumb";
import SponsorUs from "@/components/SponsorUs";

export default function Sponsor() {
  return (
    <div>
      <PageMeta title="Sponsor Us | LucoSMS" description="Support the LucoSMS project by becoming a sponsor. Your contribution helps us grow and improve." />
      <PageBreadcrumb pageTitle="Sponsor Us" />
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-6 xl:py-6">
        <SponsorUs />
      </div>
    </div>
  );
}
