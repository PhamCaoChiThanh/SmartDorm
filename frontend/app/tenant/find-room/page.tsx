"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { 
  Search, SlidersHorizontal, BedDouble, Users, Sparkles, Check, AlertCircle, Clock, Info, ShieldCheck
} from "lucide-react";

interface RoomItem {
  id: string;
  roomNumber: string;
  capacity: number;
  currentOccupants: number;
  basePrice: number;
  electricityPrice: number;
  waterPrice: number;
  garbageFee: number;
  status: string;
}

export default function TenantFindRoom() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  
  // Modal states
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [moveInDate, setMoveInDate] = useState("");
  const [note, setNote] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/rooms");
      if (res.success && Array.isArray(res.data)) {
        setRooms(res.data);
      } else {
        setError(res.message || "Không thể tải danh sách phòng.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleOpenTransferModal = (room: RoomItem) => {
    setSelectedRoom(room);
    setMoveInDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setAgreedTerms(false);
    setModalError("");
    setSuccess(false);
    setShowModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedRoom) return;
    if (!moveInDate) {
      setModalError("Vui lòng nhập ngày dọn vào dự kiến.");
      return;
    }
    if (!agreedTerms) {
      setModalError("Bạn cần đọc và đồng ý với nội quy, điều khoản KTX.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const res = await fetchAPI("/requests", {
        method: "POST",
        body: JSON.stringify({
          roomId: selectedRoom.id,
          moveInDate: moveInDate,
          note: note,
        }),
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          router.push("/tenant/contract");
        }, 2000);
      } else {
        setModalError(res.message || "Gửi yêu cầu chuyển phòng thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredRooms = rooms.filter((r) => {
    if (r.status === "MAINTENANCE") return false;
    const availableSlots = r.capacity - r.currentOccupants;
    if (availableSlots <= 0) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (!r.roomNumber.toLowerCase().includes(q)) return false;
    }

    // Price filter
    if (priceFilter !== "all") {
      if (priceFilter === "low" && r.basePrice > 1500000) return false;
      if (priceFilter === "mid" && (r.basePrice <= 1500000 || r.basePrice > 2000000)) return false;
      if (priceFilter === "high" && r.basePrice <= 2000000) return false;
    }

    // Capacity filter
    if (capacityFilter !== "all") {
      if (r.capacity !== parseInt(capacityFilter)) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 dark:text-zinc-100">
      {/* Title */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={12} /> Yêu cầu đổi chỗ ở
        </span>
        <h1 className="text-3xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">Tìm & Chuyển phòng</h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
          Duyệt danh sách các phòng còn trống trong ký túc xá và gửi yêu cầu đổi phòng. Yêu cầu sẽ được Ban quản lý xem xét và duyệt dựa trên nội quy.
        </p>
      </div>

      {/* Info Alert Box */}
      <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-300">
        <Info size={20} className="shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold block mb-1">Quy định và Điều kiện Chuyển phòng:</span>
          <ul className="list-disc list-inside space-y-1">
            <li>Bạn phải hoàn thành tất cả các hóa đơn (Tiền phòng, dịch vụ, gửi xe...) hiện tại.</li>
            <li>Bạn phải sinh sống tại phòng hiện tại ít nhất <strong>30 ngày</strong> mới được phép yêu cầu đổi phòng.</li>
            <li>Chỉ được phép gửi tối đa <strong>1 yêu cầu chuyển phòng chờ duyệt</strong> tại một thời điểm.</li>
            <li>Khi Ban quản lý duyệt yêu cầu, cọc phòng cũ sẽ được tự động kết chuyển và hợp đồng phòng cũ chấm dứt.</li>
          </ul>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-xs mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Nhập số phòng cần tìm..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
          {/* Price selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="all">Tất cả mức giá</option>
              <option value="low">Dưới 1.5 tr/tháng</option>
              <option value="mid">1.5 tr - 2.0 tr/tháng</option>
              <option value="high">Trên 2.0 tr/tháng</option>
            </select>
          </div>

          {/* Capacity selector */}
          <select
            className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
          >
            <option value="all">Mọi loại sức chứa</option>
            <option value="1">Phòng đơn (1 người)</option>
            <option value="2">Phòng đôi (2 người)</option>
            <option value="4">Phòng 4 người</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Đang tải danh sách phòng...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl">{error}</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-2xl text-gray-500">Không tìm thấy phòng trống nào phù hợp điều kiện lọc.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const availableSlots = room.capacity - room.currentOccupants;
            return (
              <div
                key={room.id}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                      Phòng {room.roomNumber}
                    </span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">
                      Còn {availableSlots} chỗ
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5"><BedDouble size={14} /> Giá phòng cơ bản</span>
                      <span className="font-bold text-gray-800 dark:text-zinc-200">
                        {room.basePrice.toLocaleString("vi-VN")} đ/tháng
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5"><Users size={14} /> Sức chứa</span>
                      <span className="font-medium text-gray-700 dark:text-zinc-300">
                        {room.currentOccupants} / {room.capacity} thành viên
                      </span>
                    </div>

                    <div className="pt-2 border-t border-dashed border-gray-100 dark:border-zinc-800 text-[10px] text-gray-400 flex flex-wrap gap-2">
                      <span>⚡ Điện: {room.electricityPrice.toLocaleString("vi-VN")} đ</span>
                      <span>💧 Nước: {room.waterPrice.toLocaleString("vi-VN")} đ</span>
                      {room.garbageFee > 0 && <span>🗑️ Rác: {room.garbageFee.toLocaleString("vi-VN")} đ</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenTransferModal(room)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold text-xs transition cursor-pointer"
                >
                  Yêu cầu chuyển đến phòng này
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking / Transfer Modal */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-2">Đăng ký chuyển sang Phòng {selectedRoom.roomNumber}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
              Bạn đang gửi một yêu cầu thay đổi chỗ ở hiện tại để chuyển qua phòng trống này.
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex gap-2 items-center">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            {success ? (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
                  <Check size={24} />
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Gửi yêu cầu chuyển phòng thành công!</p>
                <p className="text-xs text-gray-400">Đang chuyển hướng về trang hợp đồng...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">Ngày dọn vào dự kiến</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">Lý do / Ghi chú cho Ban quản lý</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập lý do đổi phòng hoặc yêu cầu hỗ trợ khác..."
                    className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-[11px] text-gray-500 dark:text-zinc-400 space-y-1.5">
                  <span className="font-bold text-gray-700 dark:text-zinc-300 block mb-1">📜 Cam kết Quy chế Ký túc xá:</span>
                  <p>1. Tôi cam kết đã thanh toán hết các nghĩa vụ tài chính liên quan đến phòng cũ.</p>
                  <p>2. Tôi đồng ý tự phối hợp bàn giao thiết bị phòng cũ và dọn dẹp sạch sẽ trước khi bàn giao khóa.</p>
                  <p>3. Tôi hiểu rằng Ban quản lý có quyền từ chối nếu không đảm bảo điều kiện hoạt động.</p>
                </div>

                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  />
                  <span className="text-xs text-gray-600 dark:text-zinc-300">
                    Tôi đã đọc kỹ và đồng ý với các nội quy và quy định chuyển phòng nêu trên.
                  </span>
                </label>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-600 dark:text-zinc-300 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmTransfer}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    disabled={submitting}
                  >
                    {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
