"use client";

import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { Home, FileText, MessageSquare, Wrench, Car, User, LogOut } from "lucide-react";

const navItems = [
  { label: "Trang chủ", icon: Home, path: "/tenant/invoice" },
  { label: "Hợp đồng", icon: FileText, path: "/tenant/contract" },
  { label: "Bản tin", icon: MessageSquare, path: "/tenant/feed" },
  { label: "Báo hỏng", icon: Wrench, path: "/tenant/maintenance" },
  { label: "Gửi xe", icon: Car, path: "/tenant/parking" },
  { label: "Hồ sơ", icon: User, path: "/tenant/profile" },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-xs px-4 py-3 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Home size={22} className="text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-blue-600 dark:text-blue-400">SmartDorm</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={() => { localStorage.clear(); router.push("/"); }}
            className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 shadow-lg z-10 transition-colors duration-300">
        <div className="grid grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center py-2.5 text-[10px] sm:text-xs transition ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                }`}
              >
                <Icon size={20} className={`mb-1 transition-transform ${isActive ? "scale-110" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}