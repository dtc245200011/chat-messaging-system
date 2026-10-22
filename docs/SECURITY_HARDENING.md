# Security Hardening — Chat Messaging System

## 1. Muc dich

Tai lieu ghi lai cac bien phap hardening da duoc xac minh tren he thong
Chat Messaging System va cac gioi han con ton tai.

## 2. Cac bien phap da xac minh

### 2.1. Chay ung dung voi user khong phai root

Docker Inspect cho thay container `chat_messaging_app` duoc cau hinh
voi user `node`. Kiem tra UID cua tien trinh trong container xac nhan
UID khac 0.

Muc dich: han che quyen cua tien trinh ung dung so voi root trong container.

### 2.2. Gioi han cong host cua ung dung chat

Cong ung dung duoc publish theo mapping:

    127.0.0.1:3002 -> 3000/tcp

Truy cap tu host duoc thuc hien qua Nginx. Ung dung khong publish truc tiep
cong 3000 tren tat ca giao dien mang cua host.

### 2.3. Cau hinh security headers tai Nginx

Cac response headers da duoc kiem tra bang HTTP:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

Kiem tra lai qua `http://chat.local/` tra ve HTTP 200 va co ca ba headers.

### 2.4. Gioi han cong host cua PostgreSQL

File Compose quan ly PostgreSQL nam ben ngoai repository chat tai
`~/DBMS/docker-compose.yml`.

Mapping da duoc thay doi tu:

    5432:5432

sang:

    127.0.0.1:5432:5432

Sau khi ap dung, `docker port postgres_db` xac nhan PostgreSQL chi publish
cong 5432 tren localhost. Ung dung chat van ket noi duoc qua
`postgres_db:5432` trong Docker network, health endpoint bao database `ok`,
va pgAdmin van phan hoi qua cong 8081.

File backup Compose duoc luu rieng tai:

    ~/DBMS/docker-compose.yml.bak-pre-postgres-hardening

Thay doi nay nam ngoai repository chat va khong duoc quan ly boi Git cua
repository nay.

## 3. Gioi han va rui ro con lai

- `chat_messaging_app` va nhieu container co so du lieu/cong cu quan tri
  cung tham gia network `dbms_default`; day khong phai network rieng chi
  danh cho ung dung chat.
- Cac kiem tra Docker cho thay `ReadonlyRootfs=false`, khong cau hinh
  `CapDrop` va khong co `SecurityOpt` rieng. Chua tinh cac thiet lap mac dinh
  cua Docker la mot bien phap hardening da duoc danh gia day du.
- Chua xac minh Content-Security-Policy hoac Strict-Transport-Security.
- Viec gioi han cong PostgreSQL tren host khong ngan cac container duoc phep
  tren Docker network ket noi den PostgreSQL.
- Cac thong bao `Health check failed: Connection terminated due to connection
  timeout` can duoc dieu tra rieng.

## 4. Lenh kiem tra lai

Xem user va cong cua container chat:

    docker inspect --format 'User={{.Config.User}} Bindings={{json .HostConfig.PortBindings}}' chat_messaging_app

Xem cong PostgreSQL:

    docker port postgres_db

Kiem tra health endpoint qua Nginx:

    curl -fsS http://chat.local/healthz

Kiem tra security headers:

    curl -sSI http://chat.local/

## 5. Ket luan

Bon bien phap trong muc 2 da duoc kiem tra tren he thong dang chay.
Cac gioi han trong muc 3 khong duoc coi la da khac phuc; can duoc danh gia
them truoc khi mo rong he thong ra moi truong mang khac.
