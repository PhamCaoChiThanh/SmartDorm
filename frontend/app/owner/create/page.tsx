"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, CheckCircle2, Camera, Lightbulb, Info, FileText,
  MapPin, Image as ImageIcon, AlertTriangle, Paperclip, CloudUpload,
  Video, Settings, Check, Circle, Save, X, Undo2, Redo2, Bold,
  Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  MoreHorizontal, BedDouble, Users, Zap, Droplets, Trash2,
} from "lucide-react";

const steps = ["Tiêu đề", "Danh mục", "Giá thuê", "Quận/Huyện", "Phường/Xã", "Địa chỉ", "Liên hệ"];

type FormState = {
  title: string; category: string; price: string; area: string;
  capacity: string;
  electricityPrice: string; waterPrice: string; garbageFee: string;
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
    capacity: "2",
    electricityPrice: "3500", waterPrice: "15000", garbageFee: "20000",
    deposit: false, minContract: "", district: "", ward: "",
    address: "", googleMap: "", phone: "", status: "Còn trống",
    furniture: "", publish: false, description: "",
  });

  const [bedStatus, setBedStatus] = useState<boolean[]>([false, false]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadItem[]>([]);

  useEffect(() => {
    const n = Math.max(1, Math.min(20, Number(form.capacity) || 1));
    setBedStatus((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) return [...prev, ...Array(n - prev.length).fill(false)];
      return prev.slice(0, n);
    });
  }, [form.capacity]);

  useEffect(() => {
    return () => { uploadedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl)); };
  }, []);

  const toggleBed = (i: number) => {
    setBedStatus((prev) => prev.map((v, idx) => idx === i ? !v : v));
  };

  const availableCount = bedStatus.filter((v) => !v).length;

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
      capacity: Number(form.capacity) || 2,
      available: availableCount,
      bedStatus,
      electricityPrice: Number(form.electricityPrice) || 3500,
      waterPrice: Number(form.waterPrice) || 15000,
      garbageFee: Number(form.garbageFee) || 20000,
      status: form.status,
      category: form.category,
      description: form.description,
      phone: form.phone,
      address: form.address,
      image: uploadedFiles[0]?.previewUrl || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop",
      images: uploadedFiles.length > 0
        ? uploadedFiles.map((f) => f.previewUrl)
        : ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop"],
      publish: form.publish,
      createdAt: new Date().toISOString(),
      ownerEmail: localStorage.getItem("currentEmail") || "",
    };
    const existing = JSON.parse(localStorage.getItem("ownerListings") || "[]");
    existing.push(newListing);
    localStorage.setItem("ownerListings", JSON.stringify(existing));
    alert("✅ Đăng tin thành công!");
    router.push("/owner/listings");
  };

  const requiredFields: (keyof FormState)[] = ["title", "category", "price", "district", "ward", "address", "phone"];
  const filledCount = requiredFields.filter((f) => !!form[f]).length;
  const progress = Math.round((filledCount / requiredFields.length) * 100);
  const completedSteps = [
    !!form.title, !!form.category, !!form.price,
    !!form.district, !!form.ward, !!form.address, !!form.phone,
  ];

  const addFiles = (raw: File[]) => {
    const newItems: UploadItem[] = raw.map((file) => ({
      file, previewUrl: URL.createObjectURL(file), isImage: file.type.startsWith("image/"),
    }));
    setUploadedFiles((prev) => [...prev, ...newItems].slice(0, 5));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
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

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <p className="text-xs text-gray-400">Pages / Thêm Nhà trọ mới</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">Thêm Nhà trọ mới</h1>
        </div>
        <button onClick={() => router.push("/owner/listings")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
          <ArrowLeft size={15} /> Quay lại
        </button>
      </div>

      {/* Tips Banner */}
      <div className="px-8 py-5" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)" }}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, title: "Nhập đủ thông tin bắt buộc", desc: "Ưu tiên Tiêu đề, Giá, Danh mục, Địa chỉ và Liên hệ" },
            { icon: Camera, title: "Tối thiểu 3 hình ảnh", desc: "Ảnh rõ nét, đủ sáng giúp tăng độ tin cậy cho tin đăng" },
            { icon: Lightbulb, title: "Mô tả ngắn gọn, trọng tâm", desc: "Nêu ưu điểm nổi bật, tiện ích xung quanh và quy định chính." },
          ].map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="bg-white/20 backdrop-blur rounded-xl p-4 flex items-start gap-3">
                <Icon size={22} className="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">{tip.title}</p>
                  <p className="text-white/80 text-xs mt-0.5">{tip.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Info size={16} className="text-blue-500" /> Thông tin cơ bản
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ví dụ: Phòng trọ cao cấp gần ĐH Bách Khoa" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Danh mục <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={`${inputCls} text-gray-600`}>
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
                      placeholder="0" className={`${inputCls} pr-14`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">VNĐ</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Diện tích (m²)</label>
                  <div className="relative">
                    <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                      placeholder="Nhập diện tích" className={`${inputCls} pr-10`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Không bắt buộc</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Sức chứa (người) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" min="1" max="20" value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      placeholder="2" className={`${inputCls} pr-16`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">người</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Số giường tối đa</p>
                </div>
              </div>

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

              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Hợp đồng tối thiểu</label>
                <div className="relative">
                  <input value={form.minContract} onChange={(e) => setForm({ ...form, minContract: e.target.value })}
                    placeholder="Nhập số tháng" className={`${inputCls} pr-16`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">tháng</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Không bắt buộc</p>
              </div>
            </div>
          </div>

          {/* ===== GIÁ DỊCH VỤ ===== */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Giá dịch vụ
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Giá này sẽ được niêm yết công khai và áp dụng cố định trong hợp đồng. Người thuê không thể thay đổi.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700 flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" /> Giá điện <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type="number" value={form.electricityPrice}
                    onChange={(e) => setForm({ ...form, electricityPrice: e.target.value })}
                    placeholder="3500" className={`${inputCls} pr-14`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">đ/số</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700 flex items-center gap-1.5">
                  <Droplets size={13} className="text-blue-500" /> Giá nước <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type="number" value={form.waterPrice}
                    onChange={(e) => setForm({ ...form, waterPrice: e.target.value })}
                    placeholder="15000" className={`${inputCls} pr-16`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">đ/khối</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700 flex items-center gap-1.5">
                  <Trash2 size={13} className="text-gray-400" /> Phí rác <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type="number" value={form.garbageFee}
                    onChange={(e) => setForm({ ...form, garbageFee: e.target.value })}
                    placeholder="20000" className={`${inputCls} pr-16`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">đ/tháng</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Giá EVN hiện tại: ~3.500đ/kWh. Giá nước: ~15.000đ/m³.</p>
              </div>
            </div>
          </div>

          {/* ===== SƠ ĐỒ GIƯỜNG ===== */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <BedDouble size={16} className="text-purple-500" /> Sơ đồ phòng
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Click vào từng giường để đánh dấu trạng thái. Khách thuê sẽ thấy sơ đồ này khi đăng ký.
            </p>
            <div className="flex gap-3 mb-4">
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs font-medium text-green-700">
                <div className="w-2.5 h-2.5 rounded-sm bg-green-400" /> {availableCount} trống
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs font-medium text-red-600">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-400" /> {bedStatus.length - availableCount} có người
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-500">
                <Users size={12} /> {bedStatus.length} tổng
              </div>
            </div>
            <div className="relative bg-gray-50 border-4 border-gray-200 rounded-2xl p-5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3.5 z-10">
                <div className="bg-blue-100 border border-blue-200 text-blue-600 text-xs px-3 py-1 rounded-full">🪟 Cửa sổ</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
                {bedStatus.map((occupied, i) => (
                  <button key={i} type="button" onClick={() => toggleBed(i)}
                    className={`rounded-xl border-2 p-3 transition-all duration-200 text-center group ${
                      occupied ? "border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100"
                      : "border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100"
                    }`}>
                    <div className={`relative mx-auto rounded-lg border-2 overflow-hidden mb-2 ${
                      occupied ? "border-red-300 bg-red-100" : "border-green-400 bg-green-100"
                    }`} style={{ width: "52px", height: "34px" }}>
                      <div className={`absolute top-1 left-1 right-1 rounded h-2 ${occupied ? "bg-red-300" : "bg-green-400"}`} />
                      <div className={`absolute bottom-1 left-1 right-1 rounded h-4 ${occupied ? "bg-red-200" : "bg-green-200"}`} />
                      {occupied && <div className="absolute inset-0 flex items-center justify-center"><Users size={13} className="text-red-500" /></div>}
                    </div>
                    <div className={`text-xs font-semibold ${occupied ? "text-red-600" : "text-green-700"}`}>
                      {occupied ? "Có người" : "Trống"}
                    </div>
                    <div className="text-xs text-gray-400">Giường #{i + 1}</div>
                    <div className={`text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${occupied ? "text-green-600" : "text-red-500"}`}>
                      → {occupied ? "Đánh dấu trống" : "Đánh dấu có người"}
                    </div>
                  </button>
                ))}
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3.5 z-10">
                <div className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full">🚪 Cửa ra vào</div>
              </div>
            </div>
            <div className="flex gap-4 mt-5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-400 border border-green-500" /> Còn trống</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-300 border border-red-400" /> Có người</span>
              <span className="ml-auto text-gray-400 italic">Click giường để đổi trạng thái</span>
            </div>
          </div>

          {/* Nội dung chi tiết */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" /> Nội dung chi tiết
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><Undo2 size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><Redo2 size={13} /></button>
                <span className="mx-1 border-r border-gray-200 h-4" />
                <select className="text-xs border-none bg-transparent text-gray-600 focus:outline-none pr-1">
                  <option>Paragraph</option><option>Heading 1</option><option>Heading 2</option>
                </select>
                <span className="mx-1 border-r border-gray-200 h-4" />
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-700"><Bold size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-700"><Italic size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-700"><Underline size={13} /></button>
                <span className="mx-1 border-r border-gray-200 h-4" />
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><AlignLeft size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><AlignCenter size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><AlignRight size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><AlignJustify size={13} /></button>
                <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><MoreHorizontal size={13} /></button>
              </div>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết về phòng trọ, tiện ích, quy định..."
                className="w-full px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none" rows={10} />
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>p</span>
                <span>{form.description.trim() ? form.description.trim().split(/\s+/).length : 0} words</span>
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MapPin size={16} className="text-purple-500" /> Địa chỉ
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Quận/Huyện <span className="text-red-500">*</span></label>
                  <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Chọn quận/huyện" className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Phường/Xã <span className="text-red-500">*</span></label>
                  <input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}
                    placeholder="Chọn phường/xã" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Số nhà, tên đường..." className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Link bản đồ (Google Maps)</label>
                <input value={form.googleMap} onChange={(e) => setForm({ ...form, googleMap: e.target.value })}
                  placeholder="https://maps.google.com/..." className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Tùy chọn</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Số điện thoại/Zalo <span className="text-red-500">*</span></label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Nhập số điện thoại liên hệ" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Hình ảnh & Video */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-gray-500" /> Hình ảnh &amp; Video
            </h3>
            <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-2 text-white text-sm font-medium"
              style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)" }}>
              <AlertTriangle size={15} />
              <span>Gói Free: Tối đa <strong>5 ảnh</strong> và <strong>1 video</strong></span>
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-3 mb-3 text-sm text-gray-600">
              <p className="font-medium mb-1 flex items-center gap-1.5"><Paperclip size={13} /> Quy định upload</p>
              <ul className="space-y-0.5 text-xs list-disc list-inside">
                <li>Định dạng: <strong>PNG, JPG, JPEG, WEBP</strong> (ảnh) hoặc <strong>MP4</strong> (video)</li>
                <li>Dung lượng tối đa: <strong>10MB/ảnh</strong>, <strong>50MB/video</strong></li>
              </ul>
            </div>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition">
              <CloudUpload size={40} className="text-gray-300" />
              <p className="text-sm text-gray-500">Kéo thả ảnh/video vào đây</p>
              <p className="text-xs text-gray-400">hoặc nhấp để chọn file</p>
              <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpg,image/jpeg,image/webp,video/mp4"
                className="hidden" onChange={handleFileChange} />
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {uploadedFiles.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    {item.isImage
                      ? <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1"><Video size={20} /><span className="text-xs">Video</span></div>}
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={16} className="text-gray-500" /> Cài đặt
            </h3>
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
                  {completedSteps[i]
                    ? <Check size={14} className="text-white bg-green-500 rounded-full p-0.5 flex-shrink-0" />
                    : <Circle size={16} className={`flex-shrink-0 ${i === completedSteps.filter(Boolean).length ? "text-purple-400" : "text-gray-300"}`} />}
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
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Lightbulb size={14} className="text-amber-500" /> Lưu ý
            </p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>Điền đầy đủ thông tin để tăng độ tin cậy</li>
              <li>Tải lên ít nhất 3 hình ảnh chất lượng</li>
              <li>Giá dịch vụ sẽ cố định trong hợp đồng</li>
            </ul>
          </div>

          <button type="button" onClick={handleSave}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            <Save size={15} /> Lưu &amp; Đăng tin
          </button>
          <button type="button" onClick={() => router.push("/owner/listings")}
            className="w-full py-3 rounded-xl text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2">
            <X size={15} /> Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}