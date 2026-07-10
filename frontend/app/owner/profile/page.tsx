"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OwnerProfile() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "dungtrieu834",
    email: "dungtrieu834@gmail.com",
    firstName: "0424_Triệu Xuân",
    lastName: "Dũng",
    phone: "",
    address: "",
    city: "",
    country: "",
    postal: "",
    bio: "",
  });
  const [showPass, setShowPass] = useState(true);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 text-gray-700 placeholder-gray-300 transition";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner with background image overlay */}
      <div className="h-36 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
        {/* Decorative overlay pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=60')",
          backgroundSize: "cover", backgroundPosition: "center"
        }} />
        <div className="relative px-8 py-4 flex justify-between items-start">
          <div>
            <p className="text-xs text-white/70">Pages / Hồ sơ cá nhân</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Hồ sơ cá nhân</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white text-lg cursor-pointer">🔔</span>
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 text-white text-sm hover:opacity-80 transition"
            >
              <span>→|</span> Log out
            </button>
          </div>
        </div>
      </div>

      {/* Profile card overlapping banner */}
      <div className="px-8 -mt-10 mb-6">
        <div
          className="rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #6D28D9 100%)" }}
        >
          {/* Subtle diagonal lines */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px"
          }} />
          <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ background: "linear-gradient(135deg, #5B21B6, #EC4899)" }}>D</div>
            )}
          </div>
          <div className="relative flex-1">
            <h2 className="text-2xl font-bold text-white">
              {form.lastName} {form.firstName}
            </h2>
            <div className="flex items-center gap-1 mt-1 text-white/80 text-sm">
              <span>👤</span> <span>User</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-white/80 text-sm">
              <span>✉️</span> <span>{form.email}</span>
            </div>
          </div>
          <div className="relative">
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">
              ✔ Active
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== LEFT COLUMN ===== */}
        <div className="lg:col-span-2 space-y-5">

          {/* Thông tin cá nhân */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-base">
              <span>👤</span> Thông tin cá nhân
            </h3>
            <hr className="border-gray-100 mb-5" />

            {/* Avatar upload */}
            <div className="mb-5">
              <label className="text-sm text-gray-600 mb-2 block">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>D</div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border-2 font-medium transition hover:bg-orange-50"
                      style={{ borderColor: "#F97316", color: "#F97316" }}>
                      ↑ Tải ảnh lên
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <span className="text-blue-400">ℹ</span> JPG, PNG hoặc WEBP (tối đa 2MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Username & Email */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Tên đăng nhập <span className="text-red-400">*</span>
                </label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Email <span className="text-red-400">*</span>
                </label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            {/* Họ & Tên */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Họ</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Tên</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Số điện thoại/Zalo</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Nhập số điện thoại" className={inputCls} />
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-base">
              <span>📍</span> Thông tin liên hệ
            </h3>
            <hr className="border-gray-100 mb-5" />
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">Địa chỉ</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Số nhà, tên đường..." className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Thành phố</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Thành phố" className={inputCls} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Quốc gia</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Quốc gia" className={inputCls} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Mã bưu điện</label>
                <input value={form.postal} onChange={(e) => setForm({ ...form, postal: e.target.value })}
                  placeholder="Mã bưu điện" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Giới thiệu */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-base">
              <span>ℹ️</span> Giới thiệu
            </h3>
            <hr className="border-gray-100 mb-4" />
            <label className="text-sm text-gray-600 mb-1 block">Về tôi</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={5}
              placeholder="Viết vài dòng giới thiệu về bản thân..."
              className={`${inputCls} resize-y`}
            />
          </div>

          {/* Đổi mật khẩu */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-base">
              <span>🔑</span> Đổi mật khẩu
            </h3>
            <hr className="border-gray-100 mb-5" />

            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">
                Mật khẩu hiện tại <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={`${inputCls} pr-10`}
                />
                <button onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  👁
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Mật khẩu mới <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    placeholder="Nhập mật khẩu mới"
                    className={`${inputCls} pr-10`}
                  />
                  <button onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    👁
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Xác nhận mật khẩu mới <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`${inputCls} pr-10`}
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    👁
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
              <span className="text-blue-400">ℹ</span> Tối thiểu 8 ký tự
            </p>
            <button
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
            >
              🔒 Đổi mật khẩu
            </button>
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="space-y-5">
          {/* Hành động */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
              <span>⚙️</span> Hành động
            </h3>
            <button
              className="w-full py-3 rounded-xl text-white font-semibold text-sm mb-3 transition hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
            >
              💾 Lưu thay đổi
            </button>
            <button
              onClick={() => router.push("/owner/dashboard")}
              className="w-full py-3 rounded-xl text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              ← Quay lại Dashboard
            </button>
          </div>

          {/* Bảo mật */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
              🛡️ Bảo mật
            </h3>
            <button
              className="w-full py-3 rounded-xl font-medium text-sm border-2 transition hover:bg-orange-50 flex items-center justify-center gap-2"
              style={{ borderColor: "#F97316", color: "#F97316" }}
            >
              🔑 Đổi mật khẩu
            </button>
          </div>

          {/* Thông tin tài khoản */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">ℹ</span>
              Thông tin tài khoản
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <span>📅</span>
                <span>Tham gia: <strong>20/05/2026</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <span>🔄</span>
                <span>Cập nhật: <strong>20/05/2026</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}