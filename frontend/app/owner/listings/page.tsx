"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, LayoutList, CheckSquare, Home, Plus, Trash2, Eye } from "lucide-react";

type Listing = {
  id: number; name: string; area: string; price: number;
  capacity: number; available: number; status: string;
  category: string; description: string; phone: string;
  address: string; image: string; publish: boolean; createdAt: string;
};

export default function OwnerListings() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ownerListings") || "[]");
    setListings(saved);
  }, []);

  const handleDelete = (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa tin đăng này?")) return;
    const updated = listings.filter((l) => l.id !== id);
    setListings(updated);
    localStorage.setItem("ownerListings", JSON.stringify(updated));
  };

  const filtered = listings.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.area.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true :
      filter === "available" ? l.available > 0 : l.available === 0;
    return matchSearch && matchFilter;
  });

  const filterTabs = [
    { key: "all", label: "Tất cả", icon: LayoutList },
    { key: "available", label: "Còn trống", icon: CheckSquare },
    { key: "rented", label: "Đã thuê", icon: Home },
  ];

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">Pages / Quản lý tin đăng</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">Quản lý tin đăng</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <SlidersHorizontal size={15} />
            Bộ lọc
            {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => router.push("/owner/create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
          >
            <Plus size={15} /> Thêm mới
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Search + Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 min-w-[250px]">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên, địa chỉ..."
                className="bg-transparent text-sm flex-1 focus:outline-none text-gray-700"
              />
            </div>
            <div className="flex gap-2">
              {filterTabs.map((f) => {
                const Icon = f.icon;
                const active = filter === f.key;
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={active ? {
                      background: "linear-gradient(135deg, #7C3AED, #EC4899)", color: "white"
                    } : { border: "1px solid #e5e7eb", color: "#374151", background: "white" }}>
                    <Icon size={14} /> {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {showFilter && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Danh mục", options: ["Tất cả danh mục", "KTX", "Phòng trọ", "Căn hộ"] },
                { label: "Giá từ", options: ["0 VNĐ"] },
                { label: "Giá đến", options: ["6,000,000 VNĐ"] },
                { label: "Trạng thái", options: ["Tất cả trạng thái", "Còn trống", "Đã thuê"] },
                { label: "Nội thất", options: ["Tất cả", "Có nội thất", "Không nội thất"] },
                { label: "Hiển thị", options: ["Tất cả", "Đang hiển thị", "Ẩn"] },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none text-gray-700 bg-white">
                    {f.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách tin đăng */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(124,58,237,0.08)" }}>
              <Home size={36} style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-2">Chưa có tin đăng nào</h3>
            <p className="text-gray-400 text-sm mb-6">Bắt đầu bằng cách thêm nhà trọ đầu tiên của bạn</p>
            <button onClick={() => router.push("/owner/create")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
              <Plus size={15} /> Thêm nhà trọ ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                <div className="relative h-48 overflow-hidden">
                  <img src={listing.image} alt={listing.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute top-3 left-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      listing.available > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      {listing.available > 0 ? "✓ Còn trống" : "✗ Đã thuê"}
                    </span>
                  </div>
                  {!listing.publish && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-700 text-white">Ẩn</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{listing.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">📍 {listing.area}</p>
                  <p className="text-sm text-gray-500 mb-3">🏷️ {listing.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg" style={{ color: "#7C3AED" }}>
                      {listing.price.toLocaleString("vi-VN")}đ
                      <span className="text-xs text-gray-400 font-normal">/người/tháng</span>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/rooms/${listing.id}`)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-500">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDelete(listing.id)}
                        className="p-2 rounded-lg border border-red-100 hover:bg-red-50 transition text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}