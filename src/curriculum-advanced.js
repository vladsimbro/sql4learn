// Further original analytical SQL lessons for the existing nine-module course.
export const advancedAdditions=[
  {
    "module": "joins",
    "after": "logical-order",
    "id": "set-union",
    "lesson": {
      "id": "set-union",
      "title": "UNION и UNION ALL: складываем результаты",
      "lead": "Иногда данные лежат в разных источниках, но нужны в одном списке.",
      "theory": [
        "UNION объединяет строки двух SELECT в одну таблицу и удаляет полностью одинаковые строки. UNION ALL тоже складывает результаты, но сохраняет все повторения. Оба оператора работают по позиции столбцов: число столбцов должно совпадать, а типы на одинаковых позициях должны быть совместимы.",
        "Например, список городов клиентов и магазинов можно собрать в одну колонку. UNION вернёт уникальные города, а UNION ALL оставит повторения — это важно, если мы хотим считать частоту упоминания города в обоих справочниках.",
        "ORDER BY для всего объединённого результата пишется в конце после обоих SELECT. Не полагайся на случайный порядок выдачи. Название выходного столбца обычно определяется первым SELECT, поэтому задавай понятный псевдоним именно там."
      ],
      "example": "SELECT city FROM customers\nUNION\nSELECT city FROM stores;",
      "quiz": {
        "question": "Чем UNION ALL отличается от UNION?",
        "choices": [
          "Сохраняет повторения строк",
          "Всегда сортирует по убыванию",
          "Объединяет таблицы по ключу"
        ],
        "correct": 0,
        "why": "UNION ALL складывает все строки, а UNION удаляет полные повторы."
      },
      "tasks": [
        {
          "id": "set-1",
          "title": "Единая география",
          "prompt": "Подготовь уникальный список всех городов, которые встречаются у клиентов или магазинов. Столбец назови city.",
          "sql": "SELECT city FROM customers UNION SELECT city FROM stores;",
          "ordered": false
        },
        {
          "id": "set-2",
          "title": "География без потери повторов",
          "prompt": "Отчёт для проверки качества должен включать каждое упоминание города из справочника клиентов и магазинов, сохраняя повторы. Выведи столбец city.",
          "sql": "SELECT city FROM customers UNION ALL SELECT city FROM stores;",
          "ordered": false
        },
        {
          "id": "set-3",
          "title": "Общий список названий",
          "prompt": "Для проверки одноимённых сущностей собери единый список названий покупателей и курьеров. Дубли одинаковых имён должны встречаться лишь один раз; столбец person_name.",
          "sql": "SELECT customer_name AS person_name FROM customers UNION SELECT courier_name AS person_name FROM couriers;",
          "ordered": false
        }
      ],
      "insight": "UNION — вертикальное объединение одинаковых по смыслу колонок; JOIN — горизонтальное сопоставление связанных строк. Не путай их."
    },
    "guide": {
      "requires": [
        "logical-order"
      ],
      "goal": "Правильно объединять SELECT с сохранением или удалением дубликатов.",
      "predict": "Сколько раз останется город «Москва», если он есть по три раза в двух источниках: UNION vs UNION ALL?",
      "pitfall": "UNION по умолчанию убирает дубли — это может уничтожить полезные события.",
      "check": "Чем соединение SELECT через UNION отличается от соединения таблиц через JOIN?"
    }
  },
  {
    "module": "joins",
    "after": "set-union",
    "id": "set-compare",
    "lesson": {
      "id": "set-compare",
      "title": "INTERSECT и EXCEPT: сравниваем множества",
      "lead": "Найди общие и отсутствующие элементы без ручного перебора.",
      "theory": [
        "INTERSECT оставляет строки, встречающиеся в обоих результатах SELECT; EXCEPT оставляет строки первого SELECT, отсутствующие во втором. По умолчанию оба оператора удаляют повторы. В отличие от JOIN они сравнивают целые строки одинаковой формы.",
        "Задай направление разности явно: «все магазины минус магазины с доставленными заказами» — это поиск магазинов без доставок; перестановка частей поменяет бизнес-ответ. INTERSECT удобно проверять, если сущность встречается в двух независимых наборах.",
        "В этих операциях NULL требует внимания: сравнение строк для удаления повторов и пересечения рассматривает NULL как совпадающее с NULL в соответствующих позициях. Это не то же самое, что условие x = NULL внутри WHERE."
      ],
      "example": "SELECT store_id FROM orders WHERE status='delivered'\nINTERSECT\nSELECT store_id FROM orders WHERE status='cancelled';",
      "quiz": {
        "question": "Что возвращает A EXCEPT B?",
        "choices": [
          "То, что есть в A, но отсутствует в B",
          "Всё, что есть в любом наборе",
          "Только совпадающие строки"
        ],
        "correct": 0,
        "why": "EXCEPT — направленная разность двух результатов, порядок операндов важен."
      },
      "tasks": [
        {
          "id": "set-4",
          "title": "Магазины со смешанной историей",
          "prompt": "Найди номера магазинов, у которых есть и доставленные, и отменённые заказы. Верни store_id без повторов.",
          "sql": "SELECT store_id FROM orders WHERE status='delivered' INTERSECT SELECT store_id FROM orders WHERE status='cancelled';",
          "ordered": false
        },
        {
          "id": "set-5",
          "title": "Магазины без доставок",
          "prompt": "Из списка всех магазинов выдели те, у которых пока ни одного доставленного заказа. Покажи store_id без повторов.",
          "sql": "SELECT store_id FROM stores EXCEPT SELECT store_id FROM orders WHERE status='delivered';",
          "ordered": false
        },
        {
          "id": "set-6",
          "title": "Клиенты с двумя типами заказов",
          "prompt": "Найди покупателей, у которых встречались и завершённые доставки, и отмены. Верни customer_id без повторов.",
          "sql": "SELECT customer_id FROM orders WHERE status='delivered' INTERSECT SELECT customer_id FROM orders WHERE status='cancelled';",
          "ordered": false
        }
      ],
      "insight": "EXCEPT работает с уже подготовленными списками; для сложных условий на связанные строки обычно нужен NOT EXISTS."
    },
    "guide": {
      "requires": [
        "set-union"
      ],
      "goal": "Находить общие и отсутствующие строки в двух результирующих множествах.",
      "predict": "Какие магазины останутся после stores EXCEPT delivered_store_ids?",
      "pitfall": "EXCEPT не симметричен: A EXCEPT B и B EXCEPT A означают разное.",
      "check": "Когда использовать INTERSECT, а когда UNION?"
    }
  },
  {
    "module": "cte",
    "after": "exists",
    "id": "not-exists-null",
    "lesson": {
      "id": "not-exists-null",
      "title": "NOT EXISTS, NOT IN и ловушка NULL",
      "lead": "Отрицание связи должно работать даже при отсутствующих значениях.",
      "theory": [
        "NOT EXISTS проверяет, что для текущей строки не существует ни одной подходящей записи в подзапросе. Например, можно отобрать магазины, у которых вообще нет заказов. Как только у магазина появится один заказ, он перестанет удовлетворять условию.",
        "NOT IN выглядит короче, но содержит неприятную ловушку: если список подзапроса содержит NULL, сравнение «не принадлежит списку» может стать UNKNOWN и не вернуть ожидаемые строки. Представь список назначений курьеров, где несколько заказов ещё не имеют courier_id.",
        "Когда проверяешь отсутствие связанных записей, NOT EXISTS часто выражает бизнес-смысл яснее и безопаснее. LEFT JOIN ... IS NULL тоже подходит, но важно проверять непустой ключ справа, а не произвольное поле."
      ],
      "example": "SELECT c.courier_id FROM couriers c\nWHERE NOT EXISTS (\n SELECT 1 FROM orders o\n WHERE o.courier_id=c.courier_id\n);",
      "quiz": {
        "question": "Почему NOT IN (SELECT courier_id FROM orders) опасен при NULL в courier_id?",
        "choices": [
          "NULL может сделать итог проверки UNKNOWN",
          "NULL автоматически пропускается",
          "NOT IN превратится в INNER JOIN"
        ],
        "correct": 0,
        "why": "SQL использует трёхзначную логику; NULL в списке может разрушить ожидаемую проверку отсутствия."
      },
      "tasks": [
        {
          "id": "anti-1",
          "title": "Курьеры без назначений",
          "prompt": "Найди курьеров, которым ещё не назначили ни одного заказа. Выведи courier_id.",
          "sql": "SELECT c.courier_id FROM couriers c WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.courier_id=c.courier_id);",
          "ordered": false
        },
        {
          "id": "anti-2",
          "title": "Магазины без истории",
          "prompt": "Найди магазины, у которых ещё нет ни одного заказа. Выведи store_id.",
          "sql": "SELECT s.store_id FROM stores s WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.store_id=s.store_id);",
          "ordered": false
        },
        {
          "id": "anti-3",
          "title": "Клиенты без отмен",
          "prompt": "Найди покупателей, у которых ещё не было отменённых заказов. Выведи customer_id.",
          "sql": "SELECT c.customer_id FROM customers c WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=c.customer_id AND o.status='cancelled');",
          "ordered": false
        }
      ],
      "insight": "Отрицание должно работать на новых данных с пустыми значениями; иначе отчёт «без активности» может тихо опустеть."
    },
    "guide": {
      "requires": [
        "exists"
      ],
      "goal": "Использовать NOT EXISTS для проверки отсутствия связанных записей и объяснять ловушку NULL.",
      "predict": "Предскажи результат NOT IN для курьера, если подзапрос выдаёт 1, 2 и NULL.",
      "pitfall": "NOT IN с NULL в подзапросе может не вернуть вообще ни одной ненулевой строки.",
      "check": "Чем NOT EXISTS отличается от NOT IN на значениях с NULL?"
    }
  },
  {
    "module": "windows",
    "after": "lag",
    "id": "window-lead",
    "lesson": {
      "id": "window-lead",
      "title": "LEAD: что будет следующим",
      "lead": "История нужна не только для прошлого, но и для будущего события.",
      "theory": [
        "LEAD(expression) похож на LAG, но берёт значение следующей строки в порядке окна. У последней строки группы нет следующего события, поэтому результат обычно NULL. Не путай с просмотром будущего в реальном времени: речь только о следующих записях уже имеющегося журнала.",
        "PARTITION BY customer_id держит историю каждого клиента отдельно; ORDER BY ordered_at,order_id определяет воспроизводимый порядок. Если убрать разбиение, «следующий заказ» может принадлежать другому человеку.",
        "Можно вычесть текущее время из времени следующего заказа и получить интервал ожидания. Сначала проверь, что сортировка отражает реальные бизнес-события и что временные поля достаточно точны для определения последовательности."
      ],
      "example": "SELECT customer_id,order_id,\n LEAD(ordered_at) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS next_order_at\nFROM orders;",
      "quiz": {
        "question": "Что вернёт LEAD для последней строки истории клиента?",
        "choices": [
          "Обычно NULL",
          "Первый заказ того же клиента",
          "Число заказов"
        ],
        "correct": 0,
        "why": "Для последней строки нет следующего события в рамках её PARTITION BY."
      },
      "tasks": [
        {
          "id": "lead-1",
          "title": "Следующая покупка",
          "prompt": "Для каждого заказа покажи покупателя, номер заказа и время следующего заказа этого же покупателя next_order_at.",
          "sql": "SELECT customer_id,order_id,LEAD(ordered_at) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS next_order_at FROM orders;",
          "ordered": false
        },
        {
          "id": "lead-2",
          "title": "Что заказали после",
          "prompt": "Для каждого заказа покажи его номер, идентификатор клиента и сумму следующего заказа того же покупателя next_amount.",
          "sql": "SELECT order_id,customer_id,LEAD(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS next_amount FROM orders;",
          "ordered": false
        },
        {
          "id": "lead-3",
          "title": "Ожидание до следующего заказа",
          "prompt": "Вычисли промежуток времени от каждого заказа до следующего заказа того же покупателя. Верни номер заказа и интервал until_next; если следующего заказа нет, оставь NULL.",
          "sql": "SELECT order_id,LEAD(ordered_at) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id)-ordered_at AS until_next FROM orders;",
          "ordered": false
        }
      ],
      "insight": "LEAD без детерминированного ORDER BY может сравнивать события в неправильном порядке."
    },
    "guide": {
      "requires": [
        "lag"
      ],
      "goal": "Выбирать следующее событие внутри истории одной сущности и считать интервал.",
      "predict": "Какую дату покажет LEAD для последней покупки клиента?",
      "pitfall": "Нельзя считать следующие события без упорядоченного временного ключа.",
      "check": "Чем LEAD отличается от LAG и почему оба требуют ORDER BY?"
    }
  },
  {
    "module": "windows",
    "after": "running",
    "id": "window-moving",
    "lesson": {
      "id": "window-moving",
      "title": "Скользящие расчёты и рамки окна",
      "lead": "Рамка позволяет анализировать не всю историю, а последние несколько событий.",
      "theory": [
        "Обычная накопительная сумма смотрит от начала истории до текущей строки. Для скользящего показателя рамка ограничивает, сколько соседних событий входит в расчёт. ROWS BETWEEN 2 PRECEDING AND CURRENT ROW означает текущую строку и две предыдущие — всего не более трёх строк.",
        "AVG(amount) OVER(...) даст средний чек последних трёх событий, причём на первой и второй строке использует только доступные строки. PARTITION BY store_id создаёт независимые истории для магазинов: соседний заказ другого магазина не должен попадать в расчёт.",
        "ROWS — это количество строк, а не количество календарных дней. Три последних заказа не равны заказам за последние три дня. Для временного скользящего окна потребуется другая рамка или календарная модель; не выдавай одно определение метрики за другое."
      ],
      "example": "SELECT order_id,\n AVG(amount) OVER(ORDER BY ordered_at,order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS last_three_avg\nFROM orders;",
      "quiz": {
        "question": "Что означает 2 PRECEDING в рамке ROWS?",
        "choices": [
          "Две предыдущие строки, а не два дня",
          "Два предыдущих месяца",
          "Пропуск первых двух строк"
        ],
        "correct": 0,
        "why": "ROWS считает строки отсортированной последовательности, не календарные интервалы."
      },
      "tasks": [
        {
          "id": "moving-1",
          "title": "Средний чек трёх заказов",
          "prompt": "Для каждого заказа рассчитай среднюю сумму по этому и двум предыдущим заказам компании в хронологическом порядке. Назови last_three_avg.",
          "sql": "SELECT order_id,AVG(amount) OVER(ORDER BY ordered_at,order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS last_three_avg FROM orders;",
          "ordered": false
        },
        {
          "id": "moving-2",
          "title": "Сумма двух заказов магазина",
          "prompt": "Для каждого заказа рассчитай сумму его и предыдущего заказа того же магазина (если он есть). Верни order_id, store_id и last_two_total.",
          "sql": "SELECT order_id,store_id,SUM(amount) OVER(PARTITION BY store_id ORDER BY ordered_at,order_id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS last_two_total FROM orders;",
          "ordered": false
        },
        {
          "id": "moving-3",
          "title": "Средний чек последних двух покупок",
          "prompt": "Для каждого заказа вычисли среднюю сумму этого заказа и предыдущего заказа того же клиента. Верни order_id, customer_id и two_order_avg.",
          "sql": "SELECT order_id,customer_id,AVG(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS two_order_avg FROM orders;",
          "ordered": false
        }
      ],
      "insight": "Скользящая средняя по строкам может отличаться от среднего за N дней: не путай число событий и продолжительность периода."
    },
    "guide": {
      "requires": [
        "running"
      ],
      "goal": "Считать скользящие суммы и средние с явной рамкой ROWS.",
      "predict": "Для первого заказа скользящая средняя по трём строкам берёт одну, две или три строки?",
      "pitfall": "Рамка по ROWS не означает календарные дни; это записи в заданном порядке.",
      "check": "Чем скользящая сумма двух заказов отличается от накопительной с начала истории?"
    }
  },
  {
    "module": "windows",
    "after": "window-moving",
    "id": "window-first-last",
    "lesson": {
      "id": "window-first-last",
      "title": "FIRST_VALUE и LAST_VALUE: крайние события",
      "lead": "Иногда нужно сопоставить каждую запись с началом или концом истории.",
      "theory": [
        "FIRST_VALUE(amount) берёт значение из первой строки окна в заданном порядке, но сохраняет все исходные строки. Например, можно показать для каждого заказа сумму самой первой покупки этого клиента — и рядом его текущую сумму.",
        "LAST_VALUE кажется симметричным, но здесь есть ловушка: рамка окна по умолчанию обычно заканчивается текущей строкой (или текущей группой одинаковых ключей). Поэтому LAST_VALUE без явной рамки часто возвращает текущее, а не последнее значение всей истории.",
        "Чтобы обратиться именно к последнему событию во всей группе, укажи ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING вместе с детерминированным ORDER BY. Ещё раз проверь: речь идёт о последней строке по времени, а не о максимальной сумме."
      ],
      "example": "SELECT order_id,customer_id,\n FIRST_VALUE(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS first_amount\nFROM orders;",
      "quiz": {
        "question": "Почему LAST_VALUE без явной рамки может показать текущую сумму?",
        "choices": [
          "Рамка по умолчанию часто заканчивается текущей строкой",
          "LAST_VALUE всегда равен MAX",
          "SQL не поддерживает LAST_VALUE"
        ],
        "correct": 0,
        "why": "Последнее значение берётся внутри оконной рамки; границы нужно задавать сознательно."
      },
      "tasks": [
        {
          "id": "first-1",
          "title": "Первая сумма клиента",
          "prompt": "Для каждого заказа покажи его номер, идентификатор покупателя и сумму самого раннего заказа того же клиента first_amount.",
          "sql": "SELECT order_id,customer_id,FIRST_VALUE(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS first_amount FROM orders;",
          "ordered": false
        },
        {
          "id": "first-2",
          "title": "Первый статус в истории",
          "prompt": "Для каждого заказа покажи номер и статус самого раннего заказа его покупателя first_status.",
          "sql": "SELECT order_id,FIRST_VALUE(status) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS first_status FROM orders;",
          "ordered": false
        },
        {
          "id": "first-3",
          "title": "Сумма последнего заказа клиента",
          "prompt": "Для каждого заказа покажи номер, покупателя и сумму самого позднего заказа того же клиента last_amount, а не текущего. Учитывай всю историю группы.",
          "sql": "SELECT order_id,customer_id,LAST_VALUE(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_amount FROM orders;",
          "ordered": false
        }
      ],
      "insight": "Первое и последнее событие определяется временем и дополнительным ключом, а не минимальным и максимальным значением метрики."
    },
    "guide": {
      "requires": [
        "window-moving"
      ],
      "goal": "Получать крайние значения окна с правильными границами рамки.",
      "predict": "Почему LAST_VALUE без UNBOUNDED FOLLOWING часто возвращает значение текущей строки?",
      "pitfall": "Не заменяй первый заказ минимальной суммой: самый ранний чек может быть самым дорогим.",
      "check": "Как гарантировать, что LAST_VALUE берёт всю историю клиента?"
    }
  }
];
