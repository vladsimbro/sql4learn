// Original spaced-retrieval bank. Every follow-up uses a fresh business formulation.
import {lessonById} from './content.js';
const V=(title,prompt,sql,ordered=false)=>({title,prompt,sql,ordered});
const S=(id,title,lessonId,category,variants)=>({id,title,lessonId,category,variants});
export const reviewSkills=[
 S('recall-first','Первый SQL','first-query','Основы',[
  V('Вычисление стоимости','Вычисли произведение 11 и 9 в одном столбце answer.','SELECT 11*9 AS answer;'),
  V('Проверка выражения','Получи сумму 23 и 19, название столбца answer.','SELECT 23+19 AS answer;'),
  V('Арифметика','Получи результат деления 84 на 7 в одном столбце answer.','SELECT 84/7 AS answer;')
 ]),
 S('recall-filter','Условия и NULL','null-range','Фильтрация',[
  V('Порог для доставок','Подготовь номера доставленных заказов на сумму не меньше 1500. Отсортируй номера по возрастанию.',"SELECT order_id FROM orders WHERE status='delivered' AND amount>=1500 ORDER BY order_id;",true),
  V('Отменены без исполнителя','Покажи номера и статусы отменённых заказов, которым не назначали курьера. Номера по возрастанию.',"SELECT order_id,status FROM orders WHERE courier_id IS NULL AND status='cancelled' ORDER BY order_id;",true),
  V('Операционный контроль','Найди номера и суммы заказов от 700 до 1500 включительно, которые были доставлены или находятся в пути. Сортируй по убыванию суммы и номеру.',"SELECT order_id,amount FROM orders WHERE amount BETWEEN 700 AND 1500 AND status IN ('delivered','in_transit') ORDER BY amount DESC,order_id;",true)
 ]),
 S('recall-groups','Агрегация и границы','having','Агрегации',[
  V('Магазины с нагрузкой','Верни идентификатор магазина и число заказов orders_count для магазинов, где не менее трёх заказов.','SELECT store_id,COUNT(*) AS orders_count FROM orders GROUP BY store_id HAVING COUNT(*)>=3;'),
  V('Оборот покупателей','Покажи идентификаторы покупателей и общий оборот total_amount только для тех, чьи суммы заказов строго больше 2500.','SELECT customer_id,SUM(amount) AS total_amount FROM orders GROUP BY customer_id HAVING SUM(amount)>2500;'),
  V('Средний чек по статусам','Для статусов со средним чеком не меньше 900 рассчитай avg_amount, округлённый до двух десятичных знаков. Покажи статус и показатель.','SELECT status,ROUND(AVG(amount),2) AS avg_amount FROM orders GROUP BY status HAVING AVG(amount)>=900;')
 ]),
 S('recall-joins','Соединения и потеря строк','fanout','JOIN',[
  V('Полный список магазинов','Для каждого магазина, включая пустые, покажи store_name и число заказов orders_count. Нулевые магазины сохраняй.','SELECT s.store_name,COUNT(o.order_id) AS orders_count FROM stores s LEFT JOIN orders o ON o.store_id=s.store_id GROUP BY s.store_id,s.store_name;'),
  V('Ещё не покупали','Назови клиентов, которые не оформили ни одного заказа. Верни customer_name.','SELECT c.customer_name FROM customers c WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=c.customer_id);'),
  V('Выручка по курьерам','По каждому курьеру, включая курьеров без доставок, посчитай доставленную выручку revenue. Покажи courier_id и revenue с нулём, где доставок нет.',"SELECT c.courier_id,COALESCE(SUM(o.amount) FILTER(WHERE o.status='delivered'),0) AS revenue FROM couriers c LEFT JOIN orders o ON o.courier_id=c.courier_id GROUP BY c.courier_id;")
 ]),
 S('recall-dates','Границы календаря','date-calendar','Время',[
  V('Дни и нулевые доставки','Подготовь календарь с 1 по 14 апреля 2026 года и число доставок delivered каждого дня, включая дни без событий. Покажи day и delivered по возрастанию.',"SELECT c.day::date AS day,COUNT(o.order_id) AS delivered FROM generate_series(DATE '2026-04-01',DATE '2026-04-14',INTERVAL '1 day') AS c(day) LEFT JOIN orders o ON o.ordered_at>=c.day AND o.ordered_at<c.day+INTERVAL '1 day' AND o.status='delivered' GROUP BY c.day ORDER BY day;",true),
  V('Дни отмен','По всем календарным дням, в которые были отмены, покажи дату day и количество отмен cancelled, отсортируй по дате.',"SELECT ordered_at::date AS day,COUNT(*) AS cancelled FROM orders WHERE status='cancelled' GROUP BY ordered_at::date ORDER BY day;",true),
  V('Доставленная выручка по неделям','Подготовь сумму доставленных заказов revenue по календарным неделям, с понедельником week как датой начала. Недели по возрастанию.',"SELECT DATE_TRUNC('week',ordered_at)::date AS week,SUM(amount) AS revenue FROM orders WHERE status='delivered' GROUP BY DATE_TRUNC('week',ordered_at)::date ORDER BY week;",true)
 ]),
 S('recall-cte','Многоэтапный SQL','conditional','CTE',[
  V('Магазины выше среднего','Найди идентификаторы магазинов, оборот которых строго выше среднего оборота на магазин.','WITH totals AS(SELECT store_id,SUM(amount) AS amount FROM orders GROUP BY store_id) SELECT store_id FROM totals WHERE amount>(SELECT AVG(amount) FROM totals);'),
  V('Крупные доставленные покупки','Для каждого покупателя, у которого сумма доставленных заказов больше 2000, покажи customer_id и revenue.','WITH d AS(SELECT customer_id,amount FROM orders WHERE status=\'delivered\') SELECT customer_id,SUM(amount) AS revenue FROM d GROUP BY customer_id HAVING SUM(amount)>2000;'),
  V('Средний чек магазина против общего','Найди идентификаторы магазинов и их средний чек avg_check, если он выше общего среднего чека компании.','WITH global_average AS(SELECT AVG(amount) AS avg_check FROM orders) SELECT o.store_id,AVG(o.amount) AS avg_check FROM orders o CROSS JOIN global_average g GROUP BY o.store_id,g.avg_check HAVING AVG(o.amount)>g.avg_check;')
 ]),
 S('recall-windows','Окна и события','running','Окна',[
  V('Очередь самых дорогих','Для каждого заказа покажи номер, идентификатор магазина и позицию rn по убыванию суммы внутри магазина, при ничьих — по возрастанию номера.','SELECT order_id,store_id,ROW_NUMBER() OVER(PARTITION BY store_id ORDER BY amount DESC,order_id) AS rn FROM orders;'),
  V('История предыдущих чеков','Для каждого заказа покажи customer_id, order_id и размер предыдущей покупки previous_amount того же клиента по времени и номеру.','SELECT customer_id,order_id,LAG(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id) AS previous_amount FROM orders;'),
  V('Сумма покупок нарастающим итогом','Для каждого доставленного заказа покажи номер и накопленную сумму revenue_so_far в истории конкретного клиента, учитывая только доставленные заказы. Порядок — время, затем номер.',"SELECT order_id,SUM(amount) OVER(PARTITION BY customer_id ORDER BY ordered_at,order_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS revenue_so_far FROM orders WHERE status='delivered';")
 ]),
 S('recall-product','Покупатели и воронки','product-history','Продуктовая аналитика',[
  V('Конверсия по каналам','Для каждого канала покажи channel, число зарегистрированных signups и число уникальных купивших payers; каналы без покупателей должны остаться.',"SELECT u.channel,COUNT(DISTINCT u.user_id) AS signups,COUNT(DISTINCT u.user_id) FILTER(WHERE e.event_type='purchase') AS payers FROM app_users u LEFT JOIN user_events e ON e.user_id=u.user_id GROUP BY u.channel;"),
  V('Уникальная аудитория по месяцам','Посчитай число активных пользователей active_users по каждому месяцу событий. Покажи начало месяца month и показатель, отсортируй месяцы.',"SELECT DATE_TRUNC('month',event_at)::date AS month,COUNT(DISTINCT user_id) AS active_users FROM user_events GROUP BY DATE_TRUNC('month',event_at)::date ORDER BY month;",true),
  V('Смотрели, но не покупали','Найди идентификаторы пользователей, у которых был хотя бы один просмотр товара, но не было ни одной покупки.','SELECT u.user_id FROM app_users u WHERE EXISTS(SELECT 1 FROM user_events e WHERE e.user_id=u.user_id AND e.event_type=\'view\') AND NOT EXISTS(SELECT 1 FROM user_events e WHERE e.user_id=u.user_id AND e.event_type=\'purchase\');')
 ]),
 S('recall-audit','Зерно и качество','audit-quality','Качество данных',[
  V('Насыщенная история','Найди номера заказов с тремя и более событиями истории и показатель events_count для каждого.','SELECT order_id,COUNT(*) AS events_count FROM order_events GROUP BY order_id HAVING COUNT(*)>=3;'),
  V('Несовпадение товаров и заголовка','Найди номера заказов и разницу difference между суммой заголовка и суммой позиций, если они различаются. Заказы без товарных позиций сохрани.',"WITH x AS(SELECT order_id,SUM(quantity*unit_price) AS items_total FROM order_items GROUP BY order_id) SELECT o.order_id,o.amount-COALESCE(x.items_total,0) AS difference FROM orders o LEFT JOIN x ON x.order_id=o.order_id WHERE o.amount IS DISTINCT FROM COALESCE(x.items_total,0);"),
  V('Ошибки последнего статуса','Выведи номера заказов, где текущий статус отличается от типа последнего события в истории; отсутствие истории тоже считается противоречием.','WITH x AS(SELECT order_id,event_type,ROW_NUMBER() OVER(PARTITION BY order_id ORDER BY event_at DESC,event_id DESC) AS rn FROM order_events) SELECT o.order_id FROM orders o LEFT JOIN x ON x.order_id=o.order_id AND x.rn=1 WHERE o.status IS DISTINCT FROM x.event_type;')
 ])
];
export const reviewSkillById=Object.fromEntries(reviewSkills.map(skill=>[skill.id,skill]));
export const REVIEW_INTERVALS_DAYS=[1,3,7,30];
// The interval level saturates; completed rounds must keep rotating the exercise.
const roundOf=snapshot=>Number.isSafeInteger(snapshot?.round)&&snapshot.round>=0?snapshot.round:(snapshot?.level||0);
export function reviewUnlocked(progress,skill){
 const lesson=lessonById[skill.lessonId];
 return !!lesson&&lesson.tasks.some(task=>progress.completed.includes(task.id));
}
export function reviewStatus(progress,skill,now=Date.now()){
 const snapshot=progress.review?.[skill.id]||{level:0,nextDueAt:0,misses:0};
 const unlocked=reviewUnlocked(progress,skill);
 const due=unlocked&&snapshot.nextDueAt<=now;
 return {...snapshot,unlocked,due,variant:skill.variants[roundOf(snapshot)%skill.variants.length]};
}
export function reviewTask(progress,skill){
 const variant=reviewStatus(progress,skill).variant;
 return {...variant,id:skill.id,skillId:skill.id};
}
export function advanceReview(current,passed,now=Date.now()){
 const level=passed?Math.min(4,(current?.level||0)+1):0;
 const delay=passed?REVIEW_INTERVALS_DAYS[level-1]*86400000:0;
 const round=roundOf(current);
 return {level,round:passed?(round===Number.MAX_SAFE_INTEGER?0:round+1):round,nextDueAt:now+delay,misses:(current?.misses||0)+(passed?0:1)};
}
