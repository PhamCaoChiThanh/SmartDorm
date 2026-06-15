"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Copy,
  Sparkles,
  Loader2,
  X
} from "lucide-react";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/invoices");
      if (res.success && Array.isArray(res.data)) {
        setInvoices(res.data);
      } else {
        setError("Không thể tải danh sách hóa đơn.");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải hóa đơn:", err);
      setError(err.message || "Có lỗi xảy ra khi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleGenerateReminder = async (invoice: any) => {
    try {
      setReminderLoading(invoice.id);
      setSelectedInvoice(invoice);
      setReminderMessage("");
      setCopied(false);

      const res = await fetchAPI(`/invoices/${invoice.id}/reminder`, {
        method: "POST"
      });

      if (res.success && res.data) {
        setReminderMessage(res.data.reminder_message);
        setShowModal(true);
      } else {
        alert(res.message || "Lỗi khi tạo lời nhắc nợ.");
      }
    } catch (err: any) {
      console.error("Lỗi tạo lời nhắc nợ AI:", err);
      alert(err.message || "Không thể gọi API tạo lời nhắc.");
    } finally {
      setReminderLoading(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách hóa đơn...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 Quản lý hóa đơn</h2>
          <p className="text-sm text-gray-500">Xem và gửi nhắc nợ hóa đơn hàng tháng của sinh viên</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b">
                <th className="text-left pb-3 font-semibold">Phòng</th>
                <th className="text-left pb-3 font-semibold">Tháng thanh toán</th>
                <th className="text-left pb-3 font-semibold">Tổng số tiền</th>
                <th className="text-left pb-3 font-semibold">Đã đóng</th>
                <th className="text-left pb-3 font-semibold">Trạng thái</th>
                <th className="text-right pb-3 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => {
                  const isPaid = inv.status === "PAID" || inv.status === "ĐÃ THANH TOÁN";
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold text-gray-800">Phòng {inv.room_number || "P-?"}</td>
                      <td className="py-4 text-gray-600">{inv.billing_month}/{inv.billing_year}</td>
                      <td className="py-4 font-medium text-gray-800">{(inv.total_amount || 0).toLocaleString("vi-VN")}đ</td>
                      <td className="py-4 text-gray-500">{(inv.paid_amount || 0).toLocaleString("vi-VN")}đ</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {isPaid ? "Đã đóng" : "Chưa đóng (Pending)"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handleGenerateReminder(inv)}
                            disabled={reminderLoading !== null}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition shadow-sm disabled:opacity-50"
                          >
                            {reminderLoading === inv.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Sparkles size={13} />
                            )}
                            Nhắc nợ AI
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Không cần nhắc</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Chưa có hóa đơn nào được tạo trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Reminder Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl text-gray-800 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Tin nhắn nhắc nợ thông minh AI</h3>
                <p className="text-[11px] text-gray-400">Tự động tối ưu hóa dựa trên lịch sử thanh toán</p>
              </div>
            </div>

            {/* Meta Data */}
            <div className="bg-purple-50 rounded-xl p-3 text-xs space-y-1.5 border border-purple-100">
              <div className="flex justify-between text-gray-600">
                <span>Phòng nhận:</span>
                <span className="font-semibold text-gray-800">Phòng {selectedInvoice.room_number}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Hóa đơn tháng:</span>
                <span className="font-semibold text-gray-800">{selectedInvoice.billing_month}/{selectedInvoice.billing_year}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Số tiền nợ:</span>
                <span className="font-semibold text-purple-700">{(selectedInvoice.total_amount || 0).toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            {/* AI Generated Content */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Nội dung tin nhắn gợi ý</label>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[100px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {reminderMessage}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? "Đã sao chép!" : "Sao chép tin nhắn"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border rounded-xl font-medium text-sm hover:bg-gray-50 text-gray-500 transition"
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
