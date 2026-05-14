"use client";

import { useState } from "react";

const initialRequests = [
  { id: 1, tenant: "Nguyễn Văn A", room: "P101", date: "2025-05-10", note: "Muốn ở phòng tầng 1", status: "PENDING" },
  { id: 2, tenant: "Trần Thị B", room: "P203", date: "2025-05-11", note: "", status: "PENDING" },
  { id: 3, tenant: "Lê Văn C", room: "P305", date: "2025-05-12", note: "Cần phòng yên tĩnh", status: "APPROVED" },
];

export default function AdminRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("ALL");

  const handleRequest = (id: number, action: "APPROVED" | "REJECTED") => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
  };

  const filtered = requests.filter((r) => filter === "ALL" || r.status === filter);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 Yêu cầu thuê phòng</h2>
        <p className="text-sm text-gray-500">Duyệt hoặc từ chối yêu cầu từ Tenant</p>
      </div>

      <div className="flex gap-3 mb-4">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            {f === "ALL" ? "Tất cả" : f === "PENDING" ? "Chờ duyệt" : f === "APPROVED" ? "Đã duyệt" : "Từ chối"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Sinh viên</th>
              <th className="text-left px-4 py-3">Phòng</th>
              <th className="text-left px-4 py-3">Ngày</th>
              <th className="text-left px-4 py-3">Ghi chú</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-left px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.tenant}</td>
                <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{r.room}</span></td>
                <td className="px-4 py-3 text-gray-500">{r.date}</td>
                <td className="px-4 py-3 text-gray-500">{r.note || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : r.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleRequest(r.id, "APPROVED")} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Duyệt</button>
                      <button onClick={() => handleRequest(r.id, "REJECTED")} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Từ chối</button>
                    </div>
                  )}
                  {r.status === "APPROVED" && <span className="text-xs text-green-600 font-medium">✅ Đã duyệt</span>}
                  {r.status === "REJECTED" && <span className="text-xs text-red-500 font-medium">❌ Đã từ chối</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}