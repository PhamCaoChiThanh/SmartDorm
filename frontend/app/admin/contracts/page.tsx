"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle } from "lucide-react";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  TERMINATED: "bg-red-100 text-red-600",
};

export default function AdminContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadContracts() {
      try {
        setLoading(true);
        setError("");
        const res = await fetchAPI("/contracts");
        if (res.success && Array.isArray(res.data)) {
          setContracts(res.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải hợp đồng:", err);
        setError("Không thể tải danh sách hợp đồng từ máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadContracts();
  }, []);

  const filtered = contracts.filter((c) => {
    const tenantName = c.tenant_name || "";
    const room = c.room_number || "";
    const id = c.id || "";
    const status = c.status || "";

    const matchFilter = filter === "ALL" || status === filter;
    const matchSearch =
      tenantName.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách hợp đồng...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 Quản lý Hợp đồng</h2>
          <p className="text-sm text-gray-500">{contracts.length} hợp đồng</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Đang hiệu lực", value: contracts.filter(c => c.status === "ACTIVE").length, color: "text-green-600" },
          { label: "Đã hết hạn", value: contracts.filter(c => c.status === "EXPIRED").length, color: "text-gray-500" },
          { label: "Đã chấm dứt", value: contracts.filter(c => c.status === "TERMINATED").length, color: "text-red-500" },
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
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600 truncate max-w-[120px]">{c.id}</td>
                  <td className="px-4 py-3">{c.tenant_name || "—"}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.room_number || "—"}</span></td>
                  <td className="px-4 py-3 text-gray-500">{c.start_date || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.end_date || "—"}</td>
                  <td className="px-4 py-3 font-medium">{(c.base_price || 0).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || "bg-gray-100 text-gray-600"}`}>{c.status === "ACTIVE" ? "ACTIVE" : c.status === "EXPIRED" ? "EXPIRED" : "TERMINATED"}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400">
                  Không tìm thấy hợp đồng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}