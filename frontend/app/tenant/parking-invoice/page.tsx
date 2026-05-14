"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const parkingInvoices = [
  {
    id: 1,
    plate: "59X1-12345",
    type: "Xe máy",
    ticketType: "MONTHLY",
    billingMonth: 5,
    billingYear: 2025,
    amount: 150000,
    status: "PENDING",
  },
  {
    id: 2,
    plate: "59X1-12345",
    type: "Xe máy",
    ticketType: "MONTHLY",
    billingMonth: 4,
    billingYear: 2025,
    amount: 150000,
    status: "PAID",
  },
];

export default function TenantParkingInvoice() {
  const router = useRouter();
  const [invoices, setInvoices] = useState(parkingInvoices);

  const handlePay = (id: number) => {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: "PAID" } : inv)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">
          ← Quay lại
        </button>
        <h1 className="font-bold text-blue-600">🅿️ Hóa đơn gửi xe</h1>
        <div />
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-semibold">Tháng {inv.billingMonth}/{inv.billingYear}</h2>
                <p className="text-sm text-gray-400">{inv.plate} · {inv.type}</p>
                <p className="text-xs text-gray-400">{inv.ticketType === "MONTHLY" ? "Vé tháng" : "Vé ngày"}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                inv.status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : inv.status === "OVERDUE"
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {inv.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-600 text-lg">
                {inv.amount.toLocaleString("vi-VN")}đ
              </span>
              {inv.status === "PENDING" && (
                <button
                  onClick={() => handlePay(inv.id)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  Thanh toán
                </button>
              )}
              {inv.status === "PAID" && (
                <span className="text-green-600 text-sm font-medium">✅ Đã thanh toán</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}