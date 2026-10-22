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

## Monitoring — Prometheus và Grafana

Hệ thống monitoring hiện tại sử dụng Prometheus, Grafana,
PostgreSQL Exporter, Blackbox Exporter, Node Exporter và cAdvisor.

Các file cấu hình được lưu trong repository:

- `config/monitoring/prometheus.yml`
- `config/monitoring/blackbox/blackbox.yml`
- `config/monitoring/exporters.compose.yml`
- `dashboards/chat-messaging-system-monitoring.json`

Dashboard Grafana: `Chat Messaging System - Monitoring`.

Các truy vấn kiểm tra chính:

    pg_up{job="postgres-exporter"}

    probe_success{job="blackbox-chat"}

Trạng thái kỳ vọng: `pg_up = 1`, `probe_success = 1`.
Website chat được kiểm tra qua Nginx với HTTP 200.

Lưu ý: môi trường lab hiện tại đang quản lý các dịch vụ monitoring
từ thư mục `~/wordpress-monitoring`. Các file trong repository
lưu cấu hình và dashboard liên quan đến Chat Messaging System.
Khi triển khai trên máy khác, cần cấu hình lại network, secret,
địa chỉ upstream và các dịch vụ phụ thuộc cho phù hợp.

## Logging — Loki, Promtail and LogQL

The project uses Loki and Promtail to collect and query Docker container logs.

- Loki readiness endpoint: `http://127.0.0.1:3100/ready`
- Loki configuration: `config/monitoring/loki-config.yml`
- Promtail configuration: `config/monitoring/promtail-config.yml`
- Logging Compose reference: `config/monitoring/logging.compose.yml`
- LogQL query examples: `docs/LOGQL_QUERIES.md`
- Logging evidence: `docs/evidence/15_grafana_logql_error_filter_pass.png`

The active Loki and Promtail services are managed by the existing stack in
`~/wordpress-monitoring/docker-compose.yml`. The Compose file in this repository
is a reference for the existing external network and volumes. Validate it with
`docker compose -f config/monitoring/logging.compose.yml config -q`.
Do not run `up` on the reference file while the original logging stack is active.

Three LogQL queries have been tested in Grafana Explore to find the chat
application startup log, health-check failures, and error-related keywords.
The number of matching log lines can change over time.

The observed message `Health check failed: Connection terminated due to
connection timeout` requires separate investigation. It does not by itself
indicate that Loki or Promtail has failed.
