# Chat Messaging System — Hướng dẫn triển khai

## 1. Tổng quan

Ứng dụng chat sử dụng Node.js, Express, Socket.IO và PostgreSQL.
Ứng dụng được đóng gói bằng Docker và khởi chạy qua Docker Compose.

## 2. Kiến trúc triển khai

- Giao diện web: HTML, CSS và JavaScript.
- Máy chủ: Node.js và Express.
- Giao tiếp thời gian thực: Socket.IO.
- Cơ sở dữ liệu: PostgreSQL.
- Container ứng dụng: chat_messaging_app.
- Docker image: chat-messaging-app:dev.
- Cổng ứng dụng trên máy Ubuntu: 3002.
- Cổng nội bộ của ứng dụng: 3000.
- Docker network kết nối PostgreSQL: dbms_default.
- Cơ sở dữ liệu ứng dụng: chat_messaging.

## 3. Khởi chạy ứng dụng

Từ thư mục gốc của dự án:

    docker compose up -d

Kiểm tra trạng thái:

    docker compose ps

Kiểm tra kết nối ứng dụng và cơ sở dữ liệu:

    curl -i http://127.0.0.1:3002/healthz

Kết quả mong đợi:

    {"status":"ok","database":"ok"}

Truy cập giao diện:

    http://127.0.0.1:3002

## 4. Xem nhật ký và dừng ứng dụng

Xem nhật ký:

    docker compose logs --tail=50 chat-app

Theo dõi nhật ký trực tiếp:

    docker compose logs -f chat-app

Dừng ứng dụng:

    docker compose down

Lệnh trên dừng và gỡ container thuộc Compose của dự án.
Nó không tự xóa cơ sở dữ liệu hoặc dừng PostgreSQL dùng chung.

## 5. Build lại ứng dụng

Sau khi thay đổi mã nguồn:

    docker build -t chat-messaging-app:dev ./app
    docker compose up -d

## 6. Chức năng đã kiểm thử

- Đăng ký và cập nhật thông tin người dùng.
- Tạo phòng chat và tham gia phòng.
- Gửi tin nhắn.
- Lưu và đọc tin nhắn từ PostgreSQL.
- Đọc lại lịch sử sau khi tải lại trang.
- Cập nhật tin nhắn thời gian thực giữa hai cửa sổ trình duyệt.

## 7. Cấu hình và bảo mật

Thông tin kết nối cơ sở dữ liệu được lưu trong file .env.
Không đưa file .env hoặc mật khẩu lên GitHub.

Ứng dụng hiện là bản thực hành, chưa có cơ chế xác thực
và quản lý phiên đăng nhập đầy đủ. Không triển khai công khai
trên Internet trước khi bổ sung xác thực, phân quyền và các
biện pháp bảo vệ phù hợp.

Ứng dụng hiện được ánh xạ cổng 3002 trên địa chỉ 127.0.0.1.

## 8. Nginx Reverse Proxy — Commit 1

### Cấu hình

File cấu hình được quản lý cùng mã nguồn tại:

    config/nginx/chat-messaging.conf

Cấu hình sử dụng `server_name chat.local` và chuyển tiếp yêu cầu
đến ứng dụng đang lắng nghe tại `127.0.0.1:3002`.

### Triển khai trên máy Ubuntu

Sao chép cấu hình vào thư mục quản lý Nginx:

    sudo cp config/nginx/chat-messaging.conf /etc/nginx/sites-available/chat-messaging

Nếu site chưa được kích hoạt, tạo liên kết:

    sudo ln -s /etc/nginx/sites-available/chat-messaging /etc/nginx/sites-enabled/chat-messaging

Kiểm tra cú pháp và nạp lại Nginx:

    sudo nginx -t
    sudo systemctl reload nginx

Đảm bảo `/etc/hosts` có dòng:

    127.0.0.1 chat.local

Truy cập ứng dụng:

    http://chat.local

### Kiểm thử đã thực hiện

- Endpoint `/healthz` trả về HTTP 200 và database báo `ok`.
- Giao diện HTML được phục vụ qua Nginx.
- Socket.IO polling handshake thành công qua Nginx.
- Chat thời gian thực được kiểm tra qua hai cửa sổ trình duyệt
  sử dụng địa chỉ `http://chat.local`.

### Lưu ý

Cấu hình này dùng HTTP nội bộ và security headers cơ bản;
chưa cấu hình HTTPS. Khi triển khai ở môi trường khác, cần điều
chỉnh tên miền, địa chỉ upstream và cấu hình Nginx tương ứng.
