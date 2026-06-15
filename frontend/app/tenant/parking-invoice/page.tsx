"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import {
  ParkingSquare,
  CheckCircle2,
  X,
  Banknote,
  Wallet,
  Smartphone,
  ChevronRight,
  Copy,
  CreditCard,
} from "lucide-react";

const parkingInvoices = [
  {
    id: 1,
    plate: "59X1-12345",
    type: "Xe máy",
    ticketType: "MONTHLY",
    billingMonth: 5,
    billingYear: 2025,
    amount: 150000,
    status: "PENDING",
  },
  {
    id: 2,
    plate: "59X1-12345",
    type: "Xe máy",
    ticketType: "MONTHLY",
    billingMonth: 4,
    billingYear: 2025,
    amount: 150000,
    status: "PAID",
  },
];

const paymentMethods = [
  {
    id: "bank",
    label: "Chuyển khoản ngân hàng",
    description: "Vietcombank",
    icon: <Banknote size={22} className="text-blue-600" />,
    detail: {
      bankName: "Vietcombank",
      accountNumber: "1234 5678 9012",
      accountName: "SmartDorm",
      content: "SMARTDORM GUIXE",
    },
  },
  {
    id: "momo",
    label: "MoMo",
    description: "Ví điện tử MoMo",
    icon: <Wallet size={22} className="text-pink-500" />,
    detail: {
      phone: "0909 123 456",
      accountName: "SmartDorm",
      content: "SMARTDORM GUIXE",
    },
  },
  {
    id: "zalopay",
    label: "ZaloPay",
    description: "Ví điện tử ZaloPay",
    icon: <Smartphone size={22} className="text-blue-400" />,
    detail: {
      phone: "0909 888 999",
      accountName: "SmartDorm",
      content: "SMARTDORM GUIXE",
    },
  },
];

type Step = "select" | "confirm";

