"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle } from "lucide-react";

export default function AdminRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const roomsRes = await fetchAPI("/rooms");
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        const contractsRes = await fetchAPI("/contracts");
        if (contractsRes.success && Array.isArray(contractsRes.data)) {
          setContracts(contractsRes.data);
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
    };
  });

  const filtered = mappedRooms.filter((r) => {
    const matchFilter = filter === "ALL" || r.status === filter;
    const matchSearch = r.number.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

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
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
          <div key={room.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{room.number}</h3>
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
              {room.price.toLocaleString("vi-VN")}đ / tháng
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}