"use client";

import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { label: "Trang chủ", icon: "🏠", path: "/tenant/invoice" },
  { label: "Hợp đồng", icon: "📄", path: "/tenant/contract" },
  { label: "Bản tin", icon: "💬", path: "/tenant/feed" },
  { label: "Báo hỏng", icon: "🔧", path: "/tenant/maintenance" },
  { label: "Gửi xe", icon: "🚗", path: "/tenant/parking" },
  { label: "Hồ sơ", icon: "👤", path: "/tenant/profile" },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xl">🏠</span>
          <span className="font-bold text-blue-600">SmartDorm</span>
        </div>
        <button
          onClick={() => { localStorage.clear(); router.push("/"); }}
          className="text-sm text-red-500 hover:underline"
        >
          Đăng xuất
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="grid grid-cols-6">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center py-3 text-xs transition ${
                pathname === item.path
                  ? "text-blue-600 font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}