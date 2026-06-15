"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

export default function TenantMaintenance() {
  const router = useRouter();
  const [issue, setIssue] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadMaintenanceHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/maintenances");
      if (res.success && Array.isArray(res.data)) {
        setHistory(res.data);
      } else {
        setError(res.message || "Không thể tải lịch sử báo hỏng.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaintenanceHistory();
  }, []);

  const handleSubmit = async () => {
    if (!issue.trim()) return;

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const fullDescription = note.trim() 
        ? `${issue.trim()} - Ghi chú: ${note.trim()}`
        : issue.trim();

      const res = await fetchAPI("/maintenances", {
        method: "POST",
        body: JSON.stringify({
          description: fullDescription
        })
      });

      if (res.success) {
        setMessage("Đã gửi yêu cầu báo hỏng thành công!");
        setIssue("");
        setNote("");
        // Reload list
        loadMaintenanceHistory();
      } else {
        setError(res.message || "Không thể gửi báo cáo sự cố.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">← Quay lại</button>
        <h1 className="font-bold text-blue-600">🔧 Báo hỏng</h1>
        <div />
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Form báo hỏng */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Gửi yêu cầu sửa chữa</h2>

          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-3">
              ❌ {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Mô tả sự cố *</label>
              <input
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="VD: Điều hòa không mát, đèn hỏng..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ghi chú thêm</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mô tả chi tiết hơn nếu cần..."
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !issue.trim()}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </div>

        {/* Lịch sử */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">📋 Lịch sử báo hỏng</h2>
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Đang tải lịch sử báo hỏng...</div>
          ) : history.length > 0 ? (
            history.map((h) => (
              <div key={h.id} className="flex justify-between items-center py-2.5 border-b last:border-0 hover:bg-gray-50/50 px-1 rounded-lg">
                <div className="max-w-[70%]">
                  <p className="text-sm font-medium text-gray-800 wrap-break-word">{h.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                  {h.assignedTo && (
                    <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                      <span>🔧 Nhân viên:</span>
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px]">{h.assignedTo}</span>
                    </p>
                  )}
                  {(h.scheduled_for || h.scheduledFor) && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span className="font-semibold">📅 Lịch hẹn:</span>
                      <span>
                        {new Date(h.scheduled_for || h.scheduledFor).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </p>
                  )}
                  {(h.completed_at || h.completedAt) && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <span className="font-semibold">✅ Hoàn thành:</span>
                      <span>
                        {new Date(h.completed_at || h.completedAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  h.status === "OPEN"
                    ? "bg-red-100 text-red-600"
                    : h.status === "IN_PROGRESS"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {h.status === "OPEN" ? "Chờ xử lý" : h.status === "IN_PROGRESS" ? "Đang xử lý" : "Hoàn thành"}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">Bạn chưa gửi báo cáo sự cố nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}