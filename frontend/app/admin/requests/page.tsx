"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle } from "lucide-react";

export default function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        setError("");
        const res = await fetchAPI("/requests");
        if (res.success && Array.isArray(res.data)) {
          setRequests(res.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách yêu cầu:", err);
        setError("Không thể tải danh sách yêu cầu từ máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const handleRequest = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetchAPI(`/requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: action }),
      });
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: action } : r))
        );
      }
    } catch (err: any) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      alert(err.message || "Lỗi khi xử lý yêu cầu.");
    }
  };

  const filtered = requests.filter(
    (r) => filter === "ALL" || r.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách yêu cầu...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 Yêu cầu thuê phòng</h2>
        <p className="text-sm text-gray-500">Duyệt hoặc từ chối yêu cầu từ Tenant</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f === "ALL"
              ? "Tất cả"
              : f === "PENDING"
              ? "Chờ duyệt"
              : f === "APPROVED"
              ? "Đã duyệt"
              : "Từ chối"}
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
            {filtered.length > 0 ? (
              filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.tenant_name || r.tenantName || "Sinh viên"}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {r.room_number || r.roomNumber || "P-?"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.move_in_date || r.moveInDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.note || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : r.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {r.status === "PENDING"
                        ? "Chờ duyệt"
                        : r.status === "APPROVED"
                        ? "Đã duyệt"
                        : "Từ chối"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequest(r.id, "APPROVED")}
                          className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 transition font-semibold"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRequest(r.id, "REJECTED")}
                          className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 transition font-semibold"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                    {r.status === "APPROVED" && (
                      <span className="text-xs text-green-600 font-medium">✅ Đã duyệt</span>
                    )}
                    {r.status === "REJECTED" && (
                      <span className="text-xs text-red-500 font-medium">❌ Đã từ chối</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Không tìm thấy yêu cầu nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}