---
title: "5.6 Frontend & URL Masking"
date: 2026-07-10
weight: 6
chapter: false
---

## 5.6 Cấu hình Next.js Frontend, Deploy Vercel & bảo mật URL Masking

Quy trình kết nối giao diện Next.js với HTTP API Gateway, deploy website và áp dụng giải pháp an ninh mạng ẩn địa chỉ quản trị nhạy cảm.

### 1. Kết nối Frontend gọi APIs Backend
Sử dụng hàm gọi fetch đính kèm JWT Token lấy từ sessionStorage khi gọi APIs:
```typescript
export async function getRooms(status?: string) {
  const token = sessionStorage.getItem("token");
  const query = status ? `?status=${status}` : "";
  const res = await fetch(`https://your-api-gateway.amazonaws.com/api/rooms${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  return res.json();
}
```

### 2. Triển khai kỹ thuật URL Masking bảo mật Client-side
Tại tệp cấu hình định tuyến hoặc Layout chính của Next.js (`frontend/app/layout.tsx` hoặc middleware), áp dụng cơ chế kiểm tra tham số mã băm chữ ký số (signature) để che giấu URL quản trị thực tế khỏi việc quét URL thủ công:
```typescript
import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Chặn rà quét URL: Nếu truy cập các trang admin mà không có signature hợp lệ
    if (pathname.startsWith("/owner") || pathname.startsWith("/admin")) {
      const sig = searchParams.get("sig");
      const expectedSig = "9b81d8d4ec0b4d5a9d8c919d3f"; // Chữ ký hợp lệ được mã hóa
      
      if (sig !== expectedSig) {
        // Trả về trang lỗi 403 Forbidden nếu không có chữ ký số
        router.push("/403");
      } else {
        // Thực hiện URL Masking: ẩn đi toàn bộ các tham số nhạy cảm trên thanh địa chỉ
        // Giữ lại URL sạch dạng: https://smartdorm.vercel.app/owner
        window.history.replaceState(null, "", pathname);
      }
    }
  }, [pathname, searchParams, router]);

  return <>{children}</>;
}
```

### 3. Đưa mã nguồn Frontend Next.js lên Vercel Hosting
*   Kết nối kho GitHub repository chứa dự án SmartDorm của bạn với tài khoản **Vercel**.
*   Thiết lập lệnh build mặc định của Next.js và biến môi trường:
    *   `Build Command`: `next build`
    *   `Output Directory`: `.next`
*   Nhấp vào nút **Deploy** để hệ thống Vercel cấp phát URL https công khai miễn phí.
