// Professional analytical SQL extensions placed after the prerequisite concepts.
export const specialistAdditions=[
  {
    "module": "aggregate",
    "after": "safe-ratios",
    "id": "string-agg",
    "lesson": {
      "id": "string-agg",
      "title": "STRING_AGG: собираем понятные списки",
      "lead": "Иногда для отчёта нужна не сумма, а список значений из нескольких строк.",
      "theory": [
        "После GROUP BY остаётся одна строка на группу. STRING_AGG(text,separator) собирает текстовые значения строк этой группы в одну строку, разделяя их выбранным символом. Например, имена магазинов одного города можно показать одной ячейкой через запятую.",
        "Без ORDER BY внутри STRING_AGG порядок элементов не гарантируется: сегодняшний результат может отличаться от завтрашнего, хотя данные не изменились. Запиши STRING_AGG(store_name, ', ' ORDER BY store_name), чтобы список был предсказуемым.",
        "По умолчанию NULL не включается в сборку. DISTINCT может убрать одинаковые названия, но не применяй его автоматически: два магазина с одним названием могут быть разными сущностями. Сначала уточни, какие повторы действительно нужно удалить."
      ],
      "example": "SELECT city,STRING_AGG(store_name,', ' ORDER BY store_name) AS store_list\nFROM stores GROUP BY city;",
      "quiz": {
        "question": "Почему ORDER BY лучше указывать внутри STRING_AGG?",
        "choices": [
          "Чтобы получить воспроизводимый порядок элементов списка",
          "Чтобы удалить все повторения",
          "Чтобы поменять исходную таблицу"
        ],
        "correct": 0,
        "why": "Порядок значений, которые собирает агрегат, нужно задавать явно."
      },
      "tasks": [
        {
          "id": "strings-agg-1",
          "title": "Каталог магазинов по городам",
          "prompt": "Для каждого города составь строку названий всех его магазинов, разделённых запятой и пробелом, по алфавиту. Верни city и store_list.",
          "sql": "SELECT city,STRING_AGG(store_name,', ' ORDER BY store_name) AS store_list FROM stores GROUP BY city;",
          "ordered": false
        },
        {
          "id": "strings-agg-2",
          "title": "Список клиентов по городу",
          "prompt": "Составь для каждого города алфавитный список имён клиентов, разделяя имена строкой ' | '. Верни city и customer_list.",
          "sql": "SELECT city,STRING_AGG(customer_name,' | ' ORDER BY customer_name) AS customer_list FROM customers GROUP BY city;",
          "ordered": false
        },
        {
          "id": "strings-agg-3",
          "title": "Справочник встречавшихся статусов",
          "prompt": "Перечисли все различные статусы заказов в одной строке, по алфавиту, через запятую и пробел. Назови её statuses.",
          "sql": "SELECT STRING_AGG(DISTINCT status,', ' ORDER BY status) AS statuses FROM orders;",
          "ordered": false
        }
      ],
      "insight": "STRING_AGG показывает список значений, но не заменяет отдельные строки, если затем потребуются детальные расчёты."
    },
    "guide": {
      "requires": [
        "safe-ratios",
        "text-normalize"
      ],
      "goal": "Объединять текстовые значения группы с понятным разделителем и гарантированным порядком.",
      "predict": "В каком порядке появятся названия, если ORDER BY находится внутри STRING_AGG?",
      "pitfall": "STRING_AGG без внутреннего ORDER BY может менять порядок элементов даже при неизменных данных.",
      "check": "Чем отличается список всех названий от списка уникальных названий через DISTINCT?"
    }
  },
  {
    "module": "cte",
    "after": "not-exists-null",
    "id": "correlated-scalar",
    "lesson": {
      "id": "correlated-scalar",
      "title": "Зависимые подзапросы для каждой строки",
      "lead": "Иногда удобнее считать показатель отдельно для каждой сущности.",
      "theory": [
        "В обычном скалярном подзапросе порог может быть общим для всей таблицы. Коррелированный подзапрос ссылается на текущую внешнюю строку: например, для каждого клиента он считает только заказы с совпадающим customer_id.",
        "Представь клиента №1: внутренний SELECT считает его заказы, затем внешний SELECT переходит к клиенту №2. Запись (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.customer_id) AS orders_count становится ещё одним полем клиента.",
        "COUNT(*) без совпадений вернёт ноль; MAX(amount) без совпадений вернёт NULL. Такие подзапросы удобны, но на больших таблицах способ исполнения стоит проверять: JOIN с предварительной агрегацией иногда понятнее или эффективнее."
      ],
      "example": "SELECT c.customer_id,\n (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.customer_id) AS orders_count\nFROM customers c;",
      "quiz": {
        "question": "Как внутренний SELECT понимает, для какого клиента считать заказы?",
        "choices": [
          "Использует c.customer_id из текущей внешней строки",
          "Всегда считает заказы всех клиентов",
          "Автоматически берёт первый клиентский ID"
        ],
        "correct": 0,
        "why": "Корреляция связывает внутренний запрос с текущей строкой внешнего источника."
      },
      "tasks": [
        {
          "id": "corr-1",
          "title": "Число заказов каждого клиента",
          "prompt": "Подготовь полный список клиентов с количеством их заказов, включая клиентов без заказов. Получи одну строку на клиента с customer_id и orders_count.",
          "sql": "SELECT c.customer_id,(SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.customer_id) AS orders_count FROM customers c;",
          "ordered": false
        },
        {
          "id": "corr-2",
          "title": "Наибольший чек каждого магазина",
          "prompt": "Для каждого магазина найди сумму его самого дорогого заказа. Сохрани магазины без заказов со значением NULL. Верни store_id и max_amount.",
          "sql": "SELECT s.store_id,(SELECT MAX(o.amount) FROM orders o WHERE o.store_id=s.store_id) AS max_amount FROM stores s;",
          "ordered": false
        },
        {
          "id": "corr-3",
          "title": "Доставки на исполнителя",
          "prompt": "Для каждого курьера посчитай только завершённые доставки, включая курьеров без доставок. Верни courier_id и delivered_count.",
          "sql": "SELECT c.courier_id,(SELECT COUNT(*) FROM orders o WHERE o.courier_id=c.courier_id AND o.status='delivered') AS delivered_count FROM couriers c;",
          "ordered": false
        }
      ],
      "insight": "Коррелированный подзапрос — один из способов получить показатель, а не универсально лучший физический план. Проверяй зерно и нагрузку."
    },
    "guide": {
      "requires": [
        "not-exists-null",
        "subquery"
      ],
      "goal": "Вычислять показатель для каждой внешней строки через связанный скалярный подзапрос.",
      "predict": "Почему клиент без заказов всё равно присутствует в запросе от customers c?",
      "pitfall": "Не путай внешний c.customer_id и внутренний o.customer_id: без корреляции получишь одинаковый показатель для всех.",
      "check": "Как меняется ответ на пустой связанной группе для COUNT и MAX?"
    }
  },
  {
    "module": "windows",
    "after": "window-first-last",
    "id": "window-ntile",
    "lesson": {
      "id": "window-ntile",
      "title": "NTILE и PERCENT_RANK: группы в рейтинге",
      "lead": "Одна позиция в рейтинге не всегда показывает, насколько результат высокий.",
      "theory": [
        "NTILE(4) делит упорядоченные строки на четыре группы с максимально близким количеством записей. Группа 1 содержит первые строки сортировки, поэтому при ORDER BY amount DESC туда попадут самые дорогие заказы. При малом количестве строк некоторые группы могут быть пустыми.",
        "PERCENT_RANK() показывает относительное место строки в разделе от 0 до 1. При одинаковых значениях ранга результат совпадает, поэтому для анализа равных сумм не добавляй искусственный уникальный ключ в сортировку PERCENT_RANK без бизнес-причины.",
        "Это разные метрики: NTILE строит группы примерно одинакового размера, а PERCENT_RANK показывает относительную позицию по рангу. Нельзя автоматически считать группу NTILE(4)=1 «верхними 25% денежных сумм» — это верхняя четверть записей."
      ],
      "example": "SELECT order_id,NTILE(4) OVER(ORDER BY amount DESC,order_id) AS amount_quartile\nFROM orders;",
      "quiz": {
        "question": "Что определяет NTILE(4)?",
        "choices": [
          "Четыре группы с примерно одинаковым числом строк",
          "Четыре календарных квартала",
          "Четыре различных значения суммы"
        ],
        "correct": 0,
        "why": "NTILE группирует упорядоченные строки по количеству, а не по значению суммы."
      },
      "tasks": [
        {
          "id": "tile-1",
          "title": "Четыре группы чеков",
          "prompt": "Разбей все заказы на четыре группы по убыванию суммы; равные суммы упорядочивай по номеру заказа. Верни order_id и quartile.",
          "sql": "SELECT order_id,NTILE(4) OVER(ORDER BY amount DESC,order_id) AS quartile FROM orders;",
          "ordered": false
        },
        {
          "id": "tile-2",
          "title": "Верхняя и нижняя половина внутри магазина",
          "prompt": "Для каждого заказа определите половину рейтинга его магазина по убыванию суммы, при равенстве — меньший номер заказа первым. Покажи order_id, store_id и half_group.",
          "sql": "SELECT order_id,store_id,NTILE(2) OVER(PARTITION BY store_id ORDER BY amount DESC,order_id) AS half_group FROM orders;",
          "ordered": false
        },
        {
          "id": "tile-3",
          "title": "Относительный ранг стоимости",
          "prompt": "Для каждого заказа вычисли относительную позицию его суммы среди всех заказов от дорогих к дешёвым. Равные суммы должны иметь одинаковое значение. Верни order_id и percent_rank.",
          "sql": "SELECT order_id,PERCENT_RANK() OVER(ORDER BY amount DESC) AS percent_rank FROM orders;",
          "ordered": false
        }
      ],
      "insight": "NTILE делит по числу строк, а не по ровным интервалам значений. Проверяй, что именно требуется бизнесу."
    },
    "guide": {
      "requires": [
        "window-first-last",
        "rank"
      ],
      "goal": "Различать распределение строк по NTILE и относительное положение через PERCENT_RANK.",
      "predict": "Если заказов десять, сколько строк примерно попадёт в каждую из четырёх групп NTILE(4)?",
      "pitfall": "Добавление уникального order_id в PERCENT_RANK разрывает ничьи между одинаковыми суммами.",
      "check": "Почему верхний квартиль строк не означает суммы больше 75% от максимального чека?"
    }
  },
  {
    "module": "windows",
    "after": "window-ntile",
    "id": "stat-median",
    "lesson": {
      "id": "stat-median",
      "title": "Медиана и перцентили: устойчивые метрики",
      "lead": "Среднее иногда искажается одним огромным заказом — попробуем другой показатель.",
      "theory": [
        "AVG складывает все значения и делит на число наблюдений. Медиана — середина упорядоченного списка; половина значений находится не выше неё и половина не ниже. При очень большом одиночном чеке средняя сумма сильно вырастет, а медиана может почти не измениться.",
        "В PostgreSQL PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) вычисляет непрерывную медиану. Для чётного числа наблюдений она может лежать между двумя реальными значениями. PERCENTILE_CONT(0.9) показывает 90-й перцентиль — значение, ниже или на уровне которого находится примерно 90% наблюдений.",
        "Если вычисляешь медиану по магазинам, сначала реши, какие статусы участвуют, затем используй WHERE и GROUP BY. Перцентили, как и среднее, не исправляют завышенный JOIN или неверный набор исходных строк."
      ],
      "example": "SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount\nFROM orders;",
      "quiz": {
        "question": "Почему медиана устойчивее среднего к одному очень большому чеку?",
        "choices": [
          "Её определяет середина упорядоченного ряда",
          "Она всегда равна нулю",
          "Она удаляет самые дорогие заказы"
        ],
        "correct": 0,
        "why": "Медиана зависит от положения значений в отсортированном ряду, не от суммы всех значений."
      },
      "tasks": [
        {
          "id": "median-1",
          "title": "Типичный чек компании",
          "prompt": "Вычисли медианную стоимость заказа по всем статусам. Назови median_amount.",
          "sql": "SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount FROM orders;",
          "ordered": false
        },
        {
          "id": "median-2",
          "title": "Медиана доставок по магазинам",
          "prompt": "Для каждого магазина с завершёнными доставками вычисли медианный чек только доставленных заказов. Верни store_id и median_delivered.",
          "sql": "SELECT store_id,PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_delivered FROM orders WHERE status='delivered' GROUP BY store_id;",
          "ordered": false
        },
        {
          "id": "median-3",
          "title": "Высокий чек на 90-м перцентиле",
          "prompt": "Найди 90-й перцентиль суммы заказа по компании. Покажи одно значение p90_amount.",
          "sql": "SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY amount) AS p90_amount FROM orders;",
          "ordered": false
        }
      ],
      "insight": "Медиана не равна AVG и не обязательно равна фактически наблюдаемой сумме заказа: PERCENTILE_CONT может интерполировать."
    },
    "guide": {
      "requires": [
        "window-ntile",
        "aggr-basic"
      ],
      "goal": "Выбирать среднее или перцентиль по смыслу метрики и рассчитывать их на подходящих строках.",
      "predict": "Если один чек вырастет в сто раз, сильнее изменится среднее или медиана?",
      "pitfall": "PERCENTILE_CONT может вернуть значение между наблюдениями, особенно при чётном числе строк.",
      "check": "Почему нельзя вычислять медиану после JOIN, который размножил некоторые заказы?"
    }
  },
  {
    "module": "audit",
    "after": "audit-full-join",
    "id": "rollup-totals",
    "lesson": {
      "id": "rollup-totals",
      "title": "ROLLUP и GROUPING SETS: итоги разных уровней",
      "lead": "Один управленческий отчёт часто требует детали, промежуточные и общие итоги.",
      "theory": [
        "GROUP BY store_id,status создаёт одну строку на каждую пару магазин–статус. Но руководитель может попросить также итог по магазину и общий итог компании. ROLLUP(store_id,status) рассчитает все три уровня сразу: детальные пары, итог магазина и общую строку.",
        "На строках итогов отсутствующие ключи становятся NULL. Чтобы понять, является ли NULL обычным значением исходных данных или указателем на итоговую группу, используй GROUPING(column): 1 означает, что столбец был свернут в агрегат.",
        "GROUPING SETS позволяет перечислить нужные сочетания ключей вручную: например, (store_id,status) и (status) без отдельного итога магазина. Результат представляет несколько уровней детализации — не складывай вместе все строки отчёта повторно."
      ],
      "example": "SELECT store_id,status,COUNT(*) AS orders_count\nFROM orders\nGROUP BY ROLLUP(store_id,status);",
      "quiz": {
        "question": "Что добавляет ROLLUP(store_id,status) к обычной группировке?",
        "choices": [
          "Итоги по магазину и общую строку",
          "Новые заказы в базе",
          "Только сортировку результата"
        ],
        "correct": 0,
        "why": "ROLLUP создаёт дополнительные уровни агрегирования поверх детальных групп."
      },
      "tasks": [
        {
          "id": "rollup-1",
          "title": "Детали и итоги по магазинам",
          "prompt": "Подготовь количество заказов по сочетаниям магазина и статуса, добавив строки итогов по магазину и общий итог компании. Покажи store_id, status и orders_count.",
          "sql": "SELECT store_id,status,COUNT(*) AS orders_count FROM orders GROUP BY ROLLUP(store_id,status);",
          "ordered": false
        },
        {
          "id": "rollup-2",
          "title": "Общий оборот и суммы магазинов",
          "prompt": "Покажи сумму всех заказов по магазину и общий итог. Отметь общую строку как is_total, используя GROUPING(store_id). Верни store_id, is_total и total_amount.",
          "sql": "SELECT store_id,GROUPING(store_id) AS is_total,SUM(amount) AS total_amount FROM orders GROUP BY ROLLUP(store_id);",
          "ordered": false
        },
        {
          "id": "rollup-3",
          "title": "Срез по статусам и магазинам",
          "prompt": "Подготовь число заказов по каждой паре магазин–статус, а дополнительно по каждому статусу в целом по компании — но без общих итогов по магазинам. Верни store_id, status и orders_count.",
          "sql": "SELECT store_id,status,COUNT(*) AS orders_count FROM orders GROUP BY GROUPING SETS((store_id,status),(status));",
          "ordered": false
        }
      ],
      "insight": "В итоговом ROLLUP отчёте нельзя сложить все строки разом: деталь уже включена в субитоги, получится двойной счёт."
    },
    "guide": {
      "requires": [
        "audit-full-join",
        "group-by"
      ],
      "goal": "Создавать детальные и итоговые агрегаты, отличая NULL-группы от настоящих пропусков.",
      "predict": "Сколько уровней детализации вернёт ROLLUP(store_id,status) и что они означают?",
      "pitfall": "NULL в строке ROLLUP может обозначать агрегированный уровень, а не реальный отсутствующий идентификатор.",
      "check": "Почему сумма всех строк ROLLUP завысит итог и как узнать уровень через GROUPING?"
    }
  }
];
