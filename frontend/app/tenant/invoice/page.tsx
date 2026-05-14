"use client";

import { useState } from "react";
import {
  Bell,
  FileText,
  CreditCard,
  CheckCircle2,
  X,
  Banknote,
  Smartphone,
  Wallet,
  ChevronRight,
  Copy,
} from "lucide-react";

const invoice = {
  month: "Tháng 5/2025",
  room: "P101",
  items: [
    { label: "Tiền phòng", amount: 1500000 },
    { label: "Tiền điện (150 số)", amount: 225000 },
    { label: "Tiền nước (8 khối)", amount: 56000 },
    { label: "Phí khác", amount: 20000 },
  ],
  status: "PENDING",
  dueDate: "2025-05-20",
};

const notifications = [
  { id: 1, message: "Hóa đơn tháng 5 đã được tạo", time: "2 giờ trước", read: false },
  { id: 2, message: "Yêu cầu thuê phòng P101 đã được duyệt", time: "2 ngày trước", read: true },
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
      accountName: "NGUYEN VAN A",
      content: "SMARTDORM P101 T5/2025",
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
      content: "SMARTDORM P101 T5/2025",
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
      content: "SMARTDORM P101 T5/2025",
    },
  },
];

type Step = "select" | "confirm";

export default function TenantInvoice() {
  const [paid, setPaid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [copied, setCopied] = useState<string | null>(null);

  const total = invoice.items.reduce((sum, i) => sum + i.amount, 0);
  const method = paymentMethods.find((m) => m.id === selectedMethod);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleClose = () => {
    setShowModal(false);
    setStep("select");
    setSelectedMethod(null);
  };

  const handleConfirmPaid = () => {
    handleClose();
    setPaid(true);
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      {/* Thông báo */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Bell size={16} className="text-yellow-500" />
          Thông báo
        </h2>
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`py-2 border-b last:border-0 flex justify-between items-start ${
              !n.read ? "font-medium" : "text-gray-400"
            }`}
          >
            <span className="text-sm">{n.message}</span>
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{n.time}</span>
          </div>
        ))}
      </div>

      {/* Hóa đơn */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText size={16} className="text-gray-500" />
            {invoice.month}
          </h2>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            {paid ? "ĐÃ THANH TOÁN" : "PENDING"}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3">Phòng: {invoice.room} · Hạn: {invoice.dueDate}</p>

        <div className="space-y-2 mb-4">
          {invoice.items.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span>{item.amount.toLocaleString("vi-VN")}đ</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {!paid ? (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            Thanh toán ngay
          </button>
        ) : (
          <div className="text-center text-green-600 font-medium py-2 flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            Đã thanh toán thành công!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">

            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {step === "confirm" && (
                  <button
                    onClick={() => setStep("select")}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
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
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{m.label}</p>
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
                        value={method.detail.content!}
                        onCopy={() => handleCopy(method.detail.content!, "content")}
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
                        value={method.detail.content!}
                        onCopy={() => handleCopy(method.detail.content!, "content")}
                        copied={copied === "content"}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
                  <span>Số tiền cần chuyển</span>
                  <span className="font-bold text-blue-600 text-base">{total.toLocaleString("vi-VN")}đ</span>
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