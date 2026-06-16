"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home, MapPin, Users, Camera, Wifi, Wind, ShieldCheck,
  WashingMachine, Fingerprint, CalendarDays, Phone, Mail,
  User, X, CheckCircle, Lightbulb, ChevronRight, Tv,
  FileText, CreditCard, Landmark, Smartphone, QrCode, Copy,
  Zap, Droplets, Trash2, ArrowRight, ChevronDown, ChevronUp,
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

type RoomData = {
  id: number; name: string; area: string; price: number;
  capacity: number; available: number; images: string[];
  amenities: string[]; description: string; manager: string;
  phone: string; email: string; status?: string; category?: string;
  ownerEmail?: string; bedStatus?: boolean[];
  electricityPrice?: number; waterPrice?: number; garbageFee?: number;
};

type Contract = {
  id: string; room: string; status: "ACTIVE" | "PENDING" | "EXPIRED";
  startDate: string; endDate: string;
  basePrice: number; electricityPrice: number; waterPrice: number; garbageFee: number;
  deposit: { totalAmount: number; remainingBalance: number; status: string };
  tenantName?: string; tenantCCCD?: string; bedNumber?: number;
};

type PaymentMethod = "bank" | "momo" | "qr";

const staticRoomsData: RoomData[] = [
  {
    id: 1, name: "Phòng KTX A1", area: "Khu A - Tầng 1", price: 1500000, capacity: 4, available: 2,
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=500&fit=crop",
    ],
    amenities: ["Camera 24/7", "Wifi tốc độ cao", "Máy lạnh", "Nhà vệ sinh riêng", "Máy giặt chung", "Khóa vân tay"],
    description: "Phòng KTX Khu A thoáng mát, sạch sẽ, đầy đủ tiện nghi.",
    manager: "Nguyễn Văn Quản", phone: "0901234567", email: "manager@smartdorm.com",
    electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  },
  {
    id: 2, name: "Phòng KTX B3", area: "Khu B - Tầng 3", price: 1800000, capacity: 2, available: 1,
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop",
    ],
    amenities: ["Camera 24/7", "Wifi tốc độ cao", "Máy lạnh", "Khóa vân tay"],
    description: "Phòng 2 người yên tĩnh, view đẹp tầng 3.",
    manager: "Trần Thị Quản", phone: "0912345678", email: "manager2@smartdorm.com",
    electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  },
  {
    id: 3, name: "Phòng KTX C2", area: "Khu C - Tầng 2", price: 2000000, capacity: 2, available: 0,
    images: ["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi tốc độ cao", "Máy lạnh"],
    description: "Phòng cao cấp khu C, đã đầy chỗ.",
    manager: "Lê Văn Quản", phone: "0923456789", email: "manager3@smartdorm.com",
    electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  },
  {
    id: 4, name: "Phòng KTX A3", area: "Khu A - Tầng 3", price: 1500000, capacity: 4, available: 3,
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi", "Máy lạnh", "Máy giặt"],
    description: "Phòng rộng rãi 4 người, còn 3 chỗ trống.",
    manager: "Nguyễn Văn Quản", phone: "0901234567", email: "manager@smartdorm.com",
    electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  },
  {
    id: 5, name: "Phòng KTX B1", area: "Khu B - Tầng 1", price: 1800000, capacity: 2, available: 2,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi", "Máy lạnh", "Khóa vân tay"],
    description: "Phòng 2 người tầng 1, tiện di chuyển.",
    manager: "Trần Thị Quản", phone: "0912345678", email: "manager2@smartdorm.com",
    electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  },
  {
    id: 6, name: "Phòng KTX D2", area: "Khu D - Tầng 2", price: 2200000, capacity: 1, available: 1,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop"],
    amenities: ["Camera 24/7", "Wifi cao cấp", "Máy lạnh", "Khóa vân tay", "WC riêng"],
    description: "Phòng 1 người cao cấp, riêng tư tuyệt đối.",
    manager: "Lê Văn Quản", phone: "0923456789", email: "manager3@smartdorm.com",
    electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
  },
];

