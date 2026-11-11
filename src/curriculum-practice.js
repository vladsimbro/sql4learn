// Additional non-template practice inside existing course lessons, preserving all published IDs.
export const supplementaryLessonPractice=[
  {
    "lessonId": "explore-data",
    "task": {
      "id": "route-extra-01",
      "title": "Товарные позиции — не заказы",
      "prompt": "Исследуй полный состав товарных позиций и убедись, что в нём может быть больше строк, чем заказов. Выведи исходные записи без фильтров.",
      "sql": "SELECT * FROM order_items;",
      "ordered": false
    }
  },
  {
    "lessonId": "distinct-order",
    "task": {
      "id": "route-extra-02",
      "title": "Уникальные пары города и магазина",
      "prompt": "Подготовь уникальные сочетания города и названия магазина, отсортированные сначала по городу, затем по названию. Выведи city и store_name.",
      "sql": "SELECT DISTINCT city,store_name FROM stores ORDER BY city,store_name;",
      "ordered": true
    }
  },
  {
    "lessonId": "having",
    "task": {
      "id": "route-extra-03",
      "title": "Магазины с устойчивыми доставками",
      "prompt": "Найди магазины, у которых не менее двух доставленных заказов. Покажи store_id и число доставок delivered_orders.",
      "sql": "SELECT store_id,COUNT(*) AS delivered_orders FROM orders WHERE status='delivered' GROUP BY store_id HAVING COUNT(*)>=2;",
      "ordered": false
    }
  },
  {
    "lessonId": "filter-case",
    "task": {
      "id": "route-extra-04",
      "title": "Два показателя по каждому курьеру",
      "prompt": "Для каждого значения исполнителя, включая ещё не назначенного, покажи число всех заказов orders_count и число отменённых cancelled_orders.",
      "sql": "SELECT courier_id,COUNT(*) AS orders_count,COUNT(*) FILTER(WHERE status='cancelled') AS cancelled_orders FROM orders GROUP BY courier_id;",
      "ordered": false
    }
  },
  {
    "lessonId": "inner",
    "task": {
      "id": "route-extra-05",
      "title": "Связанный отчёт по заказам",
      "prompt": "Собери номера заказов с именем покупателя и названием магазина: сведения находятся в разных справочниках. Покажи order_id, customer_name и store_name.",
      "sql": "SELECT o.order_id,c.customer_name,s.store_name FROM orders o JOIN customers c ON c.customer_id=o.customer_id JOIN stores s ON s.store_id=o.store_id;",
      "ordered": false
    }
  },
  {
    "lessonId": "left",
    "task": {
      "id": "route-extra-06",
      "title": "Доставки по всем клиентам",
      "prompt": "Подготовь число доставленных заказов каждого клиента, включая клиентов, которые ещё ничего не заказывали. Верни customer_id и delivered_orders, для пустых строк должен быть ноль.",
      "sql": "SELECT c.customer_id,COUNT(o.order_id) FILTER(WHERE o.status='delivered') AS delivered_orders FROM customers c LEFT JOIN orders o ON o.customer_id=c.customer_id GROUP BY c.customer_id;",
      "ordered": false
    }
  },
  {
    "lessonId": "anti",
    "task": {
      "id": "route-extra-07",
      "title": "Курьеры без доставок",
      "prompt": "Найди курьеров, которым ещё не досталась ни одна завершённая доставка. Даже если у курьера были отменённые заказы, он должен остаться в списке. Покажи courier_id.",
      "sql": "SELECT c.courier_id FROM couriers c LEFT JOIN orders o ON o.courier_id=c.courier_id AND o.status='delivered' WHERE o.order_id IS NULL;",
      "ordered": false
    }
  },
  {
    "lessonId": "fanout",
    "task": {
      "id": "route-extra-08",
      "title": "Счётчик без размножения",
      "prompt": "Для каждого магазина посчитай количество различных заказов, имеющих хотя бы одну товарную позицию. Несколько позиций одного заказа не должны увеличить показатель. Верни store_id и orders_with_items.",
      "sql": "SELECT o.store_id,COUNT(DISTINCT o.order_id) AS orders_with_items FROM orders o JOIN order_items i ON i.order_id=o.order_id GROUP BY o.store_id;",
      "ordered": false
    }
  },
  {
    "lessonId": "subquery",
    "task": {
      "id": "route-extra-09",
      "title": "Заказы дешевле среднего доставленного",
      "prompt": "Найди номера и суммы всех заказов, чья стоимость строго меньше среднего чека среди только доставленных заказов. Для сравнения можно брать заказы любого статуса. Покажи order_id и amount.",
      "sql": "SELECT order_id,amount FROM orders WHERE amount<(SELECT AVG(amount) FROM orders WHERE status='delivered');",
      "ordered": false
    }
  },
  {
    "lessonId": "exists",
    "task": {
      "id": "route-extra-10",
      "title": "Магазины с отменами",
      "prompt": "Найди магазины, в которых был хотя бы один отменённый заказ, но покажи каждый магазин только один раз. Выведи store_id.",
      "sql": "SELECT s.store_id FROM stores s WHERE EXISTS(SELECT 1 FROM orders o WHERE o.store_id=s.store_id AND o.status='cancelled');",
      "ordered": false
    }
  },
  {
    "lessonId": "conditional",
    "task": {
      "id": "route-extra-11",
      "title": "Число загруженных магазинов",
      "prompt": "Определи, сколько магазинов имеют не менее трёх заказов каждый. В ответе нужен один показатель busy_stores.",
      "sql": "WITH per_store AS(SELECT store_id,COUNT(*) AS order_count FROM orders GROUP BY store_id) SELECT COUNT(*) AS busy_stores FROM per_store WHERE order_count>=3;",
      "ordered": false
    }
  },
  {
    "lessonId": "row-number",
    "task": {
      "id": "route-extra-12",
      "title": "Самая свежая запись покупателя",
      "prompt": "Найди последний по времени заказ каждого покупателя, у которого есть история заказов. Если время совпало, выбери запись с наибольшим номером заказа. Верни customer_id и order_id.",
      "sql": "WITH ranked AS(SELECT customer_id,order_id,ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY ordered_at DESC,order_id DESC) AS rn FROM orders) SELECT customer_id,order_id FROM ranked WHERE rn=1;",
      "ordered": false
    }
  },
  {
    "lessonId": "rank",
    "task": {
      "id": "route-extra-13",
      "title": "Рейтинг магазинов по обороту",
      "prompt": "Рассчитай сумму заказов для каждого магазина с заказами, затем присвой магазинам плотный ранг по убыванию оборота. Одинаковые обороты должны делить место без пропуска следующего. Верни store_id и sales_rank.",
      "sql": "WITH store_totals AS(SELECT store_id,SUM(amount) AS total_amount FROM orders GROUP BY store_id) SELECT store_id,DENSE_RANK() OVER(ORDER BY total_amount DESC) AS sales_rank FROM store_totals;",
      "ordered": false
    }
  },
  {
    "lessonId": "lag",
    "task": {
      "id": "route-extra-14",
      "title": "Изменение чека относительно прошлого",
      "prompt": "Для каждого заказа посчитай разницу между его суммой и суммой предыдущего заказа того же покупателя. У первого заказа разница неизвестна. Верни order_id и amount_delta.",
      "sql": "SELECT order_id,amount-LAG(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS amount_delta FROM orders;",
      "ordered": false
    }
  }
];
