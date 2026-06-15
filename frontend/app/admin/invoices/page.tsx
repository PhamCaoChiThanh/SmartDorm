"use client";

import { useState, useEffect } from "react";
import { fetchAPI, API_URL } from "@/lib/api";
import { AlertCircle, Send, Plus } from "lucide-react";

const statusLabel: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ thanh toán", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Đã thanh toán", cls: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Quá hạn", cls: "bg-red-100 text-red-600" },
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Generate invoice modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genContractId, setGenContractId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const now = new Date();
  const [genMonth, setGenMonth] = useState(String(now.getMonth() + 1));
  const [genYear, setGenYear] = useState(String(now.getFullYear()));

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [invRes, conRes] = await Promise.all([
        fetchAPI("/invoices"),
        fetchAPI("/contracts"),
      ]);
      if (invRes.success && Array.isArray(invRes.data)) setInvoices(invRes.data);
      if (conRes.success && Array.isArray(conRes.data)) {
        setContracts(conRes.data.filter((c: any) => c.status === "ACTIVE"));
        if (conRes.data.filter((c: any) => c.status === "ACTIVE").length > 0) {
          setGenContractId(conRes.data.filter((c: any) => c.status === "ACTIVE")[0].id);
        }
      }
    } catch (err: any) {
      setError("Không thể tải dữ liệu hóa đơn.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const handleSendBill = async (id: string) => {
    try {
      setSendingId(id);
      setSendSuccess(null);
      const res = await fetchAPI(`/invoices/${id}/send`, { method: "POST" });
      if (res.success) {
        setSendSuccess(id);
        setTimeout(() => setSendSuccess(null), 4000);
      } else {
        alert("Lỗi: " + (res.message || "Không thể gửi hóa đơn."));
      }
    } catch (err: any) {
      alert("Lỗi khi gửi hóa đơn: " + err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleDownloadPdf = async (id: string, roomNumber: string, month: number, year: number) => {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/invoices/${id}/pdf`, { headers });
      if (!response.ok) throw new Error("Không thể xuất PDF hóa đơn.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HoaDon_Phong${roomNumber}_T${month}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi tải PDF: " + err.message);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenLoading(true);
      setGenError("");
      const res = await fetchAPI("/invoices/generate", {
        method: "POST",
        body: JSON.stringify({
          contractId: genContractId,
          billingMonth: Number(genMonth),
          billingYear: Number(genYear),
        }),
      });
      if (res.success) {
        setShowGenModal(false);
        loadData();
      } else {
        setGenError(res.message || "Lỗi tạo hóa đơn.");
      }
    } catch (err: any) {
      setGenError(err.message || "Lỗi khi tạo hóa đơn.");
    } finally {
      setGenLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const room = inv.room_number || "";
    const statusMatch = filter === "ALL" || inv.status === filter;
    const searchMatch = room.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

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
          <h2 className="text-2xl font-bold text-gray-800">🧾 Quản lý Hóa đơn</h2>
          <p className="text-sm text-gray-500">{invoices.length} hóa đơn</p>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Tạo hóa đơn
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Chờ thanh toán", value: invoices.filter(i => i.status === "PENDING").length, color: "text-yellow-600" },
          { label: "Đã thanh toán", value: invoices.filter(i => i.status === "PAID").length, color: "text-green-600" },
          { label: "Quá hạn", value: invoices.filter(i => i.status === "OVERDUE").length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo phòng..."
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {["ALL", "PENDING", "PAID", "OVERDUE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            {f === "ALL" ? "Tất cả" : f === "PENDING" ? "Chờ TT" : f === "PAID" ? "Đã TT" : "Quá hạn"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Phòng</th>
              <th className="text-left px-4 py-3">Tháng</th>
              <th className="text-right px-4 py-3">Tiền phòng</th>
              <th className="text-right px-4 py-3">Điện</th>
              <th className="text-right px-4 py-3">Nước</th>
              <th className="text-right px-4 py-3">Tổng cộng</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-right px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((inv) => {
                const st = statusLabel[inv.status] || { label: inv.status, cls: "bg-gray-100 text-gray-600" };
                const isSent = sendSuccess === inv.id;
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {inv.room_number || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {inv.billing_month}/{inv.billing_year}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{(inv.room_fee || 0).toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3 text-right text-yellow-700">{(inv.electric_fee || 0).toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3 text-right text-blue-700">{(inv.water_fee || 0).toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{(inv.total_amount || 0).toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {isSent ? (
                          <span className="text-green-600 text-xs font-semibold">✅ Đã gửi!</span>
                        ) : (
                          <button
                            onClick={() => handleSendBill(inv.id)}
                            disabled={sendingId === inv.id}
                            title="Gửi hóa đơn qua email"
                            className="flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            <Send size={12} />
                            {sendingId === inv.id ? "Đang gửi..." : "Gửi Bill"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  Không có hóa đơn nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Invoice Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo hóa đơn mới</h3>
            <form onSubmit={handleGenerate}>
              {genError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4">{genError}</div>
              )}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hợp đồng (phòng)</label>
                <select
                  value={genContractId}
                  onChange={(e) => setGenContractId(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      Phòng {c.room_number} — {c.tenant_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tháng</label>
                  <select value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Năm</label>
                  <input type="number" value={genYear} onChange={(e) => setGenYear(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowGenModal(false)} className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition">
                  Hủy
                </button>
                <button type="submit" disabled={genLoading} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {genLoading ? "Đang tạo..." : "Tạo hóa đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
