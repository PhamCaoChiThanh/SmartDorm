"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import {
  Home, MapPin, Users, Camera, Wifi, Wind, ShieldCheck,
  WashingMachine, Fingerprint, CalendarDays, Phone, Mail,
  User, X, CheckCircle, Lightbulb, ChevronRight, Tv,
} from "lucide-react";

const amenityIconMap: Record<string, React.ReactNode> = {
  "Camera 24/7": <Camera size={14} />,
  "Wifi tốc độ cao": <Wifi size={14} />,
  "Wifi cao cấp": <Wifi size={14} />,
  "Wifi": <Wifi size={14} />,
  "Máy lạnh": <Wind size={14} />,
  "Nhà vệ sinh riêng": <ShieldCheck size={14} />,
  "WC riêng": <ShieldCheck size={14} />,
  "Máy giặt chung": <WashingMachine size={14} />,
  "Máy giặt": <WashingMachine size={14} />,
  "Khóa vân tay": <Fingerprint size={14} />,
};

function AmenityIcon({ label }: { label: string }) {
  const key = Object.keys(amenityIconMap).find((k) => label.includes(k));
  return <span className="text-purple-500">{key ? amenityIconMap[key] : <Tv size={14} />}</span>;
}

// ── RoomData type ─────────────────────────────────────────────────────────────
type RoomData = {
  id: number | string;
  name: string;
  area: string;
  price: number;
  capacity: number;
  available: number;
  images: string[];
  amenities: string[];
  description: string;
  manager: string;
  phone: string;
  email: string;
  status?: string;
  category?: string;
  ownerEmail?: string;
};

// ── dữ liệu tĩnh giữ nguyên ──────────────────────────────────────────────────
const staticRoomsData: RoomData[] = [
  { id: 1, name: "Phòng KTX A1", area: "Khu A - Tầng 1", price: 1500000, capacity: 4, available: 2,
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=500&fit=crop",
    ],
    amenities: ["Camera 24/7", "Wifi tốc độ cao", "Máy lạnh", "Nhà vệ sinh riêng", "Máy giặt chung", "Khóa vân tay"],
    description: "Phòng KTX Khu A thoáng mát, sạch sẽ, đầy đủ tiện nghi. Phù hợp cho sinh viên năm nhất và năm hai. Gần khu học tập và căng tin.",
    manager: "Nguyễn Văn Quản", phone: "0901234567", email: "manager@smartdorm.com",
  },
  { id: 2, name: "Phòng KTX B3", area: "Khu B - Tầng 3", price: 1800000, capacity: 2, available: 1,
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop",
    ],
    amenities: ["Camera 24/7", "Wifi tốc độ cao", "Máy lạnh", "Khóa vân tay"],
    description: "Phòng 2 người yên tĩnh, view đẹp tầng 3. Thích hợp cho sinh viên cần không gian học tập riêng tư.",
    manager: "Trần Thị Quản", phone: "0912345678", email: "manager2@smartdorm.com",
  },
  { id: 3, name: "Phòng KTX C2", area: "Khu C - Tầng 2", price: 2000000, capacity: 2, available: 0,
    images: ["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi tốc độ cao", "Máy lạnh"],
    description: "Phòng cao cấp khu C, đã đầy chỗ.",
    manager: "Lê Văn Quản", phone: "0923456789", email: "manager3@smartdorm.com",
  },
  { id: 4, name: "Phòng KTX A3", area: "Khu A - Tầng 3", price: 1500000, capacity: 4, available: 3,
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi", "Máy lạnh", "Máy giặt"],
    description: "Phòng rộng rãi 4 người, còn 3 chỗ trống.",
    manager: "Nguyễn Văn Quản", phone: "0901234567", email: "manager@smartdorm.com",
  },
  { id: 5, name: "Phòng KTX B1", area: "Khu B - Tầng 1", price: 1800000, capacity: 2, available: 2,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi", "Máy lạnh", "Khóa vân tay"],
    description: "Phòng 2 người tầng 1, tiện di chuyển.",
    manager: "Trần Thị Quản", phone: "0912345678", email: "manager2@smartdorm.com",
  },
  { id: 6, name: "Phòng KTX D2", area: "Khu D - Tầng 2", price: 2200000, capacity: 1, available: 1,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi cao cấp", "Máy lạnh", "Khóa vân tay", "WC riêng"],
    description: "Phòng 1 người cao cấp, riêng tư tuyệt đối.",
    manager: "Lê Văn Quản", phone: "0923456789", email: "manager3@smartdorm.com",
  },
];

