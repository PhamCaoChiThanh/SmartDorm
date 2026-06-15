"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Car, FileText, Trash2, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-300">
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm px-4 py-4 flex justify-between items-center transition-colors duration-300">
        <button onClick={() => router.back()} className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1">
          <ChevronLeft size={16} /> Quay lại
        </button>
        <h1 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <Car size={18} /> Đăng ký xe
        </h1>
        <button
          onClick={() => router.push("/tenant/parking-invoice")}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <FileText size={14} /> Xem hóa đơn
        </button>
      </nav>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Form đăng ký */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-zinc-50">Đăng ký phương tiện mới</h2>

          {message && (
            <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm p-3 rounded-lg mb-3 border border-green-100 dark:border-green-900/30 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg mb-3 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-zinc-300">Biển số xe *</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="VD: 59X1-12345"
                className="w-full border border-gray-250 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-zinc-300">Loại xe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-250 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                <option>Xe máy</option>
                <option>Xe đạp</option>
                <option>Ô tô</option>
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !plate.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </div>
        </div>

        {/* Xe hiện tại */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-800">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-zinc-50">
            <Car size={16} className="text-gray-500 dark:text-zinc-400" /> Xe đang đăng ký
          </h2>

          {loading ? (
            <div className="text-center py-6 text-gray-500 dark:text-zinc-400 text-sm">Đang tải danh sách phương tiện...</div>
          ) : vehicles.length > 0 ? (
            <div className="space-y-2.5">
              {vehicles.map((v) => (
                <div key={v.id} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-zinc-800/80 last:border-0 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 px-1 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{v.license_plate || v.LicensePlate}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{getVehicleTypeLabel(v.type)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                      Đã duyệt
                    </span>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      title="Xóa phương tiện"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 dark:text-zinc-500 text-sm">Bạn chưa đăng ký xe nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}