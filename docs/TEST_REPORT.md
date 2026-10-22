# CHAT MESSAGING SYSTEM
# BÁO CÁO KẾT QUẢ KIỂM THỬ

## 1. Mục đích

Ghi nhận kết quả kiểm thử các chức năng chính của hệ thống chat
được triển khai bằng Docker, Node.js, Socket.IO và PostgreSQL.

## 2. Môi trường kiểm thử

- Hệ điều hành: Ubuntu 24.04.2 LTS
- Công nghệ máy chủ: Node.js, Express
- Giao tiếp thời gian thực: Socket.IO
- Cơ sở dữ liệu: PostgreSQL
- Công cụ đóng gói: Docker và Docker Compose
- Địa chỉ kiểm thử: http://127.0.0.1:3002

## 3. Kết quả kiểm thử

|   ID  |    Nội dung kiểm thử              | Kết quả thực tế                                                           | Trạng thái |
|-------|-----------------------------------|---------------------------------------------------------------------------|------------|
| TC-01 | Khởi chạy container ứng dụng      | Container chat_messaging_app ở trạng thái Up                              | PASS       |
| TC-02 | Kiểm tra endpoint healthz         | HTTP 200, database báo ok                                                 | PASS       |
| TC-03 | Tải giao diện web                 | HTML được phục vụ thành công                                              | PASS       |
| TC-04 | Truy vấn API danh sách phòng      | HTTP 200, JSON hợp lệ                                                     | PASS       |
| TC-05 | Đăng ký/cập nhật người dùng       | Giao diện báo đã lưu thông tin người dùng                                 | PASS       |
| TC-06 | Tạo phòng chat                    | Phòng TEST hiển thị với 1 thành viên                                      | PASS       |
| TC-07 | Gửi tin nhắn                      | Tin nhắn hiển thị trong phòng chat                                        | PASS       |
| TC-08 | Lưu tin nhắn                      | Truy vấn PostgreSQL tìm thấy tin nhắn đã gửi                              | PASS       |
| TC-09 | Đọc lại lịch sử                   | Tin nhắn còn hiển thị sau khi tải lại trang và vào phòng                  | PASS       |
| TC-10 | Chat thời gian thực               | Tin nhắn từ cửa sổ thứ hai xuất hiện ở cửa sổ ban đầu mà không tải lại    | PASS       |
| TC-11 | Xác minh dữ liệu nhiều người dùng | PostgreSQL trả về tin nhắn của duc_hieu và test_user02                    | PASS |

## 4. Nhận xét

Các chức năng cốt lõi được kiểm thử đều đạt kết quả mong đợi.
Ứng dụng kết nối được PostgreSQL, lưu và đọc lại lịch sử tin nhắn,
đồng thời truyền tin nhắn thời gian thực giữa hai kết nối trình duyệt.

Kết quả trên phản ánh các lần kiểm thử đã thực hiện trong môi trường
thực hành; chưa phải kiểm thử tải, kiểm thử bảo mật hoặc kiểm thử
khả năng chịu lỗi toàn diện.

## 5. Hạn chế

Ứng dụng hiện chưa có cơ chế xác thực và quản lý phiên đăng nhập
đầy đủ. Chưa nên triển khai công khai trên Internet trước khi bổ sung
xác thực, phân quyền, bảo vệ dữ liệu và các kiểm tra bảo mật cần thiết.

## 6. Tài liệu liên quan

- Hướng dẫn triển khai: docs/DEPLOYMENT_GUIDE.md
- Ảnh minh chứng: docs/evidence/
