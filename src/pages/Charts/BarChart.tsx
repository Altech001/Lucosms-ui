import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import ComponentCard from "../../utils/common/ComponentCard";
import BarChartOne from "../../utils/charts/bar/BarChartOne";
import PageMeta from "../../utils/common/PageMeta";

export default function BarChart() {
  return (
    <div>
      <PageMeta
        title="React.js Chart Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
