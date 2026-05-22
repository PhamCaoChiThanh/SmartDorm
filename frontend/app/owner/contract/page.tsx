"use client";

const contract = {
  id: "HD-2025-001", room: "P101", status: "ACTIVE",
  startDate: "2025-01-01", endDate: "2025-12-31",
  basePrice: 1500000, electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  deposit: { totalAmount: 3000000, remainingBalance: 3000000, status: "HOLDING" },
};

export default function OwnerContract() {
  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Hợp đồng thuê</p>
        <h1 className="text-xl font-bold mt-0.5" style={{ color: "#7C3AED" }}>📄 Hợp đồng thuê phòng</h1>
      </div>

      <div className="p-8 max-w-2xl space-y-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-bold text-lg text-gray-900">{contract.id}</h2>
              <p className="text-sm text-gray-400">Phòng {contract.room}</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">{contract.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ngày bắt đầu", value: contract.startDate },
              { label: "Ngày kết thúc", value: contract.endDate },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">💰 Chi tiết giá</h2>
          <div className="space-y-3">
            {[
              { label: "Tiền phòng", value: `${contract.basePrice.toLocaleString("vi-VN")}đ / tháng` },
              { label: "Giá điện", value: `${contract.electricityPrice.toLocaleString("vi-VN")}đ / số` },
              { label: "Giá nước", value: `${contract.waterPrice.toLocaleString("vi-VN")}đ / khối` },
              { label: "Phí rác", value: `${contract.garbageFee.toLocaleString("vi-VN")}đ / tháng` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">🔒 Tiền cọc</h2>
          <div className="space-y-3">
            {[
              { label: "Tổng tiền cọc", value: `${contract.deposit.totalAmount.toLocaleString("vi-VN")}đ` },
              { label: "Số dư còn lại", value: `${contract.deposit.remainingBalance.toLocaleString("vi-VN")}đ` },
              { label: "Trạng thái", value: contract.deposit.status },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}