"use client";

import { useState } from "react";

const logs = [
  { id: 1, user: "admin@smartdorm.com", action: "APPROVE_REQUEST", entity: "room_requests", entityId: "REQ-001", createdAt: "2025-05-13 08:30:00" },
  { id: 2, user: "admin@smartdorm.com", action: "CREATE_CONTRACT", entity: "contracts", entityId: "HD-2025-001", createdAt: "2025-05-13 08:35:00" },
  { id: 3, user: "admin@smartdorm.com", action: "UPDATE_UTILITY", entity: "utility_usages", entityId: "UTIL-001", createdAt: "2025-05-13 09:00:00" },
  { id: 4, user: "tenant@smartdorm.com", action: "CREATE_MAINTENANCE", entity: "maintenances", entityId: "MNT-001", createdAt: "2025-05-13 09:15:00" },
  { id: 5, user: "tenant@smartdorm.com", action: "SUBMIT_PAYMENT", entity: "payments", entityId: "PAY-001", createdAt: "2025-05-13 10:00:00" },
  { id: 6, user: "admin@smartdorm.com", action: "REJECT_REQUEST", entity: "room_requests", entityId: "REQ-002", createdAt: "2025-05-13 10:30:00" },
];

const actionColor: Record<string, string> = {
  APPROVE_REQUEST: "bg-green-100 text-green-700",
  REJECT_REQUEST: "bg-red-100 text-red-600",
  CREATE_CONTRACT: "bg-blue-100 text-blue-700",
  UPDATE_UTILITY: "bg-yellow-100 text-yellow-700",
  CREATE_MAINTENANCE: "bg-orange-100 text-orange-700",
  SUBMIT_PAYMENT: "bg-purple-100 text-purple-700",
};

export default function AdminAudit() {
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) =>
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔍 Audit Logs</h2>
          <p className="text-sm text-gray-500">{logs.length} hoạt động</p>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo user, hành động, bảng..." className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-4" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Thời gian</th>
              <th className="text-left px-4 py-3">Người dùng</th>
              <th className="text-left px-4 py-3">Hành động</th>
              <th className="text-left px-4 py-3">Bảng</th>
              <th className="text-left px-4 py-3">ID đối tượng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{log.createdAt}</td>
                <td className="px-4 py-3 font-medium">{log.user}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor[log.action] || "bg-gray-100 text-gray-600"}`}>{log.action}</span></td>
                <td className="px-4 py-3 text-gray-500">{log.entity}</td>
                <td className="px-4 py-3 text-blue-600">{log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}