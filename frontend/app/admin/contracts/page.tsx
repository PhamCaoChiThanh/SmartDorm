"use client";

import { useState } from "react";

const initialContracts = [
  { id: "HD-2025-001", tenantName: "Nguyễn Văn A", room: "P101", startDate: "2025-01-01", endDate: "2025-12-31", basePrice: 1500000, status: "ACTIVE" },
  { id: "HD-2025-002", tenantName: "Trần Thị B", room: "P102", startDate: "2025-02-01", endDate: "2025-08-01", basePrice: 1500000, status: "ACTIVE" },
  { id: "HD-2024-003", tenantName: "Lê Văn C", room: "P201", startDate: "2024-06-01", endDate: "2025-01-01", basePrice: 2000000, status: "EXPIRED" },
];

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  TERMINATED: "bg-red-100 text-red-600",
};

export default function AdminContracts() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = initialContracts.filter((c) => {
    const matchFilter = filter === "ALL" || c.status === filter;
    const matchSearch = c.tenantName.toLowerCase().includes(search.toLowerCase()) || c.room.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 Quản lý Hợp đồng</h2>
          <p className="text-sm text-gray-500">{initialContracts.length} hợp đồng</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Đang hiệu lực", value: initialContracts.filter(c => c.status === "ACTIVE").length, color: "text-green-600" },
          { label: "Đã hết hạn", value: initialContracts.filter(c => c.status === "EXPIRED").length, color: "text-gray-500" },
          { label: "Đã chấm dứt", value: initialContracts.filter(c => c.status === "TERMINATED").length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, phòng, mã HĐ..." className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        {["ALL", "ACTIVE", "EXPIRED", "TERMINATED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            {f === "ALL" ? "Tất cả" : f === "ACTIVE" ? "Hiệu lực" : f === "EXPIRED" ? "Hết hạn" : "Chấm dứt"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Mã HĐ</th>
              <th className="text-left px-4 py-3">Người thuê</th>
              <th className="text-left px-4 py-3">Phòng</th>
              <th className="text-left px-4 py-3">Bắt đầu</th>
              <th className="text-left px-4 py-3">Kết thúc</th>
              <th className="text-left px-4 py-3">Tiền phòng</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-600">{c.id}</td>
                <td className="px-4 py-3">{c.tenantName}</td>
                <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.room}</span></td>
                <td className="px-4 py-3 text-gray-500">{c.startDate}</td>
                <td className="px-4 py-3 text-gray-500">{c.endDate}</td>
                <td className="px-4 py-3 font-medium">{c.basePrice.toLocaleString("vi-VN")}đ</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}