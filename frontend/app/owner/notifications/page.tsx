"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  FileText,
  MessageSquare,
  Shield,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "contract" | "payment" | "maintenance" | "system" | "general";
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "contract",
    title: "Yêu cầu thuê phòng mới",
    description: "Khách thuê Nguyễn Văn A đã gửi yêu cầu thuê phòng 102. Vui lòng duyệt hợp đồng.",
    time: "5 phút trước",
    isRead: false,
  },
  {
    id: "2",
    type: "payment",
    title: "Thanh toán hóa đơn thành công",
    description: "Hóa đơn tiền điện nước phòng 304 tháng 5 đã được thanh toán (Số tiền: 1,250,000đ).",
    time: "2 giờ trước",
    isRead: false,
  },
  {
    id: "3",
    type: "maintenance",
    title: "Báo hỏng mới",
    description: "Phòng 201 báo hỏng điều hòa (không mát). Cần phân công kỹ thuật xử lý.",
    time: "1 ngày trước",
    isRead: true,
  },
  {
    id: "4",
    type: "system",
    title: "Hệ thống bảo trì",
    description: "Hệ thống SmartDorm sẽ bảo trì định kỳ vào 01:00 - 03:00 ngày mai.",
    time: "2 ngày trước",
    isRead: true,
  },
  {
    id: "5",
    type: "payment",
    title: "Hóa đơn quá hạn",
    description: "Hóa đơn phòng 401 đã quá hạn thanh toán 3 ngày. Nhắc nhở khách thuê.",
    time: "3 ngày trước",
    isRead: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<string>("all");

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.isRead;
    return notif.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "contract":
        return <FileText size={18} className="text-purple-600" />;
      case "payment":
        return <Wallet size={18} className="text-emerald-600" />;
      case "maintenance":
        return <Wrench size={18} className="text-amber-600" />;
      case "system":
        return <Shield size={18} className="text-blue-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "contract":
        return "bg-purple-50";
      case "payment":
        return "bg-emerald-50";
      case "maintenance":
        return "bg-amber-50";
      case "system":
        return "bg-blue-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-purple-600" size={24} />
            Thông báo của bạn
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các cập nhật quan trọng từ khách thuê và hệ thống.
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition shadow-sm self-start sm:self-auto"
        >
          <CheckCircle2 size={16} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-6">
        {[
          { key: "all", label: "Tất cả" },
          { key: "unread", label: "Chưa đọc" },
          { key: "contract", label: "Hợp đồng" },
          { key: "payment", label: "Thanh toán" },
          { key: "maintenance", label: "Báo hỏng" },
          { key: "system", label: "Hệ thống" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              filter === tab.key
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                notif.isRead
                  ? "bg-white border-gray-100"
                  : "bg-purple-50/30 border-purple-100 hover:border-purple-200"
              }`}
            >
              {/* Icon Circle */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(
                  notif.type
                )}`}
              >
                {getIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3
                    className={`text-sm font-semibold truncate ${
                      notif.isRead ? "text-gray-900" : "text-purple-950 font-bold"
                    }`}
                  >
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {notif.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {notif.description}
                </p>
                
                {/* Action Buttons if Unread */}
                {!notif.isRead && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <Check size={12} />
                      Đánh dấu đã đọc
                    </button>
                  </div>
                )}
              </div>

              {/* Actions Column */}
              <div className="flex flex-col items-end gap-2 self-stretch justify-between">
                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse mt-1" />
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition"
                  title="Xóa thông báo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-300" size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Không có thông báo nào</h3>
            <p className="text-xs text-gray-500 mt-1">
              Bạn đã cập nhật đầy đủ toàn bộ tin tức rồi!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
