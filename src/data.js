// Original delivery dataset, two checked variants for deterministic grading.
export const SCHEMA={
  "customers": [
    [
      "customer_id",
      "integer · PK"
    ],
    [
      "customer_name",
      "text"
    ],
    [
      "city",
      "text"
    ],
    [
      "registered_at",
      "date"
    ]
  ],
  "stores": [
    [
      "store_id",
      "integer · PK"
    ],
    [
      "store_name",
      "text"
    ],
    [
      "city",
      "text"
    ]
  ],
  "couriers": [
    [
      "courier_id",
      "integer · PK"
    ],
    [
      "courier_name",
      "text"
    ],
    [
      "city",
      "text"
    ]
  ],
  "orders": [
    [
      "order_id",
      "integer · PK"
    ],
    [
      "customer_id",
      "integer · FK"
    ],
    [
      "store_id",
      "integer · FK"
    ],
    [
      "courier_id",
      "integer · FK / NULL"
    ],
    [
      "ordered_at",
      "timestamp"
    ],
    [
      "status",
      "text"
    ],
    [
      "amount",
      "numeric"
    ]
  ],
  "order_items": [
    [
      "item_id",
      "integer · PK"
    ],
    [
      "order_id",
      "integer · FK"
    ],
    [
      "product_name",
      "text"
    ],
    [
      "quantity",
      "integer"
    ],
    [
      "unit_price",
      "numeric"
    ]
  ],
  "app_users": [
    [
      "user_id",
      "integer · PK"
    ],
    [
      "user_name",
      "text"
    ],
    [
      "signup_date",
      "date"
    ],
    [
      "channel",
      "text"
    ]
  ],
  "user_events": [
    [
      "event_id",
      "integer · PK"
    ],
    [
      "user_id",
      "integer · FK"
    ],
    [
      "event_at",
      "timestamp"
    ],
    [
      "event_type",
      "text"
    ],
    [
      "amount",
      "numeric"
    ]
  ],
  "order_events": [
    [
      "event_id",
      "integer · PK"
    ],
    [
      "order_id",
      "integer · FK"
    ],
    [
      "event_at",
      "timestamp"
    ],
    [
      "event_type",
      "text"
    ]
  ]
};
export const SEED_SQL="CREATE TABLE customers(customer_id integer PRIMARY KEY, customer_name text NOT NULL, city text NOT NULL, registered_at date NOT NULL);\nCREATE TABLE stores(store_id integer PRIMARY KEY, store_name text NOT NULL, city text NOT NULL);\nCREATE TABLE couriers(courier_id integer PRIMARY KEY, courier_name text NOT NULL, city text NOT NULL);\nCREATE TABLE orders(order_id integer PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(customer_id), store_id integer NOT NULL REFERENCES stores(store_id), courier_id integer REFERENCES couriers(courier_id), ordered_at timestamp NOT NULL, status text NOT NULL CHECK(status IN ('delivered','cancelled','in_transit')), amount numeric(12,2) NOT NULL);\nCREATE TABLE order_items(item_id integer PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(order_id), product_name text NOT NULL, quantity integer NOT NULL CHECK(quantity>0), unit_price numeric(12,2) NOT NULL);\nINSERT INTO customers VALUES\n(1,'Анна','Москва','2026-01-04'),(2,'Марк','Казань','2026-01-17'),(3,'Мария','Москва','2026-02-02'),(4,'Дмитрий','Орёл','2026-02-15'),(5,'Елена','Казань','2026-03-02'),(6,'Влад','Орёл','2026-03-07'),(7,'Полина','Москва','2026-03-11'),(8,'Павел','Тула','2026-03-19'),(9,'Алёна','Казань','2026-04-02'),(10,'Игорь','Тула','2026-04-05');\nINSERT INTO stores VALUES\n(1,'Центральный','Москва'),(2,'Северный','Казань'),(3,'Восточный','Москва'),(4,'Окружной','Орёл'),(5,'Парк','Тула'),(6,'Резервный','Орёл');\nINSERT INTO couriers VALUES\n(1,'Никита','Москва'),(2,'Сергей','Казань'),(3,'Алексей','Москва'),(4,'Олег','Орёл'),(5,'Михаил','Тула'),(6,'Артём','Орёл');\nINSERT INTO orders VALUES\n(1001,1,1,1,'2026-04-01 10:10','delivered',1200),\n(1002,2,2,2,'2026-04-01 13:15','delivered',800),\n(1003,1,1,1,'2026-04-02 09:20','cancelled',450),\n(1004,3,3,3,'2026-04-02 17:45','delivered',2100),\n(1005,4,4,4,'2026-04-03 18:30','in_transit',1600),\n(1006,2,1,2,'2026-04-03 12:40','delivered',1250),\n(1007,5,2,3,'2026-04-04 11:50','delivered',400),\n(1008,3,3,NULL,'2026-04-04 19:00','cancelled',700),\n(1009,6,4,4,'2026-04-05 16:05','delivered',2100),\n(1010,7,1,1,'2026-04-05 10:05','delivered',950),\n(1011,1,2,2,'2026-04-06 12:35','delivered',1700),\n(1012,5,5,5,'2026-04-06 20:30','delivered',1300),\n(1013,6,3,3,'2026-04-07 09:55','in_transit',300),\n(1014,4,5,NULL,'2026-04-07 22:25','cancelled',600),\n(1015,7,4,4,'2026-04-08 15:00','delivered',1500),\n(1016,8,5,5,'2026-04-09 11:30','delivered',900),\n(1017,8,1,1,'2026-04-10 14:10','delivered',500),\n(1018,2,2,2,'2026-04-10 17:45','delivered',1200);\nINSERT INTO order_items VALUES\n(1,1001,'Чай',2,250),(2,1001,'Термос',1,700),(3,1002,'Зонт',2,400),\n(4,1003,'Чай',1,450),(5,1004,'Рюкзак',1,1800),(6,1004,'Пакет',3,100),\n(7,1005,'Куртка',1,1600),(8,1006,'Книга',2,500),(9,1006,'Чай',1,250),\n(10,1007,'Кружка',1,400),(11,1008,'Пакет',7,100),(12,1009,'Рюкзак',1,2100),\n(13,1010,'Кружка',1,450),(14,1010,'Пакет',5,100),\n(15,1011,'Книга',1,700),(16,1011,'Чай',4,250),(17,1012,'Термос',1,1300),\n(18,1013,'Кружка',1,300),(19,1015,'Чай',2,250),(20,1015,'Термос',1,1000),\n(21,1016,'Зонт',1,900),(22,1017,'Чай',1,500),(23,1018,'Зонт',3,400);\nCREATE TABLE app_users(user_id integer PRIMARY KEY,user_name text NOT NULL,signup_date date NOT NULL,channel text NOT NULL);\nCREATE TABLE user_events(event_id integer PRIMARY KEY,user_id integer NOT NULL REFERENCES app_users(user_id),event_at timestamp NOT NULL,event_type text NOT NULL CHECK(event_type IN ('view','add_to_cart','purchase')),amount numeric(12,2) NOT NULL DEFAULT 0);\nINSERT INTO app_users VALUES\n(1,'Наталья','2026-01-03','organic'),\n(2,'Роман','2026-01-15','ads'),\n(3,'Оксана','2026-01-28','organic'),\n(4,'Борис','2026-02-02','referral'),\n(5,'Софья','2026-02-14','ads'),\n(6,'Алина','2026-02-23','organic'),\n(7,'Глеб','2026-03-05','referral'),\n(8,'Нина','2026-03-15','ads'),\n(9,'Виктор','2026-03-28','organic'),\n(10,'Лера','2026-04-02','ads'),\n(11,'Пётр','2026-04-10','organic'),\n(12,'Егор','2026-04-18','referral');\nINSERT INTO user_events VALUES\n(1,1,'2026-01-03 10:00','view',0),\n(2,1,'2026-01-08 10:00','add_to_cart',0),\n(3,1,'2026-01-11 15:00','purchase',400),\n(4,2,'2026-01-15 12:00','view',0),\n(5,2,'2026-01-25 14:00','purchase',600),\n(6,3,'2026-01-28 18:00','view',0),\n(7,1,'2026-02-02 09:00','view',0),\n(8,1,'2026-02-10 17:00','purchase',300),\n(9,2,'2026-02-08 13:00','view',0),\n(10,4,'2026-02-02 11:00','view',0),\n(11,4,'2026-02-15 20:00','purchase',850),\n(12,5,'2026-02-14 11:00','view',0),\n(13,6,'2026-02-23 08:00','view',0),\n(14,6,'2026-02-23 08:15','view',0),\n(15,1,'2026-03-04 09:00','view',0),\n(16,2,'2026-03-15 16:00','purchase',200),\n(17,4,'2026-03-03 09:00','view',0),\n(18,5,'2026-03-12 11:00','add_to_cart',0),\n(19,5,'2026-03-19 14:00','purchase',500),\n(20,7,'2026-03-05 15:00','view',0),\n(21,7,'2026-03-07 16:00','purchase',1200),\n(22,8,'2026-03-15 17:00','view',0),\n(23,9,'2026-03-29 11:00','view',0),\n(24,1,'2026-04-02 11:00','view',0),\n(25,3,'2026-04-04 12:00','view',0),\n(26,4,'2026-04-05 16:00','purchase',350),\n(27,6,'2026-04-10 17:00','view',0),\n(28,7,'2026-04-10 09:00','view',0),\n(29,7,'2026-04-13 10:00','purchase',650),\n(30,8,'2026-04-17 16:00','view',0),\n(31,9,'2026-04-19 12:00','view',0),\n(32,10,'2026-04-02 18:00','view',0),\n(33,11,'2026-04-12 09:00','view',0),\n(34,12,'2026-04-19 11:00','view',0),\n(35,12,'2026-04-20 13:00','add_to_cart',0),\n(36,8,'2026-04-25 19:00','purchase',900),\n(37,8,'2026-04-25 19:40','purchase',150),\n(38,9,'2026-04-26 10:00','view',0);\n\nINSERT INTO app_users VALUES (15,'Тихон','2026-04-22','referral');\nINSERT INTO user_events VALUES (48,10,'2026-04-02 11:00','purchase',275);\n\nCREATE TABLE order_events(event_id integer PRIMARY KEY,order_id integer NOT NULL REFERENCES orders(order_id),event_at timestamp NOT NULL,event_type text NOT NULL CHECK(event_type IN ('created','assigned','in_transit','delivered','cancelled')));\nINSERT INTO order_events VALUES\n(1,1001,'2026-04-01 10:10','created'),(2,1001,'2026-04-01 10:25','delivered'),\n(3,1002,'2026-04-01 13:15','created'),(4,1002,'2026-04-01 13:40','delivered'),\n(5,1003,'2026-04-02 09:20','created'),(6,1003,'2026-04-02 09:35','cancelled'),\n(7,1004,'2026-04-02 17:45','created'),(8,1004,'2026-04-02 17:55','assigned'),(9,1004,'2026-04-02 18:01','assigned'),(10,1004,'2026-04-02 18:22','delivered'),\n(11,1005,'2026-04-03 18:30','created'),(12,1005,'2026-04-03 18:43','in_transit'),\n(13,1006,'2026-04-03 12:40','created'),(14,1006,'2026-04-03 13:18','delivered'),\n(15,1007,'2026-04-04 11:50','created'),(16,1007,'2026-04-04 12:25','delivered'),\n(17,1008,'2026-04-04 19:00','created'),(18,1008,'2026-04-04 19:07','cancelled'),\n(19,1009,'2026-04-05 16:05','created'),(20,1009,'2026-04-05 16:20','assigned'),(21,1009,'2026-04-05 16:50','delivered'),\n(22,1010,'2026-04-05 10:05','created'),(23,1010,'2026-04-05 10:40','delivered'),\n(24,1011,'2026-04-06 12:35','created'),(25,1011,'2026-04-06 12:50','assigned'),(26,1011,'2026-04-06 12:55','assigned'),(27,1011,'2026-04-06 13:13','delivered'),\n(28,1012,'2026-04-06 20:30','created'),(29,1012,'2026-04-06 21:06','delivered'),\n(30,1013,'2026-04-07 09:55','created'),(31,1013,'2026-04-07 10:03','in_transit'),\n(32,1015,'2026-04-08 15:00','created'),(33,1015,'2026-04-08 15:39','delivered'),\n(34,1016,'2026-04-09 11:30','created'),(35,1016,'2026-04-09 12:10','delivered'),\n(36,1017,'2026-04-10 14:10','created'),\n(37,1018,'2026-04-10 17:45','created'),(38,1018,'2026-04-10 18:20','delivered');\n";
export const ALTERNATE_SQL="INSERT INTO customers VALUES (11,'Марта','Москва','2026-04-11'),(12,'Лев','Казань','2026-04-12');\nINSERT INTO stores VALUES (7,'Тестовый','Казань');\nINSERT INTO couriers VALUES (7,'Антон','Москва');\nINSERT INTO orders VALUES\n(1019,11,7,NULL,'2026-04-11 10:00','in_transit',1000),\n(1020,3,3,3,'2026-04-12 10:00','delivered',2100),\n(1021,1,1,1,'2026-04-12 20:10','delivered',1250),\n(1022,2,2,NULL,'2026-04-13 14:20','cancelled',300);\nINSERT INTO order_items VALUES (24,1019,'Тест',2,500),(25,1020,'Рюкзак',1,2100),(26,1021,'Чай',5,250),(27,1022,'Тетрадь',1,300);\nUPDATE orders SET status='cancelled' WHERE order_id=1002;\nUPDATE orders SET amount=1100 WHERE order_id=1007;\nINSERT INTO app_users VALUES\n(13,'Сергей','2026-05-03','ads'),(14,'Дарья','2026-02-16','organic');\nINSERT INTO user_events VALUES\n(39,13,'2026-05-03 09:00','view',0),\n(40,13,'2026-05-03 11:00','purchase',1250),\n(41,14,'2026-02-17 13:00','view',0),\n(42,14,'2026-03-17 17:00','view',0),\n(43,14,'2026-03-20 19:00','purchase',700),\n(44,3,'2026-05-10 12:00','view',0),\n(45,7,'2026-05-12 11:00','purchase',500),\n(46,1,'2026-04-23 20:00','purchase',400),\n(47,11,'2026-04-15 11:00','add_to_cart',0);\nUPDATE user_events SET amount=950 WHERE event_id=3;\n\nINSERT INTO order_events VALUES\n(39,1007,'2026-04-04 12:30','delivered'),\n(40,1019,'2026-04-11 10:00','created'),\n(41,1020,'2026-04-12 10:00','created'),(42,1020,'2026-04-12 10:37','delivered'),\n(43,1021,'2026-04-12 20:10','created'),(44,1021,'2026-04-12 20:50','delivered'),\n(45,1022,'2026-04-13 14:20','created'),(46,1022,'2026-04-13 14:27','cancelled');\n";
export const DATASET_VERSION=1;
