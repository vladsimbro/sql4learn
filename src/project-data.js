// SQL4Learn: independent support desk business domain for self-directed case study.
// Tables live in a PostgreSQL schema distinct from the course examples; alternate dataset deliberately changes SLA, staff and status data.
export const SUPPORT_SCHEMA={
  "support.clients": [
    [
      "client_id",
      "integer · PK"
    ],
    [
      "company_name",
      "text"
    ],
    [
      "segment",
      "text"
    ]
  ],
  "support.agents": [
    [
      "agent_id",
      "integer · PK"
    ],
    [
      "agent_name",
      "text"
    ]
  ],
  "support.tickets": [
    [
      "ticket_id",
      "integer · PK"
    ],
    [
      "client_id",
      "integer · FK"
    ],
    [
      "agent_id",
      "integer · FK / NULL"
    ],
    [
      "opened_at",
      "timestamp"
    ],
    [
      "current_status",
      "text"
    ],
    [
      "priority",
      "text"
    ]
  ],
  "support.ticket_events": [
    [
      "event_id",
      "integer · PK"
    ],
    [
      "ticket_id",
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
export const SUPPORT_SEED_SQL="CREATE SCHEMA support;\nCREATE TABLE support.clients(client_id integer PRIMARY KEY, company_name text NOT NULL,segment text NOT NULL);\nCREATE TABLE support.agents(agent_id integer PRIMARY KEY, agent_name text NOT NULL);\nCREATE TABLE support.tickets(ticket_id integer PRIMARY KEY,client_id integer NOT NULL REFERENCES support.clients(client_id),agent_id integer REFERENCES support.agents(agent_id),opened_at timestamp NOT NULL,current_status text NOT NULL CHECK(current_status IN ('open','in_progress','resolved')),priority text NOT NULL CHECK(priority IN ('high','low')));\nCREATE TABLE support.ticket_events(event_id integer PRIMARY KEY,ticket_id integer NOT NULL REFERENCES support.tickets(ticket_id),event_at timestamp NOT NULL,event_type text NOT NULL CHECK(event_type IN ('status_open','status_in_progress','status_resolved','reply')));\nINSERT INTO support.clients VALUES\n(1,'СеверЛогистик','enterprise'),(2,'ПиксельМаркет','standard'),\n(3,'Лазурь CRM','enterprise'),(4,'Орбита Магазин','standard'),\n(5,'АтласФинанс','enterprise'),(6,'Без заявок','standard');\nINSERT INTO support.agents VALUES (1,'Алиса'),(2,'Тимур'),(3,'София'),(4,'Денис'),(5,'Марк');\nINSERT INTO support.tickets VALUES\n(3001,1,1,'2026-06-01 09:00','resolved','high'),\n(3002,2,2,'2026-06-01 10:30','open','low'),\n(3003,3,1,'2026-06-01 11:00','in_progress','high'),\n(3004,4,3,'2026-06-02 08:30','resolved','low'),\n(3005,5,2,'2026-06-02 11:00','resolved','high'),\n(3006,1,3,'2026-06-03 12:30','open','high'),\n(3007,2,NULL,'2026-06-03 15:00','open','low'),\n(3008,3,4,'2026-06-04 09:00','resolved','high'),\n(3009,4,4,'2026-06-04 10:00','resolved','low'),\n(3010,5,1,'2026-06-05 16:00','in_progress','high'),\n(3011,1,2,'2026-06-06 10:00','resolved','low'),\n(3012,2,4,'2026-06-06 11:00','in_progress','high'),\n(3013,3,3,'2026-06-07 17:00','open','low'),\n(3014,4,NULL,'2026-06-08 08:00','open','low'),\n(3015,5,1,'2026-06-08 09:00','resolved','high'),\n(3016,3,2,'2026-06-09 11:20','resolved','low');\nINSERT INTO support.ticket_events VALUES\n(1,3001,'2026-06-01 09:00','status_open'),(2,3001,'2026-06-01 09:18','reply'),(3,3001,'2026-06-01 10:10','status_resolved'),\n(4,3002,'2026-06-01 10:30','status_open'),(5,3002,'2026-06-01 12:20','reply'),\n(6,3003,'2026-06-01 11:00','status_open'),(7,3003,'2026-06-01 11:10','status_in_progress'),(8,3003,'2026-06-01 11:45','reply'),\n(9,3004,'2026-06-02 08:30','status_open'),(10,3004,'2026-06-02 09:45','reply'),(11,3004,'2026-06-02 10:20','status_resolved'),\n(12,3005,'2026-06-02 11:00','status_open'),(13,3005,'2026-06-02 11:30','reply'),(14,3005,'2026-06-02 12:00','status_resolved'),\n(15,3006,'2026-06-03 12:30','status_open'),\n(16,3007,'2026-06-03 15:00','status_open'),\n(17,3008,'2026-06-04 09:00','status_open'),(18,3008,'2026-06-04 09:50','reply'),(19,3008,'2026-06-04 10:00','status_resolved'),\n(20,3009,'2026-06-04 10:00','status_open'),(21,3009,'2026-06-04 10:20','reply'),(22,3009,'2026-06-04 10:30','status_in_progress'),\n(23,3010,'2026-06-05 16:00','status_open'),(24,3010,'2026-06-05 16:15','status_in_progress'),(25,3010,'2026-06-05 17:10','reply'),\n(26,3011,'2026-06-06 10:00','status_open'),(27,3011,'2026-06-06 10:59','reply'),(28,3011,'2026-06-06 11:20','status_resolved'),\n(29,3012,'2026-06-06 11:00','status_open'),(30,3012,'2026-06-06 11:55','reply'),(31,3012,'2026-06-06 12:00','status_in_progress'),\n(32,3013,'2026-06-07 17:00','status_open'),\n(33,3015,'2026-06-08 09:00','status_open'),(34,3015,'2026-06-08 09:10','reply'),(35,3015,'2026-06-08 09:20','status_resolved'),\n(36,3016,'2026-06-09 11:20','status_open'),(37,3016,'2026-06-09 12:20','reply'),(38,3016,'2026-06-09 12:45','status_resolved');\n";
export const SUPPORT_ALTERNATE_SQL="INSERT INTO support.clients VALUES (7,'СеверТех','enterprise'),(8,'Пустой премиум','premium');\nINSERT INTO support.agents VALUES (6,'Ирина');\nINSERT INTO support.tickets VALUES\n(3017,7,5,'2026-06-10 09:00','open','high'),\n(3018,1,5,'2026-06-10 09:20','resolved','low'),\n(3019,7,NULL,'2026-06-10 10:10','in_progress','high'),\n(3020,2,4,'2026-06-10 11:00','resolved','low');\nINSERT INTO support.ticket_events VALUES\n(39,3017,'2026-06-10 09:00','status_open'),\n(40,3018,'2026-06-10 09:20','status_open'),(41,3018,'2026-06-10 10:00','reply'),(42,3018,'2026-06-10 10:20','status_resolved'),\n(43,3019,'2026-06-10 10:10','status_open'),(44,3019,'2026-06-10 10:20','status_in_progress'),(45,3019,'2026-06-10 11:40','reply'),\n(46,3020,'2026-06-10 11:00','status_open'),(47,3020,'2026-06-10 12:00','reply'),(48,3020,'2026-06-10 12:20','status_resolved'),\n(49,3006,'2026-06-03 14:30','reply'),\n(50,3011,'2026-06-06 12:00','status_open');\nUPDATE support.tickets SET current_status='in_progress' WHERE ticket_id=3002;\nUPDATE support.tickets SET agent_id=5 WHERE ticket_id=3012;\n";
