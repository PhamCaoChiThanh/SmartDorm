    "use client";

import { useRouter } from "next/navigation";

const contract = {
  id: "HD-2025-001",
  room: "P101",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  status: "ACTIVE",
  basePrice: 1500000,
  electricityPrice: 3500,
  waterPrice: 15000,
  garbageFee: 20000,
  deposit: {
    totalAmount: 3000000,
    remainingBalance: 3000000,
    status: "HOLDING",
  },
};

export default function TenantContract() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">
          ← Quay lại
        </button>
        <h1 className="font-bold text-blue-600">📄 Hợp đồng thuê phòng</h1>
        <div />
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Trạng thái hợp đồng */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-lg">{contract.id}</h2>
              <p className="text-sm text-gray-400">Phòng {contract.room}</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
              {contract.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Ngày bắt đầu</p>
              <p className="font-medium text-sm">{contract.startDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Ngày kết thúc</p>
              <p className="font-medium text-sm">{contract.endDate}</p>
            </div>
          </div>
        </div>

        {/* Chi tiết giá */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">💰 Chi tiết giá</h2>
          <div className="space-y-2">
            {[
              { label: "Tiền phòng", value: `${contract.basePrice.toLocaleString("vi-VN")}đ / tháng` },
              { label: "Giá điện", value: `${contract.electricityPrice.toLocaleString("vi-VN")}đ / số` },
              { label: "Giá nước", value: `${contract.waterPrice.toLocaleString("vi-VN")}đ / khối` },
              { label: "Phí rác", value: `${contract.garbageFee.toLocaleString("vi-VN")}đ / tháng` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tiền cọc */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">🔒 Tiền cọc</h2>
          <div className="space-y-2">
            {[
              { label: "Tổng tiền cọc", value: `${contract.deposit.totalAmount.toLocaleString("vi-VN")}đ` },
              { label: "Số dư còn lại", value: `${contract.deposit.remainingBalance.toLocaleString("vi-VN")}đ` },
              { label: "Trạng thái", value: contract.deposit.status },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}