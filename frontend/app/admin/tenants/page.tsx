"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { exportToCSV } from "@/lib/export";
import { AlertCircle, Plus, Edit2, Trash2, X, Search, FileSpreadsheet } from "lucide-react";

export default function AdminTenants() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function loadTenants() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/tenants");
      if (res.success && Array.isArray(res.data)) {
        setTenants(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải sinh viên:", err);
      setError("Không thể tải danh sách người thuê từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  // Form validation
  const validateForm = (isEdit: boolean) => {
    if (!fullName.trim()) return "Họ tên không được để trống.";
    if (!cccd.trim() || !/^\d{12}$/.test(cccd.trim())) return "CCCD phải đúng 12 chữ số.";
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) return "Số điện thoại phải đúng 10 chữ số.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email không hợp lệ.";
    
    if (!isEdit) {
      if (!username.trim()) return "Tên tài khoản không được để trống.";
      if (!password.trim() || password.length < 6) return "Mật khẩu phải từ 6 ký tự trở lên.";
    }
    return null;
  };

  const handleCreateTenant = async () => {
    const err = validateForm(false);
    if (err) {
      alert(err);
      return;
    }

    try {
      setError("");
      const res = await fetchAPI("/tenants", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          cccd,
          phone,
          email,
          username,
          password
        })
      });

      if (res.success) {
        alert("Thêm người thuê thành công!");
        setShowCreateModal(false);
        resetForm();
        loadTenants();
      } else {
        alert(res.message || "Lỗi khi thêm người thuê.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Đã xảy ra lỗi khi kết nối.");
    }
  };

  const handleOpenEdit = (tenant: any) => {
    setSelectedTenant(tenant);
    setFullName(tenant.fullName || tenant.FullName || "");
    setCccd(tenant.cccd || tenant.Cccd || "");
    setPhone(tenant.phone || tenant.Phone || "");
    setEmail(tenant.email || tenant.Email || "");
    setShowEditModal(true);
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;
    const err = validateForm(true);
    if (err) {
      alert(err);
      return;
    }

    try {
      setError("");
      const res = await fetchAPI(`/tenants/${selectedTenant.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName,
          cccd,
          phone,
          email
        })
      });

      if (res.success) {
        alert("Cập nhật người thuê thành công!");
        setShowEditModal(false);
        resetForm();
        loadTenants();
      } else {
        alert(res.message || "Lỗi khi cập nhật người thuê.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Đã xảy ra lỗi khi kết nối.");
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người thuê này? Hành động này cũng sẽ xóa tài khoản người dùng tương ứng.")) return;

    try {
      setError("");
      const res = await fetchAPI(`/tenants/${id}`, {
        method: "DELETE"
      });

      if (res.success) {
        alert("Xóa người thuê thành công!");
        loadTenants();
      } else {
        alert(res.message || "Lỗi khi xóa người thuê.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Đã xảy ra lỗi khi kết nối.");
    }
  };

  const resetForm = () => {
    setFullName("");
    setCccd("");
    setPhone("");
    setEmail("");
    setUsername("");
    setPassword("");
    setSelectedTenant(null);
  };

  const filtered = tenants.filter((t) => {
    const fName = t.fullName || t.full_name || t.FullName || "";
    const room = t.room_number || t.roomNumber || t.RoomNumber || "";
    const tel = t.phone || t.Phone || "";

    return (
      fName.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase()) ||
      tel.includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-500 text-sm">Đang tải danh sách người thuê...</p>
      </div>
    );
  }

  const handleExportExcel = () => {
    const headers = [
      "Họ Và Tên",
      "Số CCCD",
      "Số Điện Thoại",
      "Email",
      "Số Phòng Đang Ở"
    ];
    const keys = [
      "fullName",
      "cccd",
      "phone",
      "email",
      "room_number"
    ];
    const formatted = filtered.map(t => ({
      fullName: t.fullName || t.FullName || "",
      cccd: t.cccd || t.Cccd || "",
      phone: t.phone || t.Phone || "",
      email: t.email || t.Email || "",
      room_number: t.room_number || t.roomNumber || t.RoomNumber || "Chưa xếp phòng"
    }));
    exportToCSV(formatted, "DanhSachKhachThue_TamTru", headers, keys);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">👥 Quản lý Tenant</h2>
          <p className="text-sm text-gray-500">{tenants.length} người thuê</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            Xuất Excel
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Thêm người thuê
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tìm kiếm */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, phòng, số điện thoại..."
          className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-400 border-b">
              <th className="text-left px-4 py-3">Họ tên</th>
              <th className="text-left px-4 py-3">CCCD</th>
              <th className="text-left px-4 py-3">Số điện thoại</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phòng</th>
              <th className="text-center px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((t) => {
                const roomNumber = t.room_number || t.roomNumber || t.RoomNumber;
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 text-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800">{t.fullName || t.FullName || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{t.cccd || t.Cccd || "—"}</td>
                    <td className="px-4 py-3">{t.phone || t.Phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{t.email || t.Email || "—"}</td>
                    <td className="px-4 py-3">
                      {roomNumber ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {roomNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(t.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Không tìm thấy người thuê nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm người thuê */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-lg text-gray-800">Thêm người thuê mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Họ tên sinh viên</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Số CCCD (12 chữ số)</label>
                <input
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  placeholder="079123456789"
                  maxLength={12}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Số điện thoại (10 chữ số)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  maxLength={10}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="border-t pt-3 mt-3 space-y-3">
                <p className="text-xs font-bold text-blue-600">Thông tin tài khoản đăng nhập</p>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Tên tài khoản</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nguyenvana"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateTenant}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa người thuê */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-lg text-gray-800">Cập nhật thông tin</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Họ tên sinh viên</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Số CCCD (12 chữ số)</label>
                <input
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  placeholder="079123456789"
                  maxLength={12}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Số điện thoại (10 chữ số)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  maxLength={10}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateTenant}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}