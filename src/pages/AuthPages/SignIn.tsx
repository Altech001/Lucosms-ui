import PageMeta from "../../utils/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../utils/auth/SignInForm";



export default function LucoSignIn() {
  return (
    <>
      <PageMeta
        title="LucoSMS"
        description=""
      />
      <AuthLayout>
        <SignInForm />
        
      </AuthLayout>
    </>
  );
}
