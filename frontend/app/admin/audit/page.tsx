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
  X,
  TrendingUp,
  Activity,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle
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

  // Calculate quick stats
  const totalLogsCount = logs.length;
  const createCount = logs.filter(l => (l.action || "").includes("CREATE")).length;
  const updateCount = logs.filter(l => (l.action || "").includes("UPDATE")).length;
  const deleteCount = logs.filter(l => (l.action || "").includes("DELETE")).length;
  const otherCount = totalLogsCount - createCount - updateCount - deleteCount;

  // Find most active user
  const userCounts: Record<string, number> = {};
  logs.forEach(l => {
    if (l.user) userCounts[l.user] = (userCounts[l.user] || 0) + 1;
  });
  let topUser = "—";
  let topUserCount = 0;
  Object.entries(userCounts).forEach(([usr, count]) => {
    if (count > topUserCount) {
      topUser = usr;
      topUserCount = count;
    }
  });

  // Prepare trend data (group logs by date)
  const trendData: Record<string, number> = {};
  logs.forEach(l => {
    if (l.createdAt) {
      // Extract date part (YYYY-MM-DD or DD/MM)
      const datePart = l.createdAt.substring(0, 10);
      trendData[datePart] = (trendData[datePart] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(trendData)
    .sort()
    .slice(-7); // Last 7 active days

  const maxTrendValue = Math.max(...sortedDates.map(d => trendData[d]), 1);

  // SVG Chart layout values
  const chartHeight = 100;
  const chartWidth = 350;
  const points = sortedDates.map((date, idx) => {
    const val = trendData[date];
    const x = (idx / (sortedDates.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (val / maxTrendValue) * (chartHeight - 15);
    return { x, y, date, val };
  });

  const areaPath = points.length > 0 
    ? `${points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : "";

  const linePath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLogs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderJsonData = (jsonStr: string) => {
    if (!jsonStr) return null;
    try {
      const obj = JSON.parse(jsonStr);
      return (
        <div className="bg-slate-50 border p-3 rounded-lg font-mono text-[11px] text-slate-700 max-h-40 overflow-y-auto space-y-1">
          {Object.entries(obj).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 border-b border-slate-100 last:border-0 pb-1">
              <span className="font-bold text-indigo-700">{k}:</span>
              <span className="text-right break-all max-w-[70%] text-slate-600">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    } catch {
      return <pre className="text-xs bg-slate-50 p-2 rounded-lg overflow-x-auto">{jsonStr}</pre>;
    }
  };

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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Database className="text-blue-600" />
            Nhật ký Hệ thống (Audit Logs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, giám sát mọi hoạt động thay đổi cấu trúc dữ liệu và tác vụ trên hệ thống Dorm.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 text-xs px-3.5 py-1.5 rounded-full font-bold border border-blue-200 uppercase tracking-wider shrink-0">
          {logs.length} hoạt động
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Analytics Panel (WOW factor!) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistics Cards */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10 shrink-0">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số tác vụ</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{totalLogsCount}</div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/10 shrink-0">
              <Trash2 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu Xóa dữ liệu (Cảnh báo)</div>
              <div className="text-xl font-bold text-rose-600 mt-0.5">{deleteCount}</div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 shrink-0">
              <User size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tài khoản tích cực nhất</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5 truncate max-w-[160px]" title={`${topUser} (${topUserCount} tác vụ)`}>
                {topUser} <span className="text-xs font-normal text-slate-500">({topUserCount} lần)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Trend (SVG Area Chart) */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-600" />
              Tần suất hoạt động (7 ngày gần nhất)
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-end mt-4">
            {sortedDates.length > 0 ? (
              <div className="w-full">
                <div className="relative h-24 w-full">
                  <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="auditTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#auditTrendGrad)" />
                    <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3.5" className="fill-white stroke-blue-600 stroke-2" />
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
                  {sortedDates.map(d => {
                    const formatted = d.substring(5).replace("-", "/"); // MM/DD
                    return <span key={d} className="text-[9px] font-bold text-slate-400">{formatted}</span>;
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không đủ dữ liệu thống kê.
              </div>
            )}
          </div>
        </div>

        {/* Action Type Distribution (Progress Bars) */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={14} className="text-indigo-600" />
              Phân loại hành động
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3 mt-4 text-xs font-semibold">
            {/* Create */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span className="flex items-center gap-1 text-blue-600"><PlusCircle size={10} /> Thêm mới (CREATE)</span>
                <span>{createCount} ({totalLogsCount > 0 ? Math.round((createCount/totalLogsCount)*100) : 0}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${totalLogsCount > 0 ? (createCount/totalLogsCount)*100 : 0}%` }} className="h-full bg-blue-500 rounded-full transition-all duration-500"></div>
              </div>
            </div>

            {/* Update */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span className="flex items-center gap-1 text-amber-600"><Edit size={10} /> Chỉnh sửa (UPDATE)</span>
                <span>{updateCount} ({totalLogsCount > 0 ? Math.round((updateCount/totalLogsCount)*100) : 0}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${totalLogsCount > 0 ? (updateCount/totalLogsCount)*100 : 0}%` }} className="h-full bg-amber-500 rounded-full transition-all duration-500"></div>
              </div>
            </div>

            {/* Delete */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span className="flex items-center gap-1 text-rose-600"><Trash2 size={10} /> Xóa bỏ (DELETE)</span>
                <span>{deleteCount} ({totalLogsCount > 0 ? Math.round((deleteCount/totalLogsCount)*100) : 0}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${totalLogsCount > 0 ? (deleteCount/totalLogsCount)*100 : 0}%` }} className="h-full bg-rose-500 rounded-full transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

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
            
            <div className="p-5 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
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
                <div className="flex flex-col gap-1 pb-2 border-b border-gray-200/50">
                  <span className="text-gray-500 font-medium">ID Đối tượng:</span>
                  <span className="font-mono text-xs bg-white border border-gray-200 p-2 rounded-lg break-all text-gray-600 select-all">
                    {selectedLog.entityId || "—"}
                  </span>
                </div>
                
                {selectedLog.oldValue && (
                  <div className="flex flex-col gap-1 pb-1">
                    <span className="text-red-600 font-bold text-xs uppercase tracking-wider">◀ Dữ liệu trước thay đổi (Old Value)</span>
                    {renderJsonData(selectedLog.oldValue)}
                  </div>
                )}

                {selectedLog.newValue && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">▶ Dữ liệu sau thay đổi (New Value)</span>
                    {renderJsonData(selectedLog.newValue)}
                  </div>
                )}
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