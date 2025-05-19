import { Link } from "react-router";
import { ChevronLeftIcon} from "../../icons";

import { SignIn } from "@clerk/clerk-react";


export default function SignInForm() {
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Home
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          
          <div>
            <div className="flex  ">
              <SignIn/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


