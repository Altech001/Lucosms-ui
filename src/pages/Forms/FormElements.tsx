import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import DefaultInputs from "../../utils/form/form-elements/DefaultInputs";
import InputGroup from "../../utils/form/form-elements/InputGroup";
import DropzoneComponent from "../../utils/form/form-elements/DropZone";
import CheckboxComponents from "../../utils/form/form-elements/CheckboxComponents";
import RadioButtons from "../../utils/form/form-elements/RadioButtons";
import ToggleSwitch from "../../utils/form/form-elements/ToggleSwitch";
import FileInputExample from "../../utils/form/form-elements/FileInputExample";
import SelectInputs from "../../utils/form/form-elements/SelectInputs";
import TextAreaInput from "../../utils/form/form-elements/TextAreaInput";
import InputStates from "../../utils/form/form-elements/InputStates";
import PageMeta from "../../utils/common/PageMeta";

export default function FormElements() {
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="From Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs />
          <SelectInputs />
          <TextAreaInput />
          <InputStates />
        </div>
        <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div>
      </div>
    </div>
  );
}
