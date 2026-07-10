"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { Wrench, Pencil, Trash2, Plus, X, AlertCircle, FileSpreadsheet } from "lucide-react";
import { exportToCSV } from "@/lib/export";

export default function AdminMaintenance() {
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("OPEN");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newScheduledFor, setNewScheduledFor] = useState("");
  const [newCompletedAt, setNewCompletedAt] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editRoomId, setEditRoomId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("OPEN");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editScheduledFor, setEditScheduledFor] = useState("");
  const [editCompletedAt, setEditCompletedAt] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Confirm State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load Maintenances & Rooms
  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [mRes, rRes] = await Promise.all([
        fetchAPI("/maintenances"),
        fetchAPI("/rooms")
      ]);

      if (mRes.success && Array.isArray(mRes.data)) {
        setMaintenances(mRes.data);
      } else {
        setError(mRes.message || "Không thể tải danh sách báo cáo bảo trì.");
      }

      if (rRes.success && Array.isArray(rRes.data)) {
        setRooms(rRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomId) {
      setCreateError("Vui lòng chọn phòng.");
      return;
    }
    if (!newDescription.trim()) {
      setCreateError("Vui lòng nhập mô tả sự cố.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");
      const res = await fetchAPI("/maintenances", {
        method: "POST",
        body: JSON.stringify({
          roomId: newRoomId,
          description: newDescription,
          status: newStatus,
          assignedTo: newAssignedTo.trim() || null,
          scheduledFor: newScheduledFor ? new Date(newScheduledFor).toISOString() : null,
          completedAt: newCompletedAt ? new Date(newCompletedAt).toISOString() : null
        })
      });

      if (res.success) {
        setShowCreateModal(false);
        // Reset fields
        setNewRoomId("");
        setNewDescription("");
        setNewStatus("OPEN");
        setNewAssignedTo("");
        setNewScheduledFor("");
        setNewCompletedAt("");
        // Refresh list
        loadData();
      } else {
        setCreateError(res.message || "Không thể tạo báo cáo bảo trì.");
      }
    } catch (err: any) {
      setCreateError("Lỗi kết nối máy chủ.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditRoomId(item.roomId || "");
    setEditDescription(item.description || "");
    setEditStatus(item.status || "OPEN");
    setEditAssignedTo(item.assignedTo || "");
    
    if (item.scheduled_for || item.scheduledFor) {
      const d = new Date(item.scheduled_for || item.scheduledFor);
      const tzoffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
      setEditScheduledFor(localISOTime);
    } else {
      setEditScheduledFor("");
    }

    if (item.completed_at || item.completedAt) {
      const d = new Date(item.completed_at || item.completedAt);
      const tzoffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
      setEditCompletedAt(localISOTime);
    } else {
      setEditCompletedAt("");
    }
    setEditError("");
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoomId) {
      setEditError("Vui lòng chọn phòng.");
      return;
    }
    if (!editDescription.trim()) {
      setEditError("Vui lòng nhập mô tả sự cố.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");
      const res = await fetchAPI(`/maintenances/${editItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          roomId: editRoomId,
          description: editDescription,
          status: editStatus,
          assignedTo: editAssignedTo.trim() || null,
          scheduledFor: editScheduledFor ? new Date(editScheduledFor).toISOString() : null,
          completedAt: editCompletedAt ? new Date(editCompletedAt).toISOString() : null
        })
      });

      if (res.success) {
        setShowEditModal(false);
        setEditItem(null);
        setEditCompletedAt("");
        loadData();
      } else {
        setEditError(res.message || "Không thể cập nhật báo cáo.");
      }
    } catch (err: any) {
      setEditError("Lỗi kết nối máy chủ.");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Confirm
  const openDeleteConfirm = (item: any) => {
    setDeleteItem(item);
    setShowDeleteConfirm(true);
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const res = await fetchAPI(`/maintenances/${deleteItem.id}`, {
        method: "DELETE"
      });

      if (res.success) {
        setShowDeleteConfirm(false);
        setDeleteItem(null);
        loadData();
      } else {
        alert(res.message || "Không thể xóa báo cáo.");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered list
  const filteredMaintenances = maintenances.filter((m) => {
    if (statusFilter === "ALL") return true;
    return m.status === statusFilter;
  });

  const handleExportExcel = () => {
    const dataToExport = filteredMaintenances.map((m) => ({
      roomNumber: m.room_number || "P-?",
      description: m.description || "",
      tenantName: m.tenant_name || "Admin (Báo cáo)",
      assignedTo: m.assignedTo || "Chưa phân công",
      status: m.status === "OPEN" ? "Mở / Chờ" : m.status === "IN_PROGRESS" ? "Đang xử lý" : "Hoàn thành",
      scheduledFor: m.scheduled_for || m.scheduledFor ? new Date(m.scheduled_for || m.scheduledFor).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }) : "Chưa lên lịch",
      createdAt: new Date(m.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      completedAt: m.completed_at || m.completedAt ? new Date(m.completed_at || m.completedAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }) : "—",
    }));

    exportToCSV(
      dataToExport,
      "Bao_cao_bao_tri",
      ["Phòng", "Sự cố", "Người báo", "Người xử lý", "Trạng thái", "Lịch hẹn bảo trì", "Ngày báo", "Ngày hoàn thành"],
      ["roomNumber", "description", "tenantName", "assignedTo", "status", "scheduledFor", "createdAt", "completedAt"]
    );
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="text-blue-600" />
            Quản lý Báo cáo Bảo trì
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem, phân công xử lý, cập nhật trạng thái và quản lý danh sách báo hỏng từ sinh viên.
          </p>
        </div>
        <div className="flex gap-2">
          {filteredMaintenances.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
            >
              <FileSpreadsheet size={16} />
              Xuất Excel
            </button>
          )}
          <button
            onClick={() => {
              setCreateError("");
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Báo cáo sự cố mới
          </button>
        </div>
      </div>

      {/* Filter and Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {[
              { label: "Tất cả", value: "ALL" },
              { label: "Mở (Chờ xử lý)", value: "OPEN" },
              { label: "Đang xử lý", value: "IN_PROGRESS" },
              { label: "Đã hoàn thành", value: "DONE" }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === btn.value
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            Tổng số: <strong className="text-gray-700">{filteredMaintenances.length}</strong> báo cáo
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 flex items-center gap-2 border-b border-red-100">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Đang tải danh sách báo cáo bảo trì...</div>
        ) : filteredMaintenances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-gray-500 font-semibold">
                  <th className="text-left py-3 px-4 w-24">Phòng</th>
                  <th className="text-left py-3 px-4">Sự cố</th>
                  <th className="text-left py-3 px-4">Người báo</th>
                  <th className="text-left py-3 px-4">Người xử lý</th>
                  <th className="text-left py-3 px-4 w-36">Trạng thái</th>
                  <th className="text-left py-3 px-4 w-40">Lịch hẹn bảo trì</th>
                  <th className="text-left py-3 px-4 w-40">Ngày báo</th>
                  <th className="text-left py-3 px-4 w-40">Ngày hoàn thành</th>
                  <th className="text-center py-3 px-4 w-28">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaintenances.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition last:border-0">
                    <td className="py-3.5 px-4 font-semibold text-gray-950">{m.room_number || "P-?"}</td>
                    <td className="py-3.5 px-4 text-gray-750 max-w-xs truncate" title={m.description}>
                      {m.description}
                    </td>
                    <td className="py-3.5 px-4 text-gray-655">{m.tenant_name || "Admin (Báo cáo)"}</td>
                    <td className="py-3.5 px-4 text-gray-650">{m.assignedTo || "—"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          m.status === "OPEN"
                            ? "bg-red-100 text-red-700"
                            : m.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {m.status === "OPEN"
                          ? "Mở / Chờ"
                          : m.status === "IN_PROGRESS"
                          ? "Đang xử lý"
                          : "Hoàn thành"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-755 font-medium">
                      {m.scheduled_for || m.scheduledFor ? new Date(m.scheduled_for || m.scheduledFor).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "Chưa lên lịch"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(m.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium">
                      {m.completed_at || m.completedAt ? new Date(m.completed_at || m.completedAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(m)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-sm">
            Không tìm thấy báo cáo bảo trì nào thỏa mãn điều kiện lọc.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={16} className="text-blue-600" />
                Báo cáo sự cố mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="p-5 space-y-4">
                {createError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{createError}</span>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold mb-1 block text-gray-700">Chọn phòng *</label>
                  <select
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    required
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} ({room.status === "MAINTENANCE" ? "Đang bảo trì" : "Bình thường"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block text-gray-700">Mô tả sự cố *</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Nhập chi tiết sự cố tại phòng..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-gray-700">Trạng thái</label>
                    <select
                      value={newStatus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewStatus(val);
                        if (val === "DONE" && !newCompletedAt) {
                          const d = new Date();
                          const tzoffset = d.getTimezoneOffset() * 60000;
                          const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
                          setNewCompletedAt(localISOTime);
                        }
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    >
                      <option value="OPEN">Mở / Chờ xử lý</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="DONE">Hoàn thành</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-gray-700">Phân công cho</label>
                    <input
                      type="text"
                      value={newAssignedTo}
                      onChange={(e) => setNewAssignedTo(e.target.value)}
                      placeholder="Tên thợ / Nhân viên"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block text-gray-700">Ngày & giờ bảo trì</label>
                  <input
                    type="datetime-local"
                    value={newScheduledFor}
                    onChange={(e) => setNewScheduledFor(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                {newStatus === "DONE" && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-gray-700">Ngày & giờ hoàn thành</label>
                    <input
                      type="datetime-local"
                      value={newCompletedAt}
                      onChange={(e) => setNewCompletedAt(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-150 flex justify-end gap-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                  disabled={createLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  disabled={createLoading}
                >
                  {createLoading ? "Đang lưu..." : "Tạo báo cáo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Pencil size={16} className="text-blue-600" />
                Cập nhật báo cáo bảo trì
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-5 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{editError}</span>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold mb-1 block text-gray-700">Chọn phòng *</label>
                  <select
                    value={editRoomId}
                    onChange={(e) => setEditRoomId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    required
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} ({room.status === "MAINTENANCE" ? "Đang bảo trì" : "Bình thường"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block text-gray-700">Mô tả sự cố *</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Nhập chi tiết sự cố tại phòng..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-gray-700">Trạng thái</label>
                    <select
                      value={editStatus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditStatus(val);
                        if (val === "DONE" && !editCompletedAt) {
                          const d = new Date();
                          const tzoffset = d.getTimezoneOffset() * 60000;
                          const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
                          setEditCompletedAt(localISOTime);
                        }
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    >
                      <option value="OPEN">Mở / Chờ xử lý</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="DONE">Hoàn thành</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-gray-700">Phân công cho</label>
                    <input
                      type="text"
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                      placeholder="Tên thợ / Nhân viên"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block text-gray-700">Ngày & giờ bảo trì</label>
                  <input
                    type="datetime-local"
                    value={editScheduledFor}
                    onChange={(e) => setEditScheduledFor(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>
                {editStatus === "DONE" && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-gray-700">Ngày & giờ hoàn thành</label>
                    <input
                      type="datetime-local"
                      value={editCompletedAt}
                      onChange={(e) => setEditCompletedAt(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-150 flex justify-end gap-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                  disabled={editLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  disabled={editLoading}
                >
                  {editLoading ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Xác nhận xóa báo cáo</h3>
              <p className="text-sm text-gray-500 mt-2">
                Bạn có chắc chắn muốn xóa báo cáo sự cố tại phòng{" "}
                <strong className="text-gray-850">
                  {deleteItem?.room_number || deleteItem?.roomNumber || "P-?"}
                </strong>
                ? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
