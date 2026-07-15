"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { fetchAPI } from "@/lib/api";
import {
  Home,
  Building2,
  Users,
  ShieldCheck,
  Zap,
  Smartphone,
  Star,
  BedDouble,
  MapPin,
  Search,
  SlidersHorizontal,
  ArrowRight,
  ChevronRight,
  Mail,
  Phone,
  Flame,
  LogOut,
  User,
  Sparkles,
  TrendingUp,
  LogIn,
  ClipboardList,
  UserPlus,
} from "lucide-react";

interface RoomItem {
  id: number | string;
  name: string;
  area: string;
  price: number;
  capacity: number;
  available: number;
  image: string;
}

const defaultRooms: RoomItem[] = [
  { id: 1, name: "Phòng KTX A1", area: "Khu A - Tầng 1", price: 1500000, capacity: 4, available: 2, image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop" },
  { id: 2, name: "Phòng KTX B3", area: "Khu B - Tầng 3", price: 1800000, capacity: 2, available: 1, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop" },
  { id: 3, name: "Phòng KTX C2", area: "Khu C - Tầng 2", price: 2000000, capacity: 2, available: 0, image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&h=300&fit=crop" },
  { id: 4, name: "Phòng KTX A3", area: "Khu A - Tầng 3", price: 1500000, capacity: 4, available: 3, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop" },
  { id: 5, name: "Phòng KTX B1", area: "Khu B - Tầng 1", price: 1800000, capacity: 2, available: 2, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop" },
  { id: 6, name: "Phòng KTX D2", area: "Khu D - Tầng 2", price: 2200000, capacity: 1, available: 1, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
];

const features = [
  { icon: Building2, title: "Thông tin minh bạch", desc: "Xem đầy đủ thông tin phòng, giá cả, tiện nghi trước khi đăng ký. Không phí ẩn.", color: "from-blue-500 to-indigo-600" },
  { icon: Zap, title: "Quản lý tức thì", desc: "Theo dõi hóa đơn, báo hỏng, đăng ký xe — tất cả chỉ trong một nền tảng duy nhất.", color: "from-amber-500 to-orange-500" },
  { icon: ShieldCheck, title: "Bảo mật dữ liệu", desc: "Hệ thống bảo mật hiện đại, dữ liệu thông tin sinh viên được mã hóa an toàn tuyệt đối.", color: "from-emerald-500 to-teal-500" },
  { icon: Smartphone, title: "Đăng ký mọi lúc", desc: "Truy cập từ bất kỳ thiết bị nào. Desktop, tablet hay điện thoại đều hoạt động tốt.", color: "from-pink-500 to-rose-500" },
];

const stats = [
  { value: "48+", label: "Phòng tổng cộng", icon: BedDouble, color: "text-blue-500" },
  { value: "42+", label: "Sinh viên đang ở", icon: Users, color: "text-purple-500" },
  { value: "6", label: "Phòng còn trống", icon: Home, color: "text-emerald-500" },
  { value: "4.9", label: "Điểm hài lòng", icon: Star, color: "text-amber-500" },
];

function getRoomBadge(room: typeof defaultRooms[0]) {
  if (room.available === 0) return null;
  if (room.available === 1) return { text: "Còn 1 chỗ cuối", color: "bg-rose-500" };
  if (room.available <= 2 && room.capacity <= 2) return { text: "Sắp hết chỗ", color: "bg-amber-500" };
  if (room.id === 2 || room.id === 5) return { text: "Phổ biến", color: "bg-blue-600" };
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const roomsRef = useRef<HTMLDivElement>(null);

  const [rooms, setRooms] = useState<RoomItem[]>(defaultRooms);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [activeTab, setActiveTab] = useState<"home" | "rooms">("home");

  useEffect(() => {
    const name = sessionStorage.getItem("currentName");
    if (name) setCurrentName(name);

    const role = sessionStorage.getItem("currentRole");
    const lastActiveRoute = sessionStorage.getItem("lastActiveRoute");
    if (role) {
      setCurrentRole(role);
      if (lastActiveRoute && lastActiveRoute !== "/") {
        router.push(lastActiveRoute);
        return;
      } else if (role === "ADMIN" || role === "MANAGER") {
        router.push("/admin/dashboard");
        return;
      } else if (role === "TENANT") {
        router.push("/tenant/invoice");
        return;
      }
    }

    const token = sessionStorage.getItem("token");

    const loadRooms = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI("/rooms");
        if (response.success && Array.isArray(response.data)) {
          const mappedRooms = response.data.map((room: any) => ({
            id: room.id,
            name: `Phòng KTX ${room.roomNumber || room.room_number}`,
            area: `Khu KTX - Phòng ${room.roomNumber || room.room_number}`,
            price: room.basePrice || room.base_price || 1500000,
            capacity: room.capacity || 4,
            available: room.status === "MAINTENANCE" ? 0 : ((room.capacity || 4) - (room.currentOccupants || 0)),
            image: room.image || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop"
          }));

          const ownerListings = JSON.parse(localStorage.getItem("ownerListings") || "[]");
          const published = ownerListings.filter((l: any) => l.publish);
          
          if (mappedRooms.length === 0) {
            setRooms([...defaultRooms, ...published]);
          } else {
            setRooms([...mappedRooms, ...published]);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load rooms from API, using default/local rooms", err);
        const ownerListings = JSON.parse(localStorage.getItem("ownerListings") || "[]");
        const published = ownerListings.filter((l: any) => l.publish);
        setRooms([...defaultRooms, ...published]);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("currentEmail");
    sessionStorage.removeItem("currentName");
    sessionStorage.removeItem("currentRole");
    setCurrentName(null);
    setCurrentRole(null);
  };

  const filtered = rooms.filter((r) => {
    let matchSearch = true;
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      
      if (query === "còn trống") {
        matchSearch = r.available > 0;
      } else if (query === "giá rẻ") {
        matchSearch = r.price <= 1500000;
      } else if (query === "2 người") {
        matchSearch = r.capacity === 2;
      } else if (query === "ktx khu a") {
        matchSearch = r.name.toLowerCase().includes("khu a") || r.area.toLowerCase().includes("khu a");
      } else {
        const tokens = query.split(/\s+/).filter(Boolean);
        matchSearch = tokens.every(token =>
          r.name.toLowerCase().includes(token) ||
          r.area.toLowerCase().includes(token)
        );
      }
    }

    const matchPrice =
      priceFilter === "all" ? true :
        priceFilter === "low" ? r.price <= 1500000 :
          priceFilter === "mid" ? r.price > 1500000 && r.price <= 2000000 :
            r.price > 2000000;
    return matchSearch && matchPrice && r.available > 0;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-sans antialiased text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

        * { box-sizing: border-box; }

        .font-title { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .float-anim { animation: float 6s ease-in-out infinite; }
        .pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }

        .glass-header {
          background: rgba(250, 250, 252, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .scrolled {
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(226, 232, 240, 1);
        }

        .portal-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .portal-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .glow-btn-primary {
          background: linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%);
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
          transition: all 0.3s ease;
        }

        .glow-btn-primary:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
        }

        .glow-btn-secondary {
          background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%);
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.25);
          transition: all 0.3s ease;
        }

        .glow-btn-secondary:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
        }

        .mesh-pattern-bg {
          background-color: #FAFAFC;
          background-image: 
            radial-gradient(at 10% 20%, rgba(59, 130, 246, 0.05) 0px, transparent 50%),
            radial-gradient(at 90% 10%, rgba(139, 92, 246, 0.05) 0px, transparent 50%),
            radial-gradient(at 50% 80%, rgba(244, 63, 94, 0.03) 0px, transparent 50%);
        }
      `}</style>

      {/* ─── HEADER ─────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 glass-header ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              setActiveTab("home");
              router.push("/");
            }}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform">
              <Home size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">SmartDorm</span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-100">Portal</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Hệ thống ký túc xá thông minh</div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex gap-8 text-sm text-slate-500 font-semibold">
            <button
              onClick={() => {
                setActiveTab("rooms");
                setCurrentPage(1);
              }}
              className={`hover:text-indigo-600 transition-colors cursor-pointer ${activeTab === "rooms" ? "text-indigo-600 font-bold" : ""}`}
            >
              Danh sách phòng
            </button>
            <button
              onClick={() => {
                setActiveTab("home");
                setTimeout(() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }), 100);
              }}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Tiện ích số
            </button>
            <button
              onClick={() => {
                setActiveTab("home");
                setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 100);
              }}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Liên hệ
            </button>
          </nav>

          {/* User Account / Auth Actions */}
          <div className="flex gap-3 items-center">
            {currentName ? (
              <>
                <button
                  onClick={() => {
                    if (currentRole === "TENANT") {
                      router.push("/tenant/profile");
                    } else if (currentRole === "ADMIN" || currentRole === "MANAGER") {
                      router.push("/owner/profile");
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <User size={13} className="text-indigo-500" />
                  <span>{currentName}</span>
                </button>
                {(currentRole === "ADMIN" || currentRole === "MANAGER") && (
                  <button
                    onClick={() => router.push("/admin/dashboard")}
                    className="glow-btn-primary text-white text-xs px-4 py-2 rounded-full font-bold transition"
                  >
                    Quản trị
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm text-slate-600 hover:text-slate-900 font-semibold transition px-4 py-2 rounded-full hover:bg-slate-100"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="glow-btn-primary text-white text-sm px-5 py-2 rounded-full font-bold transition"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO & PORTALS (Only rendered when activeTab is home) ─── */}
      {activeTab === "home" && (
        <section className="relative overflow-hidden py-16 lg:py-24 mesh-pattern-bg">
          {/* Decorative background glows */}
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pulse-slow pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-3xl pulse-slow pointer-events-none" style={{ animationDelay: "-3s" }} />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16 fade-up">
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={12} className="text-indigo-600" /> Cổng dịch vụ trực tuyến
              </span>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                Chào mừng bạn đến với <br /><span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">SmartDorm</span>
              </h1>
              <p className="text-slate-500 text-base leading-relaxed">
                Giải pháp lưu trú Ký túc xá thông minh toàn diện. Vui lòng chọn cổng thông tin phù hợp bên dưới để tiếp tục.
              </p>
            </div>

            {/* TWO MAIN PORTALS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 fade-up">
              
              {/* PORTAL A: CHƯA CÓ PHÒNG / TÂN SINH VIÊN */}
              <div className="portal-card rounded-3xl p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500 z-0 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                    <UserPlus size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950 mb-3">Dành cho sinh viên chưa ở KTX</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Bạn đang chuẩn bị nhập học hoặc cần tìm chỗ ở mới? Hãy đăng ký thông tin lưu trú, lựa chọn phòng trống trực tuyến, tra cứu bảng giá dịch vụ và chuẩn bị hồ sơ nhanh chóng tại đây.
                  </p>
                  <ul className="space-y-2.5 mb-8 text-xs text-slate-600 font-semibold">
                    <li className="flex items-center gap-2"><ChevronRight size={14} className="text-blue-500" /> Tra cứu vị trí & thông tin chi tiết phòng trống</li>
                    <li className="flex items-center gap-2"><ChevronRight size={14} className="text-blue-500" /> Đăng ký hồ sơ xin lưu trú trực tuyến 100%</li>
                    <li className="flex items-center gap-2"><ChevronRight size={14} className="text-blue-500" /> Theo dõi tiến độ duyệt hồ sơ tự động</li>
                  </ul>
                </div>
                <div className="relative z-10 flex flex-wrap gap-3.5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => router.push("/register")}
                    className="glow-btn-primary text-white text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-2 grow justify-center cursor-pointer"
                  >
                    <UserPlus size={16} />
                    Đăng ký lưu trú
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("rooms");
                      setCurrentPage(1);
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-2 justify-center cursor-pointer"
                  >
                    <Search size={16} />
                    Xem phòng trống
                  </button>
                </div>
              </div>

              {/* PORTAL B: ĐANG SINH SỐNG TẠI DORM */}
              <div className="portal-card rounded-3xl p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-500 z-0 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 border border-purple-100 shadow-sm">
                    <LogIn size={26} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950 mb-3">Dành cho sinh viên đang ở KTX</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Cổng thông tin quản lý sinh hoạt dành cho các cư dân SmartDorm. Hãy đăng nhập tài khoản của bạn để thanh toán các hóa đơn, khai báo sự cố kỹ thuật, đăng ký xe gửi, hoặc gửi đơn gia hạn lưu trú.
                  </p>
                  <ul className="space-y-2.5 mb-8 text-xs text-slate-600 font-semibold">
                    <li className="flex items-center gap-2"><ChevronRight size={14} className="text-purple-500" /> Theo dõi & thanh toán hóa đơn điện nước phòng</li>
                    <li className="flex items-center gap-2"><ChevronRight size={14} className="text-purple-500" /> Báo hỏng thiết bị và yêu cầu sửa chữa</li>
                    <li className="flex items-center gap-2"><ChevronRight size={14} className="text-purple-500" /> Đăng ký giữ xe, quản lý tài sản thông minh</li>
                  </ul>
                </div>
                <div className="relative z-10 flex flex-wrap gap-3.5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => router.push("/login")}
                    className="glow-btn-secondary text-white text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-2 grow justify-center cursor-pointer"
                  >
                    <LogIn size={16} />
                    Đăng nhập hệ thống
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-2 justify-center cursor-pointer"
                  >
                    <ClipboardList size={16} />
                    Quản lý dịch vụ
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ─── ROOMS GRID (Only rendered when activeTab is rooms) ─── */}
      {activeTab === "rooms" && (
        <section id="rooms" ref={roomsRef} className="py-20 px-6 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb / Back button */}
            <div className="mb-6 flex justify-start">
              <button
                onClick={() => setActiveTab("home")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1.5 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs"
              >
                ← Quay lại trang chủ
              </button>
            </div>

            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Flame size={12} /> Tra cứu vị trí phòng trống
              </span>
              <h2 className="text-3xl font-black text-slate-950 mt-4 mb-2 tracking-tight">
                Danh sách phòng KTX có sẵn
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Thông tin minh bạch, cập nhật tự động. Chọn phòng để thực hiện thủ tục đăng ký.
              </p>
            </div>

            {/* Real-time search filters */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-10 max-w-3xl mx-auto">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 min-w-[200px] border border-slate-200">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Nhập khu, phòng cần tìm..."
                    className="bg-transparent text-sm focus:outline-none w-full text-slate-800 placeholder:text-slate-400 font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
                  <SlidersHorizontal size={14} className="text-slate-400" />
                  <select
                    value={priceFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setPriceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-sm focus:outline-none text-slate-700 font-semibold cursor-pointer"
                  >
                    <option value="all">Tất cả mức giá</option>
                    <option value="low">Dưới 1.5 triệu / tháng</option>
                    <option value="mid">1.5 triệu - 2.0 triệu</option>
                    <option value="high">Trên 2.0 triệu</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {["KTX Khu A", "Còn trống", "Giá rẻ", "2 người"].map((tag) => (
                  <span
                    key={tag}
                    onClick={() => {
                      setSearch(tag);
                      setCurrentPage(1);
                    }}
                    className="text-xs text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 px-3 py-1 rounded-full cursor-pointer font-semibold transition"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Room grid layout */}
            {loading ? (
              <div className="grid place-items-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                  <p className="text-slate-500 text-sm font-semibold">Đang truy vấn dữ liệu phòng...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((room) => {
                    const badge = getRoomBadge(room);
                    return (
                      <div key={room.id} className="rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white group flex flex-col justify-between">
                        <div>
                          <div className="relative overflow-hidden h-48">
                            <img src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-extrabold ${room.available > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                                {room.available > 0 ? `Còn ${room.available} chỗ` : "Hết chỗ"}
                              </span>
                              {badge && (
                                <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-extrabold text-white ${badge.color}`}>
                                  {badge.text}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="font-bold text-slate-950 text-lg group-hover:text-indigo-600 transition-colors">{room.name}</h3>
                            <p className="text-sm text-slate-500 mt-2 font-medium">📍 {room.area}</p>
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">👥 Sức chứa: tối đa {room.capacity} người</p>
                          </div>
                        </div>
                        
                        <div className="p-6 pt-0">
                          <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                            <div>
                              <div className="text-indigo-600 font-extrabold text-lg">{room.price.toLocaleString("vi-VN")}đ</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">mỗi tháng</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/rooms/1?id=${room.id}`)}
                                className="text-xs px-3.5 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition"
                              >
                                Chi tiết
                              </button>
                              <button
                                onClick={() => {
                                  const role = sessionStorage.getItem("currentRole");
                                  if (!role) router.push("/login");
                                  else router.push(`/rooms/1?id=${room.id}&action=register`);
                                }}
                                className="text-xs px-3.5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                              >
                                Thuê ngay
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {Math.ceil(filtered.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-2.5 mt-12">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Trước
                    </button>
                    {[...Array(Math.ceil(filtered.length / itemsPerPage))].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition cursor-pointer ${
                          currentPage === i + 1
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
      {/* ─── DIGITAL FEATURES SECTION (Only rendered when activeTab is home) ─── */}
      {activeTab === "home" && (
        <section id="features" className="py-20 px-6 bg-white border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1 text-indigo-600 text-xs font-bold uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                <ShieldCheck size={12} /> Tiện ích dịch vụ
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-4 mb-2">
                Nền tảng vận hành tối ưu
              </h2>
              <p className="text-slate-500 text-sm">Chuyển đổi số toàn diện hoạt động quản lý ký túc xá.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-xs transition duration-300 group">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${f.color} flex items-center justify-center mb-5 text-white shadow-sm`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="font-bold text-slate-950 text-base mb-2 group-hover:text-indigo-600 transition-colors">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── CONTACT FOOTER ──────────────────────────── */}
      <footer id="contact" className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
            {/* Column 1: Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/10">
                  <Home size={18} />
                </div>
                <div>
                  <div className="font-extrabold text-white text-base">SmartDorm</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ký túc xá thông minh</div>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Cổng dịch vụ số hóa Ký túc xá hiện đại, kết nối thông tin tiện lợi giữa sinh viên nội trú và Ban quản lý.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-5">Danh mục chính</h4>
              <ul className="space-y-3 text-xs font-semibold">
                <li><a href="#rooms" className="hover:text-white transition-colors">Tra cứu vị trí phòng</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Đăng nhập tài khoản</a></li>
                <li><a href="/register" className="hover:text-white transition-colors">Đăng ký lưu trú mới</a></li>
              </ul>
            </div>

            {/* Column 3: Policy */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-5">Chính sách</h4>
              <ul className="space-y-3 text-xs font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">Quy chế nội trú KTX</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật thông tin</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Quy định hoàn hủy giữ chỗ</a></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-5">Liên hệ ban quản lý</h4>
              <ul className="space-y-3.5 text-xs font-semibold">
                <li className="flex items-center gap-2.5"><Mail size={14} className="text-indigo-400 shrink-0" /> support@smartdorm.vn</li>
                <li className="flex items-center gap-2.5"><Phone size={14} className="text-indigo-400 shrink-0" /> (028) 3724 2181</li>
                <li className="flex items-center gap-2.5"><MapPin size={14} className="text-indigo-400 shrink-0" /> Khu Đô thị ĐHQG-HCM, TP. Thủ Đức</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            <span>© 2026 SmartDorm. Bản quyền thuộc về Ban quản lý.</span>
            <span>Hệ thống quản lý SmartDorm Cloud</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
