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
  ]
};
export const SEED_SQL="CREATE TABLE customers(customer_id integer PRIMARY KEY, customer_name text NOT NULL, city text NOT NULL, registered_at date NOT NULL);\nCREATE TABLE stores(store_id integer PRIMARY KEY, store_name text NOT NULL, city text NOT NULL);\nCREATE TABLE couriers(courier_id integer PRIMARY KEY, courier_name text NOT NULL, city text NOT NULL);\nCREATE TABLE orders(order_id integer PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(customer_id), store_id integer NOT NULL REFERENCES stores(store_id), courier_id integer REFERENCES couriers(courier_id), ordered_at timestamp NOT NULL, status text NOT NULL CHECK(status IN ('delivered','cancelled','in_transit')), amount numeric(12,2) NOT NULL);\nCREATE TABLE order_items(item_id integer PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(order_id), product_name text NOT NULL, quantity integer NOT NULL CHECK(quantity>0), unit_price numeric(12,2) NOT NULL);\nINSERT INTO customers VALUES\n(1,'Анна','Москва','2026-01-04'),(2,'Марк','Казань','2026-01-17'),(3,'Мария','Москва','2026-02-02'),(4,'Дмитрий','Орёл','2026-02-15'),(5,'Елена','Казань','2026-03-02'),(6,'Влад','Орёл','2026-03-07'),(7,'Полина','Москва','2026-03-11'),(8,'Павел','Тула','2026-03-19'),(9,'Алёна','Казань','2026-04-02'),(10,'Игорь','Тула','2026-04-05');\nINSERT INTO stores VALUES\n(1,'Центральный','Москва'),(2,'Северный','Казань'),(3,'Восточный','Москва'),(4,'Окружной','Орёл'),(5,'Парк','Тула'),(6,'Резервный','Орёл');\nINSERT INTO couriers VALUES\n(1,'Никита','Москва'),(2,'Сергей','Казань'),(3,'Алексей','Москва'),(4,'Олег','Орёл'),(5,'Михаил','Тула'),(6,'Артём','Орёл');\nINSERT INTO orders VALUES\n(1001,1,1,1,'2026-04-01 10:10','delivered',1200),\n(1002,2,2,2,'2026-04-01 13:15','delivered',800),\n(1003,1,1,1,'2026-04-02 09:20','cancelled',450),\n(1004,3,3,3,'2026-04-02 17:45','delivered',2100),\n(1005,4,4,4,'2026-04-03 18:30','in_transit',1600),\n(1006,2,1,2,'2026-04-03 12:40','delivered',1250),\n(1007,5,2,3,'2026-04-04 11:50','delivered',400),\n(1008,3,3,NULL,'2026-04-04 19:00','cancelled',700),\n(1009,6,4,4,'2026-04-05 16:05','delivered',2100),\n(1010,7,1,1,'2026-04-05 10:05','delivered',950),\n(1011,1,2,2,'2026-04-06 12:35','delivered',1700),\n(1012,5,5,5,'2026-04-06 20:30','delivered',1300),\n(1013,6,3,3,'2026-04-07 09:55','in_transit',300),\n(1014,4,5,NULL,'2026-04-07 22:25','cancelled',600),\n(1015,7,4,4,'2026-04-08 15:00','delivered',1500),\n(1016,8,5,5,'2026-04-09 11:30','delivered',900),\n(1017,8,1,1,'2026-04-10 14:10','delivered',500),\n(1018,2,2,2,'2026-04-10 17:45','delivered',1200);\nINSERT INTO order_items VALUES\n(1,1001,'Чай',2,250),(2,1001,'Термос',1,700),(3,1002,'Зонт',2,400),\n(4,1003,'Чай',1,450),(5,1004,'Рюкзак',1,1800),(6,1004,'Пакет',3,100),\n(7,1005,'Куртка',1,1600),(8,1006,'Книга',2,500),(9,1006,'Чай',1,250),\n(10,1007,'Кружка',1,400),(11,1008,'Пакет',7,100),(12,1009,'Рюкзак',1,2100),\n(13,1010,'Кружка',1,450),(14,1010,'Пакет',5,100),\n(15,1011,'Книга',1,700),(16,1011,'Чай',4,250),(17,1012,'Термос',1,1300),\n(18,1013,'Кружка',1,300),(19,1015,'Чай',2,250),(20,1015,'Термос',1,1000),\n(21,1016,'Зонт',1,900),(22,1017,'Чай',1,500),(23,1018,'Зонт',3,400);";
export const ALTERNATE_SQL="INSERT INTO customers VALUES (11,'Марта','Москва','2026-04-11'),(12,'Лев','Казань','2026-04-12');\nINSERT INTO stores VALUES (7,'Тестовый','Казань');\nINSERT INTO couriers VALUES (7,'Антон','Москва');\nINSERT INTO orders VALUES\n(1019,11,7,NULL,'2026-04-11 10:00','in_transit',1000),\n(1020,3,3,3,'2026-04-12 10:00','delivered',2100),\n(1021,1,1,1,'2026-04-12 20:10','delivered',1250),\n(1022,2,2,NULL,'2026-04-13 14:20','cancelled',300);\nINSERT INTO order_items VALUES (24,1019,'Тест',2,500),(25,1020,'Рюкзак',1,2100),(26,1021,'Чай',5,250),(27,1022,'Тетрадь',1,300);\nUPDATE orders SET status='cancelled' WHERE order_id=1002;\nUPDATE orders SET amount=1100 WHERE order_id=1007;";
export const DATASET_VERSION=1;
