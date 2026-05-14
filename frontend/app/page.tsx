"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Room {
  id: string | number;
  room_number: string;
  capacity: number;
  status: string;
  base_price: number;
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const loadRooms = async () => {
      try {
        const response = await fetchAPI("/rooms");
        if (response.success && Array.isArray(response.data)) {
          setRooms(response.data);
        } else {
          setRooms([]);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.message.includes("token") || err.message.includes("xác thực"))) {
          localStorage.removeItem("token");
          router.push("/login");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load rooms");
        }
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <span className="font-bold">SD</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Secure SmartDorm</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-full">
            Đăng xuất
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Tổng quan <span className="text-zinc-400">Phòng</span>
            </h2>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
              Quản lý danh sách các phòng và trạng thái hiện tại.
            </p>
          </div>
          <Button className="rounded-full px-8 py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all">
            + Thêm Phòng Mới
          </Button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-black dark:border-zinc-800 dark:border-t-white"></div>
              <p className="text-zinc-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-100/50 py-32 dark:border-zinc-800 dark:bg-zinc-900/20">
            <div className="mb-4 rounded-full bg-zinc-200 p-4 dark:bg-zinc-800">
              <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Chưa có phòng nào</h3>
            <p className="mt-2 text-zinc-500">Bắt đầu bằng cách thêm một phòng mới vào hệ thống.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => {
              const isAvailable = room.status === "AVAILABLE" || !room.status || room.status === "TRỐNG";
              return (
                <div
                  key={room.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-zinc-900/50"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-xl font-bold dark:bg-zinc-800">
                        {room.room_number}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isAvailable
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                        }`}
                      >
                        {isAvailable ? "Phòng trống" : "Đã thuê"}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Sức chứa</span>
                        <span className="font-medium">{room.capacity} người</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Giá cơ bản</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {formatPrice(room.base_price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="secondary" className="w-full rounded-xl transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                      Xem Chi Tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
