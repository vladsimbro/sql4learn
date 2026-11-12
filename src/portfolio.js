// Original independent SQL portfolio project. None of these exercises reuses lesson/task IDs.
export const independentProjects=[
 {
  id:'support-ops',
  title:'Support Ops · Аудит службы поддержки',
  subtitle:'Самостоятельное расследование по новой предметной области',
  industry:'Сервисная компания',
  level:'Продвинутый SQL · самостоятельная аналитика',
  problem:'Руководство хочет разобраться в нагрузке операторов, скорости ответа, нарушениях SLA и достоверности статусов обращений. В журнале есть повторяющиеся события, отсутствующие ответы и противоречия с карточками заявок.',
  context:'Ты только устроился аналитиком. У тебя есть отдельная схема support с компаниями-клиентами, операторами, обращениями и журналом событий. Никто не подготовил за тебя промежуточные таблицы. Разберись, как устроены связи, затем последовательно собери шесть отчётов.',
  businessRules:[
   'Одна строка support.tickets — одно обращение; событие журнала не означает новое обращение.',
   'Первый ответ — самое раннее событие reply в момент открытия обращения или позже. Ошибочные события до opened_at не учитывай. Если подходящего ответа нет, время первого ответа неизвестно, а SLA не выполнен.',
   'SLA соблюдён, когда ответ дан не позже чем через 60 минут после открытия, включая ровно 60 минут.',
   'Рассматривай status_open / status_in_progress / status_resolved как события изменения статуса; reply статус не меняет.',
   'В отчётах сохраняй клиентов или операторов без обращений там, где это явно требуется. Время измеряй по полю opened_at, а не по текущей дате.'
  ],
  schemaPrefix:'support.',
  reviewPrompt:'Сформулируй наблюдения по нагрузке операторов, узким местам SLA и надёжности статусов. Приведи минимум одну проверку, почему твои подсчёты не раздуты JOIN. Это аналитическая записка, а не автоматически проверенная защита.',
  tasks:[
   {id:'portfolio-support-1',title:'Нагрузка команды',prompt:'Составь полный список операторов поддержки и количества назначенных им обращений. Даже оператор без назначенных заявок должен остаться в отчёте с нулём.',deliverable:'agent_id, agent_name, tickets_count — одна строка на оператора.',
    sql:"SELECT a.agent_id,a.agent_name,COUNT(t.ticket_id) AS tickets_count FROM support.agents a LEFT JOIN support.tickets t ON t.agent_id=a.agent_id GROUP BY a.agent_id,a.agent_name"},
   {id:'portfolio-support-2',title:'Первый ответ каждому клиенту',prompt:'Для каждого обращения вычисли время до самого первого ответа в минутах. Если ответа не было, показатель должен остаться NULL. Округли до одного знака после запятой. Повторные ответы не должны менять результат; события до открытия не учитывай.',deliverable:'ticket_id, first_reply_minutes — одна строка на обращение.',
    sql:"WITH r AS(SELECT e.ticket_id,MIN(e.event_at) AS first_reply FROM support.ticket_events e JOIN support.tickets t ON t.ticket_id=e.ticket_id WHERE e.event_type='reply' AND e.event_at>=t.opened_at GROUP BY e.ticket_id) SELECT t.ticket_id,ROUND(EXTRACT(EPOCH FROM (r.first_reply-t.opened_at))/60,1) AS first_reply_minutes FROM support.tickets t LEFT JOIN r ON r.ticket_id=t.ticket_id"},
   {id:'portfolio-support-3',title:'Контроль SLA по операторам',prompt:'Для каждого оператора рассчитай общее число назначенных обращений, количество обращений с первым ответом за 60 минут или быстрее и число обращений, где ответа пока вообще нет. Операторы без обращений должны получить нули.',deliverable:'agent_id, agent_name, total_tickets, met_sla, unanswered — одна строка на оператора.',
    sql:"WITH reply AS(SELECT e.ticket_id,MIN(e.event_at) AS first_reply FROM support.ticket_events e JOIN support.tickets t ON t.ticket_id=e.ticket_id WHERE e.event_type='reply' AND e.event_at>=t.opened_at GROUP BY e.ticket_id) SELECT a.agent_id,a.agent_name,COUNT(t.ticket_id) AS total_tickets,COUNT(t.ticket_id) FILTER(WHERE r.first_reply IS NOT NULL AND r.first_reply<=t.opened_at+INTERVAL '60 minutes') AS met_sla,COUNT(t.ticket_id) FILTER(WHERE r.first_reply IS NULL) AS unanswered FROM support.agents a LEFT JOIN support.tickets t ON t.agent_id=a.agent_id LEFT JOIN reply r ON r.ticket_id=t.ticket_id GROUP BY a.agent_id,a.agent_name"},
   {id:'portfolio-support-4',title:'Проверка статусов в двух системах',prompt:'Найди обращения, в которых текущий статус карточки противоречит самому последнему событию изменения статуса в журнале. Обращения без записей о статусе тоже считаются расхождением. Сообщения reply не учитывай как изменение статуса.',deliverable:'ticket_id, current_status, last_status — одна строка на проблемное обращение.',
    sql:"WITH r AS(SELECT ticket_id,REPLACE(event_type,'status_','') AS last_status,ROW_NUMBER() OVER(PARTITION BY ticket_id ORDER BY event_at DESC,event_id DESC) AS rn FROM support.ticket_events WHERE event_type IN ('status_open','status_in_progress','status_resolved')) SELECT t.ticket_id,t.current_status,r.last_status FROM support.tickets t LEFT JOIN r ON r.ticket_id=t.ticket_id AND r.rn=1 WHERE t.current_status IS DISTINCT FROM r.last_status"},
   {id:'portfolio-support-5',title:'Риски по клиентским компаниям',prompt:'По каждой клиентской компании покажи общее число обращений и число ещё не решённых. К не решённым относятся open и in_progress. Компании без обращений должны присутствовать с нулями.',deliverable:'client_id, company_name, total_tickets, unresolved — одна строка на компанию.',
    sql:"SELECT c.client_id,c.company_name,COUNT(t.ticket_id) AS total_tickets,COUNT(t.ticket_id) FILTER(WHERE t.current_status IN ('open','in_progress')) AS unresolved FROM support.clients c LEFT JOIN support.tickets t ON t.client_id=c.client_id GROUP BY c.client_id,c.company_name"},
   {id:'portfolio-support-6',title:'Критическая очередь на момент отчёта',prompt:'По состоянию на 10 июня 2026 года, 12:00, найди все обращения высокого приоритета, которые ещё не решены и находятся в работе или ожидании строго больше 24 часов. Покажи время ожидания в часах с одним знаком после запятой. Отсортируй по убыванию ожидания, при равенстве — по номеру обращения.',deliverable:'ticket_id, hours_open — строго отсортированный список.',
    sql:"SELECT ticket_id,ROUND(EXTRACT(EPOCH FROM (TIMESTAMP '2026-06-10 12:00'-opened_at))/3600,1) AS hours_open FROM support.tickets WHERE priority='high' AND current_status IN ('open','in_progress') AND opened_at<TIMESTAMP '2026-06-09 12:00' ORDER BY hours_open DESC,ticket_id",ordered:true}
  ]
 }
 ,{
  "id": "inventory-audit",
  "title": "Inventory Control · Расхождения складского учёта",
  "subtitle": "Второй самостоятельный проект: движение товара и инвентаризация",
  "industry": "Товарный склад",
  "level": "Продвинутый SQL · самостоятельное расследование",
  "problem": "Финансовый отдел не доверяет остаткам: часть товаров уходит в минус, инвентаризации противоречат системному учёту, а пополнение может опираться на устаревшие числа. Нужно восстановить остатки из проводок и доказать, откуда появляются расхождения.",
  "context": "У тебя пять новых таблиц в схеме inventory: склады, номенклатура, начальные остатки, движения и физические пересчёты. В аналитике одна строка движения не равна единице товара. Исходные таблицы не менять. Восстанови состояние на фиксированный момент, а затем сверь его с инвентаризацией.",
  "businessRules": [
    "Остатки inventory.opening_stock заданы на 1 августа 2026, 00:00. Отсутствующая пара склад–товар имеет начальный остаток 0, а не NULL.",
    "Единая точка отчёта — 10 августа 2026, 12:00. Учитывай проводки начиная с 1 августа включительно и строго до точки отчёта; движения ровно в 12:00 и позже не входят.",
    "inventory.movements.delta — изменение количества в штуках: положительное поступление, отрицательное выбытие. Несколько строк по одному товару не должны размножать начальные остатки.",
    "Физическую проверку отражает последний пересчёт по паре склад–товар строго до точки отчёта; при равном времени последним считается больший count_id. Пересчёт включает движения с moved_at до counted_at включительно. Не проверенные позиции нельзя приравнивать к нулевому физическому остатку.",
    "Для сравнения на единую точку отчёта перенеси последний физический пересчёт вперёд: прибавь delta движений строго после counted_at и строго до 12:00. Предполагаем, что эти движения отражены полностью и верно. Полученное physical_qty — расчётная оценка на момент отчёта, а не новое физическое измерение.",
    "Порог пополнения products.reorder_point задан для суммарного остатка товара по всем складам. Нуждаются в пополнении позиции строго ниже порога.",
    "Отклонение инвентаризации = физическое количество минус учётное; в сводке по складам абсолютные отклонения суммируются по позициям, не взаимозачитывая плюсы и минусы."
  ],
  "schemaPrefix": "inventory.",
  "reviewPrompt": "Опиши, какие SKU нужно пополнить, где есть отрицательные учётные остатки и почему итог инвентаризации не равен нулю. Докажи хотя бы одной сверкой, что повторные пересчёты и несколько движений не размножили результат. Какие правила нужно уточнить перед управленческим решением?",
  "tasks": [
    {
      "id": "portfolio-inventory-1",
      "title": "Восстанови учётный остаток",
      "prompt": "Финансовый директор запросил полный реестр остатков всех товаров во всех складах на момент отчёта. Покажи и пустые сочетания склад–товар: они должны иметь нулевой остаток, если движение и начальные значения отсутствуют. Сохрани и отрицательные остатки для расследования.",
      "deliverable": "location_id, product_id, book_qty — одна строка на каждую пару склад–товар.",
      "sql": "WITH book AS (SELECT l.location_id,p.product_id,COALESCE(o.quantity,0)+COALESCE(m.qty,0) AS book_qty FROM inventory.locations l CROSS JOIN inventory.products p LEFT JOIN inventory.opening_stock o ON o.location_id=l.location_id AND o.product_id=p.product_id LEFT JOIN (SELECT location_id,product_id,SUM(delta) AS qty FROM inventory.movements WHERE moved_at>=TIMESTAMP '2026-08-01 00:00' AND moved_at<TIMESTAMP '2026-08-10 12:00' GROUP BY location_id,product_id) m ON m.location_id=l.location_id AND m.product_id=p.product_id) SELECT location_id,product_id,book_qty FROM book"
    },
    {
      "id": "portfolio-inventory-2",
      "title": "Позиции для пополнения",
      "prompt": "Снабжению нужен список товаров, чьё суммарное учётное количество на всех складах строго меньше установленного порога пополнения на момент отчёта. Покажи товар, его артикул, реальное учётное количество и порог. Отсортируй сначала по меньшему остатку, при равенстве — по номеру товара.",
      "deliverable": "product_id, sku, total_qty, reorder_point — отсортированный список.",
      "sql": "WITH book AS (SELECT l.location_id,p.product_id,COALESCE(o.quantity,0)+COALESCE(m.qty,0) AS book_qty FROM inventory.locations l CROSS JOIN inventory.products p LEFT JOIN inventory.opening_stock o ON o.location_id=l.location_id AND o.product_id=p.product_id LEFT JOIN (SELECT location_id,product_id,SUM(delta) AS qty FROM inventory.movements WHERE moved_at>=TIMESTAMP '2026-08-01 00:00' AND moved_at<TIMESTAMP '2026-08-10 12:00' GROUP BY location_id,product_id) m ON m.location_id=l.location_id AND m.product_id=p.product_id) SELECT p.product_id,p.sku,SUM(b.book_qty) AS total_qty,p.reorder_point FROM inventory.products p JOIN book b ON b.product_id=p.product_id GROUP BY p.product_id,p.sku,p.reorder_point HAVING SUM(b.book_qty)<p.reorder_point ORDER BY total_qty,p.product_id",
      "ordered": true
    },
    {
      "id": "portfolio-inventory-3",
      "title": "Расхождения с физическим пересчётом",
      "prompt": "Аудиторы просят позиции с расхождением остатков на единую точку отчёта. Возьми последний допустимый пересчёт и прибавь движения строго после него и строго до точки отчёта. Сравни эту расчётную оценку с учётным остатком. Старые пересчёты и позиции без проверки не включай. Разница — оценка физического количества минус учётное.",
      "deliverable": "location_id, product_id, book_qty, physical_qty, difference — только расхождения; оба количества приведены к точке отчёта, physical_qty является расчётной оценкой.",
      "sql": "WITH book AS (SELECT l.location_id,p.product_id,COALESCE(o.quantity,0)+COALESCE(m.qty,0) AS book_qty FROM inventory.locations l CROSS JOIN inventory.products p LEFT JOIN inventory.opening_stock o ON o.location_id=l.location_id AND o.product_id=p.product_id LEFT JOIN (SELECT location_id,product_id,SUM(delta) AS qty FROM inventory.movements WHERE moved_at>=TIMESTAMP '2026-08-01 00:00' AND moved_at<TIMESTAMP '2026-08-10 12:00' GROUP BY location_id,product_id) m ON m.location_id=l.location_id AND m.product_id=p.product_id), counted AS (SELECT location_id,product_id,counted_at,physical_qty,ROW_NUMBER() OVER(PARTITION BY location_id,product_id ORDER BY counted_at DESC,count_id DESC) AS rn FROM inventory.stocktakes WHERE counted_at<TIMESTAMP '2026-08-10 12:00'), projected AS (SELECT c.location_id,c.product_id,c.physical_qty+COALESCE(SUM(m.delta),0) AS physical_qty FROM counted c LEFT JOIN inventory.movements m ON m.location_id=c.location_id AND m.product_id=c.product_id AND m.moved_at>c.counted_at AND m.moved_at<TIMESTAMP '2026-08-10 12:00' WHERE c.rn=1 GROUP BY c.location_id,c.product_id,c.physical_qty) SELECT b.location_id,b.product_id,b.book_qty,c.physical_qty,c.physical_qty-b.book_qty AS difference FROM book b JOIN projected c ON c.location_id=b.location_id AND c.product_id=b.product_id WHERE c.physical_qty<>b.book_qty"
    },
    {
      "id": "portfolio-inventory-4",
      "title": "Оборот товара по складам",
      "prompt": "Операционный директор хочет знать, сколько единиц каждого склада поступило и сколько выбыло за отчётный период. Поступления и выбытия покажи отдельными положительными числами. В отчёте должны остаться склады без единой проводки с нулевыми показателями.",
      "deliverable": "location_id, location_name, received_units, issued_units — одна строка на склад.",
      "sql": "SELECT l.location_id,l.location_name,COALESCE(SUM(m.delta) FILTER(WHERE m.delta>0),0) AS received_units,COALESCE(-SUM(m.delta) FILTER(WHERE m.delta<0),0) AS issued_units FROM inventory.locations l LEFT JOIN inventory.movements m ON m.location_id=l.location_id AND m.moved_at>=TIMESTAMP '2026-08-01 00:00' AND m.moved_at<TIMESTAMP '2026-08-10 12:00' GROUP BY l.location_id,l.location_name"
    },
    {
      "id": "portfolio-inventory-5",
      "title": "Товары без движений",
      "prompt": "Команде контроля нужен полный перечень складских позиций, по которым за отчётный период не было ни одного движения. Учитывай все склады и все товары, даже если для сочетания никогда не заводили начальный остаток. Движения после точки отчёта не должны исключать позицию. Отсортируй по складу и товару.",
      "deliverable": "location_id, product_id — по возрастанию обоих полей.",
      "sql": "SELECT l.location_id,p.product_id FROM inventory.locations l CROSS JOIN inventory.products p WHERE NOT EXISTS(SELECT 1 FROM inventory.movements m WHERE m.location_id=l.location_id AND m.product_id=p.product_id AND m.moved_at>=TIMESTAMP '2026-08-01 00:00' AND m.moved_at<TIMESTAMP '2026-08-10 12:00') ORDER BY l.location_id,p.product_id",
      "ordered": true
    },
    {
      "id": "portfolio-inventory-6",
      "title": "Итоговое заключение по складам",
      "prompt": "Подготовь по каждому складу сводку инвентаризации: сколько разных позиций фактически проверили, сколько из них имеют расхождение и какова суммарная величина абсолютных расхождений в штуках. Сначала приведи последний пересчёт каждой позиции к точке отчёта с учётом последующих движений, как в предыдущей сверке. Повторные проверки не создают новые позиции. Даже склад без пересчётов должен остаться с нулями.",
      "deliverable": "location_id, counted_positions, discrepant_positions, absolute_gap_units — одна строка на склад.",
      "sql": "WITH book AS (SELECT l.location_id,p.product_id,COALESCE(o.quantity,0)+COALESCE(m.qty,0) AS book_qty FROM inventory.locations l CROSS JOIN inventory.products p LEFT JOIN inventory.opening_stock o ON o.location_id=l.location_id AND o.product_id=p.product_id LEFT JOIN (SELECT location_id,product_id,SUM(delta) AS qty FROM inventory.movements WHERE moved_at>=TIMESTAMP '2026-08-01 00:00' AND moved_at<TIMESTAMP '2026-08-10 12:00' GROUP BY location_id,product_id) m ON m.location_id=l.location_id AND m.product_id=p.product_id), counted AS (SELECT location_id,product_id,counted_at,physical_qty,ROW_NUMBER() OVER(PARTITION BY location_id,product_id ORDER BY counted_at DESC,count_id DESC) AS rn FROM inventory.stocktakes WHERE counted_at<TIMESTAMP '2026-08-10 12:00'), projected AS (SELECT c.location_id,c.product_id,c.physical_qty+COALESCE(SUM(m.delta),0) AS physical_qty FROM counted c LEFT JOIN inventory.movements m ON m.location_id=c.location_id AND m.product_id=c.product_id AND m.moved_at>c.counted_at AND m.moved_at<TIMESTAMP '2026-08-10 12:00' WHERE c.rn=1 GROUP BY c.location_id,c.product_id,c.physical_qty), checked AS (SELECT b.location_id,b.product_id,ABS(c.physical_qty-b.book_qty) AS gap FROM book b JOIN projected c ON c.location_id=b.location_id AND c.product_id=b.product_id) SELECT l.location_id,COUNT(c.product_id) AS counted_positions,COUNT(c.product_id) FILTER(WHERE c.gap>0) AS discrepant_positions,COALESCE(SUM(c.gap),0) AS absolute_gap_units FROM inventory.locations l LEFT JOIN checked c ON c.location_id=l.location_id GROUP BY l.location_id"
    }
  ]
}
]; 
export const independentProjectById=Object.fromEntries(independentProjects.map(p=>[p.id,p]));
export const independentProjectTasks=independentProjects.flatMap(p=>p.tasks.map(t=>({...t,projectId:p.id})));
export const independentProjectTaskById=Object.fromEntries(independentProjectTasks.map(t=>[t.id,t]));
