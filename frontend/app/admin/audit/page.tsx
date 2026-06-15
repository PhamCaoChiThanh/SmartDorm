"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle } from "lucide-react";

const actionColor: Record<string, string> = {
  APPROVE_REQUEST: "bg-green-100 text-green-700",
  REJECT_REQUEST: "bg-red-100 text-red-600",
  CREATE_CONTRACT: "bg-blue-100 text-blue-700",
  UPDATE_UTILITY: "bg-yellow-100 text-yellow-700",
  CREATE_MAINTENANCE: "bg-orange-100 text-orange-700",
  SUBMIT_PAYMENT: "bg-purple-100 text-purple-700",
};

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        setLoading(true);
        setError("");
        const res = await fetchAPI("/audit");
        if (res.success && Array.isArray(res.data)) {
          setLogs(res.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải lịch sử hoạt động:", err);
        setError("Không thể tải lịch sử hoạt động từ máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const user = l.user || "";
    const action = l.action || "";
    const entity = l.entity || "";

    return (
      user.toLowerCase().includes(search.toLowerCase()) ||
      action.toLowerCase().includes(search.toLowerCase()) ||
      entity.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải lịch sử hoạt động...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔍 Audit Logs</h2>
          <p className="text-sm text-gray-500">{logs.length} hoạt động</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo user, hành động, bảng..." className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-4 text-gray-800" />

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
            {filtered.length > 0 ? (
              filtered.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{log.createdAt}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor[log.action] || "bg-gray-100 text-gray-600"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.entity}</td>
                  <td className="px-4 py-3 text-blue-600 font-mono text-xs max-w-[150px] truncate">{log.entityId || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Không tìm thấy hoạt động nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}