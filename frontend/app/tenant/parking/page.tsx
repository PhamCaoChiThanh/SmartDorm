"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Car, FileText, Trash2 } from "lucide-react";

export default function TenantParking() {
  const router = useRouter();
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("Xe máy");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAPI("/vehicles");
      if (res.success && Array.isArray(res.data)) {
        setVehicles(res.data);
      } else {
        setError(res.message || "Không thể tải danh sách xe.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSubmit = async () => {
    if (!plate.trim()) return;

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const res = await fetchAPI("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          licensePlate: plate.trim(),
          type: type,
        }),
      });

      if (res.success) {
        setMessage("Đăng ký xe thành công!");
        setPlate("");
        // Reload list
        loadVehicles();
      } else {
        setError(res.message || "Không thể đăng ký phương tiện.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi đăng ký xe.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phương tiện này?")) return;

    try {
      setError("");
      setMessage("");
      const res = await fetchAPI(`/vehicles/${id}`, {
        method: "DELETE",
      });

      if (res.success) {
        setMessage("Đã xóa phương tiện thành công.");
        loadVehicles();
      } else {
        setError(res.message || "Không thể xóa phương tiện.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi xóa xe.");
    }
  };

  const getVehicleTypeLabel = (typeStr: string) => {
    switch (typeStr?.toUpperCase()) {
      case "MOTORBIKE":
        return "Xe máy";
      case "BICYCLE":
        return "Xe đạp";
      case "CAR":
        return "Ô tô";
      default:
        return typeStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">← Quay lại</button>
        <h1 className="font-bold text-blue-600 flex items-center gap-1">
          <Car size={18} /> Đăng ký xe
        </h1>
        <button
          onClick={() => router.push("/tenant/parking-invoice")}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <FileText size={14} /> Xem hóa đơn
        </button>
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Form đăng ký */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Đăng ký phương tiện mới</h2>

          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-3">
              ❌ {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Biển số xe *</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="VD: 59X1-12345"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Loại xe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>Xe máy</option>
                <option>Xe đạp</option>
                <option>Ô tô</option>
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !plate.trim()}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </div>
        </div>

        {/* Xe hiện tại */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Car size={16} className="text-gray-500" /> Xe đang đăng ký
          </h2>

          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Đang tải danh sách phương tiện...</div>
          ) : vehicles.length > 0 ? (
            <div className="space-y-2.5">
              {vehicles.map((v) => (
                <div key={v.id} className="flex justify-between items-center py-2.5 border-b last:border-0 hover:bg-gray-50/50 px-1 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{v.license_plate || v.LicensePlate}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{getVehicleTypeLabel(v.type)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
                      Đã duyệt
                    </span>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition"
                      title="Xóa phương tiện"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">Bạn chưa đăng ký xe nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}