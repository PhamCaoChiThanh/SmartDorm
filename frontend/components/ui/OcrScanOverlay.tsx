"use client";

import { useEffect, useState } from "react";
import { Sparkles, ScanLine } from "lucide-react";

interface OcrScanOverlayProps {
  onClose?: () => void;
  statusText?: string;
}

export default function OcrScanOverlay({ onClose, statusText = "AI đang trích xuất dữ liệu..." }: OcrScanOverlayProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Holographic glowing lines in bg */}
        <div className="absolute inset-0 bg-linear-to-b from-indigo-50/20 to-white pointer-events-none"></div>

        {/* Pulsing scanner box */}
        <div className="relative w-40 h-40 border-2 border-dashed border-indigo-400 rounded-2xl flex items-center justify-center bg-indigo-50/30 overflow-hidden mb-6 mt-4">
          <ScanLine className="text-indigo-600 animate-bounce" size={48} />
          
          {/* Laser scanning line */}
          <div className="absolute left-0 right-0 h-1 bg-linear-to-r from-transparent via-emerald-500 to-transparent shadow-lg shadow-emerald-500/50 animate-pulse top-0"
               style={{
                 animationName: "scan",
                 animationDuration: "2s",
                 animationIterationCount: "infinite",
                 animationTimingFunction: "ease-in-out"
               }}
          ></div>
        </div>

        {/* Spinning status spinner */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
          <span className="text-sm font-bold text-slate-700 flex items-center">
            {statusText}{dots}
          </span>
        </div>
        
        <p className="text-xs text-slate-400 text-center px-4 leading-relaxed">
          Đang sử dụng mô hình học máy để phân tích ảnh và trích xuất trường thông tin tự động...
        </p>

        {/* Internal keyframe styles for laser scan */}
        <style jsx global>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0.3; }
            50% { top: 95%; opacity: 1; }
            100% { top: 0%; opacity: 0.3; }
          }
        `}</style>
      </div>
    </div>
  );
}
