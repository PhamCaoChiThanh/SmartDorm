"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  CalendarDays,
  User,
  Wallet,
  BadgePlus,
  BarChart3,
  FileText,
  Wrench,
  Car,
  LogOut,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const menuGroups = [
  {
    label: "TIN ĐĂNG",
    items: [
      { icon: ListChecks, label: "Quản lý tin đăng", path: "/owner/listings" },
      { icon: PlusCircle, label: "Thêm nhà trọ", path: "/owner/create" },
      { icon: CalendarDays, label: "Lịch xem phòng", path: "/owner/appointments" },
    ],
  },
  {
    label: "TÀI KHOẢN",
    items: [
      { icon: User, label: "Hồ sơ", path: "/owner/profile" },
    ],
  },
  {
    label: "TÀI CHÍNH",
    items: [
      { icon: Wallet, label: "Ví điểm", path: "/owner/wallet" },
      { icon: BadgePlus, label: "Nạp điểm", path: "/owner/topup" },
      { icon: BarChart3, label: "Lịch sử giao dịch", path: "/owner/transactions" },
    ],
  },
  {
    label: "TIỆN ÍCH",
    items: [
      { icon: FileText, label: "Hợp đồng thuê", path: "/owner/contract" },
      { icon: Wrench, label: "Báo hỏng", path: "/owner/maintenance" },
      { icon: Car, label: "Đăng ký xe", path: "/owner/parking" },
    ],
  },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 shadow-sm z-40 transition-colors duration-300">
        {/* Logo — giống trang chính */}
        <div className="px-5 py-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/owner/dashboard")}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
              }}
            >
              <Home size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-zinc-100 text-base leading-tight tracking-tight">
                SmartDorm
              </div>
              <div className="text-[10px] text-gray-400 dark:text-zinc-500 leading-none">Quản lý cá nhân</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => router.push("/owner/dashboard")}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all ${
              pathname === "/owner/dashboard"
                ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-r-2 border-purple-600"
                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          {menuGroups.map((group) => (
            <div key={group.label} className="mt-4">
              <p className="px-5 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all ${
                      active
                        ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-r-2 border-purple-600 font-medium"
                        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={() => { sessionStorage.clear(); router.push("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-xl transition"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
          <p className="text-xs text-gray-400 dark:text-zinc-500 text-center mt-3">© SmartDorm 2025</p>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}