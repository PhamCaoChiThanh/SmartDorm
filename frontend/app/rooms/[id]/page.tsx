import { Suspense } from "react";
import RoomDetailPage from "./RoomDetailClient";

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" }
  ];
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-500">Loading room details...</div>}>
      <RoomDetailPage />
    </Suspense>
  );
}
