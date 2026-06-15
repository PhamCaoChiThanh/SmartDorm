"use client";

import { useState, useEffect } from "react";
import { fetchAPI, API_URL } from "@/lib/api";
import { AlertCircle } from "lucide-react";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  TERMINATED: "bg-red-100 text-red-600",
};

export default function AdminContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // States for Extend/Renew contract
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [renewLoading, setRenewLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  async function loadContracts() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/contracts");
      if (res.success && Array.isArray(res.data)) {
        setContracts(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải hợp đồng:", err);
      setError("Không thể tải danh sách hợp đồng từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContracts();
  }, []);

  const handleTerminate = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn chấm dứt hợp đồng này không?")) return;
    try {
      const res = await fetchAPI(`/contracts/${id}/terminate`, {
        method: "PUT",
      });
      if (res.success) {
        loadContracts();
      }
    } catch (err: any) {
      alert("Lỗi khi chấm dứt hợp đồng: " + err.message);
    }
  };

  const handleRenewClick = (contract: any) => {
    setSelectedContract(contract);
    if (contract.end_date) {
      const currentEnd = new Date(contract.end_date);
      currentEnd.setFullYear(currentEnd.getFullYear() + 1);
      setNewEndDate(currentEnd.toISOString().split("T")[0]);
    } else {
      setNewEndDate("");
    }
    setActionError("");
    setShowRenewModal(true);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      setRenewLoading(true);
      setActionError("");
      const res = await fetchAPI(`/contracts/${selectedContract.id}/renew`, {
        method: "PUT",
        body: JSON.stringify({ endDate: newEndDate }),
      });
      if (res.success) {
        setShowRenewModal(false);
        loadContracts();
      }
    } catch (err: any) {
      setActionError(err.message || "Lỗi khi gia hạn hợp đồng");
    } finally {
      setRenewLoading(false);
    }
  };

  const handleDownloadPdf = async (id: string, roomNumber: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/contracts/${id}/pdf`, { headers });
      if (!response.ok) throw new Error("Không thể xuất tài liệu PDF.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HopDongThuePhong_${roomNumber || "SmartDorm"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi khi tải xuống PDF: " + err.message);
    }
  };

  const handleDownloadTerminationPdf = async (id: string, roomNumber: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/contracts/${id}/pdf/termination`, { headers });
      if (!response.ok) throw new Error("Không thể xuất biên bản chấm dứt.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BienBanChamDutHopDong_${roomNumber || "SmartDorm"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi khi tải biên bản chấm dứt: " + err.message);
    }
  };

  const handleDownloadRenewalPdf = async (id: string, roomNumber: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/contracts/${id}/pdf/renewal`, { headers });
      if (!response.ok) throw new Error("Không thể xuất phụ lục gia hạn.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PhuLucGiaHanHopDong_${roomNumber || "SmartDorm"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi khi tải phụ lục gia hạn: " + err.message);
    }
  };

  const filtered = contracts.filter((c) => {
    const tenantName = c.tenant_name || "";
    const room = c.room_number || "";
    const id = c.id || "";
    const status = c.status || "";

    const matchFilter = filter === "ALL" || status === filter;
    const matchSearch =
      tenantName.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách hợp đồng...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 Quản lý Hợp đồng</h2>
          <p className="text-sm text-gray-500">{contracts.length} hợp đồng</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Đang hiệu lực", value: contracts.filter(c => c.status === "ACTIVE").length, color: "text-green-600" },
          { label: "Đã hết hạn", value: contracts.filter(c => c.status === "EXPIRED").length, color: "text-gray-500" },
          { label: "Đã chấm dứt", value: contracts.filter(c => c.status === "TERMINATED").length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, phòng, mã HĐ..." className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        {["ALL", "ACTIVE", "EXPIRED", "TERMINATED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            {f === "ALL" ? "Tất cả" : f === "ACTIVE" ? "Hiệu lực" : f === "EXPIRED" ? "Hết hạn" : "Chấm dứt"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Mã HĐ</th>
              <th className="text-left px-4 py-3">Người thuê</th>
              <th className="text-left px-4 py-3">Phòng</th>
              <th className="text-left px-4 py-3">Bắt đầu</th>
              <th className="text-left px-4 py-3">Kết thúc</th>
              <th className="text-left px-4 py-3">Tiền phòng</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-right px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600 truncate max-w-[120px]">{c.id}</td>
                  <td className="px-4 py-3">{c.tenant_name || "—"}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.room_number || "—"}</span></td>
                  <td className="px-4 py-3 text-gray-500">{c.start_date || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.end_date || "—"}</td>
                  <td className="px-4 py-3 font-medium">{(c.base_price || 0).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || "bg-gray-100 text-gray-600"}`}>{c.status === "ACTIVE" ? "Đang hiệu lực" : c.status === "EXPIRED" ? "Đã hết hạn" : "Đã chấm dứt"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {/* Hợp đồng gốc - luôn hiện */}
                      <button
                        onClick={() => handleDownloadPdf(c.id, c.room_number)}
                        title="Tải hợp đồng thuê phòng"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        📄 Hợp đồng
                      </button>

                      {/* Phụ lục gia hạn - chỉ hiện khi đã từng gia hạn */}
                      {c.wasRenewed && (
                        <button
                          onClick={() => handleDownloadRenewalPdf(c.id, c.room_number)}
                          title="Tải phụ lục gia hạn"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                        >
                          📄 Gia hạn
                        </button>
                      )}

                      {/* Biên bản chấm dứt - chỉ hiện khi TERMINATED */}
                      {c.status === "TERMINATED" && (
                        <button
                          onClick={() => handleDownloadTerminationPdf(c.id, c.room_number)}
                          title="Tải biên bản chấm dứt"
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                        >
                          📄 Chấm dứt
                        </button>
                      )}

                      {/* Action buttons for ACTIVE contracts */}
                      {c.status === "ACTIVE" && (
                        <>
                          <button onClick={() => handleRenewClick(c)} className="bg-emerald-600 text-white hover:bg-emerald-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition">
                            Gia hạn
                          </button>
                          <button onClick={() => handleTerminate(c.id)} className="bg-rose-600 text-white hover:bg-rose-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition">
                            Chấm dứt
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  Không tìm thấy hợp đồng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Renew Modal */}
      {showRenewModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gia hạn hợp đồng</h3>
            <p className="text-sm text-gray-500 mb-4">
              Gia hạn hợp đồng phòng <span className="font-semibold text-gray-700">{selectedContract.room_number}</span> của sinh viên <span className="font-semibold text-gray-700">{selectedContract.tenant_name}</span>.
            </p>
            
            <form onSubmit={handleRenewSubmit}>
              {actionError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4">
                  {actionError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Ngày kết thúc mới
                </label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Ngày kết thúc hiện tại: {selectedContract.end_date}
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={renewLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {renewLoading ? "Đang xử lý..." : "Xác nhận gia hạn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}