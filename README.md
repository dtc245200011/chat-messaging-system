# Chat Messaging System

Ứng dụng chat nhiều người dùng, sử dụng Node.js, Express,
Socket.IO, PostgreSQL, Docker và Docker Compose.

## Chức năng

- Đăng ký và cập nhật thông tin người dùng.
- Tạo phòng chat và tham gia phòng.
- Gửi tin nhắn và lưu vào PostgreSQL.
- Đọc lại lịch sử tin nhắn.
- Nhận tin nhắn thời gian thực qua Socket.IO.

## Công nghệ

- Node.js và Express
- Socket.IO
- PostgreSQL
- Docker và Docker Compose
- HTML, CSS và JavaScript

## Yêu cầu triển khai

- Docker Engine và Docker Compose.
- PostgreSQL đang hoạt động trên Docker network `dbms_default`.
- Cơ sở dữ liệu `chat_messaging`, tài khoản ứng dụng và schema
  được tạo theo hướng dẫn trong `scripts/001_schema.sql`.
- File `.env` được cấu hình theo mẫu `.env.example`.

## Khởi chạy

Tạo file `.env` từ mẫu và thay giá trị mật khẩu bằng thông tin
của môi trường triển khai:

    cp .env.example .env
    chmod 600 .env

Sau đó khởi chạy ứng dụng:

    docker compose up -d

Kiểm tra:

    docker compose ps
    curl http://127.0.0.1:3002/healthz

Mở giao diện:

    http://127.0.0.1:3002

## Tài liệu và minh chứng

- `docs/DEPLOYMENT_GUIDE.md`: hướng dẫn triển khai.
- `docs/TEST_REPORT.md`: báo cáo kết quả kiểm thử.
- `docs/evidence/`: ảnh minh chứng các bước thực hiện.

## Lưu ý bảo mật

Đây là phiên bản thực hành, chưa có xác thực và quản lý phiên
đăng nhập đầy đủ. Không triển khai công khai trên Internet trước
khi bổ sung cơ chế xác thực, phân quyền và bảo vệ phù hợp.

Không đưa file `.env` hoặc mật khẩu thực vào Git.

## Nginx Reverse Proxy

Nginx chuyển tiếp yêu cầu từ tên miền nội bộ `chat.local`
đến ứng dụng chat tại `http://127.0.0.1:3002`.

Địa chỉ truy cập qua Nginx:

    http://chat.local

Cấu hình Nginx được lưu tại:

    config/nginx/chat-messaging.conf

Cấu hình hiện hỗ trợ Socket.IO polling/WebSocket upgrade và
các security headers cơ bản. Máy Ubuntu cần có ánh xạ tên miền
`chat.local` về `127.0.0.1` trong `/etc/hosts`.

Kiểm tra và nạp cấu hình Nginx:

    sudo nginx -t
    sudo systemctl reload nginx

Kiểm tra endpoint:

    curl http://chat.local/healthz
