/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
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
  AlertCircle
} from "lucide-react";

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
      content: "SMARTDORM COMPLETED T5/2025",
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
      content: "SMARTDORM COMPLETED T5/2025",
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
      content: "SMARTDORM COMPLETED T5/2025",
    },
  },
];

type Step = "select" | "confirm";

export default function TenantInvoice() {
  const [invoice, setInvoice] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [roomNumber, setRoomNumber] = useState("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [copied, setCopied] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  async function loadInvoiceData() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/tenants/me");
      if (res.success && res.data) {
        setRoom(res.data.room);
        setRoomNumber(res.data.room?.roomNumber || res.data.room?.room_number || "—");
        const invoices = res.data.invoices || [];
        const requests = res.data.requests || [];
        
        // Tạo danh sách thông báo động real-time
        const dynamicNotifications = [];
        let notifId = 1;

        // 1. Thông báo cho yêu cầu thuê phòng đã được duyệt
        const approvedRequest = requests.find((r: any) => r.status === "APPROVED");
        if (approvedRequest) {
          dynamicNotifications.push({
            id: notifId++,
            message: `Yêu cầu thuê phòng ${approvedRequest.roomNumber || ""} đã được duyệt`,
            time: "2 ngày trước",
            read: true
          });
        } else if (requests.length > 0) {
          const latestReq = requests[0];
          dynamicNotifications.push({
            id: notifId++,
            message: `Yêu cầu thuê phòng ${latestReq.roomNumber || ""} đang ở trạng thái ${latestReq.status === "PENDING" ? "Chờ duyệt" : "Từ chối"}`,
            time: "Vừa xong",
            read: false
          });
        }

        // 2. Thông báo cho hóa đơn
        if (invoices.length > 0) {
          const latestInvoice = invoices[0];
          const invoicePaid = latestInvoice.status === "PAID" || latestInvoice.status === "ĐÃ THANH TOÁN";
          dynamicNotifications.push({
            id: notifId++,
            message: `Hóa đơn tháng ${latestInvoice.billingMonth}/${latestInvoice.billingYear} đã được tạo`,
            time: "2 giờ trước",
            read: invoicePaid
          });
        }

        setNotifications(dynamicNotifications);

        if (invoices.length > 0) {
          setInvoice(invoices[0]);
        } else {
          setInvoice(null);
        }
      }
    } catch (err: any) {
      console.error("Lỗi khi tải hóa đơn:", err);
      setError("Không thể tải thông tin hóa đơn từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => loadInvoiceData());
  }, []);

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

  const handleConfirmPaid = async () => {
    if (!invoice) return;
    try {
      const res = await fetchAPI(`/invoices/${invoice.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          paymentMethod: selectedMethod === "bank" ? "BANK_TRANSFER" : selectedMethod?.toUpperCase() || "CASH"
        })
      });
      if (res.success) {
        setInvoice((prev: any) => ({ ...prev, status: "PAID" }));
        // Cập nhật thông báo đã đọc sau khi thanh toán thành công
        setNotifications(prev => prev.map(n => n.message.includes("Hóa đơn") ? { ...n, read: true } : n));
        handleClose();
      } else {
        alert(res.message || "Giao dịch thanh toán thất bại.");
      }
    } catch (err: any) {
      console.error("Lỗi khi thanh toán:", err);
      alert(err.message || "Có lỗi xảy ra khi xử lý thanh toán.");
    }
  };

  const electricityPrice = room?.electricityPrice || 3500;
  const waterPrice = room?.waterPrice || 15000;
  const garbageFee = room?.garbageFee || 50000;

  const electricUnits = invoice?.electricFee ? Math.round(invoice.electricFee / electricityPrice) : 0;
  const waterUnits = invoice?.waterFee ? Math.round(invoice.waterFee / waterPrice) : 0;

  const invoiceItems = invoice
    ? [
        { label: "Tiền phòng", amount: invoice.roomFee || 0 },
        ...(invoice.electricFee > 0 ? [{ label: `Tiền điện (${electricUnits} số)`, amount: invoice.electricFee }] : []),
        ...(invoice.waterFee > 0 ? [{ label: `Tiền nước (${waterUnits} khối)`, amount: invoice.waterFee }] : []),
        ...(garbageFee > 0 ? [{ label: "Phí rác", amount: garbageFee }] : []),
      ]
    : [];

  const total = invoiceItems.reduce((sum, i) => sum + i.amount, 0);
  const method = paymentMethods.find((m) => m.id === selectedMethod);
  const isPaid = invoice?.status === "PAID" || invoice?.status === "ĐÃ THANH TOÁN";

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4 text-gray-500 dark:text-zinc-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-400"></div>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">Đang tải hóa đơn của bạn...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      {/* Thông báo */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-zinc-100">
          <Bell size={16} className="text-yellow-500 dark:text-yellow-400" />
          Thông báo
        </h2>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`py-2 border-b dark:border-zinc-800 last:border-0 flex justify-between items-start ${
                !n.read ? "font-medium text-gray-800 dark:text-zinc-200" : "text-gray-400 dark:text-zinc-550"
              }`}
            >
              <span className="text-sm">{n.message}</span>
              <span className="text-xs text-gray-400 dark:text-zinc-550 ml-2 whitespace-nowrap">{n.time}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 dark:text-zinc-500 py-2">Không có thông báo nào mới.</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-900/30">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Hóa đơn */}
      {invoice ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-zinc-100">
              <FileText size={16} className="text-gray-500 dark:text-zinc-400" />
              Tháng {invoice.billingMonth}/{invoice.billingYear}
            </h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isPaid ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" : "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400"
            }`}>
              {isPaid ? "ĐÃ THANH TOÁN" : "PENDING"}
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">Phòng: {roomNumber} · Hạn: {invoice.dueDate || `${invoice.billingYear}-${String(invoice.billingMonth).padStart(2, '0')}-20`}</p>

          <div className="space-y-2 mb-4">
            {invoiceItems.map((item) => (
              <div key={item.label} className="flex justify-between text-sm text-gray-600 dark:text-zinc-400">
                <span>{item.label}</span>
                <span className="font-medium text-gray-800 dark:text-zinc-200">{item.amount.toLocaleString("vi-VN")}đ</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t dark:border-zinc-800 pt-2 mt-2 text-gray-800 dark:text-zinc-100">
              <span>Tổng cộng</span>
              <span className="text-blue-600 dark:text-blue-400">{total.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {!isPaid ? (
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 dark:bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              Thanh toán ngay
            </button>
          ) : (
            <div className="text-center text-green-600 dark:text-green-400 font-medium py-2 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
              <CheckCircle2 size={18} />
              Đã thanh toán thành công!
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm p-8 text-center text-gray-500 dark:text-zinc-400">
          <FileText className="mx-auto text-gray-300 dark:text-zinc-700 mb-2" size={48} />
          <p className="text-sm">Hiện tại bạn không có hóa đơn nào cần thanh toán.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl text-gray-800 dark:text-zinc-100 border border-gray-100 dark:border-zinc-800">

            {/* Header */}
            <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                {step === "confirm" && (
                  <button
                    onClick={() => setStep("select")}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-350 text-sm"
                  >
                    ← Quay lại
                  </button>
                )}
                <h3 className="font-semibold text-base">
                  {step === "select" ? "Chọn phương thức thanh toán" : "Thông tin thanh toán"}
                </h3>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-350">
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
                          ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800 dark:text-zinc-200">{m.label}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-550">{m.description}</p>
                      </div>
                      {selectedMethod === m.id
                        ? <CheckCircle2 size={18} className="text-blue-500 dark:text-blue-400" />
                        : <ChevronRight size={18} className="text-gray-300 dark:text-zinc-650" />
                      }
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("confirm")}
                  disabled={!selectedMethod}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tiếp tục
                </button>
              </>
            )}

            {/* Bước 2: Thông tin thanh toán */}
            {step === "confirm" && method && (
              <>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3 text-sm">
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
                        value={`SMARTDORM PHONG ${roomNumber} T${invoice.billingMonth}/${invoice.billingYear}`}
                        onCopy={() => handleCopy(`SMARTDORM PHONG ${roomNumber} T${invoice.billingMonth}/${invoice.billingYear}`, "content")}
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
                        value={`SMARTDORM PHONG ${roomNumber} T${invoice.billingMonth}/${invoice.billingYear}`}
                        onCopy={() => handleCopy(`SMARTDORM PHONG ${roomNumber} T${invoice.billingMonth}/${invoice.billingYear}`, "content")}
                        copied={copied === "content"}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-zinc-400 border-t dark:border-zinc-800 pt-3">
                  <span>Số tiền cần chuyển</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-base">{total.toLocaleString("vi-VN")}đ</span>
                </div>

                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                  Sau khi chuyển tiền xong, nhấn xác nhận bên dưới
                </p>

                <button
                  onClick={handleConfirmPaid}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-550 transition flex items-center justify-center gap-2"
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
    <div className="flex justify-between items-center text-gray-800 dark:text-zinc-200">
      <span className="text-gray-500 dark:text-zinc-455">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-zinc-100">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-gray-400 dark:text-zinc-550 hover:text-blue-500 dark:hover:text-blue-400 transition">
            {copied ? <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}