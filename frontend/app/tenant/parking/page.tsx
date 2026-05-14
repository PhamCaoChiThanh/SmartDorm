"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, FileText } from "lucide-react";

const vehicles = [
  { id: 1, plate: "59X1-12345", type: "Xe máy", status: "ACTIVE" },
];

export default function TenantParking() {
  const router = useRouter();
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("Xe máy");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!plate) return;
    setSubmitted(true);
    setPlate("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">← Quay lại</button>
        <h1 className="font-bold text-blue-600 flex items-center gap-1">
          <Car size={18} /> Đăng ký xe
        </h1>
        <button
          onClick={() => router.push("/tenant/parking-invoice")}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <FileText size={14} /> Xem hóa đơn
        </button>
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Form đăng ký */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Đăng ký phương tiện mới</h2>

          {submitted && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">
              ✅ Đăng ký thành công! Phí gửi xe sẽ được cộng vào hóa đơn tháng sau.
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Biển số xe *</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="VD: 59X1-12345"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Loại xe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Xe máy</option>
                <option>Xe đạp</option>
                <option>Ô tô</option>
              </select>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* Xe hiện tại */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Car size={16} className="text-gray-500" /> Xe đang đăng ký
          </h2>
          {vehicles.map((v) => (
            <div key={v.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{v.plate}</p>
                <p className="text-xs text-gray-400">{v.type}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                {v.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}