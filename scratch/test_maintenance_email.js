// Test: login as admin, get maintenance list, update one to trigger email notification
async function test() {
  try {
    // 1. Login as admin
    console.log("1. Đăng nhập admin...");
    const loginRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "Password123!" })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.error("❌ Không đăng nhập được admin!");
      return;
    }
    const token = loginData.token;
    console.log("✅ Đăng nhập thành công!");

    // 2. Lấy danh sách báo hỏng
    console.log("2. Lấy danh sách báo hỏng...");
    const maintRes = await fetch("http://localhost:3001/api/maintenances", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const maintData = await maintRes.json();
    console.log("Status:", maintRes.status);
    if (!maintData.success || !maintData.data || maintData.data.length === 0) {
      console.log("Không có sự cố nào để thử.");
      return;
    }

    const firstMaint = maintData.data[0];
    console.log(`Lấy được sự cố ID: ${firstMaint.id}, Phòng: ${firstMaint.room_number}, Mô tả: ${firstMaint.description}`);

    // 3. Cập nhật lịch bảo trì để trigger gửi mail
    console.log(`3. Cập nhật lịch bảo trì cho sự cố ${firstMaint.id}...`);
    const updateRes = await fetch(`http://localhost:3001/api/maintenances/${firstMaint.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        roomId: firstMaint.roomId || undefined,
        description: firstMaint.description,
        status: "IN_PROGRESS",
        assignedTo: "Kỹ thuật viên Nguyễn Văn A",
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Ngày mai
      })
    });

    console.log("Update status:", updateRes.status);
    const updateData = await updateRes.json();
    console.log("Response:", JSON.stringify(updateData, null, 2));

  } catch (err) {
    console.error("Lỗi:", err.message);
  }
}
test();
