"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { FileText, ChevronLeft, DollarSign, Lock } from "lucide-react";

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
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center items-center gap-4 transition-colors duration-300">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-400"></div>
        <p className="text-gray-500 dark:text-zinc-450 text-sm">Đang tải thông tin hợp đồng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
        <nav className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm px-4 py-4 flex justify-between items-center transition-colors duration-300">
          <button onClick={() => router.back()} className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1">
            <ChevronLeft size={16} /> Quay lại
          </button>
          <h1 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <FileText size={18} /> Hợp đồng thuê phòng
          </h1>
          <div className="w-16" />
        </nav>
        <div className="p-8 text-center text-red-500 dark:text-red-400 font-medium">{error}</div>
      </div>
    );
  }

  const room = profile?.room;
  const contract = profile?.contract;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-300">
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm px-4 py-4 flex justify-between items-center transition-colors duration-300">
        <button onClick={() => router.back()} className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1">
          <ChevronLeft size={16} /> Quay lại
        </button>
        <h1 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <FileText size={18} /> Hợp đồng thuê phòng
        </h1>
        <div className="w-16" />
      </nav>

      {contract ? (
        <div className="p-4 max-w-lg mx-auto space-y-4">
          {/* Trạng thái hợp đồng */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-zinc-50">{contract.id}</h2>
                <p className="text-sm text-gray-400 dark:text-zinc-500">Phòng {room?.roomNumber || "Chưa xếp phòng"}</p>
              </div>
              <span className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full font-medium">
                {contract.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Ngày bắt đầu</p>
                <p className="font-medium text-sm text-gray-800 dark:text-zinc-200">{contract.startDate}</p>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Ngày kết thúc</p>
                <p className="font-medium text-sm text-gray-800 dark:text-zinc-200">{contract.endDate}</p>
              </div>
            </div>
          </div>

          {/* Chi tiết giá */}
          {room && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
              <h2 className="font-semibold mb-3 text-gray-900 dark:text-zinc-50 flex items-center gap-2">
                <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
                Chi tiết giá
              </h2>
              <div className="space-y-2">
                {[
                  { label: "Tiền phòng", value: `${(room.basePrice || 0).toLocaleString("vi-VN")}đ / tháng` },
                  { label: "Giá điện", value: `${(room.electricityPrice || 0).toLocaleString("vi-VN")}đ / số` },
                  { label: "Giá nước", value: `${(room.waterPrice || 0).toLocaleString("vi-VN")}đ / khối` },
                  { label: "Phí rác", value: `${(room.garbageFee || 0).toLocaleString("vi-VN")}đ / tháng` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">{item.label}</span>
                    <span className="font-medium text-gray-800 dark:text-zinc-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiền cọc */}
          {contract.deposit ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
              <h2 className="font-semibold mb-3 text-gray-900 dark:text-zinc-50 flex items-center gap-2">
                <Lock size={18} className="text-blue-600 dark:text-blue-400" />
                Tiền cọc
              </h2>
              <div className="space-y-2">
                {[
                  { label: "Tổng tiền cọc", value: `${(contract.deposit.totalAmount || 0).toLocaleString("vi-VN")}đ` },
                  { label: "Số dư còn lại", value: `${(contract.deposit.remainingBalance || 0).toLocaleString("vi-VN")}đ` },
                  { label: "Trạng thái", value: contract.deposit.status || "HOLDING" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">{item.label}</span>
                    <span className="font-medium text-gray-800 dark:text-zinc-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 text-center py-6 text-gray-400 dark:text-zinc-500 text-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
              <Lock size={24} className="text-gray-300 dark:text-zinc-650" />
              <span>Chưa có thông tin tiền đặt cọc cho hợp đồng này.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 dark:text-zinc-400 font-medium">
          Bạn hiện tại chưa có hợp đồng thuê phòng nào hoạt động.
        </div>
      )}
    </div>
  );
}