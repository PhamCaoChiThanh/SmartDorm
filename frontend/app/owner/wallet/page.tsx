"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OwnerWallet() {
  const router = useRouter();
  const [showRules, setShowRules] = useState(false);

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Ví điểm</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">Ví điểm</h1>
      </div>

      <div className="p-8 space-y-6">
        {/* Banner số dư */}
        <div className="rounded-2xl p-10 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 60%, #F97316 100%)" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-6xl">💰</div>
            <div className="absolute bottom-4 right-8 text-6xl">⭐</div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 text-white/80 mb-3">
              <span>💳</span>
              <span className="text-sm font-medium">Số dư điểm</span>
            </div>
            <div className="text-7xl font-bold text-white mb-2">0</div>
            <div className="text-white/70 text-sm mb-6">Điểm</div>
            <button onClick={() => router.push("/owner/topup")}
              className="bg-white/20 backdrop-blur border border-white/30 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/30 transition">
              + Nạp điểm ngay
            </button>
          </div>
        </div>

        {/* 3 Card hành động */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "🕐", label: "Lịch sử giao dịch", action: "Xem chi tiết", color: "#F97316", path: "/owner/transactions" },
            { icon: "🎁", label: "Nạp điểm", action: "Chọn gói", color: "#22C55E", path: "/owner/topup" },
            { icon: "ℹ️", label: "Quy định", action: "Xem quy định", color: "#7C3AED", action2: true },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="font-medium text-gray-700 mb-3">{item.label}</div>
              <button
                onClick={() => item.action2 ? setShowRules(true) : router.push(item.path!)}
                className="text-sm font-medium px-4 py-2 rounded-xl border-2 transition hover:opacity-80"
                style={{ borderColor: item.color, color: item.color }}
              >
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* Giao dịch gần đây */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Giao dịch gần đây</h3>
            <button onClick={() => router.push("/owner/transactions")}
              className="text-sm font-medium px-4 py-2 rounded-xl border-2 transition"
              style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
              Xem tất cả
            </button>
          </div>
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💳</div>
            <p className="text-gray-400 text-sm">Chưa có giao dịch nào</p>
          </div>
        </div>
      </div>

      {/* Modal quy định */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">📋 Quy định sử dụng điểm</h3>
              <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                "1 điểm = 1.000 VNĐ",
                "Điểm không được quy đổi thành tiền mặt",
                "Điểm có hiệu lực trong 365 ngày kể từ ngày nạp",
                "Hệ thống ưu tiên trừ điểm gần hết hạn trước",
                "Điểm chỉ dùng để thanh toán dịch vụ SmartDorm",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowRules(false)}
              className="w-full mt-5 py-3 rounded-xl text-white font-medium"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}