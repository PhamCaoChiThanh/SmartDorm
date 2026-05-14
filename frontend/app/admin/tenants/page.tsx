"use client";

import { useState } from "react";

const initialTenants = [
  { id: 1, fullName: "Nguyễn Văn A", cccd: "079123456789", phone: "0901234567", email: "a@gmail.com", room: "P101" },
  { id: 2, fullName: "Trần Thị B", cccd: "079987654321", phone: "0912345678", email: "b@gmail.com", room: "P102" },
  { id: 3, fullName: "Lê Văn C", cccd: "079111222333", phone: "0923456789", email: "c@gmail.com", room: "P201" },
];

export default function AdminTenants() {
  const [search, setSearch] = useState("");

  const filtered = initialTenants.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.room.toLowerCase().includes(search.toLowerCase()) ||
    t.phone.includes(search)
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">👥 Quản lý Tenant</h2>
          <p className="text-sm text-gray-500">{initialTenants.length} người thuê</p>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, phòng, số điện thoại..." className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-4" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Họ tên</th>
              <th className="text-left px-4 py-3">CCCD</th>
              <th className="text-left px-4 py-3">Số điện thoại</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phòng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.fullName}</td>
                <td className="px-4 py-3 text-gray-500">{t.cccd}</td>
                <td className="px-4 py-3">{t.phone}</td>
                <td className="px-4 py-3 text-gray-500">{t.email}</td>
                <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{t.room}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}