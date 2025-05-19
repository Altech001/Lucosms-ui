export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mt-10 w-full max-w-60 rounded-md bg-gray-50 px-4 py-5 text-center dark:bg-zinc-800`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        #1 SMS Sender Platform
      </h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        This a week nominated SMS sender platform. It is a great tool for
        sending bulk SMS to your customers.
      </p>
      <a
        href="https://lucosms.vercel.app/"
        target="_blank"
        rel="nofollow"
        className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-zinc-950 text-theme-sm hover:bg-zinc-600"
      >
        Upgrade to Pro
      </a>
    </div>
  );
}
