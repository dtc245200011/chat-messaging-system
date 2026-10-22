# LogQL Queries — Chat Messaging System

## 1. Muc dich

Ghi lai cac truy van LogQL da kiem thu voi Loki.
Promtail thu thap Docker container logs va gui log den Loki.

## 2. Chuan bi

Lay ID container ung dung bang lenh:

    docker inspect --format '{{.Id}}' chat_messaging_app

Thay CHAT_CONTAINER_ID trong cac truy van duoi day bang ID vua lay.
Khong thay doi cac phan khac cua truy van.

## 3. Truy van LogQL

### Query 1 — Log khoi dong ung dung

    {job="docker", filename=~".*CHAT_CONTAINER_ID.*"} |= "Chat server listening on port 3000"

Muc dich: xac nhan ung dung chat da khoi dong.
Ket qua kiem thu: tim thay 1 dong log.

### Query 2 — Log health check that bai

    {job="docker", filename=~".*CHAT_CONTAINER_ID.*"} |= "Health check failed"

Muc dich: tim cac thong bao health check that bai.
Ket qua kiem thu: tim thay 6 dong log.

Luu y: can dieu tra rieng cac thong bao nay; chua ket luan nguyen nhan.

### Query 3 — Tim log co tu khoa loi

    {job="docker", filename=~".*CHAT_CONTAINER_ID.*"} |~ "(?i)(error|failed|exception)"

Muc dich: tim log co tu khoa error, failed hoac exception,
khong phan biet chu hoa va chu thuong.
Ket qua kiem thu: tim thay 6 dong log.

## 4. Bang chung kiem thu

- Loki readiness endpoint tra ve HTTP 200.
- Loki co cac label filename, host, job, service_name va stream.
- Promtail dang gui log Docker den Loki.
- Da tim thay log khoi dong cua dung container chat_messaging_app.
- Ba truy van LogQL da duoc chay thu thanh cong.

So dong log co the thay doi theo thoi gian.

## 5. Han che va ghi chu

Promtail dang su dung job="docker" chung cho nhieu container.
Truy van dung filename chua container ID de loc dung ung dung.
Neu container duoc tao lai, can lay ID moi truoc khi truy van.

Cac thong bao:
Health check failed: Connection terminated due to connection timeout
can duoc dieu tra rieng. Hien chua du bang chung de ket luan nguyen nhan.
