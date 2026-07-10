"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { fetchAPI } from "@/lib/api";

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  sender_name: string;
  sender_avatar?: string;
  type: string;
  postId?: string;
  commentId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Helper to format time relative
  const formatTime = (timeStr: string) => {
    try {
      const now = new Date();
      const date = new Date(timeStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return "Hôm qua";
      return `${date.getDate()}/${date.getMonth() + 1}`;
    } catch {
      return "";
    }
  };

  // Fetch unread count
  const fetchUnread = async () => {
    try {
      const res = await fetchAPI("/notifications/unread-count");
      if (res.success && res.data) {
        setUnreadCount(res.data.unread_count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  // Fetch all notifications (when dropdown opens)
  const fetchAllNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAPI("/notifications");
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Smart Polling effect
  useEffect(() => {
    // Initial fetch
    fetchUnread();

    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      intervalId = setInterval(() => {
        fetchUnread();
      }, 20000); // Poll every 20 seconds
    };

    const stopPolling = () => {
      if (intervalId) clearInterval(intervalId);
    };

    // Start polling if document is visible
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      startPolling();
    }

    // Handle tab change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnread();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle Dropdown
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchAllNotifications();
      // Reset unread count locally for visual snappiness
      setUnreadCount(0);
      // Mark all as read on the backend
      fetchAPI("/notifications/read-all", { method: "POST" }).catch(err => console.error(err));
    }
  };

  // Handle clicking on a notification
  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);

    // Call API to read
    if (!notif.isRead) {
      try {
        await fetchAPI(`/notifications/${notif.id}/read`, { method: "POST" });
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }

    // Redirect to the post
    if (notif.postId) {
      const feedPath = "/tenant/feed";
      const targetUrl = `${feedPath}?postId=${notif.postId}`;
      
      // If we are already on the feed page, update search param and trigger scroll
      if (window.location.pathname === feedPath) {
        router.replace(targetUrl);
        // Dispatch custom event or window location change
        const params = new URLSearchParams(window.location.search);
        params.set("postId", notif.postId);
        window.history.pushState({}, "", targetUrl);
        // Find element and scroll
        const element = document.getElementById(`post-${notif.postId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("bg-blue-50/70", "ring-2", "ring-blue-200");
          setTimeout(() => {
            element.classList.remove("bg-blue-50/70", "ring-2", "ring-blue-200");
          }, 3000);
        }
      } else {
        router.push(targetUrl);
      }
    }
  };

  // Delete notification
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetchAPI(`/notifications/${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Mark all as read button click
  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchAPI("/notifications/read-all", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200 shrink-0"
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <span className="font-bold text-gray-800 dark:text-zinc-100 text-sm">Thông báo</span>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
              >
                <Check size={14} />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List area */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800/50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 px-4 py-3 items-start cursor-pointer transition-all duration-150 group ${
                    notif.isRead 
                      ? "hover:bg-gray-50 dark:hover:bg-zinc-800/40" 
                      : "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30"
                  }`}
                >
                  {/* Sender Avatar */}
                  {notif.sender_avatar ? (
                    <img
                      src={notif.sender_avatar}
                      alt={notif.sender_name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-700 shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0 mt-0.5 border border-blue-200 dark:border-blue-900/50">
                      {notif.sender_name ? notif.sender_name.substring(0, 2).toUpperCase() : "SD"}
                    </div>
                  )}

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs text-gray-700 dark:text-zinc-300 leading-normal break-words">
                      <span className="font-semibold text-gray-900 dark:text-zinc-100">{notif.sender_name}</span>{" "}
                      {notif.content}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 block">{formatTime(notif.createdAt)}</span>
                  </div>

                  {/* Actions (Delete icon) */}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-150 self-center"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-center mb-2">
                  <Bell size={24} className="text-gray-300 dark:text-zinc-600" />
                </div>
                <span className="text-xs">Không có thông báo nào.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
