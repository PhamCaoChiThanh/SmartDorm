"use client";

import { useState } from "react";

const history = [
  { id: 1, issue: "Điều hòa hỏng", date: "2025-05-09", status: "OPEN" },
  { id: 2, issue: "Đèn phòng tắt", date: "2025-04-20", status: "DONE" },
];

export default function OwnerMaintenance() {
  const [issue, setIssue] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!issue) return;
    setSubmitted(true);
    setIssue("");
    setNote("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Báo hỏng</p>
        <h1 className="text-xl font-bold mt-0.5" style={{ color: "#7C3AED" }}>🔧 Báo hỏng</h1>
      </div>

      <div className="p-8 max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Gửi yêu cầu sửa chữa</h2>
          {submitted && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl mb-4">✅ Đã gửi yêu cầu thành công!</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700">Mô tả sự cố *</label>
              <input value={issue} onChange={(e) => setIssue(e.target.value)}
                placeholder="VD: Điều hòa không mát, đèn hỏng..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-700" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700">Ghi chú thêm</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                rows={3} placeholder="Mô tả chi tiết hơn nếu cần..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-700 resize-none" />
            </div>
            <button onClick={handleSubmit}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
              Gửi yêu cầu
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">📋 Lịch sử báo hỏng</h2>
          {history.map((h) => (
            <div key={h.id} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{h.issue}</p>
                <p className="text-xs text-gray-400 mt-0.5">{h.date}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                h.status === "OPEN" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
              }`}>{h.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}