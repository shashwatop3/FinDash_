import Link from "next/link";

export const HeaderLogo = () => {
  return (
    <Link href="/">
      <div className="hidden items-center lg:flex">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 shadow-2xl hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-105">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white drop-shadow-lg"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.9"/>
            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/>
            <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          </svg>
        </div>

        <p className="ml-3 text-2xl font-bold text-white drop-shadow-lg">FinDash</p>
      </div>
    </Link>
  );
};
