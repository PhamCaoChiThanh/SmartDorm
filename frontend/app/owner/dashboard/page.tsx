"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import {
  Home,
  CheckSquare,
  LockOpen,
  Banknote,
  CalendarDays,
  Users,
  FileText,
  Wrench,
  Bell,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Activity
} from "lucide-react";

export default function OwnerDashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadOwnerData() {
      try {
        setLoading(true);
        setError("");

        // Fetch rooms
        const roomsRes = await fetchAPI("/rooms");
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        // Fetch invoices
        const invoicesRes = await fetchAPI("/invoices");
        if (invoicesRes.success && Array.isArray(invoicesRes.data)) {
          setInvoices(invoicesRes.data);
        }

        // Fetch maintenance
        const maintenanceRes = await fetchAPI("/maintenances");
        if (maintenanceRes.success && Array.isArray(maintenanceRes.data)) {
          setMaintenances(maintenanceRes.data);
        }

        // Fetch contracts
        const contractsRes = await fetchAPI("/contracts");
        if (contractsRes.success && Array.isArray(contractsRes.data)) {
          setContracts(contractsRes.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu owner dashboard:", err);
        setError("Không thể tải thông tin từ máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadOwnerData();
  }, []);

  // Calculations
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(
    (r) => (r.currentOccupants || r.current_occupants || 0) > 0
  ).length;
  const availableRooms = rooms.filter(
    (r) => (r.currentOccupants || r.current_occupants || 0) === 0 && r.status !== "MAINTENANCE"
  ).length;

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.total_amount || inv.totalAmount || 0),
    0
  );

  const stats = [
    {
      label: "Tổng phòng",
      value: totalRooms.toString(),
      icon: Home,
      color: "#3B82F6",
      colorClass: "from-blue-600 to-cyan-500",
    },
    {
      label: "Đang thuê",
      value: occupiedRooms.toString(),
      icon: CheckSquare,
      color: "#10B981",
      colorClass: "from-emerald-600 to-teal-500",
    },
    {
      label: "Phòng trống",
      value: availableRooms.toString(),
      icon: LockOpen,
      color: "#F59E0B",
      colorClass: "from-amber-500 to-orange-400",
    },
    {
      label: "Doanh thu tích lũy",
      value: `${totalRevenue.toLocaleString("vi-VN")}đ`,
      icon: Banknote,
      color: "#EC4899",
      colorClass: "from-purple-600 to-pink-500",
    },
    {
      label: "Hợp đồng hoạt động",
      value: contracts.filter(c => c.status === "ACTIVE").length.toString(),
      icon: CalendarDays,
      color: "#F97316",
      colorClass: "from-orange-500 to-red-400",
    },
  ];

  // Calculate monthly stats for chart
  const monthlyData: Record<string, number> = {};
  invoices.forEach((inv) => {
    const m = inv.billing_month || inv.billingMonth || 1;
    const y = inv.billing_year || inv.billingYear || 2026;
    const key = `${m}/${y}`;
    monthlyData[key] = (monthlyData[key] || 0) + (inv.total_amount || inv.totalAmount || 0);
  });

  const sortedMonths = Object.keys(monthlyData)
    .sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    })
    .slice(-6);

  const maxRevenue = Math.max(...sortedMonths.map((m) => monthlyData[m]), 1);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4 bg-linear-to-b from-gray-50/50 to-white/50 backdrop-blur-md rounded-2xl border border-gray-100 p-8 m-8">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-purple-600"></div>
          <Sparkles className="absolute text-purple-600 animate-pulse" size={24} />
        </div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Đang kiến tạo dữ liệu tổng quan cho Owner...</p>
      </div>
    );
  }

  // Generate SVG Points for Area Chart (Revenue)
  const chartHeight = 150;
  const chartWidth = 500;
  const points = sortedMonths.map((month, idx) => {
    const val = monthlyData[month];
    const x = (idx / (sortedMonths.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (val / maxRevenue) * (chartHeight - 20);
    return { x, y, month, val };
  });

  const areaPath = points.length > 0 
    ? `${points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : "";

  const linePath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  return (
    <div className="animate-fade-in space-y-6 p-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-purple-950 to-slate-950 p-6 md:p-8 text-white shadow-xl shadow-purple-900/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-purple-200 mb-3">
              <Sparkles size={12} className="animate-spin-slow text-yellow-400" />
              <span>SmartDorm Owner Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
              Báo cáo hiệu suất quản trị
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">{currentTime}</p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-lg border border-white/10 p-3 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity size={20} className="text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Doanh thu và phòng trọ</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Dữ liệu thực tế</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${s.colorClass} flex items-center justify-center mb-3 shadow-md text-white group-hover:rotate-12 transition-all duration-300`}>
                <Icon size={20} />
              </div>
              <div className="text-xl md:text-2xl font-black text-slate-800 tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                {s.value}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-1">{s.label}</div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${s.colorClass} opacity-70`}></div>
            </div>
          );
        })}
      </div>

      {/* Charts & Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600" />
              <span>Xu Hướng Doanh Thu</span>
            </h2>
            <p className="text-xs text-slate-400">Tổng quan doanh thu phát sinh 6 tháng gần nhất</p>
          </div>

          <div className="flex-1 min-h-[220px] flex flex-col justify-end mt-4">
            {sortedMonths.length > 0 ? (
              <div className="w-full">
                <div className="relative h-40 w-full">
                  <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ownerRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    
                    <path d={areaPath} fill="url(#ownerRevenueGrad)" />
                    <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                    
                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        className="fill-white stroke-purple-600 stroke-2"
                      />
                    ))}
                  </svg>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 mt-2 px-1">
                  {sortedMonths.map((m) => (
                    <span key={m} className="text-[10px] font-bold text-slate-400">{m}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-slate-400 text-sm py-16">
                Chưa có dữ liệu hóa đơn được tạo.
              </div>
            )}
          </div>
        </div>

        {/* Trạng thái phòng */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Hiệu Suất Phòng Trọ</h2>
            <p className="text-xs text-slate-400">Tỷ lệ lấp đầy phòng thực tế</p>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 my-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="58" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                
                {occupiedRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="58"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray="364.42"
                    strokeDashoffset={364.42 - (occupiedRooms / (totalRooms || 1)) * 364.42}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
                {availableRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="58"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="14"
                    strokeDasharray="364.42"
                    strokeDashoffset={364.42 - (availableRooms / (totalRooms || 1)) * 364.42}
                    transform={`rotate(${(occupiedRooms / (totalRooms || 1)) * 360} 80 80)`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tỷ lệ trống</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="flex flex-col items-center p-2 bg-emerald-50/50 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800">Đang thuê</span>
                <span className="text-sm font-black text-emerald-900 mt-0.5">{occupiedRooms}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-blue-50/50 rounded-xl">
                <span className="text-[10px] font-bold text-blue-800">Còn trống</span>
                <span className="text-sm font-black text-blue-900 mt-0.5">{availableRooms}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Khách thuê mới */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-purple-500" /> Khách thuê đang hoạt động
            </h2>
            <button onClick={() => router.push("/owner/listings")}
              className="text-xs text-purple-600 hover:underline flex items-center gap-0.5 font-bold">
              Xem tất cả <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {contracts.filter(c => c.status === "ACTIVE").slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition">
                <div className="w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0 bg-linear-to-br from-purple-500 to-pink-500 shadow-xs">
                  {c.tenant?.fullName?.[0] || "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{c.tenant?.fullName || "Khách thuê"}</p>
                  <p className="text-xs text-slate-400">Phòng {c.room?.roomNumber || "P-?"} · HĐ: {c.startDate}</p>
                </div>
              </div>
            ))}
            {contracts.filter(c => c.status === "ACTIVE").length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có khách thuê hoạt động.
              </div>
            )}
          </div>
        </div>

        {/* Hợp đồng sắp hết hạn */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-orange-400" /> Hợp đồng hết hạn
            </h2>
            <button onClick={() => router.push("/owner/contract")}
              className="text-xs text-purple-600 hover:underline flex items-center gap-0.5 font-bold">
              Xem tất cả <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {contracts.map((c, i) => (
              <div key={i} className={`p-3 rounded-xl border ${c.status === "EXPIRED" ? "border-red-100 bg-red-50/50" : "border-slate-100 bg-slate-50/50"}`}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.tenant?.fullName || "Khách thuê"}</p>
                    <p className="text-xs text-slate-400">Phòng {c.room?.roomNumber || "P-?"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">Thời hạn: {c.startDate} - {c.endDate}</p>
              </div>
            ))}
            {contracts.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có dữ liệu hợp đồng.
              </div>
            )}
          </div>
        </div>

        {/* Báo hỏng gần đây */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Wrench size={18} className="text-slate-500" /> Báo hỏng cần xử lý
            </h2>
            <button onClick={() => router.push("/owner/maintenance")}
              className="text-xs text-purple-600 hover:underline flex items-center gap-0.5 font-bold">
              Xem tất cả <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {maintenances.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{m.description}</p>
                  <p className="text-xs text-slate-400">Phòng {m.room_number || m.roomNumber || "P-?"}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  m.status === "OPEN" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
            {maintenances.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có báo cáo bảo trì.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}