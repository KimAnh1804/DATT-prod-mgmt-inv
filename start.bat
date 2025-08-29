@echo off
echo ========================================
echo   KHOI DONG HE THONG QUAN LY KHO HANG
echo ========================================
echo.

echo [1/4] Cai dat dependencies...
call npm install
if errorlevel 1 (
    echo Loi: Khong the cai dat dependencies goc
    pause
    exit /b 1
)

echo [2/4] Cai dat frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Loi: Khong the cai dat frontend dependencies
    pause
    exit /b 1
)

echo [3/4] Cai dat backend dependencies...
cd ..\backend
call npm install
if errorlevel 1 (
    echo Loi: Khong the cai dat backend dependencies
    pause
    exit /b 1
)

echo [4/4] Seed du lieu mau...
call npm run seed
if errorlevel 1 (
    echo Canh bao: Khong the seed du lieu (co the da ton tai)
)

cd ..
echo.
echo ========================================
echo   BAT DAU CHAY HE THONG
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Tai khoan: admin / admin123
echo ========================================
echo.

call npm run dev
