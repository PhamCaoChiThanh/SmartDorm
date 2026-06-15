"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
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
      const latest = usages.find((u: any) => u.roomId === selectedRoomId && u.type === type);
      if (latest) {
        setOldIndex(String(latest.new_index));
      } else {
        setOldIndex("0");
      }
    } else {
      setOldIndex("0");
    }
  }, [selectedRoomId, type, usages]);

  const usage = newIndex && oldIndex ? Number(newIndex) - Number(oldIndex) : 0;

  const handleSubmit = async () => {
    if (!selectedRoomId) {
      alert("Vui lòng chọn phòng có người đang thuê.");
      return;
    }
    if (!oldIndex || !newIndex || Number(newIndex) < Number(oldIndex)) {
      alert("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
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
        setOldIndex("");
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">⚡ Nhập chỉ số điện nước</h2>
        <p className="text-sm text-gray-500">Ghi nhận chỉ số hàng tháng</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

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
              <input type="number" value={newIndex} onChange={(e) => setNewIndex(e.target.value)} placeholder="VD: 250" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800" />
            </div>
          </div>
          {usage > 0 && (
            <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4 border border-blue-100">
              Tiêu thụ: <strong>{usage} {type === "ELECTRIC" ? "số điện" : "khối nước"}</strong>
            </div>
          )}
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Lưu chỉ số</button>
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