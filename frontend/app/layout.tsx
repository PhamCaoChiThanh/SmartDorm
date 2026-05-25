import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartDorm - Quản lý KTX thông minh",
  description: "Hệ thống quản lý Ký túc xá và Nhà trọ thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
