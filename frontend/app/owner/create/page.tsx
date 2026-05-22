"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const steps = ["Tiêu đề", "Danh mục", "Giá thuê", "Quận/Huyện", "Phường/Xã", "Địa chỉ", "Liên hệ"];

type FormState = {
  title: string; category: string; price: string; area: string;
  deposit: boolean; minContract: string; district: string; ward: string;
  address: string; googleMap: string; phone: string; status: string;
  furniture: string; publish: boolean; description: string;
};

type UploadItem = { file: File; previewUrl: string; isImage: boolean };

export default function OwnerCreate() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    title: "", category: "", price: "", area: "",
    deposit: false, minContract: "", district: "", ward: "",
    address: "", googleMap: "", phone: "", status: "Còn trống",
    furniture: "", publish: false, description: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadItem[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  // ── handleSave ──────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.title || !form.category || !form.price) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc: Tiêu đề, Danh mục, Giá thuê!");
      return;
    }

    const newListing = {
      id: Date.now(),
      name: form.title,
      area: `${form.district || "TP.HCM"} - ${form.ward || ""}`,
      price: Number(form.price.replace(/\D/g, "")),
      capacity: 2,
      available: form.status === "Còn trống" ? 1 : 0,
      status: form.status,
      category: form.category,
      description: form.description,
      phone: form.phone,
      address: form.address,
      image: uploadedFiles[0]?.previewUrl || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop",
  images: uploadedFiles.length > 0 // 👈 thêm dòng này
    ? uploadedFiles.map((f) => f.previewUrl)
    : ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop"],
  publish: form.publish,
      createdAt: new Date().toISOString(),
       ownerEmail: localStorage.getItem("currentEmail") || "",
    };

    // Lưu vào localStorage
    const existing = JSON.parse(localStorage.getItem("ownerListings") || "[]");
    existing.push(newListing);
    localStorage.setItem("ownerListings", JSON.stringify(existing));

    alert("✅ Đăng tin thành công!");
    router.push("/owner/listings");
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Progress calculation — typed key access
  const requiredFields: (keyof FormState)[] = ["title", "category", "price", "district", "ward", "address", "phone"];
  const filledCount = requiredFields.filter((f) => !!form[f]).length;
  const progress = Math.round((filledCount / requiredFields.length) * 100);

  const completedSteps = [
    !!form.title, !!form.category, !!form.price,
    !!form.district, !!form.ward, !!form.address, !!form.phone,
  ];

  const addFiles = (raw: File[]) => {
    const newItems: UploadItem[] = raw.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isImage: file.type.startsWith("image/"),
    }));
    setUploadedFiles((prev) => [...prev, ...newItems].slice(0, 5));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = ""; // reset so same file can be re-added
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <p className="text-xs text-gray-400">Pages / Thêm Nhà trọ mới</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">Thêm Nhà trọ mới</h1>
        </div>
        <button
          onClick={() => router.push("/owner/listings")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          ← Quay lại
        </button>
      </div>

      {/* Tips Banner */}
      <div className="px-8 py-5" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "✅", title: "Nhập đủ thông tin bắt buộc", desc: "Ưu tiên Tiêu đề, Giá, Danh mục, Địa chỉ và Liên hệ" },
            { icon: "📷", title: "Tối thiểu 3 hình ảnh", desc: "Ảnh rõ nét, đủ sáng giúp tăng độ tin cậy cho tin đăng" },
            { icon: "💡", title: "Mô tả ngắn gọn, trọng tâm", desc: "Nêu ưu điểm nổi bật, tiện ích xung quanh và quy định chính." },
          ].map((tip) => (
            <div key={tip.title} className="bg-white/20 backdrop-blur rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{tip.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{tip.title}</p>
                <p className="text-white/80 text-xs mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== LEFT COLUMN ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="text-blue-500">ℹ️</span> Thông tin cơ bản
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ví dụ: Phòng trọ cao cấp gần ĐH Bách Khoa"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Danh mục <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 text-gray-600">
                    <option value="">Chọn danh mục</option>
                    <option>KTX</option>
                    <option>Phòng trọ</option>
                    <option>Căn hộ</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Giá thuê/tháng <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 pr-14" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">VNĐ</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Diện tích (m²)</label>
                <div className="relative">
                  <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="Nhập diện tích"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 pr-10" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Không bắt buộc</p>
              </div>

              {/* Yêu cầu cọc */}
              <div className="flex items-start gap-3 pt-1">
                <button type="button" onClick={() => setForm({ ...form, deposit: !form.deposit })}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.deposit ? "bg-purple-600" : "bg-gray-200"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.deposit ? "left-6" : "left-1"}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">Yêu cầu cọc</p>
                  <p className="text-xs text-gray-400">Có cần cọc trước khi thuê không?</p>
                </div>
              </div>

              {/* Hợp đồng tối thiểu */}
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Hợp đồng tối thiểu</label>
                <div className="relative">
                  <input value={form.minContract} onChange={(e) => setForm({ ...form, minContract: e.target.value })}
                    placeholder="Nhập số tháng"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 pr-16" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">tháng</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Không bắt buộc</p>
              </div>
            </div>
          </div>

          {/* Nội dung chi tiết */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📄</span> Nội dung chi tiết
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-sm">↩</button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-sm">↪</button>
                <span className="mx-1 border-r border-gray-200 h-4" />
                <select className="text-xs border-none bg-transparent text-gray-600 focus:outline-none pr-1">
                  <option>Paragraph</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <span className="mx-1 border-r border-gray-200 h-4" />
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded font-bold text-sm text-gray-700">B</button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded italic text-sm text-gray-700">I</button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-sm text-gray-700 underline">A</button>
                <span className="mx-1 border-r border-gray-200 h-4" />
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-sm">≡</button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-sm">≡</button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-sm">≡</button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-sm">···</button>
              </div>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết về phòng trọ, tiện ích, quy định..."
                className="w-full px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none" rows={10} />
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>p</span>
                <div className="flex items-center gap-4">
                  <span>Press Alt+0 for help</span>
                  <span>{form.description.trim() ? form.description.trim().split(/\s+/).length : 0} words</span>
                  <span>Build with 🔧 tinyMCE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>📍</span> Địa chỉ
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Quận/Huyện <span className="text-red-500">*</span></label>
                  <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Chọn quận/huyện"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Phường/Xã <span className="text-red-500">*</span></label>
                  <input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}
                    placeholder="Chọn phường/xã"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Số nhà, tên đường..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Link bản đồ (Google Maps)</label>
                <input value={form.googleMap} onChange={(e) => setForm({ ...form, googleMap: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" />
                <p className="text-xs text-gray-400 mt-1">Dán link Google Maps để hiển thị vị trí trên bản đồ (tùy chọn)</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Số điện thoại/Zalo <span className="text-red-500">*</span></label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Nhập số điện thoại liên hệ"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400" />
              </div>
            </div>
          </div>

          {/* Hình ảnh & Video */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🖼️</span> Hình ảnh &amp; Video
            </h3>
            <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-2 text-white text-sm font-medium"
              style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)" }}>
              <span>⚠️</span>
              <span>Gói Free: Tối đa <strong>5 ảnh</strong> và <strong>1 video</strong></span>
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-3 mb-3 text-sm text-gray-600">
              <p className="font-medium mb-1 flex items-center gap-1"><span>📎</span> Quy định upload</p>
              <ul className="space-y-0.5 text-xs list-disc list-inside">
                <li>Định dạng: <strong>PNG, JPG, JPEG, WEBP</strong> (ảnh) hoặc <strong>MP4</strong> (video)</li>
                <li>Dung lượng tối đa: <strong>10MB/ảnh</strong>, <strong>50MB/video</strong></li>
              </ul>
            </div>

            {/* Dropzone */}
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition">
              <div className="text-gray-300 text-4xl">☁</div>
              <p className="text-sm text-gray-500">Kéo thả ảnh/video vào đây</p>
              <p className="text-xs text-gray-400">hoặc nhấp để chọn file</p>
              <input ref={fileInputRef} type="file" multiple
                accept="image/png,image/jpg,image/jpeg,image/webp,video/mp4"
                className="hidden" onChange={handleFileChange} />
            </div>

            {/* Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {uploadedFiles.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    {item.isImage ? (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🎥 Video</div>
                    )}
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span>⚙️</span> Cài đặt</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Tiến độ hoàn thiện</span>
              <span className="text-xs font-bold text-purple-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} />
            </div>
            <div className="space-y-2 mb-5">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    completedSteps[i] ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                    {completedSteps[i] ? "✓" : "○"}
                  </div>
                  <span className={completedSteps[i] ? "text-gray-800 font-medium"
                    : i === completedSteps.filter(Boolean).length ? "text-purple-600 font-medium" : "text-gray-400"}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block text-gray-700">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-gray-700">
                <option>Còn trống</option>
                <option>Đã cho thuê</option>
                <option>Sắp trống</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block text-gray-700">Tình trạng nội thất</label>
              <select value={form.furniture} onChange={(e) => setForm({ ...form, furniture: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-gray-600">
                <option value="">Chọn tình trạng nội thất</option>
                <option>Đầy đủ nội thất</option>
                <option>Nội thất cơ bản</option>
                <option>Không có nội thất</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Publish</p>
                <p className="text-xs text-gray-400">Hiển thị công khai trên website</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, publish: !form.publish })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.publish ? "bg-purple-600" : "bg-gray-200"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.publish ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><span>💡</span> Lưu ý</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>Điền đầy đủ thông tin để tăng độ tin cậy</li>
              <li>Tải lên ít nhất 3 hình ảnh chất lượng</li>
              <li>Mô tả chi tiết để thu hút khách hàng</li>
            </ul>
          </div>

          <button type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            ✅ Lưu &amp; Đăng tin
          </button>
          <button type="button" onClick={() => router.push("/owner/listings")}
            className="w-full py-3 rounded-xl text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2">
            ✕ Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}