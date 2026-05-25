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

// ── đổi tên thành defaultRooms để tránh conflict với state ──
const defaultRooms: RoomItem[] = [
  { id: 1, name: "Phòng KTX A1", area: "Khu A - Tầng 1", price: 1500000, capacity: 4, available: 2, image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop" },
  { id: 2, name: "Phòng KTX B3", area: "Khu B - Tầng 3", price: 1800000, capacity: 2, available: 1, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop" },
  { id: 3, name: "Phòng KTX C2", area: "Khu C - Tầng 2", price: 2000000, capacity: 2, available: 0, image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&h=300&fit=crop" },
  { id: 4, name: "Phòng KTX A3", area: "Khu A - Tầng 3", price: 1500000, capacity: 4, available: 3, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop" },
  { id: 5, name: "Phòng KTX B1", area: "Khu B - Tầng 1", price: 1800000, capacity: 2, available: 2, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop" },
  { id: 6, name: "Phòng KTX D2", area: "Khu D - Tầng 2", price: 2200000, capacity: 1, available: 1, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
];

const features = [
  { icon: Building2, title: "Thông tin minh bạch", desc: "Xem đầy đủ thông tin phòng, giá cả, tiện nghi trước khi đăng ký. Không phí ẩn.", color: "from-violet-500 to-purple-600" },
  { icon: Zap, title: "Quản lý tức thì", desc: "Theo dõi hóa đơn, báo hỏng, đăng ký xe — tất cả chỉ trong một nền tảng duy nhất.", color: "from-amber-500 to-orange-500" },
  { icon: ShieldCheck, title: "Bảo mật dữ liệu", desc: "Hệ thống bảo mật cloud AWS, dữ liệu được mã hóa toàn diện. An toàn tuyệt đối.", color: "from-emerald-500 to-teal-500" },
  { icon: Smartphone, title: "Đăng ký mọi lúc", desc: "Truy cập từ bất kỳ thiết bị nào. Desktop, tablet hay điện thoại đều hoạt động tốt.", color: "from-pink-500 to-rose-500" },
];

const stats = [
  { value: "48+", label: "Phòng tổng cộng", icon: BedDouble, color: "text-violet-400" },
  { value: "42+", label: "Sinh viên đang ở", icon: Users, color: "text-pink-400" },
  { value: "6", label: "Phòng còn trống", icon: Home, color: "text-amber-400" },
  { value: "4.9", label: "Điểm hài lòng", icon: Star, color: "text-emerald-400" },
];

function getRoomBadge(room: typeof defaultRooms[0]) {
  if (room.available === 0) return null;
  if (room.available === 1) return { text: "Còn 1 chỗ cuối", color: "bg-rose-500" };
  if (room.available <= 2 && room.capacity <= 2) return { text: "Sắp hết chỗ", color: "bg-amber-500" };
  if (room.id === 2 || room.id === 5) return { text: "Phổ biến", color: "bg-violet-600" };
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

  // ── state rooms (defaultRooms + owner listings từ localStorage) ──
  const [rooms, setRooms] = useState<RoomItem[]>(defaultRooms);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("currentName");
    if (name) setCurrentName(name);

    const role = localStorage.getItem("currentRole");
    if (role) {
      setCurrentRole(role);
      if (role === "ADMIN" || role === "MANAGER") {
        router.push("/admin/dashboard");
        return;
      }
    }

    const token = localStorage.getItem("token");

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
            available: room.status === "AVAILABLE" || room.status === "TRỐNG" ? (room.capacity || 4) : 0,
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

    if (token) {
      loadRooms();
    } else {
      const ownerListings = JSON.parse(localStorage.getItem("ownerListings") || "[]");
      const published = ownerListings.filter((l: any) => l.publish);
      setRooms([...defaultRooms, ...published]);
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentEmail");
    localStorage.removeItem("currentName");
    localStorage.removeItem("currentRole");
    setCurrentName(null);
    setCurrentRole(null);
  };

  const filtered = rooms.filter((r) => {
    let matchSearch = true;
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      
      // Xử lý các tag đặc biệt
      if (query === "còn trống") {
        matchSearch = r.available > 0;
      } else if (query === "giá rẻ") {
        matchSearch = r.price <= 1500000;
      } else if (query === "2 người") {
        matchSearch = r.capacity === 2;
      } else if (query === "ktx khu a") {
        matchSearch = r.name.toLowerCase().includes("khu a") || r.area.toLowerCase().includes("khu a");
      } else {
        // Tách từ khóa tìm kiếm thành các từ đơn để so khớp thông minh (Token-based matching)
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
    return matchSearch && matchPrice;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans" style={{ fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; }

        .font-display { font-family: 'DM Serif Display', Georgia, serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(-1.5deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px); }
          40% { transform: translateY(-8px); }
        }
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); }
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.6), 0 0 60px rgba(236,72,153,0.2); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes counter {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }

        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float2 8s ease-in-out infinite; animation-delay: -2s; }
        .float-3 { animation: float3 5s ease-in-out infinite; animation-delay: -1s; }
        .blob-anim { animation: blob 8s ease-in-out infinite; }
        .glow-pulse { animation: pulse-glow 3s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        .fade-up-1 { animation: fadeUp 0.6s ease-out 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.6s ease-out 0.2s both; }
        .fade-up-3 { animation: fadeUp 0.6s ease-out 0.3s both; }
        .fade-up-4 { animation: fadeUp 0.6s ease-out 0.4s both; }

        .shimmer-text {
          background: linear-gradient(90deg, #7C3AED, #EC4899, #F97316, #7C3AED);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .glow-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          transition: all 0.3s ease;
          box-shadow: 0 4px 24px rgba(124,58,237,0.35);
        }
        .glow-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.5), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .glow-btn::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .glow-btn:hover::after { opacity: 1; }

        .glass {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
        }

        .glass-dark {
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .card-hover {
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(124,58,237,0.08);
        }

        .mesh-bg {
          background-color: #F8FAFC;
          background-image:
            radial-gradient(at 20% 30%, rgba(124,58,237,0.08) 0px, transparent 50%),
            radial-gradient(at 80% 10%, rgba(236,72,153,0.06) 0px, transparent 40%),
            radial-gradient(at 60% 80%, rgba(249,115,22,0.05) 0px, transparent 40%),
            radial-gradient(at 10% 80%, rgba(168,85,247,0.06) 0px, transparent 40%);
        }

        .hero-gradient {
          background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #2D1B69 70%, #0F172A 100%);
        }

        .tag-pill {
          transition: all 0.2s ease;
        }
        .tag-pill:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1));
          border-color: rgba(124,58,237,0.3);
          transform: translateY(-1px);
        }

        .img-zoom img {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .img-zoom:hover img {
          transform: scale(1.08);
        }

        .header-blur {
          background: rgba(248,250,252,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .header-blur.scrolled {
          box-shadow: 0 1px 40px rgba(0,0,0,0.08);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* ─── HEADER ─────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 header-blur ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-btn">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight tracking-tight">SmartDorm</div>
              <div className="text-[10px] text-gray-400 leading-none">Ký túc xá thông minh</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex gap-7 text-sm text-gray-500">
            <a href="#rooms" className="hover:text-gray-900 transition-colors font-medium">Phòng</a>
            <a href="#features" className="hover:text-gray-900 transition-colors font-medium">Tiện ích</a>
            <a href="#contact" className="hover:text-gray-900 transition-colors font-medium">Liên hệ</a>
          </nav>

          {/* Auth */}
          <div className="flex gap-3 items-center">
            {currentName ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                  <User size={13} className="text-violet-500" />
                  <span className="font-medium">{currentName}</span>
                </div>
                {(currentRole === "ADMIN" || currentRole === "MANAGER") && (
                  <button
                    onClick={() => {
                      router.push("/admin/dashboard");
                    }}
                    className="glow-btn text-white text-sm px-5 py-2 rounded-full font-semibold"
                  >
                    Quản lý
                  </button>
                )}
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/login")} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors px-4 py-2 rounded-full hover:bg-gray-100">
                  Đăng nhập
                </button>
                <button onClick={() => router.push("/register")} className="glow-btn text-white text-sm px-5 py-2 rounded-full font-semibold">
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] opacity-20 blob-anim"
          style={{ background: "radial-gradient(circle, #7C3AED, #EC4899)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] opacity-15 blob-anim"
          style={{ background: "radial-gradient(circle, #F97316, #EC4899)", filter: "blur(80px)", animationDelay: "-4s" }} />
        <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] opacity-10 blob-anim"
          style={{ background: "radial-gradient(circle, #A855F7)", filter: "blur(60px)", animationDelay: "-2s" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full relative z-10">
          {/* Left */}
          <div>
            <div className="fade-up-1 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-400" />
              Nền tảng KTX thế hệ mới
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="fade-up-2 font-display text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-6 tracking-tight">
              Đăng ký KTX
              <br />
              <span className="shimmer-text">thông minh</span>
              <br />
              chỉ trong 30 giây
            </h1>

            <p className="fade-up-3 text-white/60 text-lg lg:text-xl leading-relaxed mb-10 max-w-lg">
              Xem phòng trống theo thời gian thực, biết trước giá cả, tiện ích và đăng ký trực tiếp trên một nền tảng duy nhất.
            </p>

            <div className="fade-up-4 flex flex-wrap gap-3 mb-12">
              <button
                onClick={() => roomsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="glow-btn text-white px-7 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2"
              >
                Tìm phòng ngay
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => roomsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-white/20 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
              >
                Xem phòng trống
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Social proof */}
            <div className="fade-up flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                ].map((src, i) => (
                  <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" />
                ))}
              </div>
              <div className="text-white/60 text-sm">
                <span className="text-white font-semibold">42+ sinh viên</span> đang sử dụng
              </div>
            </div>
          </div>

          {/* Right — floating cards mockup */}
          <div className="relative hidden lg:flex items-center justify-center h-[520px]">
            {/* Main dashboard card */}
            <div className="float-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 glass rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Phòng của bạn</p>
                  <p className="font-bold text-gray-900">KTX B3 - Khu B</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  <Home size={18} className="text-white" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Tiền phòng", val: "1.800.000đ" },
                  { label: "Tiền điện", val: "225.000đ" },
                  { label: "Tiền nước", val: "56.000đ" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-semibold text-gray-800">{item.val}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                  <span>Tổng cộng</span>
                  <span className="shimmer-text">2.081.000đ</span>
                </div>
              </div>
            </div>

            {/* Top-left: sinh vien */}
            <div className="float-2 absolute top-6 left-0 glass rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Users size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">42+ sinh viên</p>
                <p className="text-xs text-gray-400">Đang sinh sống</p>
              </div>
            </div>

            {/* Bottom-right: phòng trống */}
            <div className="float-3 absolute bottom-8 right-0 glass rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BedDouble size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">6 phòng trống</p>
                <p className="text-xs text-gray-400">Đăng ký ngay</p>
              </div>
            </div>

            {/* Top-right: rating */}
            <div className="float-1 absolute top-12 right-4 glass rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2" style={{ animationDelay: "-3s" }}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-900">4.9/5</span>
            </div>

            {/* Bottom-left: notification */}
            <div className="float-2 absolute bottom-14 left-2 glass rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3" style={{ animationDelay: "-1s" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-gray-600 font-medium">Hóa đơn T5 đã được tạo</p>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-[#F8FAFC] to-transparent" />
      </section>

      {/* ─── STATS ───────────────────────────────────── */}
      <section className="mesh-bg py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-card rounded-3xl p-6 shadow-sm" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-4xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                      <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center">
                      <Icon size={20} className={s.color} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Cập nhật realtime</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ROOMS ───────────────────────────────────── */}
      <section id="rooms" ref={roomsRef} className="mesh-bg py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-violet-600 text-sm font-semibold bg-violet-50 px-4 py-1.5 rounded-full border border-violet-100">
              <Flame size={13} /> Phòng có sẵn
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-5 mb-3 tracking-normal text-gray-900">
              Những phòng <span className="shimmer-text">tốt nhất</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              Chọn phòng phù hợp với nhu cầu của bạn — <span className="font-semibold text-gray-700">{filtered.length} phòng</span> đang hiển thị
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-10 max-w-3xl mx-auto">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 min-w-[180px]">
                <Search size={15} className="text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên phòng, khu vực..."
                  className="bg-transparent text-sm focus:outline-none w-full text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <select
                  value={priceFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriceFilter(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none text-gray-600"
                >
                  <option value="all">Tất cả giá</option>
                  <option value="low">≤ 1.5 triệu</option>
                  <option value="mid">1.5 – 2 triệu</option>
                  <option value="high">≥ 2 triệu</option>
                </select>
              </div>
              <button className="glow-btn text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Search size={14} /> Tìm ngay
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["KTX Khu A", "Còn trống", "Giá rẻ", "2 người"].map((tag) => (
                <span
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="tag-pill text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-full cursor-pointer font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Room grid */}
          {loading ? (
            <div className="grid place-items-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600"></div>
                <p className="text-zinc-500 text-sm">Đang tải danh sách phòng...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((room) => {
                const badge = getRoomBadge(room);
                return (
                  <div key={room.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 group border border-gray-100 bg-white">
                    <div className="relative overflow-hidden h-52">
                      <img src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`text-[11px] px-3 py-1 rounded-full font-semibold ${room.available > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                          {room.available > 0 ? `✓ Còn ${room.available} chỗ` : "✗ Đã đầy"}
                        </span>
                        {badge && (
                          <span className={`text-[11px] px-3 py-1 rounded-full font-semibold text-white ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-800 text-lg">{room.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">📍 {room.area}</p>
                      <p className="text-sm text-gray-500 mt-1">👥 Sức chứa: {room.capacity} người</p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-violet-600 font-bold text-lg">{room.price.toLocaleString("vi-VN")}đ</span>
                          <span className="text-xs text-gray-400">/tháng</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/rooms/${room.id}`)}
                            className="text-xs px-3 py-2 rounded-xl font-medium transition"
                            style={{ border: "2px solid #7C3AED", color: "#7C3AED", background: "transparent" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => {
                              const role = localStorage.getItem("currentRole");
                              if (!role) router.push("/login");
                              else router.push(`/rooms/${room.id}?action=register`);
                            }}
                            className="text-xs px-3 py-2 rounded-xl font-medium text-white transition"
                            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(124,58,237,0.45)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(124,58,237,0.3)"; }}
                          >
                            Đăng ký ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-violet-600 text-sm font-semibold bg-violet-50 px-4 py-1.5 rounded-full border border-violet-100">
              <ShieldCheck size={13} /> Tại sao chọn chúng tôi
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-gray-900 mt-5 mb-3">
              Tiện ích <span className="shimmer-text">vượt trội</span>
            </h2>
            <p className="text-gray-500 text-lg">Hệ thống được xây dựng trên nền tảng AWS Cloud hiện đại</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-gray-50 rounded-3xl p-7 card-hover border border-gray-100 group">
                  <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="py-20 px-6 mesh-bg">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #2D1B69 100%)" }}>
            <div className="absolute top-0 right-0 w-80 h-80 opacity-20 blob-anim"
              style={{ background: "radial-gradient(circle, #7C3AED, #EC4899)", filter: "blur(60px)" }} />
            <div className="absolute bottom-0 left-0 w-60 h-60 opacity-15 blob-anim"
              style={{ background: "radial-gradient(circle, #F97316)", filter: "blur(60px)", animationDelay: "-3s" }} />
            <div className="relative z-10 p-12 lg:p-16 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-7 backdrop-blur-sm">
                <Sparkles size={13} className="text-amber-400" />
                Sẵn sàng chuyển vào ở?
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight tracking-normal">
                Trải nghiệm cuộc sống
                <br /><span className="shimmer-text">KTX thông minh</span>
              </h2>
              <p className="text-white/60 text-lg mb-10">Đăng ký ngay hôm nay — miễn phí, không cần thẻ tín dụng</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer id="contact" className="bg-[#0F172A] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-btn">
                  <Home size={17} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-base">SmartDorm</div>
                  <div className="text-[10px] text-gray-500">Ký túc xá thông minh</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hệ thống quản lý ký túc xá hiện đại, tiện lợi cho sinh viên và ban quản lý.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Mail, href: "#" },
                ].map(({ icon: Icon, href }, i) => (
                  <a key={i} href={href}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Tìm nhanh</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {["Danh sách phòng", "Đăng ký thuê", "Hóa đơn", "Báo hỏng"].map((l) => (
                  <li key={l} className="hover:text-white cursor-pointer transition-colors flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-violet-500" /> {l}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Dành cho bạn</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {["Về SmartDorm", "Hỗ trợ xem phòng", "Chính sách bảo mật"].map((l) => (
                  <li key={l} className="hover:text-white cursor-pointer transition-colors flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-violet-500" /> {l}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Liên hệ</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2.5"><Mail size={14} className="text-violet-400 shrink-0" /> smartdorm@email.com</li>
                <li className="flex items-center gap-2.5"><Phone size={14} className="text-violet-400 shrink-0" /> 0901 234 567</li>
                <li className="flex items-center gap-2.5"><MapPin size={14} className="text-violet-400 shrink-0" /> TP. Hồ Chí Minh</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <span>© 2025 SmartDorm. All rights reserved.</span>
            <span className="flex items-center gap-1.5">Powered by <span className="text-violet-400 font-medium">AWS Cloud</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
