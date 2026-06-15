"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import {
  Home,
  CheckCircle2,
  LockKeyholeOpen,
  BadgeDollarSign,
  Wrench,
  AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");

        // Fetch all rooms
        const roomsRes = await fetchAPI("/rooms");
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        // Fetch all invoices
        const invoicesRes = await fetchAPI("/invoices");
        if (invoicesRes.success && Array.isArray(invoicesRes.data)) {
          setInvoices(invoicesRes.data);
        }

        // Fetch all maintenance reports
        const maintenanceRes = await fetchAPI("/maintenances");
        if (maintenanceRes.success && Array.isArray(maintenanceRes.data)) {
          setMaintenances(maintenanceRes.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
        setError("Không thể tải thông tin từ máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(
    (r) => (r.currentOccupants || r.current_occupants || 0) > 0
  ).length;
  const availableRooms = rooms.filter(
    (r) => (r.currentOccupants || r.current_occupants || 0) === 0 && r.status !== "MAINTENANCE"
  ).length;

  // Revenue (Total amount of all invoices)
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.total_amount || inv.totalAmount || 0),
    0
  );

  const stats = [
    {
      label: "Tổng phòng",
      value: totalRooms.toString(),
      icon: <Home size={28} className="text-blue-500" />,
      border: "border-blue-500",
    },
    {
      label: "Đang thuê",
      value: occupiedRooms.toString(),
      icon: <CheckCircle2 size={28} className="text-green-500" />,
      border: "border-green-500",
    },
    {
      label: "Phòng trống",
      value: availableRooms.toString(),
      icon: <LockKeyholeOpen size={28} className="text-yellow-500" />,
      border: "border-yellow-500",
    },
    {
      label: "Doanh thu tháng",
      value: `${totalRevenue.toLocaleString("vi-VN")}đ`,
      icon: <BadgeDollarSign size={28} className="text-purple-500" />,
      border: "border-purple-500",
    },
  ];

  // Prepare chart data
  const monthlyData: Record<string, number> = {};
  invoices.forEach((inv) => {
    const m = inv.billing_month || inv.billingMonth || 1;
    const y = inv.billing_year || inv.billingYear || 2026;
    const key = `${m}/${y}`;
    monthlyData[key] = (monthlyData[key] || 0) + (inv.total_amount || inv.totalAmount || 0);
  });

  const sortedMonths = Object.keys(monthlyData)
    .sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    })
    .slice(-6); // last 6 months

  const maxRevenue = Math.max(...sortedMonths.map((m) => monthlyData[m]), 1);
  const total = totalRooms || 1;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">Tổng quan hệ thống SmartDorm</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.border}`}>
            <div className="mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Doanh thu */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 flex flex-col">
          <h2 className="font-semibold text-base mb-4 text-gray-800">📊 Biểu đồ Doanh thu (6 tháng gần nhất)</h2>
          <div className="flex-1 min-h-[220px] flex items-end justify-between w-full pt-4 px-2">
            {sortedMonths.length > 0 ? (
              sortedMonths.map((month) => {
                const val = monthlyData[month];
                const heightPct = val > 0 ? (val / maxRevenue) * 100 : 0;
                return (
                  <div key={month} className="flex flex-col items-center flex-1 group mx-1">
                    {/* Bar container */}
                    <div className="w-full flex items-end justify-center h-40 relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md">
                        {val.toLocaleString("vi-VN")}đ
                      </div>
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[40px] bg-linear-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-500 ease-out shadow-sm"
                      ></div>
                    </div>
                    {/* Label */}
                    <span className="text-[10px] text-gray-400 mt-2 font-medium">{month}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-gray-400 text-sm py-12">
                Không có dữ liệu doanh thu.
              </div>
            )}
          </div>
        </div>

        {/* Trạng thái phòng */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <h2 className="font-semibold text-base mb-4 text-gray-800">⭕ Trạng thái phòng</h2>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle cx="80" cy="80" r="55" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                {/* Occupied (Green) */}
                {occupiedRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="55"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="18"
                    strokeDasharray="345.57"
                    strokeDashoffset={345.57 - (occupiedRooms / total) * 345.57}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
                {/* Available (Blue) */}
                {availableRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="55"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="18"
                    strokeDasharray="345.57"
                    strokeDashoffset={345.57 - (availableRooms / total) * 345.57}
                    transform={`rotate(${(occupiedRooms / total) * 360} 80 80)`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
                {/* Maintenance (Yellow) */}
                {rooms.filter(r => r.status === "MAINTENANCE").length > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="55"
                    fill="transparent"
                    stroke="#eab308"
                    strokeWidth="18"
                    strokeDasharray="345.57"
                    strokeDashoffset={345.57 - (rooms.filter(r => r.status === "MAINTENANCE").length / total) * 345.57}
                    transform={`rotate(${((occupiedRooms + availableRooms) / total) * 360} 80 80)`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
              </svg>
              {/* Inner label */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-gray-800">{totalRooms}</span>
                <span className="text-xs text-gray-400 font-medium">Tổng số phòng</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full grid grid-cols-3 gap-2 mt-6 text-center text-[10px] font-semibold">
              <div className="flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mb-1"></span>
                <span className="text-gray-500">Đang thuê</span>
                <span className="text-gray-800 font-bold">{occupiedRooms}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-blue-500 mb-1"></span>
                <span className="text-gray-500">Còn trống</span>
                <span className="text-gray-800 font-bold">{availableRooms}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-yellow-500 mb-1"></span>
                <span className="text-gray-500">Bảo trì</span>
                <span className="text-gray-800 font-bold">{rooms.filter(r => r.status === "MAINTENANCE").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Báo cáo bảo trì */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Wrench size={18} className="text-gray-600" />
            Báo cáo bảo trì
          </h2>
          <button
            onClick={() => router.push("/admin/maintenance")}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Quản lý tất cả →
          </button>
        </div>
        {maintenances.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b">
                <th className="text-left pb-2">Phòng</th>
                <th className="text-left pb-2">Sự cố</th>
                <th className="text-left pb-2">Người báo</th>
                <th className="text-left pb-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.slice(0, 10).map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-3 font-semibold text-gray-800">{m.room_number || m.roomNumber || "P-?"}</td>
                  <td className="py-3 text-gray-600">{m.description}</td>
                  <td className="py-3 text-gray-500">{m.tenant_name || m.tenantName || "Admin (Báo cáo)"}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.status === "OPEN"
                          ? "bg-red-100 text-red-600"
                          : m.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {m.status === "OPEN"
                        ? "Mở"
                        : m.status === "IN_PROGRESS"
                        ? "Đang xử lý"
                        : "Đã xong"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            Không có báo cáo bảo trì nào gần đây.
          </div>
        )}
      </div>
    </div>
  );
}