export default function TenantParkingInvoice() {
  const router = useRouter();
  const [invoices, setInvoices] = useState(parkingInvoices);
  const [showModal, setShowModal] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState("—");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchAPI("/tenants/me");
        if (res.success && res.data && res.data.room) {
          setRoomNumber(res.data.room.roomNumber || res.data.room.room_number || "—");
        }

        const vehicleRes = await fetchAPI("/vehicles");
        let plateNumber = "66FA-19015";
        let vehicleType = "Xe máy";
        if (vehicleRes.success && Array.isArray(vehicleRes.data) && vehicleRes.data.length > 0) {
          const mainVehicle = vehicleRes.data[0];
          plateNumber = mainVehicle.license_plate || mainVehicle.licensePlate || mainVehicle.LicensePlate || "66FA-19015";
          const typeUpper = (mainVehicle.type || "").toUpperCase();
          if (typeUpper === "BICYCLE") vehicleType = "Xe đạp";
          else if (typeUpper === "CAR") vehicleType = "Ô tô";
        }

        const localData = localStorage.getItem("parkingInvoices");
        if (localData) {
          const parsed = JSON.parse(localData);
          setInvoices(parsed.map((inv: any) => ({
            ...inv,
            plate: plateNumber,
            type: vehicleType
          })));
        } else {
          const initialInvoices = parkingInvoices.map((inv) => ({
            ...inv,
            plate: plateNumber,
            type: vehicleType
          }));
          setInvoices(initialInvoices);
          localStorage.setItem("parkingInvoices", JSON.stringify(initialInvoices));
        }
      } catch (err) {
        console.error("Failed to load room and vehicle info:", err);
      }
    }
    loadData();
  }, []);

  const payingInvoice = invoices.find((inv) => inv.id === payingId);
  const method = paymentMethods.find((m) => m.id === selectedMethod);

  const handleOpenModal = (id: number) => {
    setPayingId(id);
    setStep("select");
    setSelectedMethod(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setPayingId(null);
    setStep("select");
    setSelectedMethod(null);
  };

  const handleConfirmPaid = () => {
    if (!payingId) return;
    const updated = invoices.map((inv) =>
      inv.id === payingId ? { ...inv, status: "PAID" } : inv
    );
    setInvoices(updated);
    localStorage.setItem("parkingInvoices", JSON.stringify(updated));
    handleClose();
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleExportReceipt = (inv: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn gửi xe - SmartDorm</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .details { margin-top: 30px; line-height: 2; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 8px 0; }
            .label { color: #666; }
            .value { font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SMARTDORM</div>
            <div>HÓA ĐƠN THANH TOÁN GỬI XE</div>
          </div>
          <div class="details">
            <div class="row"><span class="label">Mã hóa đơn:</span><span class="value">SD-PK-${inv.id}-${inv.billingMonth}${inv.billingYear}</span></div>
            <div class="row"><span class="label">Phòng:</span><span class="value">${roomNumber}</span></div>
            <div class="row"><span class="label">Biển số xe:</span><span class="value">${inv.plate}</span></div>
            <div class="row"><span class="label">Loại xe:</span><span class="value">${inv.type}</span></div>
            <div class="row"><span class="label">Loại vé:</span><span class="value">${inv.ticketType === "MONTHLY" ? "Vé tháng" : "Vé ngày"}</span></div>
            <div class="row"><span class="label">Kỳ thanh toán:</span><span class="value">Tháng ${inv.billingMonth}/${inv.billingYear}</span></div>
            <div class="row"><span class="label">Số tiền:</span><span class="value">${inv.amount.toLocaleString("vi-VN")}đ</span></div>
            <div class="row"><span class="label">Trạng thái:</span><span class="value" style="color: green;">ĐÃ THANH TOÁN</span></div>
          </div>
          <div class="footer">
            <p>Cảm ơn bạn đã thanh toán dịch vụ gửi xe tại SmartDorm!</p>
            <p>Hóa đơn được xuất tự động từ hệ thống.</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Construct dynamic transfer description
  const transferContent = payingInvoice 
    ? `SMARTDORM GUIXE ${roomNumber} ${payingInvoice.plate}`
    : "SMARTDORM GUIXE";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">
          ← Quay lại
        </button>
        <h1 className="font-bold text-blue-600 flex items-center gap-1">
          <ParkingSquare size={18} /> Hóa đơn gửi xe
        </h1>
        <div />
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-semibold text-gray-800">Tháng {inv.billingMonth}/{inv.billingYear}</h2>
                <p className="text-sm text-gray-400">{inv.plate} · {inv.type}</p>
                <p className="text-xs text-gray-400">{inv.ticketType === "MONTHLY" ? "Vé tháng" : "Vé ngày"}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                inv.status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : inv.status === "WAITING"
                  ? "bg-blue-100 text-blue-700"
                  : inv.status === "OVERDUE"
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {inv.status === "PAID"
                  ? "Đã thanh toán"
                  : inv.status === "WAITING"
                  ? "Chờ duyệt"
                  : inv.status === "OVERDUE"
                  ? "Quá hạn"
                  : "Chờ thanh toán"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-600 text-lg">
                {inv.amount.toLocaleString("vi-VN")}đ
              </span>
              {inv.status === "PENDING" && (
                <button
                  onClick={() => handleOpenModal(inv.id)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <CreditCard size={14} /> Thanh toán
                </button>
              )}
              {inv.status === "WAITING" && (
                <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" /> Đang chờ duyệt
                </span>
              )}
              {inv.status === "PAID" && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                    <CheckCircle2 size={16} /> Đã thanh toán
                  </span>
                  <button
                    onClick={() => handleExportReceipt(inv)}
                    className="text-xs bg-slate-100 border hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1"
                  >
                    Xuất hóa đơn
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && payingInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl text-gray-800">

            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {step === "confirm" && (
                  <button onClick={() => setStep("select")} className="text-gray-400 hover:text-gray-600 text-sm">
                    ← Quay lại
                  </button>
                )}
                <h3 className="font-semibold text-base">
                  {step === "select" ? "Chọn phương thức thanh toán" : "Thông tin thanh toán"}
                </h3>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Bước 1: Chọn phương thức */}
            {step === "select" && (
              <>
                <div className="space-y-2">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                        selectedMethod === m.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{m.label}</p>
                        <p className="text-xs text-gray-400">{m.description}</p>
                      </div>
                      {selectedMethod === m.id
                        ? <CheckCircle2 size={18} className="text-blue-500" />
                        : <ChevronRight size={18} className="text-gray-300" />
                      }
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("confirm")}
                  disabled={!selectedMethod}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tiếp tục
                </button>
              </>
            )}

            {/* Bước 2: Thông tin thanh toán */}
            {step === "confirm" && method && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  {method.id === "bank" && (
                    <>
                      <InfoRow label="Ngân hàng" value={method.detail.bankName!} />
                      <InfoRow
                        label="Số tài khoản"
                        value={method.detail.accountNumber!}
                        onCopy={() => handleCopy(method.detail.accountNumber!, "acc")}
                        copied={copied === "acc"}
                      />
                      <InfoRow label="Chủ tài khoản" value={method.detail.accountName!} />
                      <InfoRow
                        label="Nội dung CK"
                        value={transferContent}
                        onCopy={() => handleCopy(transferContent, "content")}
                        copied={copied === "content"}
                      />
                    </>
                  )}
                  {(method.id === "momo" || method.id === "zalopay") && (
                    <>
                      <InfoRow
                        label="Số điện thoại"
                        value={method.detail.phone!}
                        onCopy={() => handleCopy(method.detail.phone!, "phone")}
                        copied={copied === "phone"}
                      />
                      <InfoRow label="Tên tài khoản" value={method.detail.accountName!} />
                      <InfoRow
                        label="Nội dung"
                        value={transferContent}
                        onCopy={() => handleCopy(transferContent, "content")}
                        copied={copied === "content"}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
                  <span>Số tiền cần chuyển</span>
                  <span className="font-bold text-blue-600 text-base">
                    {payingInvoice.amount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Sau khi chuyển tiền xong, nhấn xác nhận bên dưới
                </p>

                <button
                  onClick={handleConfirmPaid}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Tôi đã chuyển tiền
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-gray-400 hover:text-blue-500 transition">
            {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}