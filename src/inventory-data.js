// Independent inventory accounting case: fixed snapshot boundary and adversarial second dataset.
// Opening balances are at 2026-08-01 00:00; include movements strictly before 2026-08-10 12:00.
export const INVENTORY_SCHEMA={
  "inventory.locations": [
    [
      "location_id",
      "integer · PK"
    ],
    [
      "location_name",
      "text"
    ]
  ],
  "inventory.products": [
    [
      "product_id",
      "integer · PK"
    ],
    [
      "sku",
      "text · UNIQUE"
    ],
    [
      "product_name",
      "text"
    ],
    [
      "reorder_point",
      "integer"
    ]
  ],
  "inventory.opening_stock": [
    [
      "location_id",
      "integer · PK/FK"
    ],
    [
      "product_id",
      "integer · PK/FK"
    ],
    [
      "quantity",
      "integer · шт."
    ]
  ],
  "inventory.movements": [
    [
      "move_id",
      "integer · PK"
    ],
    [
      "location_id",
      "integer · FK"
    ],
    [
      "product_id",
      "integer · FK"
    ],
    [
      "moved_at",
      "timestamp"
    ],
    [
      "delta",
      "integer · знак ±"
    ],
    [
      "reason",
      "text"
    ]
  ],
  "inventory.stocktakes": [
    [
      "count_id",
      "integer · PK"
    ],
    [
      "location_id",
      "integer · FK"
    ],
    [
      "product_id",
      "integer · FK"
    ],
    [
      "counted_at",
      "timestamp"
    ],
    [
      "physical_qty",
      "integer · шт."
    ]
  ]
};
export const INVENTORY_SEED_SQL="CREATE SCHEMA inventory;\nCREATE TABLE inventory.locations(location_id integer PRIMARY KEY,location_name text NOT NULL);\nCREATE TABLE inventory.products(product_id integer PRIMARY KEY,sku text UNIQUE NOT NULL,product_name text NOT NULL,reorder_point integer NOT NULL CHECK(reorder_point>=0));\nCREATE TABLE inventory.opening_stock(location_id integer NOT NULL REFERENCES inventory.locations(location_id),product_id integer NOT NULL REFERENCES inventory.products(product_id),quantity integer NOT NULL CHECK(quantity>=0),PRIMARY KEY(location_id,product_id));\nCREATE TABLE inventory.movements(move_id integer PRIMARY KEY,location_id integer NOT NULL REFERENCES inventory.locations(location_id),product_id integer NOT NULL REFERENCES inventory.products(product_id),moved_at timestamp NOT NULL,delta integer NOT NULL CHECK(delta<>0),reason text NOT NULL CHECK(reason IN ('receipt','dispatch','adjustment')));\nCREATE TABLE inventory.stocktakes(count_id integer PRIMARY KEY,location_id integer NOT NULL REFERENCES inventory.locations(location_id),product_id integer NOT NULL REFERENCES inventory.products(product_id),counted_at timestamp NOT NULL,physical_qty integer NOT NULL CHECK(physical_qty>=0));\nINSERT INTO inventory.locations VALUES (1,'Северный'),(2,'Южный'),(3,'Резерв');\nINSERT INTO inventory.products VALUES (101,'TEA-1','Чай',8),(102,'BAT-2','Батарейки',12),(103,'FLT-3','Фильтр',5),(104,'CBL-4','Кабель',4);\nINSERT INTO inventory.opening_stock VALUES (1,101,12),(1,102,6),(1,103,3),(1,104,0),(2,101,6),(2,102,9),(2,103,0),(3,101,2),(3,102,0);\nINSERT INTO inventory.movements VALUES\n(1,1,101,'2026-08-02 09:00',5,'receipt'),\n(2,1,101,'2026-08-03 14:00',-6,'dispatch'),\n(3,1,101,'2026-08-04 08:00',-2,'dispatch'),\n(4,1,102,'2026-08-02 11:00',10,'receipt'),\n(5,1,102,'2026-08-09 10:00',-5,'dispatch'),\n(6,1,103,'2026-08-05 08:00',-5,'dispatch'),\n(7,2,101,'2026-08-06 10:00',-4,'dispatch'),\n(8,2,102,'2026-08-02 17:00',3,'receipt'),\n(9,2,102,'2026-08-07 13:00',-2,'dispatch'),\n(10,2,103,'2026-08-08 14:00',2,'receipt'),\n(11,2,104,'2026-08-08 14:00',1,'receipt'),\n(12,3,101,'2026-08-02 14:00',-2,'dispatch'),\n(13,3,102,'2026-08-09 14:00',1,'receipt'),\n(14,1,101,'2026-08-10 12:00',50,'receipt'),\n(15,3,104,'2026-08-11 10:00',5,'receipt');\nINSERT INTO inventory.stocktakes VALUES\n(1,1,101,'2026-08-10 11:00',10),\n(2,1,101,'2026-08-10 11:55',9),\n(3,1,102,'2026-08-10 11:55',9),\n(4,1,103,'2026-08-10 11:55',0),\n(5,2,101,'2026-08-10 11:55',2),\n(6,2,102,'2026-08-10 11:55',12),\n(7,2,103,'2026-08-10 11:55',2),\n(8,3,101,'2026-08-10 11:55',1),\n(9,3,102,'2026-08-10 11:55',1),\n(10,1,101,'2026-08-10 12:01',40),\n(11,1,102,'2026-08-10 11:55',10),\n(12,3,103,'2026-08-10 11:50',0);";
export const INVENTORY_ALTERNATE_SQL="INSERT INTO inventory.locations VALUES (4,'Новый склад'),(5,'Склад без инвентаризации');\nINSERT INTO inventory.products VALUES (105,'KEY-5','Крепёж',2);\nINSERT INTO inventory.opening_stock VALUES (4,101,3),(4,105,1),(1,105,2);\nINSERT INTO inventory.movements VALUES\n(16,4,101,'2026-08-07 14:00',-4,'dispatch'),\n(17,4,105,'2026-08-09 09:00',-1,'dispatch'),\n(18,1,105,'2026-08-10 11:59',-1,'dispatch'),\n(19,2,104,'2026-08-10 12:00',10,'receipt'),\n(20,1,103,'2026-08-09 09:00',3,'receipt'),\n(21,3,102,'2026-08-10 10:00',4,'receipt'),\n(22,1,101,'2026-08-10 11:58',-2,'dispatch');\nINSERT INTO inventory.stocktakes VALUES\n(13,4,101,'2026-08-10 11:55',1),\n(14,4,105,'2026-08-10 11:55',0),\n(15,1,103,'2026-08-10 11:59',0),\n(16,2,104,'2026-08-10 11:55',1),\n(17,3,102,'2026-08-10 11:56',4),\n(18,1,105,'2026-08-10 11:59',1);";
