# Xóa file zip cũ nếu có
if (Test-Path "backend.zip") {
    Remove-Item "backend.zip" -Force
}

Write-Host "Đang đóng gói ứng dụng Backend..."

# Nén các file cần thiết (code + thư viện node_modules)
Compress-Archive -Path "src", "node_modules", "package.json", "package-lock.json" -DestinationPath "backend.zip"

Write-Host "Đóng gói thành công thành file backend.zip! Bạn đã sẵn sàng chạy Terraform." -ForegroundColor Green
