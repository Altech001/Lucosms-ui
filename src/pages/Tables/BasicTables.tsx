import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import ComponentCard from "../../utils/common/ComponentCard";
import PageMeta from "../../utils/common/PageMeta";
import TranscationTB from "../../utils/tables/BasicTables/TranscationTB";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title=""
        description=""
      />
      <PageBreadcrumb pageTitle="Billings" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <TranscationTB />
        </ComponentCard>
      </div>
    </>
  );
}
