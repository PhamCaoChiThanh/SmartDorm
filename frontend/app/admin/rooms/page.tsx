"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle, FileSpreadsheet } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function AdminRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [utilities, setUtilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Room detail modal state
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [roomsRes, contractsRes, tenantsRes, utilitiesRes] = await Promise.all([
          fetchAPI("/rooms"),
          fetchAPI("/contracts"),
          fetchAPI("/tenants"),
          fetchAPI("/utilities")
        ]);

        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        if (contractsRes.success && Array.isArray(contractsRes.data)) {
          setContracts(contractsRes.data);
        }

        if (tenantsRes.success && Array.isArray(tenantsRes.data)) {
          setTenants(tenantsRes.data);
        }

        if (utilitiesRes.success && Array.isArray(utilitiesRes.data)) {
          setUtilities(utilitiesRes.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách phòng:", err);
        setError("Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Map backend rooms with occupancy data from contracts
  const mappedRooms = rooms.map((room) => {
    const activeContracts = contracts.filter(
      (c) => (c.roomId === room.id || c.room_id === room.id) && c.status === "ACTIVE"
    );
    const currentCount = activeContracts.length;
    const roomNumber = room.roomNumber || room.room_number || "P-?";
    
    // Parse floor from room number (e.g. P101 -> 1, P202 -> 2)
    const numericPart = roomNumber.replace(/\D/g, "");
    const floor = numericPart.length > 0 ? parseInt(numericPart.substring(0, 1)) : 1;

    // Map backend status to UI status
    // Status in DB: AVAILABLE, OCCUPIED, MAINTENANCE
    let mappedStatus = "AVAILABLE";
    if (room.status === "MAINTENANCE") {
      mappedStatus = "MAINTENANCE";
    } else if (currentCount >= room.capacity) {
      mappedStatus = "FULL";
    }

    return {
      id: room.id,
      number: roomNumber,
      floor: floor,
      capacity: room.capacity || 4,
      current: currentCount,
      price: room.basePrice || room.base_price || 0,
      status: mappedStatus, // FULL, AVAILABLE, MAINTENANCE
      rawRoom: room // Store raw room object for details
    };
  });

  const filtered = mappedRooms.filter((r) => {
    const matchFilter = filter === "ALL" || r.status === filter;
    const matchSearch = r.number.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleRoomClick = (room: any) => {
    const activeContractsForRoom = contracts.filter(
      (c) => (c.roomId === room.id || c.room_id === room.id) && c.status === "ACTIVE"
    );

    const roomOccupants = activeContractsForRoom.map((c) => {
      const tenantDetail = tenants.find(
        (t) => t.id === c.tenantId || t.id === c.tenant_id
      );
      return {
        id: c.id,
        name: c.tenant_name || tenantDetail?.fullName || "Sinh viên",
        phone: tenantDetail?.phone || "Chưa cập nhật",
        email: tenantDetail?.email || "Chưa cập nhật",
        cccd: tenantDetail?.cccd || "Chưa cập nhật",
        startDate: c.start_date || c.startDate,
        endDate: c.end_date || c.endDate
      };
    });

    setSelectedRoom({
      ...room,
      occupants: roomOccupants
    });
    setShowDetailModal(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const handleExportExcel = () => {
    const dataToExport: any[] = [];

    // Filter only rooms with occupants
    const roomsWithOccupants = filtered.filter((r) => r.current > 0);

    roomsWithOccupants.forEach((room) => {
      // Get active contracts for this room
      const activeContractsForRoom = contracts.filter(
        (c) => (c.roomId === room.id || c.room_id === room.id) && c.status === "ACTIVE"
      );

      // Get latest electric & water index
      const roomUtils = utilities.filter(
        (u) => u.roomId === room.id || u.room_id === room.id
      );

      const latestElectric = roomUtils
        .filter((u) => u.type === "ELECTRIC" || u.type === "electric")
        .sort((a, b) => (b.billing_year || b.billingYear) - (a.billing_year || a.billingYear) || (b.billing_month || b.billingMonth) - (a.billing_month || a.billingMonth))[0];

      const latestWater = roomUtils
        .filter((u) => u.type === "WATER" || u.type === "water")
        .sort((a, b) => (b.billing_year || b.billingYear) - (a.billing_year || a.billingYear) || (b.billing_month || b.billingMonth) - (a.billing_month || a.billingMonth))[0];

      const electricVal = latestElectric ? `${latestElectric.new_index || latestElectric.newIndex} (Tháng ${(latestElectric.billing_month || latestElectric.billingMonth)}/${(latestElectric.billing_year || latestElectric.billingYear)})` : "Chưa ghi nhận";
      const waterVal = latestWater ? `${latestWater.new_index || latestWater.newIndex} (Tháng ${(latestWater.billing_month || latestWater.billingMonth)}/${(latestWater.billing_year || latestWater.billingYear)})` : "Chưa ghi nhận";

      activeContractsForRoom.forEach((c) => {
        const tenantDetail = tenants.find(
          (t) => t.id === c.tenantId || t.id === c.tenant_id
        );

        dataToExport.push({
          roomNumber: room.number,
          floor: room.floor,
          price: room.price,
          tenantName: c.tenant_name || tenantDetail?.fullName || "Sinh viên",
          tenantPhone: tenantDetail?.phone || "Chưa cập nhật",
          tenantCccd: tenantDetail?.cccd || "Chưa cập nhật",
          tenantEmail: tenantDetail?.email || "Chưa cập nhật",
          contractPeriod: `${formatDate(c.start_date || c.startDate)} - ${formatDate(c.end_date || c.endDate)}`,
          electricIndex: electricVal,
          waterIndex: waterVal,
        });
      });
    });

    exportToCSV(
      dataToExport,
      "Bao_cao_tong_hop_phong_va_nguoi_thue",
      [
        "Số phòng",
        "Tầng",
        "Giá thuê/người/tháng",
        "Họ và tên người thuê",
        "Số điện thoại",
        "Số CCCD",
        "Email",
        "Thời hạn hợp đồng",
        "Chỉ số điện mới nhất",
        "Chỉ số nước mới nhất"
      ],
      [
        "roomNumber",
        "floor",
        "price",
        "tenantName",
        "tenantPhone",
        "tenantCccd",
        "tenantEmail",
        "contractPeriod",
        "electricIndex",
        "waterIndex"
      ]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách phòng...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏠 Quản lý phòng</h2>
          <p className="text-sm text-gray-500">{mappedRooms.length} phòng tổng cộng</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{mappedRooms.length}</div>
          <div className="text-sm text-gray-500">Tổng phòng</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">
            {mappedRooms.filter((r) => r.status === "AVAILABLE").length}
          </div>
          <div className="text-sm text-gray-500">Còn trống</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-500">
            {mappedRooms.filter((r) => r.status === "FULL").length}
          </div>
          <div className="text-sm text-gray-500">Đã đầy</div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm phòng..."
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
        />
        {["ALL", "AVAILABLE", "FULL", "MAINTENANCE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f === "ALL"
              ? "Tất cả"
              : f === "AVAILABLE"
              ? "Còn trống"
              : f === "FULL"
              ? "Đã đầy"
              : "Bảo trì"}
          </button>
        ))}
      </div>

      {/* Danh sách phòng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((room) => (
          <div
            key={room.id}
            onClick={() => handleRoomClick(room)}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer hover:border-blue-300 border border-transparent"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-950">{room.number}</h3>
                <p className="text-sm text-gray-400">Tầng {room.floor}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  room.status === "AVAILABLE"
                    ? "bg-green-100 text-green-700"
                    : room.status === "FULL"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {room.status === "AVAILABLE"
                  ? "Còn trống"
                  : room.status === "FULL"
                  ? "Đã đầy"
                  : "Đang bảo trì"}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Sức chứa</span>
                <span>
                  {room.current}/{room.capacity} người
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    room.current === room.capacity ? "bg-red-400" : "bg-blue-400"
                  }`}
                  style={{ width: `${(room.current / room.capacity) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-sm font-semibold text-blue-600">
              {room.price.toLocaleString("vi-VN")}đ / người / tháng
            </div>
          </div>
        ))}
      </div>

      {/* Room Details Modal */}
      {showDetailModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <span>🏠 Chi tiết phòng {selectedRoom.number}</span>
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Room Stats */}
              <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">Sức chứa hiện tại:</span>
                  <strong className="text-gray-800 text-base">{selectedRoom.current} / {selectedRoom.capacity} người</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Giá thuê:</span>
                  <strong className="text-blue-600 text-base">{selectedRoom.price.toLocaleString("vi-VN")}đ / người / tháng</strong>
                </div>
              </div>

              {/* Occupants Info */}
              <div>
                <h3 className="font-bold text-gray-950 text-sm mb-3 flex items-center gap-1.5 border-b pb-1.5">
                  👤 Danh sách người đang thuê ({selectedRoom.occupants.length})
                </h3>
                
                {selectedRoom.occupants.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRoom.occupants.map((occ: any, idx: number) => (
                      <div key={occ.id || idx} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-gray-900">{occ.name}</h4>
                          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">Đang hoạt động</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-gray-650">
                          <div>
                            <span className="text-gray-450 block">Số điện thoại:</span>
                            <span className="font-medium text-gray-800">{occ.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-450 block">Email:</span>
                            <span className="font-medium text-gray-800 truncate block">{occ.email}</span>
                          </div>
                          <div>
                            <span className="text-gray-450 block">Số CCCD:</span>
                            <span className="font-medium text-gray-800">{occ.cccd}</span>
                          </div>
                          <div>
                            <span className="text-gray-450 block">Thời hạn hợp đồng:</span>
                            <span className="font-medium text-gray-800">
                              {formatDate(occ.startDate)} - {formatDate(occ.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-250">
                    Phòng này hiện tại chưa có người thuê.
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-gray-150 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}