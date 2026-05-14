"use client";

const stats = [
  { label: "Tổng phòng", value: "48", icon: "🏠", border: "border-blue-500" },
  { label: "Đang thuê", value: "42", icon: "✅", border: "border-green-500" },
  { label: "Phòng trống", value: "6", icon: "🔓", border: "border-yellow-500" },
  { label: "Doanh thu tháng", value: "84.000.000đ", icon: "💰", border: "border-purple-500" },
];

const maintenance = [
  { id: 1, room: "P101", issue: "Điều hòa hỏng", status: "OPEN" },
  { id: 2, room: "P204", issue: "Đèn không sáng", status: "DONE" },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">Tổng quan hệ thống SmartDorm</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.border}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Báo cáo bảo trì */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-lg mb-4">🔧 Báo cáo bảo trì</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b">
              <th className="text-left pb-2">Phòng</th>
              <th className="text-left pb-2">Sự cố</th>
              <th className="text-left pb-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2">{m.room}</td>
                <td className="py-2">{m.issue}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.status === "OPEN" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                  }`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}