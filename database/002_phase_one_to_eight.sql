-- Phase 1-8: authentication, catalog, cart, coupon, order, payment, logistics and admin
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS users (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 account VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(100) NOT NULL,
 role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
 status ENUM('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 name VARCHAR(100) NOT NULL,
 slug VARCHAR(100) NOT NULL UNIQUE,
 sort_order INT NOT NULL DEFAULT 0,
 status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 category_id BIGINT NOT NULL,
 name VARCHAR(200) NOT NULL,
 subtitle VARCHAR(300),
 description TEXT,
 cover_url VARCHAR(500),
 status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_product_category FOREIGN KEY(category_id) REFERENCES categories(id), INDEX idx_product_category_status(category_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skus (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 product_id BIGINT NOT NULL,
 sku_code VARCHAR(80) NOT NULL UNIQUE,
 name VARCHAR(150) NOT NULL,
 price DECIMAL(12,2) NOT NULL,
 stock INT NOT NULL,
 status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT chk_sku_price CHECK(price > 0), CONSTRAINT chk_sku_stock CHECK(stock >= 0),
 CONSTRAINT fk_sku_product FOREIGN KEY(product_id) REFERENCES products(id), INDEX idx_sku_product_status(product_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 user_id BIGINT NOT NULL,
 sku_id BIGINT NOT NULL,
 quantity INT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT chk_cart_quantity CHECK(quantity > 0), CONSTRAINT uk_cart_user_sku UNIQUE(user_id,sku_id),
 CONSTRAINT fk_cart_user FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT fk_cart_sku FOREIGN KEY(sku_id) REFERENCES skus(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 name VARCHAR(150) NOT NULL,
 discount_amount DECIMAL(12,2) NOT NULL,
 minimum_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 valid_from DATETIME NOT NULL,
 valid_to DATETIME NOT NULL,
 status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT chk_coupon_discount CHECK(discount_amount > 0), CONSTRAINT chk_coupon_minimum CHECK(minimum_amount >= 0), CONSTRAINT chk_coupon_time CHECK(valid_to > valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 order_no VARCHAR(40) NOT NULL UNIQUE,
 user_id BIGINT NOT NULL,
 status ENUM('PENDING_PAYMENT','PAID','SHIPPED','DELIVERED','COMPLETED','CANCELLED','REFUNDED') NOT NULL,
 goods_amount DECIMAL(12,2) NOT NULL,
 discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 payable_amount DECIMAL(12,2) NOT NULL,
 coupon_id BIGINT NULL,
 shipping_address VARCHAR(500) NOT NULL,
 paid_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_order_user FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT fk_order_coupon FOREIGN KEY(coupon_id) REFERENCES coupons(id), INDEX idx_order_user_status(user_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 order_id BIGINT NOT NULL,
 sku_id BIGINT NOT NULL,
 product_name VARCHAR(200) NOT NULL,
 sku_name VARCHAR(150) NOT NULL,
 sku_code VARCHAR(80) NOT NULL,
 unit_price DECIMAL(12,2) NOT NULL,
 quantity INT NOT NULL,
 subtotal DECIMAL(12,2) NOT NULL,
 CONSTRAINT fk_item_order FOREIGN KEY(order_id) REFERENCES orders(id), CONSTRAINT fk_item_sku FOREIGN KEY(sku_id) REFERENCES skus(id), INDEX idx_item_order(order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_coupons (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 user_id BIGINT NOT NULL,
 coupon_id BIGINT NOT NULL,
 status ENUM('UNUSED','USED') NOT NULL DEFAULT 'UNUSED',
 used_order_id BIGINT NULL,
 used_at DATETIME NULL,
 claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uk_user_coupon UNIQUE(user_id,coupon_id), CONSTRAINT fk_uc_user FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT fk_uc_coupon FOREIGN KEY(coupon_id) REFERENCES coupons(id), CONSTRAINT fk_uc_order FOREIGN KEY(used_order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 order_id BIGINT NOT NULL UNIQUE,
 payment_no VARCHAR(50) NOT NULL UNIQUE,
 status ENUM('SUCCESS') NOT NULL,
 paid_at DATETIME NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_payment_order FOREIGN KEY(order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logistics (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 order_id BIGINT NOT NULL UNIQUE,
 carrier VARCHAR(100) NOT NULL,
 tracking_number VARCHAR(40) NOT NULL UNIQUE,
 status ENUM('SHIPPED','DELIVERED') NOT NULL,
 shipped_at DATETIME NOT NULL,
 delivered_at DATETIME NULL,
 CONSTRAINT fk_logistics_order FOREIGN KEY(order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shipment_tracking_events (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 shipment_id BIGINT NOT NULL,
 status ENUM('CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED') NOT NULL,
 description VARCHAR(255) NOT NULL,
 event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_tracking_shipment FOREIGN KEY(shipment_id) REFERENCES logistics(id), INDEX idx_tracking_shipment_time(shipment_id,event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users(id,account,password_hash,role,status) VALUES
 (1,'admin@example.com','$2b$12$gKxBYa6Dae6Xe.mf/pCyoOpKGVkwzGpwLiNb56V9D79kXugihLs1i','ADMIN','ACTIVE'),
 (2,'demo@example.com','$2b$12$i3YMuR9IKrFhaCplTRIzz.LYB0aJ0sQRd2zRK2P/4mT5hwZHNtLg.','USER','ACTIVE')
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role=VALUES(role),status='ACTIVE';

INSERT INTO categories(id,name,slug,sort_order,status) VALUES
 (1,'数码办公','digital',10,'ACTIVE'),(2,'家居生活','home',20,'ACTIVE'),(3,'户外运动','sports',30,'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name),sort_order=VALUES(sort_order),status='ACTIVE';

INSERT INTO products(id,category_id,name,subtitle,description,cover_url,status) VALUES
 (1,1,'Aurora 降噪蓝牙耳机','40 小时续航，通勤降噪','支持双设备连接与通透模式','https://images.example.com/aurora-headphones.jpg','ACTIVE'),
 (2,1,'Flow 机械键盘','热插拔轴体，三模连接','75% 配列与可编程旋钮','https://images.example.com/flow-keyboard.jpg','ACTIVE'),
 (3,1,'Pocket 65W 氮化镓充电器','三口快充，旅行便携','双 USB-C 与 USB-A 接口','https://images.example.com/gan-charger.jpg','ACTIVE'),
 (4,2,'Cloud 恒温随行杯','全天保温，食品级内胆','轻量防漏杯盖，适合办公与旅行','https://images.example.com/cloud-mug.jpg','ACTIVE'),
 (5,2,'Luna 香薰加湿器','静音雾化，柔光夜灯','适合卧室与书桌的 300ml 水箱','https://images.example.com/luna-humidifier.jpg','ACTIVE'),
 (6,3,'Trail 城市轻量背包','防泼水，独立电脑仓','适合通勤和周末短途徒步','https://images.example.com/trail-backpack.jpg','ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name),subtitle=VALUES(subtitle),status='ACTIVE';

INSERT INTO skus(id,product_id,sku_code,name,price,stock,status) VALUES
 (1,1,'AUR-BLK','曜石黑',399.00,60,'ACTIVE'),(2,1,'AUR-WHT','云雾白',399.00,45,'ACTIVE'),
 (3,2,'FLOW-RED','红轴',529.00,35,'ACTIVE'),(4,2,'FLOW-TEA','茶轴',549.00,30,'ACTIVE'),
 (5,3,'GAN-WHT','白色',169.00,100,'ACTIVE'),(6,3,'GAN-BLK','黑色',169.00,90,'ACTIVE'),
 (7,4,'CLOUD-450-BLU','450ml 海盐蓝',129.00,80,'ACTIVE'),(8,4,'CLOUD-450-WHT','450ml 奶油白',129.00,75,'ACTIVE'),
 (9,5,'LUNA-WHT','月光白',189.00,55,'ACTIVE'),(10,5,'LUNA-GRN','森林绿',199.00,40,'ACTIVE'),
 (11,6,'TRAIL-18-BLK','18L 黑色',269.00,50,'ACTIVE'),(12,6,'TRAIL-24-GRN','24L 苔藓绿',329.00,38,'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name),price=VALUES(price),stock=VALUES(stock),status='ACTIVE';

INSERT INTO coupons(id,name,discount_amount,minimum_amount,valid_from,valid_to,status) VALUES
 (1,'新客满 100 减 15',15.00,100.00,DATE_SUB(NOW(),INTERVAL 1 DAY),DATE_ADD(NOW(),INTERVAL 365 DAY),'ACTIVE'),
 (2,'品质生活满 500 减 60',60.00,500.00,DATE_SUB(NOW(),INTERVAL 1 DAY),DATE_ADD(NOW(),INTERVAL 365 DAY),'ACTIVE'),
 (3,'全场满 1000 减 150',150.00,1000.00,DATE_SUB(NOW(),INTERVAL 1 DAY),DATE_ADD(NOW(),INTERVAL 365 DAY),'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name),discount_amount=VALUES(discount_amount),minimum_amount=VALUES(minimum_amount),valid_from=VALUES(valid_from),valid_to=VALUES(valid_to),status='ACTIVE';

INSERT INTO schema_version(version,description) VALUES('1-8','Authentication through minimal admin vertical slices') ON DUPLICATE KEY UPDATE description=VALUES(description);
