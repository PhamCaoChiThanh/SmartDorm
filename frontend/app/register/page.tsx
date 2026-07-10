"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchAPI } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    cccd: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-gray-200", width: "w-0" };
    
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    let color = "bg-red-500";
    let label = "Yếu";
    let width = "w-1/3";
    
    if (score >= 4 && pass.length >= 6) {
      if (score === 5) {
        color = "bg-green-500";
        label = "Mạnh";
        width = "w-full";
      } else {
        color = "bg-amber-500";
        label = "Trung bình";
        width = "w-2/3";
      }
    } else if (score >= 3 && pass.length >= 6) {
      color = "bg-amber-500";
      label = "Trung bình";
      width = "w-2/3";
    }
    
    return { score, label, color, width };
  };

  const handleRegister = async () => {
    setError("");

    if (!form.fullName || !form.cccd || !form.email || !form.username || !form.password) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (!/^\d{12}$/.test(form.cccd.trim())) {
      setError("Số CCCD phải có đúng 12 chữ số!");
      return;
    }

    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      setError("Số điện thoại phải có đúng 10 chữ số!");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Địa chỉ email không đúng định dạng!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ cái in hoa!");
      return;
    }

    if (!/[a-z]/.test(form.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ cái thường!");
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ số!");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, ...).");
      return;
    }

    setLoading(true);

    try {
      // Gọi API đăng ký của Backend C#
      await fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          role: "TENANT",
          fullName: form.fullName,
          cccd: form.cccd,
          phone: form.phone || null,
        }),
      });

      // Để tương thích ngược với local mock (nếu có phần nào khác trên UI cần):
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const exists = users.find((u: any) => u.email === form.email);
      if (!exists) {
        users.push({
          fullName: form.fullName,
          cccd: form.cccd,
          phone: form.phone,
          email: form.email,
          username: form.username,
          password: form.password,
          role: "TENANT",
        });
        localStorage.setItem("users", JSON.stringify(users));
      }

      router.push("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng kiểm tra lại kết nối đến Backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">🏠 SmartDorm</h1>
        <p className="text-center text-gray-500 mb-6">Đăng ký tài khoản Tenant</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Họ và tên *</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CCCD *</label>
            <input
              name="cccd"
              value={form.cccd}
              onChange={handleChange}
              placeholder="079123456789"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0901234567"
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@gmail.com"
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tên đăng nhập *</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="username"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.password && (() => {
              const strength = getPasswordStrength(form.password);
              return (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-gray-400">Độ mạnh mật khẩu:</span>
                    <span className={strength.score === 5 ? "text-green-600 font-semibold" : strength.score >= 3 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold"}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Yêu cầu: tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
                  </p>
                </div>
              );
            })()}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu *</label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}