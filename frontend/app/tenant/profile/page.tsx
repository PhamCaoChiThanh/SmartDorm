"use client";

import { useState, useEffect, useRef } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Home,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
  X,
  TrendingUp,
  Activity,
  DollarSign
} from "lucide-react";

// Resize & compress image to base64 for avatar (max 250px width, quality 0.85)
function resizeAndConvertToBase64(file: File, maxWidth = 250, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function TenantProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    cccd: "",
    avatarUrl: ""
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [viewAvatarOpen, setViewAvatarOpen] = useState(false);

  const updateAvatarDirectly = async (base64: string) => {
    try {
      setAvatarLoading(true);
      setMessage(null);
      const payload = {
        fullName: profile?.fullName || formData.fullName,
        phone: profile?.phone || formData.phone,
        email: profile?.email || formData.email,
        cccd: profile?.cccd || formData.cccd,
        avatarUrl: base64
      };
      const res = await fetchAPI("/tenants/me", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (res.success) {
        setMessage({ type: "success", text: "Cập nhật ảnh đại diện thành công!" });
        setProfile((prev: any) => ({ ...prev, avatar_url: base64 }));
        setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Không thể cập nhật ảnh đại diện." });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Vui lòng chọn file hình ảnh hợp lệ." });
      return;
    }
    try {
      setAvatarLoading(true);
      setMessage(null);
      const base64 = await resizeAndConvertToBase64(file, 250, 0.85);
      if (editMode) {
        setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
      } else {
        await updateAvatarDirectly(base64);
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Lỗi đọc file ảnh. Vui lòng thử lại." });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/tenants/me");
      if (res.success && res.data) {
        setProfile(res.data);
        setFormData({
          fullName: res.data.fullName || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          cccd: res.data.cccd || "",
          avatarUrl: res.data.avatar_url || ""
        });
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      if (err.message && (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized"))) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      setMessage({ type: "error", text: err.message || "Không thể kết nối đến máy chủ." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.fullName.trim()) {
      setMessage({ type: "error", text: "Họ và tên không được để trống." });
      return;
    }

    const cccdRegex = /^\d{12}$/;
    if (!cccdRegex.test(formData.cccd.trim())) {
      setMessage({ type: "error", text: "Số CCCD phải có đúng 12 chữ số." });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setMessage({ type: "error", text: "Số điện thoại phải có đúng 10 chữ số." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setMessage({ type: "error", text: "Địa chỉ email không đúng định dạng." });
      return;
    }

    try {
      setSaving(true);
      const res = await fetchAPI("/tenants/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          cccd: formData.cccd,
          avatarUrl: formData.avatarUrl
        })
      });
      if (res.success) {
        setMessage({ type: "success", text: "Cập nhật thông tin cá nhân thành công!" });
        setProfile((prev: any) => ({
          ...prev,
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          cccd: formData.cccd,
          avatar_url: formData.avatarUrl
        }));
        setEditMode(false);
        // Cập nhật lại thông tin lưu ở localStorage
        localStorage.setItem("currentName", formData.fullName);
        localStorage.setItem("currentEmail", formData.email);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setMessage({ type: "error", text: err.message || "Cập nhật thất bại." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        email: profile.email || "",
        cccd: profile.cccd || "",
        avatarUrl: profile.avatar_url || ""
      });
    }
    setEditMode(false);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header Profile */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl translate-x-8 -translate-y-8"></div>
        <div className="relative z-10 flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile avatar"
              onClick={() => setAvatarMenuOpen(true)}
              className="w-16 h-16 rounded-2xl object-cover border border-white/30 bg-white/20 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 hover:ring-2 hover:ring-white/50"
            />
          ) : (
            <div
              onClick={() => setAvatarMenuOpen(true)}
              className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold border border-white/30 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 hover:ring-2 hover:ring-white/50"
            >
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile?.fullName || "Sinh viên SmartDorm"}</h1>
            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
              <span className="bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Sinh viên
              </span>
              {profile?.room ? (
                <span className="bg-emerald-500/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  Phòng: {profile.room.roomNumber}
                </span>
              ) : (
                <span className="bg-amber-500/85 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  Chưa nhận phòng
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo Feedback */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: Thông tin cá nhân */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="font-bold text-gray-800 dark:text-zinc-100 text-lg flex items-center gap-2">
              <User size={18} className="text-blue-600 dark:text-blue-400" />
              Thông tin cá nhân
            </h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Edit2 size={14} />
                Chỉnh sửa
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
              >
                <X size={14} />
                Hủy bỏ
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                Họ và Tên
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-550" />
                <input
                  type="text"
                  required
                  disabled={!editMode}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none transition-colors ${
                    editMode
                      ? "border-blue-300 dark:border-blue-700 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      : "border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400"
                  }`}
                />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            <div className="space-y-1">
              <label className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                Số CCCD / Hộ chiếu
              </label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-550" />
                <input
                  type="text"
                  required
                  disabled={!editMode}
                  value={formData.cccd}
                  onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none transition-colors ${
                    editMode
                      ? "border-blue-300 dark:border-blue-700 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      : "border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-550" />
                <input
                  type="tel"
                  disabled={!editMode}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none transition-colors ${
                    editMode
                      ? "border-blue-300 dark:border-blue-700 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      : "border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400"
                  }`}
                  placeholder="Chưa cập nhật SĐT"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-550" />
                <input
                  type="email"
                  disabled={!editMode}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none transition-colors ${
                    editMode
                      ? "border-blue-300 dark:border-blue-700 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      : "border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400"
                  }`}
                  placeholder="Chưa cập nhật email"
                />
              </div>
            </div>

            {editMode && (
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/10"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                ) : (
                  <Save size={16} />
                )}
                Lưu thay đổi
              </button>
            )}
          </form>
        </div>

        {/* Cột 2: Thông tin phòng ở & hợp đồng */}
        <div className="space-y-6">
          {/* Thông tin phòng */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 dark:text-zinc-100 text-lg flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
              <Home size={18} className="text-blue-600 dark:text-blue-400" />
              Thông tin phòng ở
            </h2>

            {profile?.room ? (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Số phòng</span>
                  <span className="font-bold text-gray-800 dark:text-zinc-100 text-base">{profile.room.roomNumber}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Trạng thái</span>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    {profile.room.status === "AVAILABLE" ? "Còn trống" : "Đang thuê"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Giá phòng cơ bản</span>
                  <span className="font-bold text-gray-900 dark:text-zinc-550">
                    {profile.room.basePrice.toLocaleString("vi-VN")} đ/tháng
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
                  <p className="font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Đơn giá tiện ích phòng
                  </p>
                  <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                    <span>Đơn giá điện:</span>
                    <span className="font-semibold text-gray-800 dark:text-zinc-200">
                      {profile.room.electricityPrice.toLocaleString("vi-VN")} đ/số
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                    <span>Đơn giá nước:</span>
                    <span className="font-semibold text-gray-800 dark:text-zinc-200">
                      {profile.room.waterPrice.toLocaleString("vi-VN")} đ/khối
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                    <span>Phí rác:</span>
                    <span className="font-semibold text-gray-800 dark:text-zinc-200">
                      {profile.room.garbageFee.toLocaleString("vi-VN")} đ/tháng
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-zinc-500 space-y-2">
                <AlertCircle size={32} className="mx-auto text-gray-300 dark:text-zinc-650" />
                <p className="text-sm">Bạn hiện chưa được sắp xếp phòng nào.</p>
              </div>
            )}
          </div>

          {/* Thông tin Hợp đồng */}
          {profile?.contract && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 space-y-4">
              <h2 className="font-bold text-gray-800 dark:text-zinc-100 text-lg flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
                <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                Thời hạn hợp đồng
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Ngày bắt đầu</span>
                  <span className="font-semibold text-gray-700 dark:text-zinc-300">{profile.contract.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Ngày kết thúc</span>
                  <span className="font-semibold text-gray-700 dark:text-zinc-300">{profile.contract.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Trạng thái hợp đồng</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      profile.contract.status === "ACTIVE"
                        ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-355"
                    }`}
                  >
                    {profile.contract.status === "ACTIVE" ? "Đang hiệu lực" : profile.contract.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử hóa đơn của bạn */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 space-y-4">
        <h2 className="font-bold text-gray-800 dark:text-zinc-100 text-lg flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
          <FileText size={18} className="text-blue-600 dark:text-blue-400" />
          Hóa đơn của bạn
        </h2>

        {profile?.invoices && profile.invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-zinc-300">
              <thead className="text-xs text-gray-400 dark:text-zinc-500 uppercase bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Kỳ hóa đơn
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tổng tiền
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Đã trả
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {profile.invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-4 font-semibold text-gray-900 dark:text-zinc-105">
                      Tháng {inv.billingMonth}/{inv.billingYear}
                    </td>
                    <td className="px-4 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {inv.totalAmount ? inv.totalAmount.toLocaleString("vi-VN") : "0"} đ
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-zinc-400">
                      {inv.paidAmount ? inv.paidAmount.toLocaleString("vi-VN") : "0"} đ
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          inv.status === "PAID"
                            ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                            : inv.status === "OVERDUE"
                            ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                            : "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {inv.status === "PAID"
                          ? "Đã thanh toán"
                          : inv.status === "OVERDUE"
                          ? "Quá hạn"
                          : "Chờ thanh toán"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <a
                        href="/tenant/invoice"
                        className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 px-3 py-1.5 rounded-lg font-semibold transition"
                      >
                        Chi tiết
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 dark:text-zinc-500 space-y-2">
            <AlertCircle size={32} className="mx-auto text-gray-300 dark:text-zinc-650" />
            <p className="text-sm">Không có dữ liệu hóa đơn nào.</p>
          </div>
        )}
      </div>

      {/* Modal Lựa chọn Ảnh đại diện */}
      {avatarMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setAvatarMenuOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 w-80 max-w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-lg text-center mb-4">Ảnh đại diện</h3>
            <div className="space-y-2">
              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={() => {
                    setViewAvatarOpen(true);
                    setAvatarMenuOpen(false);
                  }}
                  className="w-full text-left font-semibold text-sm px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl text-gray-700 dark:text-zinc-300 transition-colors"
                >
                  Xem ảnh đại diện
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setAvatarMenuOpen(false);
                }}
                className="w-full text-left font-semibold text-sm px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl text-gray-700 dark:text-zinc-300 transition-colors"
              >
                Thay ảnh đại diện
              </button>
              <button
                type="button"
                onClick={() => setAvatarMenuOpen(false)}
                className="w-full text-center font-bold text-sm px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors mt-2"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Ảnh đại diện fullsize */}
      {viewAvatarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={() => setViewAvatarOpen(false)}>
          <div className="relative max-w-[95vw] max-h-[85vh] animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewAvatarOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={profile?.avatar_url}
              alt="Avatar Fullsize"
              className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
