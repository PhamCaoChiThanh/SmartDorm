"use client";

import { useState } from "react";
import {
  FileText, ChevronDown, ChevronUp, CheckCircle, CreditCard,
  Landmark, Smartphone, QrCode, Copy, X, Home, CalendarDays,
  Zap, Droplets, Trash2, ShieldCheck, Clock, ArrowRight, Phone,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
type Contract = {
  id: string; room: string; status: "ACTIVE" | "PENDING" | "EXPIRED";
  startDate: string; endDate: string;
  basePrice: number; electricityPrice: number; waterPrice: number; garbageFee: number;
  deposit: { totalAmount: number; remainingBalance: number; status: string };
  tenantName?: string; tenantCCCD?: string; tenantPhone?: string; bedNumber?: number;
};

type PaymentMethod = "bank" | "momo" | "qr";

// ─── Mock data ────────────────────────────────────────────
const mockContracts: Contract[] = [
  {
    id: "HD-2025-001", room: "P101", status: "ACTIVE",
    startDate: "2025-01-01", endDate: "2025-12-31",
    basePrice: 1500000, electricityPrice: 3500, waterPrice: 15000, garbageFee: 20000,
    deposit: { totalAmount: 3000000, remainingBalance: 3000000, status: "HOLDING" },
    tenantName: "Nguyễn Văn A", tenantCCCD: "079123456789", tenantPhone: "0901234567", bedNumber: 1,
  },
];

const statusConfig = {
  ACTIVE: { label: "Đang hiệu lực", color: "bg-green-100 text-green-700 border-green-200" },
  PENDING: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 border-amber-200" },
  EXPIRED: { label: "Hết hạn", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ─── Payment Method Modal ─────────────────────────────────
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

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "bank", label: "Chuyển khoản", icon: <Landmark size={16} />, desc: "Vietcombank / MB Bank" },
    { id: "momo", label: "MoMo / ZaloPay", icon: <Smartphone size={16} />, desc: "Ví điện tử" },
    { id: "qr", label: "QR Code", icon: <QrCode size={16} />, desc: "Quét mã nhanh" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard size={18} className="text-purple-500" /> Thanh toán tiền phòng
          </h3>
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
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Phòng {contract.room}</span>
                  <span>Đã bao gồm phí rác</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Chọn phương thức</p>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map((m) => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`rounded-xl border-2 p-3 text-center transition-all ${
                        method === m.id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <div className={`flex justify-center mb-1 ${method === m.id ? "text-purple-600" : "text-gray-400"}`}>
                        {m.icon}
                      </div>
                      <p className={`text-xs font-semibold ${method === m.id ? "text-purple-700" : "text-gray-600"}`}>{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </button>
                  ))}
                </div>
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

              {method === "momo" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "MoMo", color: "#AE2070", num: "0901234567" },
                      { name: "ZaloPay", color: "#0068FF", num: "0901234567" },
                    ].map((w) => (
                      <div key={w.name} className="rounded-xl border border-gray-200 p-4 text-center">
                        <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: w.color }}>
                          {w.name[0]}
                        </div>
                        <p className="text-sm font-bold text-gray-800">{w.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{w.num}</p>
                        <button onClick={() => copyText(w.num)}
                          className="mt-2 text-xs text-purple-600 hover:underline flex items-center gap-1 mx-auto">
                          <Copy size={11} /> Sao chép
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Nội dung: <strong>{contract.id} THANG {new Date().getMonth() + 1}</strong>
                  </p>
                </div>
              )}

              {method === "qr" && (
                <div className="text-center space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-6 inline-block mx-auto">
                    <div className="w-44 h-44 bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto">
                      <div className="grid grid-cols-8 gap-0.5 opacity-80">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-sm ${
                            [0,1,2,3,4,7,8,14,15,21,16,22,23,29,56,57,58,59,60,63,7,15,23,31,
                            32,33,40,41,42,48,49,50,55,62,10,18,26,35,44,52].includes(i)
                            ? "bg-gray-900" : "bg-white"
                          }`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Quét mã để thanh toán</p>
                  <p className="text-xs text-gray-400">
                    Số tiền: <strong className="text-purple-600">{monthlyTotal.toLocaleString("vi-VN")}đ</strong>
                  </p>
                  <p className="text-xs text-gray-400">Hỗ trợ tất cả ứng dụng ngân hàng & ví điện tử</p>
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

// ─── Contract Card (Accordion) ────────────────────────────
function ContractCard({ contract, isOwner }: { contract: Contract; isOwner?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const status = statusConfig[contract.status];

  const sections = [
    {
      icon: <CalendarDays size={14} className="text-blue-500" />,
      title: "Thời hạn hợp đồng",
      content: (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[{ label: "Ngày bắt đầu", value: contract.startDate },
            { label: "Ngày kết thúc", value: contract.endDate }].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Zap size={14} className="text-amber-500" />,
      title: "Chi tiết giá",
      content: (
        <div className="space-y-2.5 mt-3">
          {[
            { label: "Tiền phòng", value: `${contract.basePrice.toLocaleString("vi-VN")}đ / tháng`, icon: <Home size={13} className="text-purple-400" /> },
            { label: "Giá điện", value: `${contract.electricityPrice.toLocaleString("vi-VN")}đ / số`, icon: <Zap size={13} className="text-amber-400" /> },
            { label: "Giá nước", value: `${contract.waterPrice.toLocaleString("vi-VN")}đ / khối`, icon: <Droplets size={13} className="text-blue-400" /> },
            { label: "Phí rác", value: `${contract.garbageFee.toLocaleString("vi-VN")}đ / tháng`, icon: <Trash2 size={13} className="text-gray-400" /> },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="flex items-center gap-2 text-gray-500">{item.icon}{item.label}</span>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <ShieldCheck size={14} className="text-green-500" />,
      title: "Tiền cọc",
      content: (
        <div className="space-y-2.5 mt-3">
          {[
            { label: "Tổng tiền cọc", value: `${contract.deposit.totalAmount.toLocaleString("vi-VN")}đ` },
            { label: "Số dư còn lại", value: `${contract.deposit.remainingBalance.toLocaleString("vi-VN")}đ` },
            { label: "Trạng thái", value: contract.deposit.status },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      ),
    },
    // ✅ Thêm tenantPhone vào phần thông tin người thuê
    ...(contract.tenantName ? [{
      icon: <Clock size={14} className="text-purple-500" />,
      title: "Thông tin người thuê",
      content: (
        <div className="space-y-2.5 mt-3">
          {[
            { label: "Họ tên", value: contract.tenantName || "" },
            { label: "CCCD", value: contract.tenantCCCD || "" },
            { label: "Số điện thoại", value: contract.tenantPhone || "—" },
            { label: "Giường số", value: `#${contract.bedNumber}` },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED22, #EC489922)" }}>
              <FileText size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{contract.id}</p>
              <p className="text-xs text-gray-400">Phòng {contract.room} · {contract.startDate} → {contract.endDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${status.color}`}>
              {status.label}
            </span>
            {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>

        {open && (
          <div className="border-t border-gray-100 px-5 pb-5">
            <div className="space-y-4 mt-4">
              {sections.map((s, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    {s.icon} {s.title}
                  </p>
                  {s.content}
                </div>
              ))}
            </div>

            {!isOwner && contract.status === "ACTIVE" && (
              <button
                onClick={() => setShowPayment(true)}
                className="mt-5 w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
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

// ─── Helper ───────────────────────────────────────────────
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
export function CreateContractModal({
  roomName, roomPrice, electricityPrice, waterPrice, garbageFee,
  tenantName, tenantCCCD, tenantPhone, bedNumber, moveDate, onClose, onConfirm,
}: {
  roomName: string; roomPrice: number;
  electricityPrice: number; waterPrice: number; garbageFee: number;
  tenantName: string; tenantCCCD: string; tenantPhone: string;
  bedNumber: number; moveDate: string; onClose: () => void; onConfirm: (c: Contract) => void;
}) {
  const deposit = roomPrice * 2;

  // Thời hạn: 3 / 6 / 12 tháng
  const durations = [
    { label: "3 tháng", months: 3 },
    { label: "6 tháng", months: 6 },
    { label: "1 năm", months: 12 },
  ];
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const endDate = selectedDuration && moveDate ? addMonths(moveDate, selectedDuration) : "";

  const [done, setDone] = useState(false);

  const handleCreate = () => {
    if (!selectedDuration) { alert("Vui lòng chọn thời hạn hợp đồng!"); return; }
    const newContract: Contract = {
      id: `HD-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      room: roomName, status: "PENDING",
      startDate: moveDate, endDate,
      basePrice: roomPrice,
      electricityPrice, waterPrice, garbageFee,
      deposit: { totalAmount: deposit, remainingBalance: deposit, status: "HOLDING" },
      tenantName, tenantCCCD, tenantPhone, bedNumber,
    };
    const existing = JSON.parse(localStorage.getItem("contracts") || "[]");
    existing.push(newContract);
    localStorage.setItem("contracts", JSON.stringify(existing));
    setDone(true);
    setTimeout(() => { onConfirm(newContract); }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText size={18} className="text-purple-500" /> Tạo hợp đồng thuê
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {done ? (
            <div className="text-center py-10">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-600 text-lg">Hợp đồng đã được tạo!</p>
              <p className="text-sm text-gray-400 mt-1">Đang chờ xét duyệt từ ban quản lý</p>
            </div>
          ) : (
            <>
              {/* Info phòng & người thuê */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-gray-500">Phòng</span><span className="font-semibold">{roomName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Người thuê</span><span className="font-semibold">{tenantName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CCCD</span><span className="font-semibold">{tenantCCCD}</span></div>
                {/* ✅ Hiển thị SĐT */}
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><Phone size={12} /> Số điện thoại</span>
                  <span className="font-semibold">{tenantPhone}</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Giường</span><span className="font-semibold">#{bedNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tiền phòng</span>
                  <span className="font-bold text-purple-700">{roomPrice.toLocaleString("vi-VN")}đ/tháng</span></div>
              </div>

              {/* ✅ Thời hạn hợp đồng — chọn 3/6/12 tháng */}
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

              {/* ✅ Giá dịch vụ — read-only, do chủ nhà niêm yết */}
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
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function ContractPage({ isOwner }: { isOwner?: boolean }) {
  const [contracts, setContracts] = useState<Contract[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("contracts") || "[]");
      return saved.length > 0 ? saved : mockContracts;
    } catch { return mockContracts; }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <p className="text-xs text-gray-400">Pages / Hợp đồng thuê</p>
        <h1 className="text-xl font-bold mt-0.5 flex items-center gap-2" style={{ color: "#7C3AED" }}>
          <FileText size={20} /> Hợp đồng thuê phòng
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {contracts.length} hợp đồng · Bấm vào từng hợp đồng để xem chi tiết
        </p>
      </div>

      <div className="p-8 max-w-2xl space-y-3">
        {contracts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Chưa có hợp đồng nào</p>
            <p className="text-sm text-gray-400 mt-1">Hợp đồng sẽ xuất hiện sau khi đăng ký thuê phòng</p>
          </div>
        ) : (
          contracts.map((c) => (
            <ContractCard key={c.id} contract={c} isOwner={isOwner} />
          ))
        )}
      </div>
    </div>
  );
}