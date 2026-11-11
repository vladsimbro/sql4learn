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
   'Первый ответ — самое раннее событие reply после открытия обращения. Если ответа нет, время первого ответа неизвестно, а SLA не выполнен.',
   'SLA соблюдён, когда ответ дан не позже чем через 60 минут после открытия, включая ровно 60 минут.',
   'Рассматривай status_open / status_in_progress / status_resolved как события изменения статуса; reply статус не меняет.',
   'В отчётах сохраняй клиентов или операторов без обращений там, где это явно требуется. Время измеряй по полю opened_at, а не по текущей дате.'
  ],
  schemaPrefix:'support.',
  reviewPrompt:'Сформулируй наблюдения по нагрузке операторов, узким местам SLA и надёжности статусов. Приведи минимум одну проверку, почему твои подсчёты не раздуты JOIN. Это аналитическая записка, а не автоматически проверенная защита.',
  tasks:[
   {id:'portfolio-support-1',title:'Нагрузка команды',prompt:'Составь полный список операторов поддержки и количества назначенных им обращений. Даже оператор без назначенных заявок должен остаться в отчёте с нулём.',deliverable:'agent_id, agent_name, tickets_count — одна строка на оператора.',
    sql:"SELECT a.agent_id,a.agent_name,COUNT(t.ticket_id) AS tickets_count FROM support.agents a LEFT JOIN support.tickets t ON t.agent_id=a.agent_id GROUP BY a.agent_id,a.agent_name"},
   {id:'portfolio-support-2',title:'Первый ответ каждому клиенту',prompt:'Для каждого обращения вычисли время до самого первого ответа в минутах. Если ответа не было, показатель должен остаться NULL. Округли до одного знака после запятой. Повторные ответы не должны менять результат.',deliverable:'ticket_id, first_reply_minutes — одна строка на обращение.',
    sql:"WITH r AS(SELECT ticket_id,MIN(event_at) FILTER(WHERE event_type='reply') AS first_reply FROM support.ticket_events GROUP BY ticket_id) SELECT t.ticket_id,ROUND(EXTRACT(EPOCH FROM (r.first_reply-t.opened_at))/60,1) AS first_reply_minutes FROM support.tickets t LEFT JOIN r ON r.ticket_id=t.ticket_id"},
   {id:'portfolio-support-3',title:'Контроль SLA по операторам',prompt:'Для каждого оператора рассчитай общее число назначенных обращений, количество обращений с первым ответом за 60 минут или быстрее и число обращений, где ответа пока вообще нет. Операторы без обращений должны получить нули.',deliverable:'agent_id, agent_name, total_tickets, met_sla, unanswered — одна строка на оператора.',
    sql:"WITH reply AS(SELECT ticket_id,MIN(event_at) FILTER(WHERE event_type='reply') AS first_reply FROM support.ticket_events GROUP BY ticket_id) SELECT a.agent_id,a.agent_name,COUNT(t.ticket_id) AS total_tickets,COUNT(t.ticket_id) FILTER(WHERE r.first_reply IS NOT NULL AND r.first_reply<=t.opened_at+INTERVAL '60 minutes') AS met_sla,COUNT(t.ticket_id) FILTER(WHERE r.first_reply IS NULL) AS unanswered FROM support.agents a LEFT JOIN support.tickets t ON t.agent_id=a.agent_id LEFT JOIN reply r ON r.ticket_id=t.ticket_id GROUP BY a.agent_id,a.agent_name"},
   {id:'portfolio-support-4',title:'Проверка статусов в двух системах',prompt:'Найди обращения, в которых текущий статус карточки противоречит самому последнему событию изменения статуса в журнале. Обращения без записей о статусе тоже считаются расхождением. Сообщения reply не учитывай как изменение статуса.',deliverable:'ticket_id, current_status, last_status — одна строка на проблемное обращение.',
    sql:"WITH r AS(SELECT ticket_id,REPLACE(event_type,'status_','') AS last_status,ROW_NUMBER() OVER(PARTITION BY ticket_id ORDER BY event_at DESC,event_id DESC) AS rn FROM support.ticket_events WHERE event_type IN ('status_open','status_in_progress','status_resolved')) SELECT t.ticket_id,t.current_status,r.last_status FROM support.tickets t LEFT JOIN r ON r.ticket_id=t.ticket_id AND r.rn=1 WHERE t.current_status IS DISTINCT FROM r.last_status"},
   {id:'portfolio-support-5',title:'Риски по клиентским компаниям',prompt:'По каждой клиентской компании покажи общее число обращений и число ещё не решённых. К не решённым относятся open и in_progress. Компании без обращений должны присутствовать с нулями.',deliverable:'client_id, company_name, total_tickets, unresolved — одна строка на компанию.',
    sql:"SELECT c.client_id,c.company_name,COUNT(t.ticket_id) AS total_tickets,COUNT(t.ticket_id) FILTER(WHERE t.current_status IN ('open','in_progress')) AS unresolved FROM support.clients c LEFT JOIN support.tickets t ON t.client_id=c.client_id GROUP BY c.client_id,c.company_name"},
   {id:'portfolio-support-6',title:'Критическая очередь на момент отчёта',prompt:'По состоянию на 10 июня 2026 года, 12:00, найди все обращения высокого приоритета, которые ещё не решены и находятся в работе или ожидании строго больше 24 часов. Покажи время ожидания в часах с одним знаком после запятой. Отсортируй по убыванию ожидания, при равенстве — по номеру обращения.',deliverable:'ticket_id, hours_open — строго отсортированный список.',
    sql:"SELECT ticket_id,ROUND(EXTRACT(EPOCH FROM (TIMESTAMP '2026-06-10 12:00'-opened_at))/3600,1) AS hours_open FROM support.tickets WHERE priority='high' AND current_status IN ('open','in_progress') AND opened_at<TIMESTAMP '2026-06-09 12:00' ORDER BY hours_open DESC,ticket_id",ordered:true}
  ]
 }
];
export const independentProjectById=Object.fromEntries(independentProjects.map(p=>[p.id,p]));
export const independentProjectTasks=independentProjects.flatMap(p=>p.tasks.map(t=>({...t,projectId:p.id})));
export const independentProjectTaskById=Object.fromEntries(independentProjectTasks.map(t=>[t.id,t]));
