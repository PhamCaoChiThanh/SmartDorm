"use client";

import { useRouter } from "next/navigation";

export default function OwnerTransactions() {
  const router = useRouter();

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">Pages / Lịch sử giao dịch</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">Lịch sử giao dịch điểm</h1>
        </div>
        <button onClick={() => router.push("/owner/wallet")}
          className="text-sm font-medium px-4 py-2 rounded-xl border-2 transition"
          style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
          ← Về ví điểm
        </button>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="font-bold text-gray-700 text-lg mb-2">Chưa có giao dịch nào</h3>
          <p className="text-gray-400 text-sm mb-6">Lịch sử giao dịch điểm của bạn sẽ hiển thị tại đây</p>
          <button onClick={() => router.push("/owner/topup")}
            className="px-6 py-3 rounded-xl text-white font-medium text-sm"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            + Nạp điểm ngay
          </button>
        </div>
      </div>
    </div>
  );
}