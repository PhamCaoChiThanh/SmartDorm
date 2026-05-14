"use client";

import { useState } from "react";

const invoice = {
  month: "Tháng 5/2025",
  room: "P101",
  items: [
    { label: "Tiền phòng", amount: 1500000 },
    { label: "Tiền điện (150 số)", amount: 225000 },
    { label: "Tiền nước (8 khối)", amount: 56000 },
    { label: "Phí khác", amount: 20000 },
  ],
  status: "PENDING",
  dueDate: "2025-05-20",
};

const notifications = [
  { id: 1, message: "Hóa đơn tháng 5 đã được tạo", time: "2 giờ trước", read: false },
  { id: 2, message: "Yêu cầu thuê phòng P101 đã được duyệt", time: "2 ngày trước", read: true },
];

export default function TenantInvoice() {
  const [paid, setPaid] = useState(false);
  const total = invoice.items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Thông báo */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-3">🔔 Thông báo</h2>
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`py-2 border-b last:border-0 flex justify-between items-start ${
              !n.read ? "font-medium" : "text-gray-400"
            }`}
          >
            <span className="text-sm">{n.message}</span>
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{n.time}</span>
          </div>
        ))}
      </div>

      {/* Hóa đơn */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">📄 {invoice.month}</h2>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            {paid ? "ĐÃ THANH TOÁN" : "PENDING"}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">Phòng: {invoice.room} · Hạn: {invoice.dueDate}</p>

        <div className="space-y-2 mb-4">
          {invoice.items.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span>{item.amount.toLocaleString("vi-VN")}đ</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {!paid ? (
          <button
            onClick={() => setPaid(true)}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            💳 Thanh toán ngay
          </button>
        ) : (
          <div className="text-center text-green-600 font-medium py-2">
            ✅ Đã thanh toán thành công!
          </div>
        )}
      </div>
    </div>
  );
}