// ── helper: chuẩn hóa owner listing → RoomData ───────────────────────────────
function normalizeOwnerListing(l: any): RoomData {
  return {
    id: l.id,
    name: l.name,
    area: l.area || "",
    price: l.price || 0,
    capacity: l.capacity || 1,
    available: l.available ?? 1,
    images: l.image ? [l.image] : ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop"],
    amenities: l.amenities || [],
    description: l.description || "",
    manager: l.manager || "Ban quản lý",
    phone: l.phone || "",
    email: l.email || "",
    status: l.status,
    category: l.category,
    ownerEmail: l.ownerEmail || "",
  };
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition";

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params.id as string;

  const [room, setRoom] = useState<RoomData | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = useState({ name: "", phone: "", people: "1", vehicles: "0", visitDate: "", moveDate: "", note: "" });
  const [registerForm, setRegisterForm] = useState({ people: "1", cccd: "", moveDate: "", vehicle: "", note: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // 1. Tìm trong dữ liệu tĩnh trước
    const staticMatch = staticRoomsData.find((r) => String(r.id) === rawId);
    if (staticMatch) {
      setRoom(staticMatch);
    } else {
      // 2. Không có → tìm trong ownerListings từ localStorage
      try {
        const ownerListings: any[] = JSON.parse(localStorage.getItem("ownerListings") || "[]");
        const ownerMatch = ownerListings.find((l) => String(l.id) === rawId);
        if (ownerMatch) {
          setRoom(normalizeOwnerListing(ownerMatch));
          return;
        }
      } catch {
        // localStorage không khả dụng hoặc JSON lỗi — bỏ qua
      }

      // 3. Không có nữa → Gọi API của backend
      const fetchRoomFromBackend = async () => {
        try {
          const response = await fetchAPI(`/rooms/${rawId}`);
          if (response.success && response.data) {
            const r = response.data;
            const mappedRoom: RoomData = {
              id: r.id,
              name: `Phòng KTX ${r.roomNumber || r.room_number || ""}`,
              area: `Khu KTX - Phòng ${r.roomNumber || r.room_number || ""}`,
              price: r.basePrice || r.base_price || 1500000,
              capacity: r.capacity || 4,
              available: r.status === "AVAILABLE" || r.status === "TRỐNG" ? (r.capacity || 4) : 0,
              images: r.image ? [r.image] : [
                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop"
              ],
              amenities: r.amenities || ["Camera 24/7", "Wifi", "Máy lạnh", "Máy giặt"],
              description: r.description || `Phòng KTX số ${r.roomNumber || r.room_number || ""} rộng rãi, đầy đủ tiện nghi, an ninh đảm bảo.`,
              manager: r.manager || "Ban quản lý KTX",
              phone: r.phone || "0901234567",
              email: r.email || "manager@smartdorm.com",
              status: r.status,
            };
            setRoom(mappedRoom);
          }
        } catch (err) {
          console.error("Failed to fetch room details from API", err);
        }
      };

      fetchRoomFromBackend();
    }

    const name = localStorage.getItem("currentName");
    if (name) setCurrentName(name);
    const role = localStorage.getItem("currentRole");
    if (role) {
      setCurrentRole(role);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    if (searchParams.get("action") === "register" && role) {
      setShowRegisterModal(true);
    }
  }, [rawId]);
  
  useEffect(() => {
    async function loadTenantProfile() {
      if (isLoggedIn && currentRole === "TENANT") {
        try {
          const [profileRes, vehiclesRes] = await Promise.all([
            fetchAPI("/tenants/me"),
            fetchAPI("/vehicles"),
          ]);
          if (profileRes.success && profileRes.data) {
            setRegisterForm((prev) => ({
              ...prev,
              cccd: profileRes.data.cccd || "",
            }));
            setScheduleForm((prev) => ({
              ...prev,
              name: profileRes.data.fullName || prev.name,
              phone: profileRes.data.phone || prev.phone,
            }));
          }
          if (vehiclesRes.success && Array.isArray(vehiclesRes.data) && vehiclesRes.data.length > 0) {
            const firstPlate = vehiclesRes.data[0].license_plate || "";
            setRegisterForm((prev) => ({ ...prev, vehicle: firstPlate }));
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin người thuê để điền tự động:", err);
        }
      }
    }
    loadTenantProfile();
  }, [isLoggedIn, currentRole]);

  if (!room) return <div className="p-8 text-center text-gray-500">Không tìm thấy phòng!</div>;

  const handleScheduleSubmit = () => {
    if (!scheduleForm.name || !scheduleForm.phone || !scheduleForm.visitDate) return;

    // Lưu lịch vào localStorage
    const newAppointment = {
      id: Date.now(),
      roomId: room.id,
      roomName: room.name,
      name: scheduleForm.name,
      phone: scheduleForm.phone,
      people: scheduleForm.people,
      vehicles: scheduleForm.vehicles,
      visitDate: scheduleForm.visitDate,
      moveDate: scheduleForm.moveDate,
      note: scheduleForm.note,
      status: "Chờ xác nhận",
      createdAt: new Date().toISOString(),
      ownerEmail: room.ownerEmail || "",
    };
    const existing = JSON.parse(localStorage.getItem("ownerAppointments") || "[]");
    existing.push(newAppointment);
    localStorage.setItem("ownerAppointments", JSON.stringify(existing));

    setSubmitted(true);
    setTimeout(() => {
      setShowScheduleModal(false);
      setSubmitted(false);
      setScheduleForm({ name: "", phone: "", people: "1", vehicles: "0", visitDate: "", moveDate: "", note: "" });
    }, 1500);
  };

  const [registerError, setRegisterError] = useState("");

  const handleRegisterSubmit = async () => {
    if (!registerForm.cccd || !registerForm.moveDate) {
      setRegisterError("Vui lòng điền đầy đủ CCCD và ngày chuyển vào.");
      return;
    }
    setRegisterError("");
    try {
      const res = await fetchAPI("/requests", {
        method: "POST",
        body: JSON.stringify({
          roomId: room.id,
          moveInDate: registerForm.moveDate,
          note: registerForm.note || "",
        }),
      });
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setShowRegisterModal(false);
          setSubmitted(false);
          router.push("/tenant/contract");
        }, 2000);
      } else {
        setRegisterError(res.message || "Gửi yêu cầu thất bại.");
      }
    } catch (err: any) {
      setRegisterError(err.message || "Gửi yêu cầu thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push("/")} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 4px 24px rgba(124,58,237,0.35)" }}>
              <Home size={17} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight tracking-tight">SmartDorm</div>
              <div className="text-[10px] text-gray-400 leading-none">Ký túc xá thông minh</div>
            </div>
          </button>

          <div className="flex gap-3 items-center">
            {isLoggedIn ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                  <User size={13} className="text-purple-500" />
                  <span className="font-medium">{currentName || "Người dùng"}</span>
                </div>
                {(currentRole === "ADMIN" || currentRole === "MANAGER") && (
                  <button onClick={() => router.push("/admin/dashboard")}
                    className="text-sm text-white px-5 py-2 rounded-full font-semibold transition hover:opacity-90 shadow-md"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                    Quản lý
                  </button>
                )}
                {currentRole === "OWNER" && (
                  <button onClick={() => router.push("/owner/dashboard")}
                    className="text-sm text-white px-5 py-2 rounded-full font-semibold transition hover:opacity-90 shadow-md"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                    Quản lý
                  </button>
                )}
                <button onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  localStorage.removeItem("currentEmail");
                  localStorage.removeItem("currentName");
                  localStorage.removeItem("currentRole");
                  setCurrentName(null);
                  setCurrentRole(null);
                  setIsLoggedIn(false);
                  router.push("/");
                }} className="text-sm text-gray-400 hover:text-red-500 transition-colors font-medium ml-2">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/login")}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-full hover:bg-gray-100 transition">
                  Đăng nhập
                </button>
                <button onClick={() => router.push("/register")}
                  className="text-sm text-white px-5 py-2 rounded-full font-semibold transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-1 text-sm text-gray-400">
        <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => router.push("/")}>Trang chủ</span>
        <ChevronRight size={14} />
        <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => router.push("/")}>Danh sách phòng</span>
        <ChevronRight size={14} />
        <span className="text-gray-700 font-medium">{room.name}</span>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái */}
        <div className="lg:col-span-2 space-y-5">

          {/* Gallery */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative h-80">
              <img src={room.images[activeImage]} alt={room.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${room.available > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                  {room.available > 0 ? `Còn ${room.available} chỗ` : "Đã đầy"}
                </span>
              </div>
            </div>
            {room.images.length > 1 && (
              <div className="flex gap-2 p-3">
                {room.images.map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setActiveImage(i)}
                    className={`w-20 h-16 object-cover rounded-lg cursor-pointer border-2 transition ${activeImage === i ? "border-purple-500" : "border-transparent opacity-70 hover:opacity-100"}`} />
                ))}
              </div>
            )}
          </div>

          {/* Tiêu đề & giá */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-gray-400 mt-1 flex items-center gap-1 text-sm">
              <MapPin size={13} className="text-purple-400" /> {room.area} · Cập nhật hôm nay
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-3xl font-bold text-purple-600">{room.price.toLocaleString("vi-VN")}đ</span>
                <span className="text-gray-400 text-sm">/tháng</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${room.available > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {room.available > 0 ? "Còn trống" : "Đã đầy"}
              </span>
            </div>
          </div>

          {/* Thông tin phòng */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-4">Thông tin phòng</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Loại phòng", value: room.category || "KTX" },
                { label: "Khu vực", value: room.area.split("-")[0].trim() || room.area },
                { label: "Sức chứa", value: `${room.capacity} người` },
              ].map((info) => (
                <div key={info.label} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <div className="font-semibold text-gray-800">{info.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{info.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mô tả + Tiện ích */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-3">Mô tả</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {room.description || "Chưa có mô tả chi tiết."}
            </p>
            {room.amenities.length > 0 && (
              <>
                <h2 className="font-bold text-lg mt-6 mb-3">Tiện ích</h2>
                <div className="grid grid-cols-2 gap-2">
                  {room.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <AmenityIcon label={a} />
                      {a}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Vị trí */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-3">Vị trí</h2>
            <div className="bg-gray-50 rounded-xl h-48 flex items-center justify-center border border-gray-100">
              <div className="text-center">
                <MapPin size={36} className="text-purple-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">{room.area}</p>
                <button className="mt-3 text-purple-600 text-sm hover:underline flex items-center gap-1 mx-auto">
                  Mở Google Maps <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải — Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-lg">Thông tin quản lý</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                <User size={20} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">{room.manager}</div>
                <div className="text-xs text-gray-400">Quản lý phòng</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {showPhone ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                  <Phone size={14} /> {room.phone || "Chưa cập nhật"}
                </div>
              ) : (
                <button
                  onClick={() => { if (!isLoggedIn) router.push("/login"); else setShowPhone(true); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border-2 transition hover:bg-purple-50"
                  style={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                >
                  {isLoggedIn ? "Hiện số điện thoại" : "Đăng nhập để xem số"}
                </button>
              )}
              {room.email && (
                <div className="text-gray-400 text-xs flex items-center gap-1.5 px-1">
                  <Mail size={12} /> {room.email}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-3 rounded-xl font-medium text-sm border-2 transition hover:bg-purple-50 flex items-center justify-center gap-2"
                style={{ borderColor: "#7C3AED", color: "#7C3AED" }}
              >
                <CalendarDays size={15} /> Đặt lịch xem phòng
              </button>
              <button
                onClick={() => { if (!isLoggedIn) router.push("/login"); else setShowRegisterModal(true); }}
                disabled={room.available === 0}
                className="w-full text-white py-3 rounded-xl font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
              >
                <Home size={15} /> {room.available === 0 ? "Phòng đã đầy" : "Đăng ký thuê ngay"}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
              <Lightbulb size={13} className="mt-0.5 shrink-0" />
              Đăng nhập để xem số điện thoại và đăng ký thuê phòng
            </div>
          </div>
        </div>
      </div>

      {/* Modal Đặt lịch */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CalendarDays size={18} className="text-purple-500" /> Đặt lịch xem phòng
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-green-600">Đặt lịch thành công!</p>
                <p className="text-sm text-gray-400 mt-1">Quản lý sẽ liên hệ bạn sớm</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Họ tên *", key: "name", placeholder: "Nguyễn Văn A", type: "text" },
                  { label: "Số điện thoại *", key: "phone", placeholder: "0901234567", type: "tel" },
                  { label: "Ngày xem phòng *", key: "visitDate", placeholder: "", type: "date" },
                  { label: "Ngày dự kiến chuyển vào", key: "moveDate", placeholder: "", type: "date" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-sm font-medium mb-1 block text-gray-700">{field.label}</label>
                    <input type={field.type} value={(scheduleForm as any)[field.key]}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder} className={inputCls} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Số người", key: "people" }, { label: "Số xe", key: "vehicles" }].map((f) => (
                    <div key={f.key}>
                      <label className="text-sm font-medium mb-1 block text-gray-700">{f.label}</label>
                      <select value={(scheduleForm as any)[f.key]}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, [f.key]: e.target.value })}
                        className={inputCls}>
                        {["0","1","2","3","4"].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Ghi chú</label>
                  <textarea value={scheduleForm.note} onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                    rows={2} className={inputCls} placeholder="Ghi chú thêm..." />
                </div>
                <button onClick={handleScheduleSubmit}
                  className="w-full text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                  Xác nhận đặt lịch
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Đăng ký thuê */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Home size={18} className="text-purple-500" /> Đăng ký thuê phòng
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
              <Users size={14} className="text-purple-500" />
              <span><strong>{room.name}</strong> — {room.price.toLocaleString("vi-VN")}đ/tháng</span>
            </div>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-green-600">Đăng ký thành công!</p>
                <p className="text-sm text-gray-400 mt-1">Admin sẽ xét duyệt và tạo hợp đồng</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Số người *</label>
                  <select value={registerForm.people} onChange={(e) => setRegisterForm({ ...registerForm, people: e.target.value })} className={inputCls}>
                    {["1","2","3","4"].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">CCCD *</label>
                  <input type="text" value={registerForm.cccd} onChange={(e) => setRegisterForm({ ...registerForm, cccd: e.target.value })}
                    placeholder="079123456789" className={inputCls} readOnly={!!registerForm.cccd} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Ngày chuyển vào *</label>
                  <input type="date" value={registerForm.moveDate} onChange={(e) => setRegisterForm({ ...registerForm, moveDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Xe (nếu có)</label>
                  <input type="text" value={registerForm.vehicle} onChange={(e) => setRegisterForm({ ...registerForm, vehicle: e.target.value })}
                    placeholder="59X1-12345" className={inputCls} />
                  {registerForm.vehicle && (
                    <p className="text-xs text-green-600 mt-1">✓ Đã tải biển số xe từ hồ sơ của bạn</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Ghi chú</label>
                  <textarea value={registerForm.note} onChange={(e) => setRegisterForm({ ...registerForm, note: e.target.value })}
                    rows={2} className={inputCls} placeholder="Yêu cầu đặc biệt..." />
                </div>
                {registerError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
                    {registerError}
                  </div>
                )}
                <button onClick={handleRegisterSubmit}
                  className="w-full text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
                  Gửi yêu cầu đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}