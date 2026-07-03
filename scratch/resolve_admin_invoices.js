const fs = require('fs');

const pagePath = 'm:/SmartDorm/frontend/app/admin/invoices/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Update lucide imports
const oldImports = `import { AlertCircle, Send, Plus, Pencil, Trash2, FileSpreadsheet, FileDown, ChevronDown, ChevronRight } from "lucide-react";`;
const newImports = `import { AlertCircle, Send, Plus, Pencil, Trash2, FileSpreadsheet, FileDown, ChevronDown, ChevronRight, FileText, CheckCircle, Copy, Sparkles, Loader2, X } from "lucide-react";`;
content = content.replace(oldImports, newImports);

// 2. Insert states inside AdminInvoices()
const oldStateStart = `export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);`;
const newStateStart = `export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [copied, setCopied] = useState(false);`;
content = content.replace(oldStateStart, newStateStart);

// 3. Insert handlers before loadInvoices or inside the component
// Let's find "const loadInvoices = async () => {"
const loadInvoicesTarget = `  const loadInvoices = async () => {`;
const handlersCode = `  const handleGenerateReminder = async (invoice: any) => {
    try {
      setReminderLoading(invoice.id);
      setSelectedInvoice(invoice);
      setReminderMessage("");
      setCopied(false);
      setShowModal(true);

      const res = await fetchAPI(\`/invoices/\${invoice.id}/reminder\`, {
        method: "POST",
      });

      if (res.success && res.data) {
        setReminderMessage(res.data.reminder_message);
      } else {
        setError(res.message || "Không thể tạo tin nhắn nhắc nợ.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi kết nối máy chủ.");
    } finally {
      setReminderLoading(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadInvoices = async () => {`;
content = content.replace(loadInvoicesTarget, handlersCode);

// 4. Insert Nhắc nợ AI button
const billBtnTarget = `                                            {inv.status === "PAID" ? (
                                              <span className="text-green-600 text-[11px] font-semibold flex items-center gap-0.5">
                                                ✅ Đã thanh toán
                                              </span>
                                            ) : isSent ? (
                                              <span className="text-green-600 text-[11px] font-semibold">✅ Đã gửi!</span>
                                            ) : (`;

const newBillAndOcrBtn = `                                            {inv.status !== "PAID" && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleGenerateReminder(inv);
                                                }}
                                                disabled={reminderLoading !== null}
                                                title="Nhắc nợ bằng AI"
                                                className="flex items-center gap-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition disabled:opacity-50 shadow-xs"
                                              >
                                                {reminderLoading === inv.id ? (
                                                  <Loader2 size={10} className="animate-spin" />
                                                ) : (
                                                  <Sparkles size={10} />
                                                )}
                                                Nhắc nợ AI
                                              </button>
                                            )}
                                            {inv.status === "PAID" ? (
                                              <span className="text-green-600 text-[11px] font-semibold flex items-center gap-0.5">
                                                ✅ Đã thanh toán
                                              </span>
                                            ) : isSent ? (
                                              <span className="text-green-600 text-[11px] font-semibold">✅ Đã gửi!</span>
                                            ) : (`;
content = content.replace(billBtnTarget, newBillAndOcrBtn);

// 5. Insert Modal code at the end
const endTarget = `      )}
    </div>
  );
}`;

const modalAndEnd = `      )}

      {/* AI Reminder Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl text-gray-800 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Tin nhắn nhắc nợ thông minh AI</h3>
                <p className="text-[11px] text-gray-400">Tự động tối ưu hóa dựa trên lịch sử thanh toán</p>
              </div>
            </div>

            {/* Meta Data */}
            <div className="bg-purple-50 rounded-xl p-3 text-xs space-y-1.5 border border-purple-100">
              <div className="flex justify-between text-gray-600">
                <span>Phòng nhận:</span>
                <span className="font-semibold text-gray-800">Phòng {selectedInvoice.room_number}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Hóa đơn tháng:</span>
                <span className="font-semibold text-gray-800">{selectedInvoice.billing_month}/{selectedInvoice.billing_year}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Số tiền nợ:</span>
                <span className="font-semibold text-purple-700">{(selectedInvoice.total_amount || 0).toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            {/* AI Generated Content */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Nội dung tin nhắn gợi ý</label>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[100px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {reminderMessage}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? "Đã sao chép!" : "Sao chép tin nhắn"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border rounded-xl font-medium text-sm hover:bg-gray-50 text-gray-500 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace(endTarget, modalAndEnd);
fs.writeFileSync(pagePath, content, 'utf8');
console.log('page.tsx updated successfully!');
