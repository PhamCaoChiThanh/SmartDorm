"use client";

import { useState } from "react";

const vehicles = [
  { id: 1, plate: "59X1-12345", type: "Xe máy", status: "ACTIVE" },
];

export default function OwnerParking() {
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("Xe máy");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!plate) return;
    setSubmitted(true);
    setPlate("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Đăng ký xe</p>
        <h1 className="text-xl font-bold mt-0.5" style={{ color: "#7C3AED" }}>🚗 Đăng ký xe</h1>
      </div>

      <div className="p-8 max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Đăng ký phương tiện mới</h2>
          {submitted && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl mb-4">✅ Đăng ký thành công!</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700">Biển số xe *</label>
              <input value={plate} onChange={(e) => setPlate(e.target.value)}
                placeholder="VD: 59X1-12345"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-700" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700">Loại xe</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-700">
                <option>Xe máy</option>
                <option>Xe đạp</option>
                <option>Ô tô</option>
              </select>
            </div>
            <button onClick={handleSubmit}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
              Đăng ký
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">🚘 Xe đang đăng ký</h2>
          {vehicles.map((v) => (
            <div key={v.id} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{v.plate}</p>
                <p className="text-xs text-gray-400 mt-0.5">{v.type}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">{v.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}