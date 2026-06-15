"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

export default function TenantContract() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const res = await fetchAPI("/tenants/me");
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.message || "Không thể tải thông tin hợp đồng.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải thông tin hợp đồng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
          <button onClick={() => router.back()} className="text-blue-600 text-sm">← Quay lại</button>
          <h1 className="font-bold text-blue-600">📄 Hợp đồng thuê phòng</h1>
          <div />
        </nav>
        <div className="p-8 text-center text-red-500 font-medium">{error}</div>
      </div>
    );
  }

  const room = profile?.room;
  const contract = profile?.contract;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">
          ← Quay lại
        </button>
        <h1 className="font-bold text-blue-600">📄 Hợp đồng thuê phòng</h1>
        <div />
      </nav>

      {contract ? (
        <div className="p-4 max-w-lg mx-auto space-y-4">
          {/* Trạng thái hợp đồng */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-lg">{contract.id}</h2>
                <p className="text-sm text-gray-400">Phòng {room?.roomNumber || "Chưa xếp phòng"}</p>
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
          {room && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold mb-3">💰 Chi tiết giá</h2>
              <div className="space-y-2">
                {[
                  { label: "Tiền phòng", value: `${(room.basePrice || 0).toLocaleString("vi-VN")}đ / người / tháng` },
                  { label: "Giá điện", value: `${(room.electricityPrice || 0).toLocaleString("vi-VN")}đ / số` },
                  { label: "Giá nước", value: `${(room.waterPrice || 0).toLocaleString("vi-VN")}đ / khối` },
                  { label: "Phí rác", value: `${(room.garbageFee || 0).toLocaleString("vi-VN")}đ / tháng` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiền cọc */}
          {contract.deposit ? (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold mb-3">🔒 Tiền cọc</h2>
              <div className="space-y-2">
                {[
                  { label: "Tổng tiền cọc", value: `${(contract.deposit.totalAmount || 0).toLocaleString("vi-VN")}đ` },
                  { label: "Số dư còn lại", value: `${(contract.deposit.remainingBalance || 0).toLocaleString("vi-VN")}đ` },
                  { label: "Trạng thái", value: contract.deposit.status || "HOLDING" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 text-center py-6 text-gray-400 text-sm">
              🔒 Chưa có thông tin tiền đặt cọc cho hợp đồng này.
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 font-medium">
          Bạn hiện tại chưa có hợp đồng thuê phòng nào hoạt động.
        </div>
      )}
    </div>
  );
}