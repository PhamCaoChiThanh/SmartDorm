"use client";

import { useRouter } from "next/navigation";
import {
  Home,
  CheckSquare,
  LockOpen,
  Banknote,
  CalendarDays,
  Users,
  FileText,
  Wrench,
  Bell,
  ChevronRight,
} from "lucide-react";

const stats = [
  { label: "Tổng tin đăng", value: "12", icon: Home, color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  { label: "Phòng đang thuê", value: "8", icon: CheckSquare, color: "#22C55E", bg: "rgba(34,197,94,0.08)" },
  { label: "Phòng trống", value: "4", icon: LockOpen, color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  { label: "Doanh thu tháng", value: "12.000.000đ", icon: Banknote, color: "#EC4899", bg: "rgba(236,72,153,0.08)" },
  { label: "Lịch xem phòng", value: "3", icon: CalendarDays, color: "#F97316", bg: "rgba(249,115,22,0.08)" },
];

const recentTenants = [
  { name: "Nguyễn Văn A", room: "P101", date: "10/05/2025", avatar: "A" },
  { name: "Trần Thị B", room: "P203", date: "11/05/2025", avatar: "B" },
  { name: "Lê Văn C", room: "P305", date: "12/05/2025", avatar: "C" },
];

const expiringContracts = [
  { id: "HD-2025-001", room: "P101", tenant: "Nguyễn Văn A", expiry: "01/08/2025", daysLeft: 72 },
  { id: "HD-2025-002", room: "P102", tenant: "Trần Thị B", expiry: "01/07/2025", daysLeft: 42 },
];

const recentMaintenance = [
  { room: "P101", issue: "Điều hòa hỏng", date: "09/05/2025", status: "OPEN" },
  { room: "P204", issue: "Đèn không sáng", date: "10/05/2025", status: "DONE" },
];

export default function OwnerDashboard() {
  const router = useRouter();

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">Pages / Dashboard</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-gray-700 transition">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
              style={{ background: "#EC4899", fontSize: "10px" }}>3</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>D</div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Khách thuê mới */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-purple-500" /> Khách thuê mới
              </h2>
              <button onClick={() => router.push("/owner/listings")}
                className="text-xs text-purple-600 hover:underline flex items-center gap-0.5">
                Xem tất cả <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {recentTenants.map((t) => (
                <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">Phòng {t.room} · {t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hợp đồng sắp hết hạn */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-orange-400" /> Sắp hết hạn
              </h2>
              <button onClick={() => router.push("/owner/contract")}
                className="text-xs text-purple-600 hover:underline flex items-center gap-0.5">
                Xem tất cả <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {expiringContracts.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border border-orange-100 bg-orange-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.tenant}</p>
                      <p className="text-xs text-gray-400">Phòng {c.room} · {c.id}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-600 flex-shrink-0">
                      {c.daysLeft} ngày
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Hết hạn: {c.expiry}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Báo hỏng gần đây */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={16} className="text-gray-500" /> Báo hỏng
              </h2>
              <button onClick={() => router.push("/owner/maintenance")}
                className="text-xs text-purple-600 hover:underline flex items-center gap-0.5">
                Xem tất cả <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {recentMaintenance.map((m) => (
                <div key={m.room + m.issue} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.issue}</p>
                    <p className="text-xs text-gray-400">Phòng {m.room} · {m.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                    m.status === "OPEN" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}