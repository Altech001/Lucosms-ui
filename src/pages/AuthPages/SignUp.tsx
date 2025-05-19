import PageMeta from "../../utils/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../utils/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Luco sms"
        description=""
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
