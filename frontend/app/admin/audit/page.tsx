"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { 
  AlertCircle, 
  Search, 
  Calendar, 
  User, 
  Database, 
  Key, 
  Eye, 
  Clock,
  ArrowRight,
  Info,
  X
} from "lucide-react";

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const getActionStyles = (action: string) => {
    const act = action || "";
    if (act.includes("CREATE")) {
      return "bg-blue-50 text-blue-700 border border-blue-200/60";
    }
    if (act.includes("UPDATE")) {
      return "bg-amber-50 text-amber-700 border border-amber-200/60";
    }
    if (act.includes("DELETE")) {
      return "bg-rose-50 text-rose-700 border border-rose-200/60";
    }
    if (act.includes("APPROVE")) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
    }
    if (act.includes("REJECT")) {
      return "bg-red-50 text-red-700 border border-red-200/60";
    }
    return "bg-slate-50 text-slate-700 border border-slate-200/60";
  };

  const filtered = logs.filter((l) => {
    const user = l.user || "";
    const action = l.action || "";
    const entity = l.entity || "";
    const entityId = l.entityId || "";

    return (
      user.toLowerCase().includes(search.toLowerCase()) ||
      action.toLowerCase().includes(search.toLowerCase()) ||
      entity.toLowerCase().includes(search.toLowerCase()) ||
      entityId.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLogs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenDetail = (log: any) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm font-semibold">Đang tải lịch sử hoạt động...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Database className="text-blue-600" />
            Nhật ký Hệ thống (Audit Logs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, giám sát mọi hoạt động thay đổi cấu trúc dữ liệu và tác vụ trên hệ thống Dorm.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 text-xs px-3.5 py-1.5 rounded-full font-bold border border-blue-200 uppercase tracking-wider">
          {logs.length} hoạt động
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Control panel */}
      <div className="flex gap-3 items-center bg-white rounded-xl p-3 border border-gray-200/80 shadow-xs">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3.5 py-2 border border-gray-200">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tài khoản, hành động, bảng cơ sở dữ liệu, ID..."
            className="bg-transparent text-sm focus:outline-none w-full text-gray-800 placeholder:text-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
        {paginatedLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-gray-500 font-semibold">
                  <th className="text-left py-3.5 px-4 w-52">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} /> Thời gian
                    </span>
                  </th>
                  <th className="text-left py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <User size={14} /> Người dùng
                    </span>
                  </th>
                  <th className="text-left py-3.5 px-4 w-60">
                    <span className="flex items-center gap-1.5">
                      <Info size={14} /> Hành động
                    </span>
                  </th>
                  <th className="text-left py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <Database size={14} /> Bảng dữ liệu
                    </span>
                  </th>
                  <th className="text-left py-3.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <Key size={14} /> ID Đối tượng
                    </span>
                  </th>
                  <th className="text-center py-3.5 px-4 w-20">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors last:border-0">
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                      {log.createdAt}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-950">
                      {log.user}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getActionStyles(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs max-w-[150px] truncate" title={log.entityId}>
                      {log.entityId || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenDetail(log)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-sm">
            Không tìm thấy lịch sử hoạt động nào thỏa mãn điều kiện lọc.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
          >
            Trước
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white shadow-xs"
                  : "border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Log Details Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Thông tin hành động hệ thống
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Thời gian:</span>
                  <span className="font-mono text-gray-800 font-semibold">{selectedLog.createdAt}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Tài khoản:</span>
                  <span className="font-bold text-blue-600">{selectedLog.user}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Hành động:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getActionStyles(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-500 font-medium">Bảng dữ liệu:</span>
                  <span className="font-semibold text-gray-800">{selectedLog.entity}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 font-medium">ID Đối tượng:</span>
                  <span className="font-mono text-xs bg-white border border-gray-200 p-2 rounded-lg break-all text-gray-600 select-all">
                    {selectedLog.entityId || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-gray-150 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}