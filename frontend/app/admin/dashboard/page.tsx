"use client";

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

      {/* Báo cáo bảo trì */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Wrench size={18} className="text-gray-600" />
          Báo cáo bảo trì
        </h2>
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
                  <td className="py-3 text-gray-500">{m.tenant_name || m.tenantName || "Sinh viên"}</td>
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