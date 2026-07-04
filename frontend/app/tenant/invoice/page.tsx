"use client";

import { useState, useEffect, useRef } from "react";
import { fetchAPI, API_URL } from "@/lib/api";
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
  AlertCircle,
  Sparkles,
  UploadCloud,
  QrCode,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import OcrScanOverlay from "@/components/ui/OcrScanOverlay";

const paymentMethods = [
  {
    id: "bank",
    label: "Chuyển khoản ngân hàng",
    description: "Ngân hàng MB Bank (VietQR)",
    icon: <Banknote size={22} className="text-blue-600" />,
    detail: {
      bankName: "MB Bank (Ngân hàng Quân đội)",
      accountNumber: "0704569016",
      accountName: "PHAM CAO CHI THANH",
    },
  },
  {
    id: "momo",
    label: "MoMo",
    description: "Ví điện tử MoMo",
    icon: <Wallet size={22} className="text-pink-500" />,
    detail: {
      phone: "PSP2607411100000389",
      accountName: "PHAM CAO CHI THANH",
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
  const [ocrLoading, setOcrLoading] = useState(false);
  const [roomAnalytic, setRoomAnalytic] = useState<any>(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        const dynamicNotifications = [];
        let notifId = 1;

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

        try {
          const maintRes = await fetchAPI("/maintenances");
          if (maintRes.success && Array.isArray(maintRes.data)) {
            maintRes.data.forEach((m: any) => {
              const isDone = m.status === "DONE";
              const dateStr = new Date(m.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              let scheduleInfo = "";
              if (m.scheduled_for || m.scheduledFor) {
                const schedDate = new Date(m.scheduled_for || m.scheduledFor).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                scheduleInfo = ` - Lịch hẹn: ${schedDate}`;
              }

              let completionInfo = "";
              if (m.completed_at || m.completedAt) {
                const compDate = new Date(m.completed_at || m.completedAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                completionInfo = ` - Hoàn thành: ${compDate}`;
              }

              const statusText = m.status === "OPEN" ? "Chờ xử lý" : m.status === "IN_PROGRESS" ? "Đang xử lý" : "Đã hoàn thành";
              
              dynamicNotifications.push({
                id: notifId++,
                message: `🔧 Bảo trì phòng ${m.room_number || "—"}: ${m.description}${scheduleInfo}${completionInfo} (${statusText})`,
                time: dateStr,
                read: isDone
              });
            });
          }
        } catch (maintErr) {
          console.error("Lỗi khi tải thông báo bảo trì:", maintErr);
        }

        setNotifications(dynamicNotifications);

        // Load utility analytics for tenant's room
        if (res.data.room?.id) {
          try {
            const analyticsRes = await fetchAPI("/utilities/analytics");
            if (analyticsRes.success && Array.isArray(analyticsRes.data)) {
              const myRoomAnalytic = analyticsRes.data.find(
                (item: any) => item.roomId === res.data.room.id
              );
              setRoomAnalytic(myRoomAnalytic || null);
            }
          } catch (analyticErr) {
            console.error("Lỗi khi tải phân tích điện nước:", analyticErr);
          }
        }

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
    loadInvoiceData();
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
    setReceiptUploaded(false);
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

  const handleReceiptOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !invoice) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setOcrLoading(true);
      const token = sessionStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/upload/ocr-receipt`, {
        method: "POST",
        body: formData,
        headers
      });

      if (!response.ok) throw new Error("Không thể đọc biên lai");

      setReceiptUploaded(true);

      const result = await response.json();
      if (result.success) {
        // Automatically mark the invoice as paid
        const payRes = await fetchAPI(`/invoices/${invoice.id}/pay`, {
          method: "POST",
          body: JSON.stringify({
            paymentMethod: "BANK_TRANSFER (AI/OCR AUTO-MATCH)"
          })
        });

        if (payRes.success) {
          setInvoice((prev: any) => ({ ...prev, status: "PAID" }));
          setNotifications(prev => prev.map(n => n.message.includes("Hóa đơn") ? { ...n, read: true } : n));
          
          // Automatically download PDF invoice
          try {
            const token = sessionStorage.getItem("token");
            const headers: any = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const pdfResponse = await fetch(`${API_URL}/invoices/${invoice.id}/pdf`, { headers });
            if (pdfResponse.ok) {
              const blob = await pdfResponse.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `HoaDon_Phong${roomNumber}_Thang${invoice.billingMonth}_${invoice.billingYear}.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }
          } catch (pdfErr) {
            console.error("Lỗi tự động tải PDF hóa đơn:", pdfErr);
          }

          alert(`AI đối soát thành công:\n- Mã giao dịch: ${result.transactionId}\n- Số tiền khớp: ${Number(result.amount).toLocaleString("vi-VN")}đ\nHóa đơn đã được thanh toán và hệ thống đã tự động xuất tải PDF hóa đơn về máy của bạn!`);
          handleClose();
        } else {
          alert("Đối soát thành công nhưng không thể cập nhật trạng thái hóa đơn.");
        }
      } else {
        alert("Ảnh biên lai không trùng khớp thông tin hóa đơn.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi đối soát biên lai: " + err.message);
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadPdfManual = async () => {
    if (!invoice) return;
    try {
      const token = sessionStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const pdfResponse = await fetch(`${API_URL}/invoices/${invoice.id}/pdf`, { headers });
      if (!pdfResponse.ok) throw new Error("Không thể xuất tải file PDF hóa đơn.");
      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HoaDon_Phong${roomNumber}_Thang${invoice.billingMonth}_${invoice.billingYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi khi tải hóa đơn PDF: " + err.message);
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

  // Dynamic VietQR Generation URL
  const qrTransferContent = invoice ? `SMARTDORM PHONG ${roomNumber} T${invoice.billingMonth}/${invoice.billingYear}` : "";
  const vietQrUrl = `https://img.vietqr.io/image/MB-0704569016-compact2.png?amount=${total}&addInfo=${encodeURIComponent(qrTransferContent)}&accountName=${encodeURIComponent("PHAM CAO CHI THANH")}`;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải hóa đơn của bạn...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24 animate-fade-in">
      {/* Thông báo */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
          <Bell size={16} className="text-yellow-500" />
          Thông báo
        </h2>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`py-2 border-b last:border-0 flex justify-between items-start ${
                !n.read ? "font-medium" : "text-gray-400"
              }`}
            >
              <span className="text-sm">{n.message}</span>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{n.time}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 py-2">Không có thông báo nào mới.</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Hóa đơn */}
      {invoice ? (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold flex items-center gap-2 text-gray-800">
              <FileText size={16} className="text-gray-500" />
              Tháng {invoice.billingMonth}/{invoice.billingYear}
            </h2>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
              isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {isPaid ? "ĐÃ THANH TOÁN" : "PENDING"}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-3">Phòng: {roomNumber} · Hạn: {invoice.dueDate || `${invoice.billingYear}-${String(invoice.billingMonth).padStart(2, '0')}-20`}</p>

          <div className="space-y-2 mb-4">
            {invoiceItems.map((item) => (
              <div key={item.label} className="flex justify-between text-sm text-gray-600">
                <span>{item.label}</span>
                <span className="font-medium text-gray-800">{item.amount.toLocaleString("vi-VN")}đ</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2 text-gray-800">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {!isPaid ? (
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              Thanh toán ngay
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-center text-green-600 font-medium py-2 flex items-center justify-center gap-2 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 size={18} />
                Đã thanh toán thành công!
              </div>
              <button
                onClick={handleDownloadPdfManual}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm shadow-xs"
              >
                <FileText size={16} /> Tải hóa đơn PDF
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          <FileText className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-sm">Hiện tại bạn không có hóa đơn nào cần thanh toán.</p>
        </div>
      )}

      {/* Biểu đồ phân tích điện nước & Cảnh báo rò rỉ */}
      {roomAnalytic && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
            <TrendingUp size={16} className="text-blue-500" />
            Phân tích tiêu thụ phòng {roomNumber}
          </h2>

          {/* Anomaly warning for tenant */}
          {(roomAnalytic.waterAnalytics.isAnomaly || roomAnalytic.electricAnalytics.isAnomaly) && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle size={14} className="text-red-600 animate-bounce" />
                HỆ THỐNG PHÁT HIỆN BẤT THƯỜNG
              </div>
              <div className="text-xs text-red-700 space-y-1.5">
                {roomAnalytic.waterAnalytics.isAnomaly && (
                  <p>💧 <strong>Nước:</strong> {roomAnalytic.waterAnalytics.message}</p>
                )}
                {roomAnalytic.electricAnalytics.isAnomaly && (
                  <p>⚡ <strong>Điện:</strong> {roomAnalytic.electricAnalytics.message}</p>
                )}
                <p className="font-medium text-red-600 italic">Vui lòng kiểm tra lại thiết bị điện nước của phòng hoặc tạo yêu cầu hỗ trợ sửa chữa nếu có hiện tượng rò rỉ.</p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            {/* Water chart */}
            {roomAnalytic.waterAnalytics.history.length > 0 && (
              <div className="border border-gray-50 rounded-lg p-3 bg-gray-50/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">💧 Chỉ số nước tiêu thụ (m³)</span>
                  {roomAnalytic.waterAnalytics.isAnomaly && (
                    <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full animate-pulse">⚠️ Rò rỉ</span>
                  )}
                </div>
                <div className="h-28 w-full flex items-end justify-between gap-1 pt-4 border-b border-l px-1 relative">
                  <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-100/50"></div>
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100/50"></div>
                  
                  {roomAnalytic.waterAnalytics.history.map((h: any, idx: number) => {
                    const max = Math.max(...roomAnalytic.waterAnalytics.history.map((item: any) => item.consumption), 1);
                    const heightPct = (h.consumption / max) * 80;
                    const isLatest = idx === roomAnalytic.waterAnalytics.history.length - 1;
                    const isAnomaly = isLatest && roomAnalytic.waterAnalytics.isAnomaly;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div className="absolute -top-6 text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition z-10 bg-white border px-1 rounded shadow-xs">
                          {h.consumption}m³
                        </div>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-sm transition-all duration-500 ${
                            isAnomaly
                              ? "bg-red-500"
                              : "bg-blue-500/80 group-hover:bg-blue-500"
                          }`}
                        ></div>
                        <span className="text-[8px] text-gray-400 mt-1">{h.month}/{String(h.year).slice(-2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Electric chart */}
            {roomAnalytic.electricAnalytics.history.length > 0 && (
              <div className="border border-gray-50 rounded-lg p-3 bg-gray-50/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">⚡ Chỉ số điện tiêu thụ (kWh)</span>
                  {roomAnalytic.electricAnalytics.isAnomaly && (
                    <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full animate-pulse">⚠️ Rò điện</span>
                  )}
                </div>
                <div className="h-28 w-full flex items-end justify-between gap-1 pt-4 border-b border-l px-1 relative">
                  <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-100/50"></div>
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100/50"></div>
                  
                  {roomAnalytic.electricAnalytics.history.map((h: any, idx: number) => {
                    const max = Math.max(...roomAnalytic.electricAnalytics.history.map((item: any) => item.consumption), 1);
                    const heightPct = (h.consumption / max) * 80;
                    const isLatest = idx === roomAnalytic.electricAnalytics.history.length - 1;
                    const isAnomaly = isLatest && roomAnalytic.electricAnalytics.isAnomaly;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        <div className="absolute -top-6 text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition z-10 bg-white border px-1 rounded shadow-xs">
                          {h.consumption}kWh
                        </div>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-sm transition-all duration-500 ${
                            isAnomaly
                              ? "bg-red-500"
                              : "bg-yellow-500/80 group-hover:bg-yellow-500"
                          }`}
                        ></div>
                        <span className="text-[8px] text-gray-400 mt-1">{h.month}/{String(h.year).slice(-2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl text-gray-800">

            {/* Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                {step === "confirm" && (
                  <button
                    onClick={() => setStep("select")}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
                  >
                    ← Quay lại
                  </button>
                )}
                <h3 className="font-semibold text-base text-slate-800">
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
                {/* Dynamic VietQR code display */}
                {method.id === "bank" && (
                  <div className="flex flex-col items-center p-3 bg-linear-to-b from-indigo-50/50 to-white rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs mb-2">
                      <QrCode size={14} /> Quét mã VietQR để thanh toán nhanh
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vietQrUrl}
                      alt="VietQR Code"
                      className="w-48 h-48 object-contain border rounded-xl shadow-xs"
                    />
                  </div>
                )}

                {method.id === "momo" && (
                  <div className="flex flex-col items-center p-3 bg-linear-to-b from-pink-50/50 to-white rounded-2xl border border-pink-100/50">
                    <div className="flex items-center gap-1.5 text-pink-700 font-bold text-xs mb-2">
                      <QrCode size={14} /> Quét mã MoMo để thanh toán nhanh
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.vietqr.io/image/VietCapitalBank-PSP2607411100000389-compact2.png?amount=${total}&addInfo=${encodeURIComponent(qrTransferContent)}&accountName=${encodeURIComponent("PHAM CAO CHI THANH")}`}
                      alt="MoMo QR Code"
                      className="w-48 h-48 object-contain border rounded-xl shadow-xs"
                    />
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  {method.id === "bank" && (
                    <>
                      <InfoRow label="Ngân hàng" value={method.detail.bankName || ""} />
                      <InfoRow
                        label="Số tài khoản"
                        value={method.detail.accountNumber || ""}
                        onCopy={() => handleCopy(method.detail.accountNumber || "", "acc")}
                        copied={copied === "acc"}
                      />
                      <InfoRow label="Chủ tài khoản" value={method.detail.accountName || ""} />
                      <InfoRow
                        label="Nội dung CK"
                        value={qrTransferContent}
                        onCopy={() => handleCopy(qrTransferContent, "content")}
                        copied={copied === "content"}
                      />
                    </>
                  )}
                  {method.id === "momo" && (
                    <>
                      <InfoRow
                        label={method.detail.phone?.startsWith("PSP") ? "Số tài khoản" : "Số điện thoại"}
                        value={method.detail.phone || ""}
                        onCopy={() => handleCopy(method.detail.phone || "", "phone")}
                        copied={copied === "phone"}
                      />
                      <InfoRow label="Tên tài khoản" value={method.detail.accountName || ""} />
                      <InfoRow
                        label="Nội dung"
                        value={qrTransferContent}
                        onCopy={() => handleCopy(qrTransferContent, "content")}
                        copied={copied === "content"}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
                  <span>Số tiền cần chuyển</span>
                  <span className="font-bold text-blue-600 text-base">{total.toLocaleString("vi-VN")}đ</span>
                </div>

                {/* Simulated Receipt OCR File Uploader (WOW factor!) */}
                <div className="border border-dashed border-emerald-200 bg-emerald-50/50 p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <Sparkles className="text-emerald-600 animate-pulse" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">📸 Tự động đối khớp bằng AI/OCR</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tải ảnh chụp màn hình biên lai chuyển khoản để duyệt hóa đơn ngay lập tức</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleReceiptOcr}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition shadow-xs"
                  >
                    <UploadCloud size={14} /> Tải lên biên lai
                  </button>
                </div>

                <div className="text-[10px] text-gray-400 text-center">
                  Hoặc bấm xác nhận thủ công nếu không tải được ảnh
                </div>

                <button
                  onClick={handleConfirmPaid}
                  disabled={!receiptUploaded}
                  className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    receiptUploaded
                      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={18} />
                  Xác nhận tôi đã chuyển tiền
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Render Scan Overlay if OCR is processing */}
      {ocrLoading && <OcrScanOverlay statusText="AI đang phân tích và đối soát biên lai..." />}
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
    <div className="flex justify-between items-center text-gray-800">
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