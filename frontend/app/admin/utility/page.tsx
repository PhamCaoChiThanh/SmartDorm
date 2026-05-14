"use client";

import { useState } from "react";

const roomList = ["P101", "P102", "P201", "P202", "P301"];

const history = [
  { id: 1, room: "P101", type: "ELECTRIC", month: 4, year: 2025, oldIndex: 100, newIndex: 250 },
  { id: 2, room: "P101", type: "WATER", month: 4, year: 2025, oldIndex: 20, newIndex: 28 },
  { id: 3, room: "P102", type: "ELECTRIC", month: 4, year: 2025, oldIndex: 80, newIndex: 200 },
];

export default function AdminUtility() {
  const [room, setRoom] = useState("P101");
  const [type, setType] = useState("ELECTRIC");
  const [oldIndex, setOldIndex] = useState("");
  const [newIndex, setNewIndex] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const usage = newIndex && oldIndex ? Number(newIndex) - Number(oldIndex) : 0;

  const handleSubmit = () => {
    if (!oldIndex || !newIndex || Number(newIndex) <= Number(oldIndex)) return;
    setSubmitted(true);
    setOldIndex("");
    setNewIndex("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">⚡ Nhập chỉ số điện nước</h2>
        <p className="text-sm text-gray-500">Ghi nhận chỉ số hàng tháng</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">Ghi nhận chỉ số mới</h2>
          {submitted && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4">
              ✅ Đã lưu chỉ số thành công!
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Phòng</label>
              <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {roomList.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Loại</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ELECTRIC">⚡ Điện</option>
                <option value="WATER">💧 Nước</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Chỉ số cũ</label>
              <input type="number" value={oldIndex} onChange={(e) => setOldIndex(e.target.value)} placeholder="VD: 100" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Chỉ số mới</label>
              <input type="number" value={newIndex} onChange={(e) => setNewIndex(e.target.value)} placeholder="VD: 250" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {usage > 0 && (
            <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4">
              Tiêu thụ: <strong>{usage} {type === "ELECTRIC" ? "số điện" : "khối nước"}</strong>
            </div>
          )}
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Lưu chỉ số</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">📋 Lịch sử ghi nhận</h2>
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
              {history.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{h.room}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.type === "ELECTRIC" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                      {h.type === "ELECTRIC" ? "⚡ Điện" : "💧 Nước"}
                    </span>
                  </td>
                  <td className="py-2">{h.month}/{h.year}</td>
                  <td className="py-2">{h.oldIndex}</td>
                  <td className="py-2">{h.newIndex}</td>
                  <td className="py-2 font-medium text-blue-600">{h.newIndex - h.oldIndex} {h.type === "ELECTRIC" ? "số" : "khối"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}