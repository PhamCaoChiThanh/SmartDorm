// Test: login as admin and approve/reject a request
async function test() {
  try {
    // 1. Login as admin
    console.log("1. Đăng nhập admin...");
    const loginRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" })
    });
    const loginData = await loginRes.json();
    console.log("   Status:", loginRes.status, "| Role:", loginData.role);
    if (!loginData.token) {
      // try other common passwords
      const loginRes2 = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "123456" })
      });
      const loginData2 = await loginRes2.json();
      console.log("   Try 123456 - Status:", loginRes2.status, "| Role:", loginData2.role);
      if (!loginData2.token) { console.error("   ❌ Không đăng nhập được admin!"); return; }
      Object.assign(loginData, loginData2);
    }
    const token = loginData.token;
    console.log("   ✅ Token nhận được");

    // 2. GET all requests
    console.log("\n2. Lấy danh sách yêu cầu...");
    const reqRes = await fetch("http://localhost:3001/api/requests", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("   Status:", reqRes.status);
    const reqData = await reqRes.json();
    console.log("   Requests:", JSON.stringify(reqData, null, 2));

    if (!reqData.success || !reqData.data || reqData.data.length === 0) {
      console.log("   Không có yêu cầu để duyệt.");
      return;
    }

    // 3. Try to APPROVE the first PENDING request
    const pending = reqData.data.find(r => r.status === "PENDING");
    if (!pending) { console.log("   Không có yêu cầu PENDING."); return; }
    console.log(`\n3. Duyệt yêu cầu ID: ${pending.id} (phòng ${pending.room_number})...`);
    const approveRes = await fetch(`http://localhost:3001/api/requests/${pending.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ status: "APPROVED", adminNote: "Test duyệt từ script" })
    });
    console.log("   Status:", approveRes.status);
    const approveText = await approveRes.text();
    console.log("   Response:", approveText);

  } catch (err) {
    console.error("Lỗi:", err.message);
  }
}
test();
