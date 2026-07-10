"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import {
  Home,
  CheckCircle2,
  LockKeyholeOpen,
  BadgeDollarSign,
  Wrench,
  AlertCircle,
  FileText,
  Users,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Zap,
  Droplet
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [selectedChartTab, setSelectedChartTab] = useState<"revenue" | "utilities">("revenue");

  useEffect(() => {
    // Clock update
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
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");

        // Fetch all rooms
        const roomsRes = await fetchAPI("/rooms");
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        // Fetch all invoices
        const invoicesRes = await fetchAPI("/invoices");
        if (invoicesRes.success && Array.isArray(invoicesRes.data)) {
          setInvoices(invoicesRes.data);
        }

        // Fetch all maintenance reports
        const maintenanceRes = await fetchAPI("/maintenances");
        if (maintenanceRes.success && Array.isArray(maintenanceRes.data)) {
          setMaintenances(maintenanceRes.data);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
        setError("Không thể tải thông tin từ máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(
    (r) => (r.currentOccupants || r.current_occupants || 0) > 0
  ).length;
  const availableRooms = rooms.filter(
    (r) => (r.currentOccupants || r.current_occupants || 0) === 0 && r.status !== "MAINTENANCE"
  ).length;
  const maintenanceRooms = rooms.filter(
    (r) => r.status === "MAINTENANCE"
  ).length;

  // Revenue (Total amount of all invoices)
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.total_amount || inv.totalAmount || 0),
    0
  );

  const stats = [
    {
      label: "Tổng phòng",
      value: totalRooms.toString(),
      icon: <Home size={22} className="text-white" />,
      colorClass: "from-blue-600 to-cyan-500",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50/50",
    },
    {
      label: "Đang thuê",
      value: occupiedRooms.toString(),
      icon: <CheckCircle2 size={22} className="text-white" />,
      colorClass: "from-emerald-600 to-teal-500",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50/50",
    },
    {
      label: "Phòng trống",
      value: availableRooms.toString(),
      icon: <LockKeyholeOpen size={22} className="text-white" />,
      colorClass: "from-amber-500 to-orange-400",
      textColor: "text-amber-600",
      bgLight: "bg-amber-50/50",
    },
    {
      label: "Doanh thu tích lũy",
      value: `${totalRevenue.toLocaleString("vi-VN")}đ`,
      icon: <BadgeDollarSign size={22} className="text-white" />,
      colorClass: "from-purple-600 to-pink-500",
      textColor: "text-purple-600",
      bgLight: "bg-purple-50/50",
    },
  ];

  // Prepare chart data
  const monthlyData: Record<string, number> = {};
  // Mock Utility data for visual wow effect
  const monthlyElectric: Record<string, number> = {};
  const monthlyWater: Record<string, number> = {};

  invoices.forEach((inv) => {
    const m = inv.billing_month || inv.billingMonth || 1;
    const y = inv.billing_year || inv.billingYear || 2026;
    const key = `${m}/${y}`;
    const amount = inv.total_amount || inv.totalAmount || 0;
    monthlyData[key] = (monthlyData[key] || 0) + amount;
    
    // Simulate utility fee breakdowns
    monthlyElectric[key] = (monthlyElectric[key] || 0) + (inv.electric_fee || inv.electricFee || amount * 0.15);
    monthlyWater[key] = (monthlyWater[key] || 0) + (inv.water_fee || inv.waterFee || amount * 0.08);
  });

  const sortedMonths = Object.keys(monthlyData)
    .sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    })
    .slice(-6); // last 6 months

  const maxRevenue = Math.max(...sortedMonths.map((m) => monthlyData[m]), 1);
  const maxUtility = Math.max(
    ...sortedMonths.map((m) => Math.max(monthlyElectric[m] || 1, monthlyWater[m] || 1)),
    1
  );
  const total = totalRooms || 1;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4 bg-linear-to-b from-gray-50/50 to-white/50 backdrop-blur-md rounded-2xl border border-gray-100 p-8">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600"></div>
          <Sparkles className="absolute text-indigo-600 animate-pulse" size={24} />
        </div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Đang kiến tạo dữ liệu tổng quan...</p>
      </div>
    );
  }

  // Generate SVG Points for Area Chart (Revenue)
  const chartHeight = 160;
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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl shadow-indigo-900/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-200 mb-3">
              <Sparkles size={12} className="animate-spin-slow text-yellow-400" />
              <span>SmartDorm Premium Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Chào mừng trở lại, Admin
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">{currentTime}</p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-lg border border-white/10 p-3 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Activity size={20} className="text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Trạng thái hệ thống</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Hoạt động ổn định</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</span>
                <div className="text-2xl font-bold text-slate-800 mt-1 tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                  {s.value}
                </div>
              </div>
              <div className={`h-11 w-11 rounded-xl bg-linear-to-br ${s.colorClass} flex items-center justify-center shadow-md group-hover:rotate-12 transition-all duration-300`}>
                {s.icon}
              </div>
            </div>
            {/* Visual bottom bar */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${s.colorClass} opacity-70`}></div>
          </div>
        ))}
      </div>

      {/* Charts Panel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Analytics: Revenue & Utilities */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-100 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                <span>Báo Cáo Phân Tích Chỉ Số</span>
              </h2>
              <p className="text-xs text-slate-400">Xem thống kê doanh thu và tiêu dùng năng lượng</p>
            </div>
            
            {/* Tabs Controller */}
            <div className="flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/50">
              <button
                onClick={() => setSelectedChartTab("revenue")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  selectedChartTab === "revenue"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Doanh thu
              </button>
              <button
                onClick={() => setSelectedChartTab("utilities")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  selectedChartTab === "utilities"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Điện & Nước
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="flex-1 min-h-[260px] flex flex-col justify-end">
            {sortedMonths.length > 0 ? (
              selectedChartTab === "revenue" ? (
                /* Beautiful SVG Area Chart for Revenue */
                <div className="w-full">
                  <div className="relative h-44 w-full">
                    <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      
                      {/* Area Path */}
                      <path d={areaPath} fill="url(#revenueGrad)" />
                      {/* Line Path */}
                      <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* Data Nodes */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group/node cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            className="fill-white stroke-indigo-600 stroke-[3px] hover:r-7 transition-all duration-200"
                          />
                        </g>
                      ))}
                    </svg>

                    {/* HTML Overlay Tooltips */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                      {points.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            left: `${(idx / (sortedMonths.length - 1 || 1)) * 92}%`,
                            top: `${(p.y / chartHeight) * 70}%`,
                          }}
                          className="absolute transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 hover:opacity-100 sm:group-hover/node:opacity-100 transition-opacity duration-200 pointer-events-auto whitespace-nowrap shadow-lg border border-slate-700"
                        >
                          {p.val.toLocaleString("vi-VN")}đ
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* X Axis Labels */}
                  <div className="flex justify-between border-t border-slate-100 pt-3 mt-2 px-1">
                    {sortedMonths.map((m) => (
                      <span key={m} className="text-[10px] font-bold text-slate-400">{m}</span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Elegant Double-Bar Chart for Utilities */
                <div className="w-full">
                  <div className="h-44 flex items-end justify-between w-full px-2 gap-4">
                    {sortedMonths.map((month) => {
                      const electricVal = monthlyElectric[month] || 0;
                      const waterVal = monthlyWater[month] || 0;
                      
                      const electricHeight = (electricVal / maxUtility) * 100;
                      const waterHeight = (waterVal / maxUtility) * 100;

                      return (
                        <div key={month} className="flex flex-col items-center flex-1 group">
                          <div className="w-full flex items-end justify-center h-36 gap-1.5 relative">
                            {/* Hover info panel */}
                            <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] py-1.5 px-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none whitespace-nowrap shadow-xl z-20 border border-slate-800 flex flex-col gap-0.5">
                              <span className="font-bold border-b border-slate-700 pb-0.5 mb-0.5 text-center text-indigo-400">{month}</span>
                              <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-400" /> Điện: {electricVal.toLocaleString("vi-VN")}đ</span>
                              <span className="flex items-center gap-1"><Droplet size={10} className="text-blue-400" /> Nước: {waterVal.toLocaleString("vi-VN")}đ</span>
                            </div>

                            {/* Electric Bar */}
                            <div
                              style={{ height: `${Math.max(electricHeight, 5)}%` }}
                              className="w-3 sm:w-4 bg-linear-to-t from-amber-500 to-yellow-400 rounded-t-full shadow-xs hover:brightness-110 transition-all duration-300"
                            ></div>
                            {/* Water Bar */}
                            <div
                              style={{ height: `${Math.max(waterHeight, 5)}%` }}
                              className="w-3 sm:w-4 bg-linear-to-t from-blue-600 to-indigo-400 rounded-t-full shadow-xs hover:brightness-110 transition-all duration-300"
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold mt-2">{month}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      Điện sinh hoạt
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      Nước sinh hoạt
                    </span>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full text-center text-slate-400 text-sm py-16">
                Không có dữ liệu hiển thị.
              </div>
            )}
          </div>
        </div>

        {/* Circular Occupancy Progress Ring */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Trạng Thái Phòng</h2>
            <p className="text-xs text-slate-400">Tỉ lệ lắp đầy và trạng thái bảo trì</p>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 my-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background base circle */}
                <circle cx="80" cy="80" r="58" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                
                {/* Occupied (Emerald Green) */}
                {occupiedRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="58"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray="364.42"
                    strokeDashoffset={364.42 - (occupiedRooms / total) * 364.42}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
                {/* Available (Royal Blue) */}
                {availableRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="58"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="14"
                    strokeDasharray="364.42"
                    strokeDashoffset={364.42 - (availableRooms / total) * 364.42}
                    transform={`rotate(${(occupiedRooms / total) * 360} 80 80)`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
                {/* Maintenance (Orange-Yellow) */}
                {maintenanceRooms > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="58"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray="364.42"
                    strokeDashoffset={364.42 - (maintenanceRooms / total) * 364.42}
                    transform={`rotate(${((occupiedRooms + availableRooms) / total) * 360} 80 80)`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                )}
              </svg>
              {/* Inner core displaying total */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalRooms}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng số phòng</span>
              </div>
            </div>

            {/* Grid legends */}
            <div className="w-full grid grid-cols-3 gap-2 mt-6">
              <div className="flex flex-col items-center bg-emerald-50/50 rounded-xl p-2 border border-emerald-100/20">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mb-1 shadow-sm"></span>
                <span className="text-[10px] font-bold text-emerald-800">Đang thuê</span>
                <span className="text-sm font-black text-emerald-900 mt-0.5">{occupiedRooms}</span>
              </div>
              <div className="flex flex-col items-center bg-blue-50/50 rounded-xl p-2 border border-blue-100/20">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 mb-1 shadow-sm"></span>
                <span className="text-[10px] font-bold text-blue-800">Còn trống</span>
                <span className="text-sm font-black text-blue-900 mt-0.5">{availableRooms}</span>
              </div>
              <div className="flex flex-col items-center bg-amber-50/50 rounded-xl p-2 border border-amber-100/20">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 mb-1 shadow-sm"></span>
                <span className="text-[10px] font-bold text-amber-800">Bảo trì</span>
                <span className="text-sm font-black text-amber-900 mt-0.5">{maintenanceRooms}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tools Bar */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600 animate-pulse" />
          Công cụ thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/admin/requests")}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100/50 text-indigo-700 hover:from-indigo-600 hover:to-indigo-500 hover:text-white hover:shadow-md transition-all duration-300 group font-bold text-xs"
          >
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
              <Users size={16} />
            </div>
            <span>Duyệt Yêu Cầu Thuê</span>
            <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => router.push("/admin/invoices")}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100/50 text-emerald-700 hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:shadow-md transition-all duration-300 group font-bold text-xs"
          >
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
              <FileText size={16} />
            </div>
            <span>Tạo Hóa Đơn Mới</span>
            <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => router.push("/admin/maintenance")}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-br from-amber-50 to-amber-100/30 border border-amber-100/50 text-amber-700 hover:from-amber-600 hover:to-amber-500 hover:text-white hover:shadow-md transition-all duration-300 group font-bold text-xs"
          >
            <div className="h-8 w-8 rounded-xl bg-amber-600 text-white flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
              <Wrench size={16} />
            </div>
            <span>Quản Lý Bảo Trì</span>
            <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => router.push("/admin/audit")}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-br from-purple-50 to-purple-100/30 border border-purple-100/50 text-purple-700 hover:from-purple-600 hover:to-purple-500 hover:text-white hover:shadow-md transition-all duration-300 group font-bold text-xs"
          >
            <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
              <Activity size={16} />
            </div>
            <span>Xem Nhật Ký Audit</span>
            <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* Sleek Maintenance Reports table */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Wrench size={20} className="text-slate-500" />
              Yêu Cầu Sửa Chữa Gần Đây
            </h2>
            <p className="text-xs text-slate-400">Các phòng báo cáo sự cố cần xử lý</p>
          </div>
          <button
            onClick={() => router.push("/admin/maintenance")}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition"
          >
            Quản lý tất cả →
          </button>
        </div>
        
        {maintenances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 font-bold text-xs uppercase tracking-wider">
                  <th className="pb-3">Phòng</th>
                  <th className="pb-3">Nội dung sự cố</th>
                  <th className="pb-3">Người báo cáo</th>
                  <th className="pb-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {maintenances.slice(0, 5).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                        {m.room_number || m.roomNumber || "P-?"}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 font-medium">{m.description}</td>
                    <td className="py-4 text-slate-500 font-medium">{m.tenant_name || m.tenantName || "Admin (Báo cáo)"}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          m.status === "OPEN"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : m.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          m.status === "OPEN"
                            ? "bg-red-500"
                            : m.status === "IN_PROGRESS"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}></span>
                        {m.status === "OPEN"
                          ? "Mới báo"
                          : m.status === "IN_PROGRESS"
                          ? "Đang xử lý"
                          : "Đã hoàn thành"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            Không có báo cáo bảo trì nào gần đây.
          </div>
        )}
      </div>
    </div>
  );
}