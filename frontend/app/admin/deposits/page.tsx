"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle, Wallet, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Transaction History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Refund/Deduct Action Modal
  const [actionType, setActionType] = useState<"REFUND" | "DEDUCT" | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  async function loadDeposits() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/deposits");
      if (res.success && Array.isArray(res.data)) {
        setDeposits(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách đặt cọc:", err);
      setError("Không thể tải danh sách tiền đặt cọc.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleShowHistory = async (deposit: any) => {
    setSelectedDeposit(deposit);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetchAPI(`/deposits/${deposit.id}/transactions`);
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải lịch sử giao dịch cọc:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleActionClick = (deposit: any, type: "REFUND" | "DEDUCT") => {
    setSelectedDeposit(deposit);
    setActionType(type);
    setActionAmount(deposit.remainingBalance?.toString() || deposit.remaining_balance?.toString() || "");
    setActionReason("");
    setActionError("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeposit || !actionType) return;
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionError("Vui lòng nhập số tiền hợp lệ lớn hơn 0");
      return;
    }

    const maxAmount = selectedDeposit.remainingBalance ?? selectedDeposit.remaining_balance ?? 0;
    if (amount > maxAmount) {
      setActionError(`Số tiền không được vượt quá số dư còn lại (${maxAmount.toLocaleString("vi-VN")}đ)`);
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      const endpoint = actionType === "REFUND" ? "refund" : "deduct";
      const res = await fetchAPI(`/deposits/${selectedDeposit.id}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          reason: actionReason
        })
      });

      if (res.success) {
        setActionType(null);
        loadDeposits();
        alert("Đã cập nhật giao dịch đặt cọc thành công!");
      }
    } catch (err: any) {
      setActionError(err.message || "Đã xảy ra lỗi khi thực hiện giao dịch.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = deposits.filter((d) => {
    const tenantName = d.tenant_name || "";
    const room = d.room_number || "";
    const status = d.status || "";

    const matchFilter = filter === "ALL" || status === filter;
    const matchSearch =
      tenantName.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "HOLDING": return "Đang giữ cọc";
      case "REFUNDED": return "Đã hoàn trả";
      case "PARTIALLY_REFUNDED": return "Hoàn trả một phần";
      case "DEDUCTED_ALL": return "Đã khấu trừ hết";
      case "PARTIALLY_DEDUCTED": return "Khấu trừ một phần";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HOLDING": return "bg-blue-100 text-blue-700";
      case "REFUNDED": return "bg-green-100 text-green-700";
      case "PARTIALLY_REFUNDED": return "bg-teal-100 text-teal-700";
      case "DEDUCTED_ALL": return "bg-red-100 text-red-700";
      case "PARTIALLY_DEDUCTED": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách đặt cọc...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💰 Quản lý Tiền đặt cọc</h2>
          <p className="text-sm text-gray-500">{deposits.length} khoản đặt cọc</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 flex-wrap mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, phòng..."
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {["ALL", "HOLDING", "REFUNDED", "DEDUCTED_ALL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f === "ALL" ? "Tất cả" : getStatusLabel(f)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Người thuê</th>
              <th className="text-left px-4 py-3">Phòng</th>
              <th className="text-left px-4 py-3">Tổng cọc ban đầu</th>
              <th className="text-left px-4 py-3">Số dư còn lại</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-right px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((d) => {
                const remBal = d.remainingBalance ?? d.remaining_balance ?? 0;
                return (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.tenant_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {d.room_number || "P-?"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {d.totalAmount?.toLocaleString("vi-VN") || d.total_amount?.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">
                      {remBal.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(d.status)}`}>
                        {getStatusLabel(d.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleShowHistory(d)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Lịch sử
                      </button>
                      {remBal > 0 && (
                        <>
                          <button
                            onClick={() => handleActionClick(d, "REFUND")}
                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            Hoàn cọc
                          </button>
                          <button
                            onClick={() => handleActionClick(d, "DEDUCT")}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Phạt/Khấu trừ
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Không tìm thấy khoản đặt cọc nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lịch sử giao dịch Modal */}
      {showHistoryModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-800">
                Lịch sử giao dịch cọc phòng {selectedDeposit.room_number}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            {historyLoading ? (
              <div className="py-6 text-center text-sm text-gray-400">Đang tải lịch sử...</div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <div key={t.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          t.transactionType === "RECEIVE" ? "bg-blue-100 text-blue-700" :
                          t.transactionType === "REFUND" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {t.transactionType === "RECEIVE" ? <Wallet size={16} /> :
                           t.transactionType === "REFUND" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{t.reason || "Giao dịch đặt cọc"}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${
                        t.transactionType === "RECEIVE" ? "text-blue-600" :
                        t.transactionType === "REFUND" ? "text-green-600" : "text-red-600"
                      }`}>
                        {t.transactionType === "RECEIVE" ? "+" : "-"}
                        {t.amount?.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-gray-400">Chưa có giao dịch nào được ghi nhận.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund/Deduct Action Modal */}
      {actionType && selectedDeposit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleActionSubmit} className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-xl text-gray-800">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">
                {actionType === "REFUND" ? "Hoàn trả tiền cọc" : "Phạt/Khấu trừ tiền cọc"}
              </h3>
              <button type="button" onClick={() => setActionType(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            
            {actionError && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Số tiền (đ)</label>
                <input
                  type="number"
                  required
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <span className="text-xs text-gray-400 block mt-1">
                  Số dư còn lại có thể sử dụng: {(selectedDeposit.remainingBalance ?? selectedDeposit.remaining_balance ?? 0).toLocaleString("vi-VN")}đ
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Lý do</label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionType === "REFUND" ? "Lý do hoàn trả tiền đặt cọc..." : "Ví dụ: Sinh viên làm hư hỏng thiết bị, kết thúc hợp đồng trước hạn..."}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-lg text-sm transition font-medium ${
                  actionType === "REFUND" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-55`}
              >
                {actionLoading ? "Đang xử lý..." : (actionType === "REFUND" ? "Xác nhận hoàn" : "Xác nhận phạt")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
