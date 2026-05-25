@echo off
title SmartDorm Starter
echo ===================================================
echo             KHOI DONG DU AN SMARTDORM
echo ===================================================
echo.

echo [+] Dang khoi dong C# Backend trong cua so moi...
start "SmartDorm Backend (3001)" cmd /k "cd backend && dotnet run"

echo.
echo [+] Dang khoi dong Next.js Frontend trong cua so moi...
start "SmartDorm Frontend (3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo [OK] Ca 2 cua so da duoc mo!
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:3000
echo.
echo Giu cua so nay de doc cac thong tin huong dan hoac close.
echo ===================================================
pause
