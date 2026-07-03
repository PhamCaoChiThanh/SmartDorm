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
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased bg-background text-foreground transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
