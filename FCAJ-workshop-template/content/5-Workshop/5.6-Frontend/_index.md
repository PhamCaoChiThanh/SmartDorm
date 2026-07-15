---
title: "5.6 Frontend & URL Masking"
date: 2026-07-10
weight: 6
chapter: false
---

## 5.6 Next.js Frontend Integration & URL Masking Security

Connect the Next.js client, deploy to Vercel, and implement route protection via client-side URL Masking.

### 1. Connection Fetch Logic with JWT Headers
Use fetch routines appending sessionStorage JWT Authorization headers:
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

### 2. URL Masking Routing Protection (`layout.tsx`)
In your Next.js root layout files, intercept route changes and authenticate hashed signatures to obfuscate URL paths from brute-forcing scans:
```typescript
import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname.startsWith("/owner") || pathname.startsWith("/admin")) {
      const sig = searchParams.get("sig");
      const expectedSig = "9b81d8d4ec0b4d5a9d8c919d3f"; // Valid hash key signature
      
      if (sig !== expectedSig) {
        // Redirect unauthorized access to error pages
        router.push("/403");
      } else {
        // Rewrite the address bar (URL Masking) to hide credentials parameters
        window.history.replaceState(null, "", pathname);
      }
    }
  }, [pathname, searchParams, router]);

  return <>{children}</>;
}
```

### 3. Host Next.js on Vercel
*   Link your GitHub workspace with **Vercel**.
*   Select default frameworks options:
    *   `Build Command`: `next build`
    *   `Output Directory`: `.next`
*   Click **Deploy** to instantly launch the secure frontend.
