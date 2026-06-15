async function test() {
  try {
    // 1. Login as admin
    console.log("1. Đăng nhập admin...");
    let loginRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" })
    });
    let loginData = await loginRes.json();
    
    if (!loginData.token) {
      console.log("   Thử mật khẩu 123456...");
      loginRes = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "123456" })
      });
      loginData = await loginRes.json();
    }

    if (!loginData.token) {
      console.error("❌ Không đăng nhập được admin! Response:", loginData);
      return;
    }
    const token = loginData.token;
    console.log("✅ Đăng nhập thành công! Token:", token.substring(0, 15) + "...");

    // 2. Tạo bài viết thử nghiệm
    console.log("\n2. Tạo bài viết mới...");
    const postRes = await fetch("http://localhost:3001/api/posts", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ content: "Bài viết test xóa API", imageUrl: null })
    });
    const postData = await postRes.json();
    console.log("Status:", postRes.status);
    if (!postData.success) {
      console.error("❌ Tạo bài viết thất bại:", postData);
      return;
    }
    const postId = postData.data.id;
    console.log("✅ Bài viết đã tạo có ID:", postId);

    // 3. Tạo bình luận kèm ảnh trên bài viết vừa tạo
    console.log("\n3. Tạo bình luận kèm ảnh...");
    const commentRes = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        content: "Bình luận test kèm ảnh",
        parentId: null,
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400"
      })
    });
    const commentData = await commentRes.json();
    console.log("Status:", commentRes.status);
    if (!commentData.success) {
      console.error("❌ Tạo bình luận thất bại:", commentData);
      return;
    }
    const commentId = commentData.data.id;
    console.log("✅ Bình luận đã tạo có ID:", commentId, "| ImageUrl:", commentData.data.image_url);

    // 4. Xóa bình luận vừa tạo
    console.log("\n4. Xóa bình luận...");
    const delCommentRes = await fetch(`http://localhost:3001/api/posts/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const delCommentData = await delCommentRes.json();
    console.log("Status:", delCommentRes.status, "| Response:", delCommentData);
    if (delCommentRes.status === 200 && delCommentData.success) {
      console.log("✅ Xóa bình luận thành công!");
    } else {
      console.error("❌ Xóa bình luận thất bại");
    }

    // 5. Xóa bài viết vừa tạo
    console.log("\n5. Xóa bài viết...");
    const delPostRes = await fetch(`http://localhost:3001/api/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const delPostData = await delPostRes.json();
    console.log("Status:", delPostRes.status, "| Response:", delPostData);
    if (delPostRes.status === 200 && delPostData.success) {
      console.log("✅ Xóa bài viết thành công!");
    } else {
      console.error("❌ Xóa bài viết thất bại");
    }

  } catch (err) {
    console.error("❌ Lỗi xảy ra:", err.message);
  }
}

test();
