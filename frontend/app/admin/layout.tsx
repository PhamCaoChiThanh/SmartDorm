"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Home,
  ClipboardList,
  FileText,
  Zap,
  Users,
  Search,
  LogOut,
  Receipt,
  Wrench,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/admin/dashboard" },
  { label: "Quản lý phòng", icon: <Home size={16} />, path: "/admin/rooms" },
  { label: "Yêu cầu thuê", icon: <ClipboardList size={16} />, path: "/admin/requests" },
  { label: "Hợp đồng", icon: <FileText size={16} />, path: "/admin/contracts" },
  { label: "Đặt cọc", icon: <Receipt size={16} />, path: "/admin/deposits" },
  { label: "Hóa đơn", icon: <Receipt size={16} />, path: "/admin/invoices" },
  { label: "Điện nước", icon: <Zap size={16} />, path: "/admin/utility" },
  { label: "Bảo trì", icon: <Wrench size={16} />, path: "/admin/maintenance" },
  { label: "Tenant", icon: <Users size={16} />, path: "/admin/tenants" },
  { label: "Audit Logs", icon: <Search size={16} />, path: "/admin/audit" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("currentRole");
    if (!token || role !== "ADMIN") {
      router.push("/");
      return;
    }
    
    setAuthorized(true);

    // Save actual route for F5 refresh recovery
    sessionStorage.setItem("lastActiveRoute", pathname);

    const userStr = sessionStorage.getItem("user");
    let userSubId = "00000000";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const idVal = u.id || u.Id || "";
        if (idVal) userSubId = idVal.toString().substring(0, 8);
      } catch (e) {}
    }

    // Generate a signature based on pathname and userSubId
    let hash = 0;
    const combined = pathname + userSubId;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    const sig = Math.abs(hash).toString(16).padEnd(8, "0");

    // Mask the browser address bar URL
    window.history.replaceState(null, "", `/?sig=${sig}&id=${userSubId}`);
  }, [router, pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Đang xác thực quyền quản trị...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col min-h-screen fixed left-0 top-0">
        <div className="px-4 py-5 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Home size={18} className="text-orange-400" />
            SmartDorm
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Quản trị hệ thống</p>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-700 transition ${
                pathname === item.path ? "bg-blue-600 text-white" : "text-gray-300"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Đăng nhập với tư cách</p>
          <p className="text-sm font-medium text-white">Admin</p>
          <button
            onClick={() => { sessionStorage.clear(); router.push("/"); }}
            className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <LogOut size={12} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 p-6">
        {children}
      </main>
    </div>
  );
}