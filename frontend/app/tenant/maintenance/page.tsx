"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const history = [
  { id: 1, issue: "Điều hòa hỏng", date: "2025-05-09", status: "OPEN" },
  { id: 2, issue: "Đèn phòng tắt", date: "2025-04-20", status: "DONE" },
];

export default function TenantMaintenance() {
  const router = useRouter();
  const [issue, setIssue] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!issue) return;
    setSubmitted(true);
    setIssue("");
    setNote("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">← Quay lại</button>
        <h1 className="font-bold text-blue-600">🔧 Báo hỏng</h1>
        <div />
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Form báo hỏng */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Gửi yêu cầu sửa chữa</h2>

          {submitted && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">
              ✅ Đã gửi yêu cầu thành công! Ban quản lý sẽ xử lý sớm.
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Mô tả sự cố *</label>
              <input
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="VD: Điều hòa không mát, đèn hỏng..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ghi chú thêm</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mô tả chi tiết hơn nếu cần..."
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Gửi yêu cầu
            </button>
          </div>
        </div>

        {/* Lịch sử */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">📋 Lịch sử báo hỏng</h2>
          {history.map((h) => (
            <div key={h.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{h.issue}</p>
                <p className="text-xs text-gray-400">{h.date}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                h.status === "OPEN"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-700"
              }`}>
                {h.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}