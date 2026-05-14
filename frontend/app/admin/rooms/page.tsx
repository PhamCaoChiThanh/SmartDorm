"use client";

import { useState } from "react";

const initialRooms = [
  { id: 1, number: "P101", floor: 1, capacity: 4, current: 4, price: 1500000, status: "FULL" },
  { id: 2, number: "P102", floor: 1, capacity: 4, current: 2, price: 1500000, status: "AVAILABLE" },
  { id: 3, number: "P201", floor: 2, capacity: 2, current: 0, price: 2000000, status: "AVAILABLE" },
  { id: 4, number: "P202", floor: 2, capacity: 4, current: 4, price: 1500000, status: "FULL" },
  { id: 5, number: "P301", floor: 3, capacity: 2, current: 1, price: 2000000, status: "AVAILABLE" },
];

export default function AdminRooms() {
  const [rooms] = useState(initialRooms);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = rooms.filter((r) => {
    const matchFilter = filter === "ALL" || r.status === filter;
    const matchSearch = r.number.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏠 Quản lý phòng</h2>
          <p className="text-sm text-gray-500">{rooms.length} phòng tổng cộng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{rooms.length}</div>
          <div className="text-sm text-gray-500">Tổng phòng</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">
            {rooms.filter((r) => r.status === "AVAILABLE").length}
          </div>
          <div className="text-sm text-gray-500">Còn trống</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-500">
            {rooms.filter((r) => r.status === "FULL").length}
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
        {["ALL", "AVAILABLE", "FULL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f === "ALL" ? "Tất cả" : f === "AVAILABLE" ? "Còn trống" : "Đã đầy"}
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
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                room.status === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {room.status === "AVAILABLE" ? "Còn trống" : "Đã đầy"}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Sức chứa</span>
                <span>{room.current}/{room.capacity} người</span>
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