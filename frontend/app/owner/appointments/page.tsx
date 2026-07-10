"use client";

import { useState, useEffect } from "react";

type Appointment = {
  id: number;
  roomId: number;
  roomName: string;
  ownerEmail: string;
  name: string;
  phone: string;
  people: string;
  vehicles: string;
  visitDate: string;
  moveDate: string;
  note: string;
  status: string;
  createdAt: string;
};

export default function OwnerAppointments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [roomFilter, setRoomFilter] = useState("Tất cả tin đăng");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("currentEmail") || "";
    setCurrentEmail(email);

    const all: Appointment[] = JSON.parse(localStorage.getItem("ownerAppointments") || "[]");

    // Chỉ lấy lịch của phòng do owner này đăng
    const mine = all.filter((a) => a.ownerEmail === email);
    setAppointments(mine);
  }, []);

  const updateStatus = (id: number, newStatus: string) => {
    // Cập nhật state local
    const updatedMine = appointments.map((a) =>
      a.id === id ? { ...a, status: newStatus } : a
    );
    setAppointments(updatedMine);

    // Cập nhật toàn bộ danh sách trong localStorage
    const all: Appointment[] = JSON.parse(localStorage.getItem("ownerAppointments") || "[]");
    const updatedAll = all.map((a) => a.id === id ? { ...a, status: newStatus } : a);
    localStorage.setItem("ownerAppointments", JSON.stringify(updatedAll));
  };

  const deleteAppointment = (id: number) => {
    const updatedMine = appointments.filter((a) => a.id !== id);
    setAppointments(updatedMine);

    const all: Appointment[] = JSON.parse(localStorage.getItem("ownerAppointments") || "[]");
    const updatedAll = all.filter((a) => a.id !== id);
    localStorage.setItem("ownerAppointments", JSON.stringify(updatedAll));
  };

  const roomNames = ["Tất cả tin đăng", ...Array.from(new Set(appointments.map((a) => a.roomName)))];

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search);
    const matchStatus =
      statusFilter === "Tất cả trạng thái" || a.status === statusFilter;
    const matchRoom =
      roomFilter === "Tất cả tin đăng" || a.roomName === roomFilter;
    return matchSearch && matchStatus && matchRoom;
  });

  const statusColor: Record<string, string> = {
    "Chờ xác nhận": "bg-amber-100 text-amber-700",
    "Đã xác nhận": "bg-green-100 text-green-700",
    "Đã huỷ": "bg-red-100 text-red-600",
  };

  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Lịch xem phòng</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">📅 Lịch xem phòng</h1>
      </div>

      <div className="p-8">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khách / SĐT..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-gray-600"
            >
              <option>Tất cả trạng thái</option>
              <option>Chờ xác nhận</option>
              <option>Đã xác nhận</option>
              <option>Đã huỷ</option>
            </select>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-gray-600"
            >
              {roomNames.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button
              className="px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
            >
              Lọc
            </button>
            <button
              onClick={() => { setSearch(""); setStatusFilter("Tất cả trạng thái"); setRoomFilter("Tất cả tin đăng"); }}
              className="px-4 py-2.5 rounded-xl text-gray-600 text-sm border border-gray-200 hover:bg-gray-50"
            >
              Xoá lọc
            </button>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-bold text-gray-700 text-lg mb-2">Chưa có lịch xem phòng</h3>
            <p className="text-gray-400 text-sm">Khi có khách đặt lịch qua tin đăng, thông tin sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{a.name}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[a.status] || "bg-gray-100 text-gray-600"}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">📞 {a.phone}</p>
                    <p className="text-sm text-gray-500">🏠 {a.roomName}</p>
                    <p className="text-sm text-gray-500">📅 Ngày xem: <span className="font-medium text-gray-700">{a.visitDate}</span></p>
                    {a.moveDate && (
                      <p className="text-sm text-gray-500">🚚 Dự kiến vào: <span className="font-medium text-gray-700">{a.moveDate}</span></p>
                    )}
                    <p className="text-sm text-gray-500">👥 {a.people} người · 🛵 {a.vehicles} xe</p>
                    {a.note && <p className="text-sm text-gray-400 italic">"{a.note}"</p>}
                  </div>

                  {/* Actions — chỉ owner của phòng đó mới thấy */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {a.status === "Chờ xác nhận" && (
                      <>
                        <button
                          onClick={() => updateStatus(a.id, "Đã xác nhận")}
                          className="px-4 py-2 rounded-xl text-white text-xs font-medium"
                          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
                        >
                          ✓ Xác nhận
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, "Đã huỷ")}
                          className="px-4 py-2 rounded-xl text-red-600 text-xs font-medium border border-red-200 hover:bg-red-50"
                        >
                          ✕ Huỷ lịch
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteAppointment(a.id)}
                      className="px-4 py-2 rounded-xl text-gray-400 text-xs border border-gray-200 hover:bg-gray-50"
                    >
                      🗑 Xoá
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}