function normalizeOwnerListing(l: any): RoomData {
  return {
    id: l.id, name: l.name, area: l.area || "",
    price: l.price || 0, capacity: l.capacity || 1, available: l.available ?? 1,
    images: l.images && l.images.length > 0 ? l.images
      : l.image ? [l.image]
      : ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop"],
    amenities: l.amenities || [], description: l.description || "",
    manager: l.manager || "Ban quản lý", phone: l.phone || "", email: l.email || "",
    status: l.status, category: l.category, ownerEmail: l.ownerEmail || "",
    bedStatus: l.bedStatus || [],
    electricityPrice: l.electricityPrice || 3500,
    waterPrice: l.waterPrice || 15000,
    garbageFee: l.garbageFee || 20000,
  };
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition";

// ─── Payment Modal ────────────────────────────────────────
function PaymentModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const monthlyTotal = contract.basePrice + contract.garbageFee;
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const methods = [
    { id: "bank" as PaymentMethod, label: "Chuyển khoản", icon: <Landmark size={16} />, desc: "Vietcombank / MB" },
    { id: "momo" as PaymentMethod, label: "MoMo / Zalo", icon: <Smartphone size={16} />, desc: "Ví điện tử" },
    { id: "qr" as PaymentMethod, label: "QR Code", icon: <QrCode size={16} />, desc: "Quét mã nhanh" },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard size={18} className="text-purple-500" /> Thanh toán tiền phòng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {paid ? (
            <div className="text-center py-10">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-600 text-lg">Thanh toán thành công!</p>
              <p className="text-sm text-gray-400 mt-1">Quản lý sẽ xác nhận trong vòng 24h</p>
            </div>
          ) : (
            <>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-400 font-medium mb-2">HỢP ĐỒNG {contract.id}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền phòng tháng này</span>
                  <span className="font-bold text-purple-700">{monthlyTotal.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${method === m.id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className={`flex justify-center mb-1 ${method === m.id ? "text-purple-600" : "text-gray-400"}`}>{m.icon}</div>
                    <p className={`text-xs font-semibold ${method === m.id ? "text-purple-700" : "text-gray-600"}`}>{m.label}</p>
                    <p className="text-xs text-gray-400">{m.desc}</p>
                  </button>
                ))}
              </div>
              {method === "bank" && (
                <div className="space-y-3">
                  {[
                    { label: "Ngân hàng", value: "Vietcombank" },
                    { label: "Số tài khoản", value: "1234567890", copy: true },
                    { label: "Tên tài khoản", value: "NGUYEN VAN QUAN" },
                    { label: "Số tiền", value: `${monthlyTotal.toLocaleString("vi-VN")}đ`, copy: true },
                    { label: "Nội dung CK", value: `${contract.id} THANG ${new Date().getMonth() + 1}`, copy: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                      </div>
                      {item.copy && (
                        <button onClick={() => copyText(item.value)} className="text-purple-500 hover:text-purple-700 transition">
                          {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setPaid(true)}
                className="w-full text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
                <CheckCircle size={15} /> Xác nhận đã thanh toán
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Contract Card ────────────────────────────────────────
function ContractCard({ contract }: { contract: Contract }) {
  const [open, setOpen] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const statusConfig = {
    ACTIVE: { label: "Đang hiệu lực", color: "bg-green-100 text-green-700 border-green-200" },
    PENDING: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 border-amber-200" },
    EXPIRED: { label: "Hết hạn", color: "bg-gray-100 text-gray-500 border-gray-200" },
  };
  const status = statusConfig[contract.status];
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED22, #EC489922)" }}>
              <FileText size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{contract.id}</p>
              <p className="text-xs text-gray-400">Phòng {contract.room} · {contract.startDate} → {contract.endDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${status.color}`}>{status.label}</span>
            {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>
        {open && (
          <div className="border-t border-gray-100 px-5 pb-5 space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {[{ label: "Ngày bắt đầu", value: contract.startDate }, { label: "Ngày kết thúc", value: contract.endDate }].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { label: "Tiền phòng", value: `${contract.basePrice.toLocaleString("vi-VN")}đ/tháng`, icon: <Home size={12} className="text-purple-400" /> },
                { label: "Giá điện", value: `${contract.electricityPrice.toLocaleString("vi-VN")}đ/số`, icon: <Zap size={12} className="text-amber-400" /> },
                { label: "Giá nước", value: `${contract.waterPrice.toLocaleString("vi-VN")}đ/khối`, icon: <Droplets size={12} className="text-blue-400" /> },
                { label: "Phí rác", value: `${contract.garbageFee.toLocaleString("vi-VN")}đ/tháng`, icon: <Trash2 size={12} className="text-gray-400" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
                  <span className="flex items-center gap-2 text-gray-500">{item.icon}{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
            {contract.status === "ACTIVE" && (
              <button onClick={() => setShowPayment(true)}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
                <CreditCard size={15} /> Thanh toán tháng này <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {showPayment && <PaymentModal contract={contract} onClose={() => setShowPayment(false)} />}
    </>
  );
}

// ─── Tính ngày kết thúc từ ngày bắt đầu + số tháng ──────
function addMonths(dateStr: string, months: number): string {
  try {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  } catch { return ""; }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, day] = dateStr.split("-");
  return `${parseInt(day)}/${parseInt(m)}/${y}`;
}

// ─── Create Contract Modal ────────────────────────────────
function CreateContractModal({
  room, tenantCCCD, bedNumber, moveDate, onClose, onDone,
}: {
  room: RoomData; tenantCCCD: string; bedNumber: number;
  moveDate: string; onClose: () => void; onDone: (c: Contract) => void;
}) {
  // Giá dịch vụ từ room (read-only, do chủ nhà đã thiết lập)
  const electricityPrice = room.electricityPrice ?? 3500;
  const waterPrice = room.waterPrice ?? 15000;
  const garbageFee = room.garbageFee ?? 20000;
  const deposit = room.price * 2;

  // Thời hạn: 3 tháng / 6 tháng / 12 tháng
  const durations = [
    { label: "3 tháng", months: 3 },
    { label: "6 tháng", months: 6 },
    { label: "1 năm", months: 12 },
  ];
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const endDate = selectedDuration && moveDate ? addMonths(moveDate, selectedDuration) : "";

  const [done, setDone] = useState(false);
  const [createdContract, setCreatedContract] = useState<Contract | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleCreate = () => {
    if (!selectedDuration) { alert("Vui lòng chọn thời hạn hợp đồng!"); return; }
    const newContract: Contract = {
      id: `HD-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      room: room.name, status: "PENDING",
      startDate: moveDate, endDate,
      basePrice: room.price,
      electricityPrice, waterPrice, garbageFee,
      deposit: { totalAmount: deposit, remainingBalance: deposit, status: "HOLDING" },
      tenantCCCD, bedNumber,
      tenantName: localStorage.getItem("currentName") || "Người thuê",
    };
    const existing = JSON.parse(localStorage.getItem("contracts") || "[]");
    existing.push(newContract);
    localStorage.setItem("contracts", JSON.stringify(existing));
    setCreatedContract(newContract);
    setDone(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
          <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileText size={18} className="text-purple-500" /> Tạo hợp đồng thuê
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {done && createdContract ? (
              <>
                <div className="text-center pt-4">
                  <CheckCircle size={52} className="text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-green-600 text-lg">Hợp đồng đã được tạo!</p>
                  <p className="text-sm text-gray-400 mt-1">Mã hợp đồng: <strong>{createdContract.id}</strong></p>
                </div>
                <ContractCard contract={createdContract} />
                <button onClick={() => setShowPayment(true)}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
                  <CreditCard size={15} /> Thanh toán tiền cọc ngay
                </button>
                <button onClick={() => onDone(createdContract)}
                  className="w-full py-3 rounded-xl text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition">
                  Để sau
                </button>
              </>
            ) : (
              <>
                {/* Tóm tắt */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm space-y-1.5">
                  <div className="flex justify-between"><span className="text-gray-500">Phòng</span><span className="font-semibold">{room.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">CCCD</span><span className="font-semibold">{tenantCCCD}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Giường</span><span className="font-semibold">#{bedNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ngày vào</span><span className="font-semibold">{formatDate(moveDate)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tiền phòng</span>
                    <span className="font-bold text-purple-700">{room.price.toLocaleString("vi-VN")}đ/tháng</span></div>
                </div>

                {/* Thời hạn hợp đồng */}
                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">
                    Thời hạn hợp đồng <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {durations.map((d) => {
                      const endD = moveDate ? addMonths(moveDate, d.months) : "";
                      const isSelected = selectedDuration === d.months;
                      return (
                        <button key={d.months} type="button" onClick={() => setSelectedDuration(d.months)}
                          className={`rounded-xl border-2 p-3 text-center transition-all ${
                            isSelected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                          }`}>
                          <p className={`text-sm font-bold ${isSelected ? "text-purple-700" : "text-gray-700"}`}>{d.label}</p>
                          {endD && (
                            <p className={`text-xs mt-1 ${isSelected ? "text-purple-500" : "text-gray-400"}`}>
                              {formatDate(endD)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {endDate && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
                      <CalendarDays size={14} />
                      Hết hạn: <strong>{formatDate(endDate)}</strong>
                    </div>
                  )}
                </div>

                {/* Giá dịch vụ — read only */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Giá dịch vụ</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Do chủ nhà niêm yết</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Giá điện", value: `${electricityPrice.toLocaleString("vi-VN")}đ / số`, icon: <Zap size={13} className="text-amber-500" /> },
                      { label: "Giá nước", value: `${waterPrice.toLocaleString("vi-VN")}đ / khối`, icon: <Droplets size={13} className="text-blue-500" /> },
                      { label: "Phí rác", value: `${garbageFee.toLocaleString("vi-VN")}đ / tháng`, icon: <Trash2 size={13} className="text-gray-400" /> },
                      { label: "Tiền cọc", value: `${deposit.toLocaleString("vi-VN")}đ`, icon: <ShieldCheck size={13} className="text-green-500" /> },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                        <span className="flex items-center gap-2 text-sm text-gray-500">{item.icon}{item.label}</span>
                        <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleCreate}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
                  <FileText size={15} /> Tạo hợp đồng
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {showPayment && createdContract && (
        <PaymentModal contract={createdContract} onClose={() => { setShowPayment(false); onDone(createdContract); }} />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Number(params.id);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    name: "", phone: "", people: "1", vehicles: "0", visitDate: "", moveDate: "", note: "",
  });
  const [registerForm, setRegisterForm] = useState({
    people: "1", cccd: "", phone: "", moveDate: "", vehicle: "", note: "",
  });

  useEffect(() => {
    const staticMatch = staticRoomsData.find((r) => r.id === id);
    if (staticMatch) { setRoom(staticMatch); }
    else {
      try {
        const ownerListings: any[] = JSON.parse(localStorage.getItem("ownerListings") || "[]");
        const ownerMatch = ownerListings.find((l) => l.id === id);
        if (ownerMatch) setRoom(normalizeOwnerListing(ownerMatch));
      } catch {}
    }
    const role = localStorage.getItem("currentRole");
    setIsLoggedIn(!!role);
    if (searchParams.get("action") === "register" && role) setShowRegisterModal(true);
  }, [id]);

  if (!room) return <div className="p-8 text-center text-gray-500">Không tìm thấy phòng!</div>;

  const handleScheduleSubmit = () => {
    if (!scheduleForm.name || !scheduleForm.phone || !scheduleForm.visitDate) return;
    const existing = JSON.parse(localStorage.getItem("ownerAppointments") || "[]");
    existing.push({ id: Date.now(), roomId: room.id, roomName: room.name, ...scheduleForm, status: "Chờ xác nhận", createdAt: new Date().toISOString(), ownerEmail: room.ownerEmail || "" });
    localStorage.setItem("ownerAppointments", JSON.stringify(existing));
    setSubmitted(true);
    setTimeout(() => { setShowScheduleModal(false); setSubmitted(false); setScheduleForm({ name: "", phone: "", people: "1", vehicles: "0", visitDate: "", moveDate: "", note: "" }); }, 1500);
  };

  const handleRegisterSubmit = () => {
    if (!registerForm.cccd || !registerForm.moveDate || !registerForm.phone) {
      alert("Vui lòng điền đầy đủ: CCCD, Số điện thoại và Ngày chuyển vào!");
      return;
    }
    setShowRegisterModal(false);
    setShowCreateContract(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white/90 backdrop-blur shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push("/")} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 4px 24px rgba(124,58,237,0.35)" }}>
              <Home size={17} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">SmartDorm</div>
              <div className="text-[10px] text-gray-400 leading-none">Ký túc xá thông minh</div>
            </div>
          </button>
          <div className="flex gap-3 items-center">
            {isLoggedIn ? (
              <button onClick={() => router.push("/owner/dashboard")}
                className="text-sm text-white px-5 py-2 rounded-full font-semibold transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>Quản lý</button>
            ) : (
              <>
                <button onClick={() => router.push("/login")} className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-full hover:bg-gray-100 transition">Đăng nhập</button>
                <button onClick={() => router.push("/register")} className="text-sm text-white px-5 py-2 rounded-full font-semibold transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>Đăng ký</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-1 text-sm text-gray-400">
        <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => router.push("/")}>Trang chủ</span>
        <ChevronRight size={14} />
        <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => router.push("/")}>Danh sách phòng</span>
        <ChevronRight size={14} />
        <span className="text-gray-700 font-medium">{room.name}</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <div className="flex gap-2 p-3 flex-wrap">
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
            <p className="text-gray-400 mt-1 flex items-center gap-1 text-sm"><MapPin size={13} className="text-purple-400" /> {room.area} · Cập nhật hôm nay</p>
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
            <p className="text-gray-600 leading-relaxed text-sm">{room.description || "Chưa có mô tả chi tiết."}</p>
            {room.amenities.length > 0 && (
              <>
                <h2 className="font-bold text-lg mt-6 mb-3">Tiện ích</h2>
                <div className="grid grid-cols-2 gap-2">
                  {room.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <AmenityIcon label={a} /> {a}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Giá dịch vụ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-3">Bảng giá dịch vụ</h2>
            <div className="space-y-2">
              {[
                { label: "Giá điện", value: `${(room.electricityPrice ?? 3500).toLocaleString("vi-VN")}đ / số`, icon: <Zap size={14} className="text-amber-500" /> },
                { label: "Giá nước", value: `${(room.waterPrice ?? 15000).toLocaleString("vi-VN")}đ / khối`, icon: <Droplets size={14} className="text-blue-500" /> },
                { label: "Phí rác", value: `${(room.garbageFee ?? 20000).toLocaleString("vi-VN")}đ / tháng`, icon: <Trash2 size={14} className="text-gray-400" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <span className="flex items-center gap-2 text-sm text-gray-600">{item.icon}{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
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

        {/* Cột phải */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-lg">Thông tin quản lý</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
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
                <button onClick={() => { if (!isLoggedIn) router.push("/login"); else setShowPhone(true); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border-2 transition hover:bg-purple-50"
                  style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
                  {isLoggedIn ? "Hiện số điện thoại" : "Đăng nhập để xem số"}
                </button>
              )}
              {room.email && (
                <div className="text-gray-400 text-xs flex items-center gap-1.5 px-1"><Mail size={12} /> {room.email}</div>
              )}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <button onClick={() => { if (!isLoggedIn) router.push("/login"); else setShowScheduleModal(true); }}
                className="w-full py-3 rounded-xl font-medium text-sm border-2 transition hover:bg-purple-50 flex items-center justify-center gap-2"
                style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
                <CalendarDays size={15} /> Đặt lịch xem phòng
              </button>
              <button onClick={() => { if (!isLoggedIn) router.push("/login"); else setShowRegisterModal(true); }}
                disabled={room.available === 0}
                className="w-full text-white py-3 rounded-xl font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}>
                <Home size={15} /> {room.available === 0 ? "Phòng đã đầy" : "Đăng ký thuê ngay"}
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
              <Lightbulb size={13} className="mt-0.5 flex-shrink-0" />
              Đăng nhập để xem số điện thoại và đăng ký thuê phòng
            </div>
          </div>
        </div>
      </div>

      {/* Modal Đặt lịch */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
            <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2"><CalendarDays size={18} className="text-purple-500" /> Đặt lịch xem phòng</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
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
                          onChange={(e) => setScheduleForm({ ...scheduleForm, [f.key]: e.target.value })} className={inputCls}>
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
                    style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>Xác nhận đặt lịch</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng ký thuê */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
            <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2"><Home size={18} className="text-purple-500" /> Đăng ký thuê phòng</h3>
              <button onClick={() => { setShowRegisterModal(false); setSelectedBed(null); }} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm flex items-center gap-2">
                <Users size={14} className="text-purple-500" />
                <span><strong>{room.name}</strong> — {room.price.toLocaleString("vi-VN")}đ/tháng</span>
              </div>

              {/* Sơ đồ giường */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-1">🏠 Sơ đồ phòng — Chọn giường trống</p>
                <p className="text-xs text-gray-400 mb-3">Click vào giường trống để chọn vị trí</p>
                <div className="relative bg-white border-4 border-gray-300 rounded-2xl p-4">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
                    <div className="bg-blue-200 text-blue-700 text-xs px-3 py-0.5 rounded-full whitespace-nowrap">🪟 Cửa sổ</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 mb-5">
                    {Array.from({ length: room.capacity }).map((_, i) => {
                      const occupied = room.bedStatus ? room.bedStatus[i] === true : i >= room.available;
                      const isSelected = selectedBed === i;
                      return (
                        <button key={i} type="button" disabled={occupied}
                          onClick={() => setSelectedBed(isSelected ? null : i)}
                          className={`relative rounded-xl border-2 p-3 transition-all duration-200 ${
                            occupied ? "border-red-200 bg-red-50 cursor-not-allowed opacity-70"
                            : isSelected ? "border-purple-500 bg-purple-100 scale-105 shadow-md"
                            : "border-green-300 bg-green-50 hover:border-purple-400 hover:bg-purple-50 cursor-pointer"
                          }`}>
                          <div className={`relative mx-auto rounded-lg border-2 overflow-hidden ${
                            occupied ? "border-red-300 bg-red-100" : isSelected ? "border-purple-400 bg-purple-200" : "border-green-400 bg-green-100"
                          }`} style={{ width: "56px", height: "36px" }}>
                            <div className={`absolute top-1 left-1 right-1 rounded h-2 ${occupied ? "bg-red-300" : isSelected ? "bg-purple-400" : "bg-green-400"}`} />
                            <div className={`absolute bottom-1 left-1 right-1 rounded h-4 ${occupied ? "bg-red-200" : isSelected ? "bg-purple-300" : "bg-green-200"}`} />
                            {occupied && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm">👤</div>}
                            {isSelected && <div className="absolute inset-0 flex items-center justify-center text-purple-600 font-bold">✓</div>}
                          </div>
                          <div className={`text-xs font-semibold mt-2 ${occupied ? "text-red-500" : isSelected ? "text-purple-700" : "text-green-700"}`}>
                            {occupied ? "Có người" : isSelected ? "✓ Đã chọn" : "Trống"}
                          </div>
                          <div className="text-xs text-gray-400">Giường #{i + 1}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 z-10">
                    <div className="bg-gray-400 text-white text-xs px-3 py-0.5 rounded-full whitespace-nowrap">🚪 Cửa ra vào</div>
                  </div>
                </div>
                {selectedBed !== null && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-purple-700 font-medium flex items-center gap-2">
                    ✅ Bạn đã chọn <strong>Giường #{selectedBed + 1}</strong>
                  </div>
                )}
              </div>

              {/* Form đăng ký — đã thêm SĐT */}
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Số người *</label>
                <select value={registerForm.people} onChange={(e) => setRegisterForm({ ...registerForm, people: e.target.value })} className={inputCls}>
                  {["1","2","3","4"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">CCCD *</label>
                <input type="text" value={registerForm.cccd}
                  onChange={(e) => setRegisterForm({ ...registerForm, cccd: e.target.value })}
                  placeholder="079123456789" className={inputCls} />
              </div>
              {/* ✅ Thêm SĐT */}
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Số điện thoại *</label>
                <input type="tel" value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="0901234567" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Ngày chuyển vào *</label>
                <input type="date" value={registerForm.moveDate}
                  onChange={(e) => setRegisterForm({ ...registerForm, moveDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Xe (nếu có)</label>
                <input type="text" value={registerForm.vehicle}
                  onChange={(e) => setRegisterForm({ ...registerForm, vehicle: e.target.value })}
                  placeholder="59X1-12345" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Ghi chú</label>
                <textarea value={registerForm.note} onChange={(e) => setRegisterForm({ ...registerForm, note: e.target.value })}
                  rows={2} className={inputCls} placeholder="Yêu cầu đặc biệt..." />
              </div>
              <button onClick={handleRegisterSubmit}
                className="w-full text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
                Tiếp theo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo hợp đồng */}
      {showCreateContract && (
        <CreateContractModal
          room={room}
          tenantCCCD={registerForm.cccd}
          bedNumber={(selectedBed ?? 0) + 1}
          moveDate={registerForm.moveDate}
          onClose={() => setShowCreateContract(false)}
          onDone={() => { setShowCreateContract(false); setSelectedBed(null); router.push("/owner/contract"); }}
        />
      )}
    </div>
  );
}