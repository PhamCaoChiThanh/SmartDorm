"use client";

import { useState, useEffect } from "react";
import { fetchAPI, API_URL } from "@/lib/api";
import { exportToCSV } from "@/lib/export";
import { AlertCircle, Send, Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";

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
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [parkingInvoices, setParkingInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
 
  // Generate invoice modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genContractId, setGenContractId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const now = new Date();
  const [genMonth, setGenMonth] = useState(String(now.getMonth() + 1));
  const [genYear, setGenYear] = useState(String(now.getFullYear()));
 
  // Edit invoice states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [editRoomFee, setEditRoomFee] = useState("");
  const [editElectricFee, setEditElectricFee] = useState("");
  const [editWaterFee, setEditWaterFee] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
 
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
        const active = conRes.data.filter((c: any) => c.status === "ACTIVE");
        const uniqueRooms: any[] = [];
        const seen = new Set();
        for (const c of active) {
          if (!seen.has(c.room_number)) {
            seen.add(c.room_number);
            uniqueRooms.push(c);
          }
        }
        setContracts(uniqueRooms);
        if (uniqueRooms.length > 0) {
          setGenContractId(uniqueRooms[0].id);
        }
      }
    } catch (err: any) {
      setError("Không thể tải dữ liệu hóa đơn.");
    } finally {
      setLoading(false);
    }
  }

  const loadParkingInvoices = () => {
    const data = localStorage.getItem("parkingInvoices");
    if (data) {
      const parsed = JSON.parse(data);
      setParkingInvoices(parsed.filter((inv: any) => inv.status === "WAITING"));
    } else {
      setParkingInvoices([]);
    }
  };

  const handleApproveParkingInvoice = (id: number) => {
    const data = localStorage.getItem("parkingInvoices");
    if (data) {
      const parsed = JSON.parse(data);
      const updated = parsed.map((inv: any) => 
        inv.id === id ? { ...inv, status: "PAID" } : inv
      );
      localStorage.setItem("parkingInvoices", JSON.stringify(updated));
      loadParkingInvoices();
    }
  };
 
  useEffect(() => { 
    loadData(); 
    loadParkingInvoices();
  }, []);

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

  const handleOpenEdit = (inv: any) => {
    setEditInvoice(inv);
    setEditRoomFee(String(inv.room_fee || 0));
    setEditElectricFee(String(inv.electric_fee || 0));
    setEditWaterFee(String(inv.water_fee || 0));
    setEditPaidAmount(String(inv.paid_amount || 0));
    setEditStatus(inv.status);
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;
    try {
      setEditLoading(true);
      setEditError("");
      const res = await fetchAPI(`/invoices/${editInvoice.Id || editInvoice.id}`, {
        method: "PUT",
        body: JSON.stringify({
          roomFee: Number(editRoomFee),
          electricFee: Number(editElectricFee),
          waterFee: Number(editWaterFee),
          paidAmount: Number(editPaidAmount),
          status: editStatus,
        }),
      });
      if (res.success) {
        setShowEditModal(false);
        loadData();
      } else {
        setEditError(res.message || "Lỗi cập nhật hóa đơn.");
      }
    } catch (err: any) {
      setEditError(err.message || "Lỗi khi cập nhật hóa đơn.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hóa đơn này không?")) return;
    try {
      const res = await fetchAPI(`/invoices/${id}`, { method: "DELETE" });
      if (res.success) {
        loadData();
      } else {
        alert("Lỗi: " + (res.message || "Không thể xóa hóa đơn."));
      }
    } catch (err: any) {
      alert("Lỗi khi xóa hóa đơn: " + err.message);
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

  const handleExportExcel = () => {
    const headers = [
      "ID Hóa Đơn",
      "Số Phòng",
      "Kỳ Tháng",
      "Kỳ Năm",
      "Tiền Phòng (VNĐ)",
      "Tiền Điện (VNĐ)",
      "Tiền Nước (VNĐ)",
      "Tổng Tiền (VNĐ)",
      "Đã Thanh Toán (VNĐ)",
      "Trạng Thái",
      "Ngày Tạo"
    ];
    const keys = [
      "id",
      "room_number",
      "billing_month",
      "billing_year",
      "room_fee",
      "electric_fee",
      "water_fee",
      "total_amount",
      "paid_amount",
      "status",
      "created_at"
    ];
    const formatted = filtered.map(inv => ({
      ...inv,
      status: inv.status === "PAID" ? "Đã thanh toán" : inv.status === "OVERDUE" ? "Quá hạn" : "Chờ thanh toán",
      created_at: new Date(inv.created_at || inv.createdAt).toLocaleDateString("vi-VN")
    }));
    exportToCSV(formatted, `DanhSachHoaDon_${filter}`, headers, keys);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🧾 Quản lý Hóa đơn</h2>
          <p className="text-sm text-gray-500">{invoices.length} hóa đơn</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-xs"
          >
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Tạo hóa đơn
          </button>
        </div>
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
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          title="Sửa hóa đơn"
                          className="p-1 text-gray-500 hover:text-blue-600 transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          title="Xóa hóa đơn"
                          className="p-1 text-gray-500 hover:text-red-600 transition mr-2"
                        >
                          <Trash2 size={14} />
                        </button>
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
                      Phòng {c.room_number}
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

      {/* Edit Invoice Modal */}
      {showEditModal && editInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Chỉnh sửa hóa đơn — Phòng {editInvoice.room_number}</h3>
            <form onSubmit={handleUpdate}>
              {editError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4">{editError}</div>
              )}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tiền phòng (VND)</label>
                <input
                  type="number"
                  value={editRoomFee}
                  onChange={(e) => setEditRoomFee(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tiền điện (VND)</label>
                  <input
                    type="number"
                    value={editElectricFee}
                    onChange={(e) => setEditElectricFee(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tiền nước (VND)</label>
                  <input
                    type="number"
                    value={editWaterFee}
                    onChange={(e) => setEditWaterFee(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Đã thanh toán (VND)</label>
                  <input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trạng thái</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Chờ thanh toán</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="OVERDUE">Quá hạn</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition">
                  Hủy
                </button>
                <button type="submit" disabled={editLoading} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parking Invoices Approval Section */}
      {parkingInvoices.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden p-5 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            📋 Duyệt thanh toán hóa đơn gửi xe
          </h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-400 border-b">
                <th className="text-left px-4 py-3">Biển số xe</th>
                <th className="text-left px-4 py-3">Loại xe</th>
                <th className="text-left px-4 py-3">Kỳ hạn</th>
                <th className="text-right px-4 py-3">Số tiền</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-right px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {parkingInvoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{inv.plate}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.type}</td>
                  <td className="px-4 py-3 text-gray-600">Tháng {inv.billingMonth}/{inv.billingYear}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{(inv.amount || 150000).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">Chờ duyệt</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleApproveParkingInvoice(inv.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Xác nhận thanh toán
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
