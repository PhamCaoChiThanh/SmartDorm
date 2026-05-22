"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const packages = [
  { id: 1, price: "20.000đ", points: 20, bonus: 0, popular: false },
  { id: 2, price: "50.000đ", points: 50, bonus: 5, popular: true },
  { id: 3, price: "100.000đ", points: 100, bonus: 10, popular: false },
  { id: 4, price: "200.000đ", points: 200, bonus: 30, popular: false },
];

export default function OwnerTopup() {
  const router = useRouter();
  const [selected, setSelected] = useState(2);

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Nạp điểm</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">Nạp điểm vào ví</h1>
      </div>

      <div className="p-8 max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelected(pkg.id)}
              className="relative bg-white rounded-2xl p-5 border-2 cursor-pointer transition hover:shadow-md"
              style={{ borderColor: selected === pkg.id ? "#7C3AED" : "#e5e7eb" }}
            >
              {pkg.popular && (
                <span className="absolute -top-2 left-4 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                  Phổ biến
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${selected === pkg.id ? "border-purple-600" : "border-gray-300"}`}>
                  {selected === pkg.id && <div className="w-3 h-3 rounded-full" style={{ background: "#7C3AED" }} />}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{pkg.price}</div>
                  <div className="text-sm text-gray-500">
                    {pkg.bonus > 0 ? (
                      <span>Tặng <span className="text-purple-600 font-medium">{pkg.bonus} điểm</span> — Tổng <span className="font-bold">{pkg.points + pkg.bonus} điểm</span></span>
                    ) : (
                      <span>{pkg.points} điểm</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full py-3.5 rounded-xl text-white font-medium text-sm mb-6"
          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
          Tiếp tục thanh toán →
        </button>

        <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
          <h4 className="font-semibold text-purple-800 mb-3">ℹ️ Thông tin nạp điểm</h4>
          <ul className="space-y-2 text-sm text-purple-700">
            {[
              "Điểm được nạp tự động sau khi thanh toán thành công",
              "Bạn sẽ nhận thông báo qua email và tài khoản",
              "Điểm có thể sử dụng ngay sau khi nạp",
              "Mọi thắc mắc liên hệ support@smartdorm.com",
            ].map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}