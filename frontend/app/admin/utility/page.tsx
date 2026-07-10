"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle, Pencil, Trash2, FileSpreadsheet, Activity, ShieldAlert, TrendingUp, AlertTriangle } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function AdminUtility() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [usages, setUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("ELECTRIC");
  const [oldIndex, setOldIndex] = useState("");
  const [newIndex, setNewIndex] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"record" | "analytics">("record");
  const [selectedAnalyticRoom, setSelectedAnalyticRoom] = useState<any>(null);

  // Edit utility states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsage, setEditUsage] = useState<any>(null);
  const [editOldIndex, setEditOldIndex] = useState("");
  const [editNewIndex, setEditNewIndex] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editType, setEditType] = useState("ELECTRIC");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const roomsRes = await fetchAPI("/rooms");
      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        const occupiedRooms = roomsRes.data.filter((r: any) => r.currentOccupants > 0);
        setRooms(occupiedRooms);
        if (occupiedRooms.length > 0) {
          setSelectedRoomId(occupiedRooms[0].id);
        } else {
          setSelectedRoomId("");
        }
      }

      const usagesRes = await fetchAPI("/utilities");
      if (usagesRes.success && Array.isArray(usagesRes.data)) {
        setUsages(usagesRes.data);
      }

      const analyticsRes = await fetchAPI("/utilities/analytics");
      if (analyticsRes.success && Array.isArray(analyticsRes.data)) {
        setAnalytics(analyticsRes.data);
        if (analyticsRes.data.length > 0) {
          setSelectedAnalyticRoom(analyticsRes.data[0]);
        }
      }
    } catch (err: any) {
      console.error("Lỗi khi tải dữ liệu điện nước:", err);
      setError("Không thể tải thông tin từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRoomId && type && usages.length > 0) {
      const roomUsages = usages.filter((u: any) => u.roomId === selectedRoomId && u.type === type);
      if (roomUsages.length > 0) {
        // Sort by year and month descending to get the absolute latest usage record
        const sorted = [...roomUsages].sort((a, b) => {
          const valA = (a.billing_year || a.billingYear || 0) * 12 + (a.billing_month || a.billingMonth || 0);
          const valB = (b.billing_year || b.billingYear || 0) * 12 + (b.billing_month || b.billingMonth || 0);
          return valB - valA;
        });
        setOldIndex(String(sorted[0].new_index || sorted[0].newIndex || 0));
      } else {
        setOldIndex("0");
      }
    } else {
      setOldIndex("0");
    }
  }, [selectedRoomId, type, usages]);

  const usage = newIndex && oldIndex ? Number(newIndex) - Number(oldIndex) : 0;
  const isInvalidIndex = newIndex !== "" && Number(newIndex) < Number(oldIndex);

  const handleSubmit = async () => {
    if (!selectedRoomId) {
      alert("Vui lòng chọn phòng có người đang thuê.");
      return;
    }
    if (isInvalidIndex) {
      alert("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
      return;
    }
    if (!newIndex) {
      alert("Vui lòng nhập chỉ số mới.");
      return;
    }

    try {
      setError("");
      const now = new Date();
      const billingMonth = now.getMonth() + 1;
      const billingYear = now.getFullYear();

      const res = await fetchAPI("/utilities", {
        method: "POST",
        body: JSON.stringify({
          roomId: selectedRoomId,
          type: type,
          billingMonth,
          billingYear,
          oldIndex: Number(oldIndex),
          newIndex: Number(newIndex),
        }),
      });

      if (res.success) {
        setSubmitted(true);
        setSuccessMessage("✅ Ghi nhận chỉ số thành công!");
        setNewIndex("");
        
        // Refresh usages history
        const usagesRes = await fetchAPI("/utilities");
        if (usagesRes.success && Array.isArray(usagesRes.data)) {
          setUsages(usagesRes.data);
        }

        setTimeout(() => {
          setSubmitted(false);
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(res.message || "Lỗi khi ghi nhận chỉ số.");
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu chỉ số:", err);
      setError(err.message || "Có lỗi xảy ra khi lưu chỉ số.");
    }
  };

  const handleOpenEdit = (u: any) => {
    setEditUsage(u);
    setEditOldIndex(String(u.old_index));
    setEditNewIndex(String(u.new_index));
    setEditMonth(String(u.billing_month));
    setEditYear(String(u.billing_year));
    setEditType(u.type);
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsage) return;
    if (Number(editNewIndex) < Number(editOldIndex)) {
      alert("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");
      const res = await fetchAPI(`/utilities/${editUsage.id}`, {
        method: "PUT",
        body: JSON.stringify({
          oldIndex: Number(editOldIndex),
          newIndex: Number(editNewIndex),
          billingMonth: Number(editMonth),
          billingYear: Number(editYear),
          type: editType,
        }),
      });

      if (res.success) {
        setShowEditModal(false);
        loadData();
      } else {
        setEditError(res.message || "Lỗi khi cập nhật chỉ số.");
      }
    } catch (err: any) {
      setEditError(err.message || "Có lỗi xảy ra khi cập nhật.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi nhận chỉ số này không?")) return;
    try {
      const res = await fetchAPI(`/utilities/${id}`, { method: "DELETE" });
      if (res.success) {
        loadData();
      } else {
        alert("Lỗi: " + (res.message || "Không thể xóa ghi nhận."));
      }
    } catch (err: any) {
      alert("Lỗi khi xóa ghi nhận: " + err.message);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = usages.map((item) => ({
      room_number: item.room_number || "",
      type: item.type === "ELECTRIC" ? "Điện" : "Nước",
      month_year: `${item.billing_month}/${item.billing_year}`,
      old_index: item.old_index,
      new_index: item.new_index,
      consumption: item.new_index - item.old_index,
      unit: item.type === "ELECTRIC" ? "số" : "khối",
    }));

    exportToCSV(
      dataToExport,
      "Lich_su_ghi_nhan_dien_nuoc",
      ["Phòng", "Loại", "Tháng/Năm", "Chỉ số cũ", "Chỉ số mới", "Tiêu thụ", "Đơn vị"],
      ["room_number", "type", "month_year", "old_index", "new_index", "consumption", "unit"]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải dữ liệu điện nước...</p>
      </div>
    );
  }

  const activeWarnings = analytics.filter(r => r.waterAnalytics.isAnomaly || r.electricAnalytics.isAnomaly);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⚡ Quản lý Điện nước</h2>
          <p className="text-sm text-gray-500">Ghi nhận chỉ số và phân tích rò rỉ thông minh</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab("record")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "record"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ✍️ Nhập chỉ số
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Activity size={16} />
            Phân tích & Cảnh báo
            {activeWarnings.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Global Pulsing Warning Banner */}
      {activeWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 flex items-start gap-3 animate-pulse">
          <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <span className="font-bold">⚠️ CẢNH BÁO BẤT THƯỜNG KHẨN CẤP:</span>
            <p className="text-sm text-red-700 mt-1">
              Phát hiện lượng nước hoặc điện tiêu thụ tăng đột biến tại các phòng:{" "}
              {activeWarnings.map((w, idx) => (
                <strong key={w.roomId}>
                  Phòng {w.roomNumber}
                  {idx < activeWarnings.length - 1 ? ", " : ""}
                </strong>
              ))}
              . Vui lòng kiểm tra mục **Phân tích & Cảnh báo** để xem chi tiết.
            </p>
          </div>
        </div>
      )}

      {activeTab === "record" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold mb-4 text-gray-800">Ghi nhận chỉ số mới</h2>
            {submitted && successMessage && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4 border border-green-100">
                {successMessage}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Phòng</label>
                <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800">
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber || r.room_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Loại</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800">
                  <option value="ELECTRIC">⚡ Điện</option>
                  <option value="WATER">💧 Nước</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Chỉ số cũ</label>
                <input type="number" value={oldIndex} onChange={(e) => setOldIndex(e.target.value)} placeholder="VD: 100" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Chỉ số mới</label>
                <input
                  type="number"
                  value={newIndex}
                  onChange={(e) => setNewIndex(e.target.value)}
                  placeholder="VD: 250"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white text-gray-800 transition ${
                    isInvalidIndex 
                      ? "border-red-500 focus:ring-red-500/20" 
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            {isInvalidIndex && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-100 flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                Chỉ số mới không được nhỏ hơn chỉ số cũ ({oldIndex}).
              </div>
            )}

            {usage > 0 && !isInvalidIndex && (
              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4 border border-blue-100">
                Tiêu thụ: <strong>{usage} {type === "ELECTRIC" ? "số điện" : "khối nước"}</strong>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={isInvalidIndex || !newIndex}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu chỉ số
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">📋 Lịch sử ghi nhận</h2>
              {usages.length > 0 && (
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <FileSpreadsheet size={16} />
                  <span>Xuất Excel</span>
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b">
                  <th className="text-left pb-2">Phòng</th>
                  <th className="text-left pb-2">Loại</th>
                  <th className="text-left pb-2">Tháng</th>
                  <th className="text-left pb-2">Chỉ số cũ</th>
                  <th className="text-left pb-2">Chỉ số mới</th>
                  <th className="text-left pb-2">Tiêu thụ</th>
                  <th className="text-right pb-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {usages.length > 0 ? (
                  usages.map((h) => (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-semibold text-gray-800">{h.room_number}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.type === "ELECTRIC" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                          {h.type === "ELECTRIC" ? "⚡ Điện" : "💧 Nước"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{h.billing_month}/{h.billing_year}</td>
                      <td className="py-3 text-gray-600">{h.old_index}</td>
                      <td className="py-3 text-gray-600">{h.new_index}</td>
                      <td className="py-3 font-medium text-blue-600">{(h.new_index - h.old_index)} {h.type === "ELECTRIC" ? "số" : "khối"}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(h)}
                            title="Sửa ghi nhận"
                            className="p-1 text-gray-500 hover:text-blue-600 transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            title="Xóa ghi nhận"
                            className="p-1 text-gray-500 hover:text-red-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      Chưa có lịch sử ghi nhận điện nước.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rooms List on Left */}
          <div className="bg-white rounded-xl shadow-sm p-5 h-[600px] overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              Danh sách phòng phân tích
            </h3>
            <div className="space-y-2">
              {analytics.map((item) => {
                const hasWarning = item.waterAnalytics.isAnomaly || item.electricAnalytics.isAnomaly;
                const isSelected = selectedAnalyticRoom?.roomId === item.roomId;
                return (
                  <button
                    key={item.roomId}
                    onClick={() => setSelectedAnalyticRoom(item)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/50 border-blue-200 shadow-xs"
                        : "bg-white hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-gray-800">Phòng {item.roomNumber}</span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.waterAnalytics.history.length} chỉ số gần nhất
                      </div>
                    </div>
                    {hasWarning && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Detail Analytics on Right */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 flex flex-col gap-6">
            {selectedAnalyticRoom ? (
              <>
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Phòng {selectedAnalyticRoom.roomNumber}</h3>
                    <p className="text-sm text-gray-500">Phân tích chi tiết điện nước tiêu thụ</p>
                  </div>
                </div>

                {/* Anomalies Warnings */}
                {(selectedAnalyticRoom.waterAnalytics.isAnomaly || selectedAnalyticRoom.electricAnalytics.isAnomaly) && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-700 font-semibold">
                      <ShieldAlert size={18} />
                      <span>CẢNH BÁO BẤT THƯỜNG KHẨN CẤP</span>
                    </div>
                    <div className="text-sm text-red-600 space-y-1.5 pl-7">
                      {selectedAnalyticRoom.waterAnalytics.isAnomaly && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-red-700 font-bold">💧 Nước:</span>
                          <span>{selectedAnalyticRoom.waterAnalytics.message}</span>
                        </div>
                      )}
                      {selectedAnalyticRoom.electricAnalytics.isAnomaly && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-red-700 font-bold">⚡ Điện:</span>
                          <span>{selectedAnalyticRoom.electricAnalytics.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Visual Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Water Chart */}
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-700 flex items-center gap-1">💧 Tiêu thụ Nước (m³)</span>
                      {selectedAnalyticRoom.waterAnalytics.isAnomaly && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          ⚠️ Cảnh báo
                        </span>
                      )}
                    </div>
                    {selectedAnalyticRoom.waterAnalytics.history.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 border-b border-l px-2 relative">
                          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-100"></div>
                          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100"></div>
                          
                          {selectedAnalyticRoom.waterAnalytics.history.map((h: any, idx: number) => {
                            const max = Math.max(...selectedAnalyticRoom.waterAnalytics.history.map((item: any) => item.consumption), 1);
                            const heightPct = (h.consumption / max) * 80;
                            const isLatest = idx === selectedAnalyticRoom.waterAnalytics.history.length - 1;
                            const isAnomaly = isLatest && selectedAnalyticRoom.waterAnalytics.isAnomaly;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                <div className="absolute -top-6 text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition z-10 bg-white border px-1 rounded shadow-xs">
                                  {h.consumption}m³
                                </div>
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full rounded-t-sm transition-all duration-500 ${
                                    isAnomaly
                                      ? "bg-red-500 shadow-sm"
                                      : "bg-blue-500/80 group-hover:bg-blue-500"
                                  }`}
                                ></div>
                                <span className="text-[9px] text-gray-400 mt-1">{h.month}/{String(h.year).slice(-2)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">Lịch sử tiêu thụ 6 tháng gần nhất</div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-10">Chưa có chỉ số lịch sử</p>
                    )}
                  </div>

                  {/* Electric Chart */}
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-700 flex items-center gap-1">⚡ Tiêu thụ Điện (kWh)</span>
                      {selectedAnalyticRoom.electricAnalytics.isAnomaly && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          ⚠️ Cảnh báo
                        </span>
                      )}
                    </div>
                    {selectedAnalyticRoom.electricAnalytics.history.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 border-b border-l px-2 relative">
                          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-100"></div>
                          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100"></div>
                          
                          {selectedAnalyticRoom.electricAnalytics.history.map((h: any, idx: number) => {
                            const max = Math.max(...selectedAnalyticRoom.electricAnalytics.history.map((item: any) => item.consumption), 1);
                            const heightPct = (h.consumption / max) * 80;
                            const isLatest = idx === selectedAnalyticRoom.electricAnalytics.history.length - 1;
                            const isAnomaly = isLatest && selectedAnalyticRoom.electricAnalytics.isAnomaly;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                <div className="absolute -top-6 text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition z-10 bg-white border px-1 rounded shadow-xs">
                                  {h.consumption}kWh
                                </div>
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full rounded-t-sm transition-all duration-500 ${
                                    isAnomaly
                                      ? "bg-red-500 shadow-sm"
                                      : "bg-yellow-500/80 group-hover:bg-yellow-500"
                                  }`}
                                ></div>
                                <span className="text-[9px] text-gray-400 mt-1">{h.month}/{String(h.year).slice(-2)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">Lịch sử tiêu thụ 6 tháng gần nhất</div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-10">Chưa có chỉ số lịch sử</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-400 py-20">
                <Activity size={48} className="stroke-1 mb-2" />
                <p>Chọn phòng để bắt đầu phân tích</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Utility Modal */}
      {showEditModal && editUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sửa chỉ số — Phòng {editUsage.room_number}</h3>
            <form onSubmit={handleUpdate}>
              {editError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4">{editError}</div>
              )}
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loại tiện ích</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                >
                  <option value="ELECTRIC">⚡ Điện</option>
                  <option value="WATER">💧 Nước</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chỉ số cũ</label>
                  <input
                    type="number"
                    value={editOldIndex}
                    onChange={(e) => setEditOldIndex(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chỉ số mới</label>
                  <input
                    type="number"
                    value={editNewIndex}
                    onChange={(e) => setEditNewIndex(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tháng</label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Năm</label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    required
                  />
                </div>
              </div>

              {Number(editNewIndex) >= Number(editOldIndex) && (
                <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg mb-4 border border-blue-100">
                  Tiêu thụ mới: <strong>{Number(editNewIndex) - Number(editOldIndex)} {editType === "ELECTRIC" ? "số" : "khối"}</strong>
                </div>
              )}

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
    </div>
  );
}