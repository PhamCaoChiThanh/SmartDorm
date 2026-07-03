"use client";

import { useState, useEffect } from "react";
import { fetchAPI, API_URL } from "@/lib/api";
import { exportToCSV } from "@/lib/export";
import { AlertCircle, Send, Plus, Pencil, Trash2, FileSpreadsheet, FileDown, ChevronDown, ChevronRight, FileText, CheckCircle, Copy, Sparkles, Loader2, X } from "lucide-react";

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
  const [sendingRoomKey, setSendingRoomKey] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [parkingInvoices, setParkingInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
 
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

  const handleSendRoomBills = async (roomInvoices: any[], roomKey: string) => {
    const pendingInvoices = roomInvoices.filter((inv) => inv.status !== "PAID");
    if (pendingInvoices.length === 0) {
      alert("Tất cả thành viên trong phòng này đã thanh toán hóa đơn!");
      return;
    }
    
    try {
      setSendingRoomKey(roomKey);
      
      const promises = pendingInvoices.map((inv) =>
        fetchAPI(`/invoices/${inv.id}/send`, { method: "POST" })
      );
      
      const results = await Promise.all(promises);
      const failed = results.filter((res) => !res.success);
      
      if (failed.length > 0) {
        alert(`Gửi bill thành công cho ${results.length - failed.length}/${results.length} người. Có ${failed.length} người gửi lỗi.`);
      } else {
        alert("Đã gửi bill thành công đến tất cả các thành viên chưa thanh toán trong phòng!");
      }
      
      pendingInvoices.forEach((inv) => {
        setSendSuccess(inv.id);
        setTimeout(() => setSendSuccess(null), 4000);
      });
      
    } catch (err: any) {
      alert("Lỗi khi gửi hóa đơn phòng: " + err.message);
    } finally {
      setSendingRoomKey(null);
    }
  };

  const handleDownloadPdf = async (id: string, roomNumber: string, month: number, year: number) => {
    try {
      const token = sessionStorage.getItem("token");
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

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

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
      "Ngày Gửi Bill",
      "Ngày Thanh Toán",
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
      "sent_at",
      "payment_date",
      "created_at"
    ];
    const formatted = filtered.map(inv => ({
      ...inv,
      status: inv.status === "PAID" ? "Đã thanh toán" : inv.status === "OVERDUE" ? "Quá hạn" : "Chờ thanh toán",
      sent_at: inv.sent_at ? new Date(inv.sent_at).toLocaleString("vi-VN") : "—",
      payment_date: inv.payment_date ? new Date(inv.payment_date).toLocaleString("vi-VN") : "—",
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
              <th className="text-left px-4 py-3">Gửi lúc</th>
              <th className="text-left px-4 py-3">Thanh toán lúc</th>
              <th className="text-right px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Group invoices by room and month/year
              const groups: Record<string, {
                room_number: string;
                billing_month: number;
                billing_year: number;
                room_fee: number;
                electric_fee: number;
                water_fee: number;
                total_amount: number;
                invoices: any[];
              }> = {};

              filtered.forEach((inv) => {
                const key = `${inv.room_number || "—"}_${inv.billing_month}_${inv.billing_year}`;
                if (!groups[key]) {
                  groups[key] = {
                    room_number: inv.room_number || "—",
                    billing_month: inv.billing_month,
                    billing_year: inv.billing_year,
                    room_fee: 0,
                    electric_fee: 0,
                    water_fee: 0,
                    total_amount: 0,
                    invoices: [],
                  };
                }
                groups[key].room_fee += inv.room_fee || 0;
                groups[key].electric_fee += inv.electric_fee || 0;
                groups[key].water_fee += inv.water_fee || 0;
                groups[key].total_amount += inv.total_amount || 0;
                groups[key].invoices.push(inv);
              });

              const groupedList = Object.values(groups);

              if (groupedList.length === 0) {
                return (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-400">
                      Không có hóa đơn nào.
                    </td>
                  </tr>
                );
              }

              return groupedList.map((group) => {
                const groupKey = `${group.room_number}_${group.billing_month}_${group.billing_year}`;
                const isExpanded = !!expandedGroups[groupKey];
                const paidCount = group.invoices.filter((i: any) => i.status === "PAID").length;
                const totalCount = group.invoices.length;

                let groupStatusLabel = `Chờ thanh toán (0/${totalCount})`;
                let groupStatusCls = "bg-yellow-100 text-yellow-700";

                if (paidCount === totalCount) {
                  groupStatusLabel = `Đã thanh toán (${totalCount}/${totalCount})`;
                  groupStatusCls = "bg-green-100 text-green-700";
                } else if (paidCount > 0) {
                  groupStatusLabel = `Đã TT một phần (${paidCount}/${totalCount})`;
                  groupStatusCls = "bg-blue-100 text-blue-700";
                }

                const toggleExpand = () => {
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [groupKey]: !prev[groupKey],
                  }));
                };

                return (
                  <>
                    {/* Main Row */}
                    <tr
                      key={groupKey}
                      onClick={toggleExpand}
                      className="border-b hover:bg-gray-50/80 cursor-pointer transition select-none"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                          <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {group.room_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {group.billing_month}/{group.billing_year}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">
                        {group.room_fee.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-700 font-medium">
                        {group.electric_fee.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-4 py-3 text-right text-blue-700 font-medium">
                        {group.water_fee.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {group.total_amount.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-4 py-3" colSpan={4}>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${groupStatusCls}`}>
                            {groupStatusLabel}
                          </span>
                          <div className="flex items-center gap-3">
                            {paidCount < totalCount && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendRoomBills(group.invoices, groupKey);
                                }}
                                disabled={sendingRoomKey === groupKey}
                                className="flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                              >
                                <Send size={12} />
                                {sendingRoomKey === groupKey ? "Đang gửi..." : "Gửi Bill"}
                              </button>
                            )}
                            <span className="text-xs text-blue-600 font-semibold hover:underline">
                              {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Sub Rows (Expanded) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="bg-gray-50/40 p-0 border-b">
                          <div className="px-4 py-3 border-l-4 border-blue-500 bg-gray-50/70">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Chi tiết hóa đơn từng thành viên phòng {group.room_number}
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50/50 text-gray-500 border-b">
                                  <tr>
                                    <th className="text-left px-3 py-2 font-semibold">Tên khách thuê</th>
                                    <th className="text-right px-3 py-2 font-semibold">Tiền phòng</th>
                                    <th className="text-right px-3 py-2 font-semibold">Tiền điện</th>
                                    <th className="text-right px-3 py-2 font-semibold">Tiền nước</th>
                                    <th className="text-right px-3 py-2 font-semibold">Tổng cộng</th>
                                    <th className="text-left px-3 py-2 font-semibold">Trạng thái</th>
                                    <th className="text-left px-3 py-2 font-semibold">Gửi lúc</th>
                                    <th className="text-left px-3 py-2 font-semibold">Thanh toán lúc</th>
                                    <th className="text-right px-3 py-2 font-semibold">Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.invoices.map((inv: any) => {
                                    const st = statusLabel[inv.status] || {
                                      label: inv.status,
                                      cls: "bg-gray-100 text-gray-600",
                                    };
                                    const isSent = sendSuccess === inv.id;
                                    return (
                                      <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/30">
                                        <td className="px-3 py-2.5 font-semibold text-gray-700">
                                          {inv.tenant_name || "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-gray-600">
                                          {(inv.room_fee || 0).toLocaleString("vi-VN")}đ
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-yellow-700">
                                          {(inv.electric_fee || 0).toLocaleString("vi-VN")}đ
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-blue-700">
                                          {(inv.water_fee || 0).toLocaleString("vi-VN")}đ
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                                          {(inv.total_amount || 0).toLocaleString("vi-VN")}đ
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>
                                            {st.label}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-400 font-normal">
                                          {formatDateTime(inv.sent_at)}
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-400 font-normal">
                                          {formatDateTime(inv.payment_date)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                          <div className="flex justify-end gap-1.5 items-center">
                                            {inv.status !== "PAID" && (
                                              <>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenEdit(inv);
                                                  }}
                                                  title="Sửa hóa đơn"
                                                  className="p-1 text-gray-400 hover:text-blue-600 transition"
                                                >
                                                  <Pencil size={12} />
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteInvoice(inv.id);
                                                  }}
                                                  title="Xóa hóa đơn"
                                                  className="p-1 text-gray-400 hover:text-red-600 transition"
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadPdf(
                                                      inv.id,
                                                      inv.room_number,
                                                      inv.billing_month,
                                                      inv.billing_year
                                                    );
                                                  }}
                                                  title="Xuất PDF hóa đơn"
                                                  className="p-1 text-gray-400 hover:text-emerald-600 transition"
                                                >
                                                  <FileDown size={12} />
                                                </button>
                                              </>
                                            )}
                                            {inv.status === "PAID" ? (
                                              <span className="text-green-600 text-[11px] font-semibold flex items-center gap-0.5">
                                                ✅ Đã thanh toán
                                              </span>
                                            ) : isSent ? (
                                              <span className="text-green-600 text-[11px] font-semibold">✅ Đã gửi!</span>
                                            ) : (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSendBill(inv.id);
                                                }}
                                                disabled={sendingId === inv.id}
                                                title="Gửi hóa đơn qua email"
                                                className="flex items-center gap-0.5 bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold transition disabled:opacity-50"
                                              >
                                                <Send size={10} />
                                                {sendingId === inv.id ? "Đang gửi..." : "Gửi Bill"}
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              });
            })()}
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
