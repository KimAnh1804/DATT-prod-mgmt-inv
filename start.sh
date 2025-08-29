echo "========================================"
echo "   KHOI DONG HE THONG QUAN LY KHO HANG"
echo "========================================"
echo

echo "[1/4] Cai dat dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Loi: Khong the cai dat dependencies goc"
    exit 1
fi

echo "[2/4] Cai dat frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Loi: Khong the cai dat frontend dependencies"
    exit 1
fi

echo "[3/4] Cai dat backend dependencies..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "Loi: Khong the cai dat backend dependencies"
    exit 1
fi

echo "[4/4] Seed du lieu mau..."
npm run seed
if [ $? -ne 0 ]; then
    echo "Canh bao: Khong the seed du lieu (co the da ton tai)"
fi

cd ..
echo
echo "========================================"
echo "   BAT DAU CHAY HE THONG"
echo "========================================"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Tai khoan: admin / admin123"
echo "========================================"
echo

npm run dev
