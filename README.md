# Hệ thống Quản lý Đơn hàng và Dự đoán Tồn kho

Hệ thống quản lý kho hàng thông minh cho công ty TNHH Initation Việt Nam.

## Cài đặt nhanh

### Windows:
\`\`\`bash
# Chạy file start.bat
start.bat
\`\`\`

### Mac/Linux:
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

### Thủ công:
\`\`\`bash
# 1. Cài đặt dependencies
npm run install-all

# 2. Seed dữ liệu
npm run seed

# 3. Chạy hệ thống
npm run dev
\`\`\`

## Truy cập
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Tài khoản: admin / admin123

## Cấu trúc dự án
\`\`\`
inventory-management-system/
├── frontend/           # React frontend
├── backend/           # Node.js backend
├── package.json       # Root package.json
├── start.bat         # Windows startup script
├── start.sh          # Linux/Mac startup script
└── README.md
