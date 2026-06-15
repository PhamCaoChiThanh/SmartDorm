"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle } from "lucide-react";

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

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const roomsRes = await fetchAPI("/rooms");
      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
        if (roomsRes.data.length > 0) {
          setSelectedRoomId(roomsRes.data[0].id);
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

  const usage = newIndex && oldIndex ? Number(newIndex) - Number(oldIndex) : 0;

  const handleSubmit = async () => {
    if (!selectedRoomId || !oldIndex || !newIndex || Number(newIndex) < Number(oldIndex)) {
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
          <h2 className="font-semibold mb-4 text-gray-800">📋 Lịch sử ghi nhận</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b">
                <th className="text-left pb-2">Phòng</th>
                <th className="text-left pb-2">Loại</th>
                <th className="text-left pb-2">Tháng</th>
                <th className="text-left pb-2">Chỉ số cũ</th>
                <th className="text-left pb-2">Chỉ số mới</th>
                <th className="text-left pb-2">Tiêu thụ</th>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Chưa có lịch sử ghi nhận điện nước.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}