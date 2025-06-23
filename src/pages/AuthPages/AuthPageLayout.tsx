import React from "react";
import GridShape from "../../utils/common/GridShape";
import { Link } from "react-router";
// import ThemeTogglerTwo from "../../utils/common/ThemeTogglerTwo";
import { MessageCircleMoreIcon } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-zinc-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-zinc-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-zinc-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              
              <Link to="/" className=" mb-4 flex">
                <h2 className="text-title-md font-bold text-gray-100 dark:text-gray-400">
                  Luco SMS
                </h2>

              <MessageCircleMoreIcon className="text-gray-100 dark:text-gray-400"/>
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                Luco SMS is the 1# SMS Sending Platform in Uganda and Beyond.
              </p>
            </div>
          </div>
        </div>
        {/* <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div> */}
      </div>
    </div>
  );
}
