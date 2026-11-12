import {modules,lessons,tasks,lessonById,taskById,moduleById,upcomingModules,projects} from './content.js';
import {assessments,assessmentById} from './assessments.js';
import {xrayScenarios,xrayById} from './xray.js';
import {clinicTasks,clinicTaskById} from './clinic.js';
import {SCHEMA} from './data.js';
import {SUPPORT_SCHEMA} from './project-data.js';
import {INVENTORY_SCHEMA} from './inventory-data.js';
import {independentProjects,independentProjectById} from './portfolio.js';
import {reviewSkills,reviewSkillById,reviewStatus,reviewTask} from './review-bank.js';
import {mastery} from './progress.js';
import {getLessonGuide,modulePedagogy} from './lesson-guides.js';
import {lessonWalkthroughs,lessonVisuals} from './lesson-walkthroughs.js';

export const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const done=(state,id)=>state.progress.completed.includes(id);
const percentage=(n,d)=>d?Math.round(n/d*100):0;
const skill=(state,module)=> {
 const all=module.lessons.flatMap(l=>l.tasks),passed=all.filter(t=>done(state,t.id)).length;
 return {passed,total:all.length,percent:percentage(passed,all.length)};
};
const lessonDone=(state,l)=>l.tasks.length>0&&(l.tasks.every(t=>done(state,t.id))||state.progress.legacyMastered?.includes(l.id))&&state.progress.quiz[l.id]===l.quiz.correct;
const button=(label,href,primary=false)=>`<a class="btn ${primary?'primary':''}" href="${href}">${esc(label)}</a>`;
const pill=(label,style='')=>`<span class="pill ${style}">${esc(label)}</span>`;
const header=(eyebrow,title,description,action='')=>`<div class="page-header"><div><p class="section-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${action}</div>`;

export function renderHome(state){
 const completed=tasks.filter(task=>state.progress.completed.includes(task.id)).length;
 const mastered=lessons.filter(l=>lessonDone(state,l)).length;
 const start=lessons.find(l=>!lessonDone(state,l))||lessons[0];
 const module=moduleById[start.moduleId];
 return `<section class="hero">
  <div class="hero-inner"><p class="hero-eyebrow">ТВОЁ РАБОЧЕЕ ПРОСТРАНСТВО ДАННЫХ</p><h1>Меньше зубрёжки.<br><em>Больше реального SQL.</em></h1>
  <p>Осваивай SQL с нуля на базе службы доставки. Пиши запросы в настоящем PostgreSQL, проверяй разные сценарии и учись видеть ошибки в цифрах.</p>
  ${button(completed?'Продолжить обучение':'Написать первый SQL',`#/lesson/${start.id}`,true)} ${button('Посмотреть маршрут','#/course',false)}
  </div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit o2"></div><div class="orb-node n1">SELECT<br>DATA</div><div class="orb-node n2">✔ SQL</div><div class="orb-node n3">GROUP BY<br>INSIGHTS</div></div></section>
  <div class="stat-grid">
   <div class="card stat"><label>SQL-заданий выполнено</label><strong>${completed}<span class="muted">/${tasks.length}</span></strong><small>Реально проверены</small></div>
   <div class="card stat"><label>Уроков освоено</label><strong>${mastered}<span class="muted">/${lessons.length}</span></strong><small>Теория + весь SQL</small></div>
   <div class="card stat"><label>Учебных модулей</label><strong>${modules.length}</strong><small>С работающими заданиями</small></div>
   <div class="card stat"><label>Рубежных экзаменов</label><strong>${assessments.filter(a=>a.tasks.every(t=>done(state,t.id))).length}<span class="muted">/${assessments.length}</span></strong><small>Независимые задачи</small></div>
  </div>
  <div class="dashboard-grid"><section class="card next-lesson"><div class="between"><p class="section-eyebrow">СЛЕДУЮЩИЙ ШАГ</p>${pill(module.title,'teal')}</div>
  <h2>${esc(start.title)}</h2><p>${esc(start.lead)}</p>
  <div class="subtle-line"></div><div class="between"><span class="small muted">${module.lessons.length} уроков в модуле</span>${button('Открыть урок',`#/lesson/${start.id}`,true)}</div></section>
  <section class="card learning-path"><p class="section-eyebrow">КАК ТЫ БУДЕШЬ УЧИТЬСЯ</p>
    <div class="mini-step"><span class="step-dot">01</span><div><strong>Разберись в логике</strong><small>Короткая теория и пример результата</small></div></div>
    <div class="mini-step"><span class="step-dot">02</span><div><strong>Напиши самостоятельно</strong><small>Несколько различных SQL-задач</small></div></div>
    <div class="mini-step"><span class="step-dot">03</span><div><strong>Проверь на новых данных</strong><small>Дополнительный набор ловит неверную логику</small></div></div>
    <div class="mini-step"><span class="step-dot">04</span><div><strong>Сдай накопительную работу</strong><small>Темы проверяются вместе</small></div></div>
  </section></div>`;
}
export function renderCourse(state){
 return header('КУРСЫ / ОСНОВНОЙ МАРШРУТ','SQL для аналитики','От первого SELECT до корректных бизнес-метрик. Темы идут по зависимости знаний: необходимые конструкции объясняются раньше практики с ними.')+
 `<section class="card curriculum-sequence"><p class="section-eyebrow">ПОЧЕМУ ИМЕННО ТАКАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ</p>
 <div class="curriculum-sequence-grid">${modules.map((m,i)=>`<a href="#/module/${m.id}" class="curriculum-sequence-step"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(m.title)}</strong><small>${esc(modulePedagogy[m.id]?.outcome||m.subtitle)}</small></a>`).join('')}</div>
 <p class="small muted">Модули открыты для свободного просмотра. Но чтобы действительно освоить тему, пройди предыдущие объяснения, реши SQL самостоятельно и вернись к контрольной на сочетание навыков.</p>
 </section><div class="module-grid">${modules.map((m,i)=>{const p=skill(state,m);return `<section class="card module-card">
    <div class="module-top"><span class="module-icon">${esc(m.icon)}</span>${pill(i===0?'Старт':'Модуль '+(i+1),i===0?'teal':'neutral')}</div>
    <h2>${esc(m.title)}</h2><p>${esc(m.subtitle)}</p><p class="module-why"><b>Зачем этот этап:</b> ${esc(modulePedagogy[m.id]?.why||"")}</p>
    <div class="progress-track"><span style="width:${p.percent}%"></span></div>
    <div class="module-card-footer"><span>${m.lessons.length} урока · ${p.total} задач</span><strong>${p.passed}/${p.total}</strong></div>
    ${button(p.passed?'Продолжить модуль':'Открыть модуль',`#/module/${m.id}`)}
    </section>`}).join('')}</div>
    <section class="roadmap-future"><h2 class="panel-title">Следующие направления</h2><p class="small muted">Они включены в план, но пока не выданы за готовые курсы.</p><div class="future-list">${upcomingModules.map(m=>`<span>${esc(m)} · в разработке</span>`).join('')}</div></section>`;
}
export function renderModule(state,id){
 const m=moduleById[id];if(!m)return renderNotFound();
 const p=skill(state,m);
 const exam=assessments.find(a=>a.after===m.id);
 return header('УЧЕБНЫЙ МАРШРУТ / МОДУЛЬ '+esc(m.icon),m.title,m.subtitle,button('К программе','#/course'))+
 `<section class="card panel"><div class="between"><strong>${p.passed} из ${p.total} SQL-задач</strong>${pill(p.percent+'% выполнено',p.percent===100?'teal':'')}</div>
 <div class="progress-track" style="margin:15px 0 22px"><span style="width:${p.percent}%"></span></div>
 <div class="lesson-list">${m.lessons.map((l,i)=>`<a class="${lessonDone(state,l)?'done':''}" href="#/lesson/${l.id}"><span class="lesson-number">${String(i+1).padStart(2,'0')}</span><span>${esc(l.title)}</span><small>${lessonDone(state,l)?'✓ Освоено':l.tasks.length+' SQL-задачи'}</small></a>`).join('')}</div>
 ${exam?`<div class="subtle-line"></div><div class="between"><div><strong>${esc(exam.title)}</strong><p class="small muted">${esc(exam.description)}</p></div>${button('К контрольной',`#/exam/${exam.id}`,true)}</div>`:''}
 </section>`;
}
function objective(l,state){
 const guide=getLessonGuide(l.id);
 if(!guide)return '';
 const prereqs=guide.requires.map(id=>{
  const prerequisite=lessonById[id];
  return prerequisite?`<a href="#/lesson/${prerequisite.id}" class="lesson-prerequisite ${lessonDone(state,prerequisite)?'ready':''}">${lessonDone(state,prerequisite)?'✓':'○'} ${esc(prerequisite.title)}</a>`:'';
 }).join('');
 return `<div class="lesson-goal">
  <span class="section-eyebrow">ЧТО ТЫ ДОЛЖЕН УМЕТЬ ПОСЛЕ ЭТОГО УРОКА</span>
  <p>${esc(guide.goal)}</p>
  ${prereqs?`<div class="lesson-prerequisites"><strong>Полезно вспомнить до начала</strong><div>${prereqs}</div></div>`:'<span class="small muted">Начинаем с нуля: предварительных знаний SQL не требуется.</span>'}
 </div>`;
}
function predictionGuide(l,state){
 const guide=getLessonGuide(l.id),result=state.exampleResult?.lessonId===l.id?state.exampleResult:null;
 if(!guide)return '';
 const forecast=result?.forecast;
 const verified=result?.query&&Number.isInteger(forecast);
 const actual=result?.query?.rows?.length;
 return `<div class="lesson-prediction">
  <p class="section-eyebrow">ПРОГНОЗ ДО ЗАПУСКА SQL</p>
  <p>${esc(guide.predict)}</p>
  <label for="example-prediction">Сколько строк ожидаешь в результате? <span class="muted">(необязательно)</span></label>
  <input id="example-prediction" type="number" min="0" max="1000000" step="1" inputmode="numeric" placeholder="Например, 1" value="${Number.isInteger(forecast)?forecast:''}" aria-describedby="prediction-hint">
  <div id="prediction-hint" class="small muted">Сначала подумай, потом запусти пример и сверь предположение с настоящим PostgreSQL.</div>
  ${verified?`<div class="prediction-result ${forecast===actual?'correct':'review'}">${forecast===actual?'Прогноз числа строк подтвердился.':'Прогноз: '+forecast+' строк. Фактически: '+actual+'. Найди этап SQL, который изменил количество строк.'}</div>`:''}
 </div>`;
}
function misconceptionGuide(l){
 const guide=getLessonGuide(l.id);
 return guide?`<div class="lesson-mistake"><span class="section-eyebrow">ТИПИЧНАЯ ЛОГИЧЕСКАЯ ОШИБКА</span><p>${esc(guide.pitfall)}</p></div>
 <div class="lesson-self-check"><span class="section-eyebrow">ПРОВЕРЬ СЕБЯ</span><p>${esc(guide.check)}</p></div>`:'';
}
function renderWalkthrough(l){
 const steps=lessonWalkthroughs[l.id]||[],visual=lessonVisuals[l.id];
 if(!steps.length)return '';
 const stageNames=['Сначала — исходные данные','Затем — действие SQL','Наконец — проверь результат'];
 const grid=(table)=>`<div class="walkthrough-table"><strong>${esc(table.label)}</strong><div class="table-scroll"><table><thead><tr>${table.columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
 return `<div class="lesson-walkthrough" id="lesson-walkthrough"><p class="section-eyebrow">ЛОГИКА БЕЗ ЗУБРЁЖКИ</p><h2>Разберём на маленьком примере</h2>
 <p>Пройди эти шаги мысленно, а затем сравни с результатом настоящего запроса ниже. Здесь важнее понять, почему меняются строки, чем запомнить команду.</p>
 <div class="walkthrough-steps">${steps.map((step,i)=>`<article class="walkthrough-step"><div class="walkthrough-step-header"><span>${i+1}</span><strong>${esc(stageNames[i])}</strong></div><p>${esc(step)}</p></article>`).join('')}</div>
 ${visual?`<div class="walkthrough-visual"><h3>${esc(visual.title)}</h3><p class="walkthrough-disclaimer">Это условный маленький пример для объяснения, а не строки учебной базы. Ниже ты запустишь настоящий SQL.</p><div class="walkthrough-tables">${grid(visual.before)}<span class="walkthrough-arrow" aria-hidden="true">→</span>${grid(visual.after)}</div><p class="walkthrough-insight">${esc(visual.insight)}</p></div>`:''}</div>`;
}
function quiz(state,l){
 const selection=state.progress.quiz[l.id],hasAnswer=Number.isInteger(selection);
 return `<section class="card lesson-section"><p class="section-eyebrow">ПРОВЕРКА ПОНИМАНИЯ</p><h2>${esc(l.quiz.question)}</h2>
 <div class="question-options">${l.quiz.choices.map((text,i)=>`<button class="option ${hasAnswer&&selection===i?(i===l.quiz.correct?'correct':'wrong'):''}" data-quiz="${i}" data-lesson="${l.id}"><span>${String.fromCharCode(65+i)}</span>${esc(text)}</button>`).join('')}</div>
 ${hasAnswer?`<div class="feedback ${selection===l.quiz.correct?'success':'error'}"><strong>${selection===l.quiz.correct?'Верно.':'Есть ошибка — попробуй ещё раз.'}</strong>${esc(l.quiz.why)}</div>`:''}</section>`;
}
const flow={start:['SELECT','Вычисление выражений','Таблица результата'],filter:['FROM','WHERE','SELECT','ORDER BY'],aggregate:['FROM','WHERE','GROUP BY','Агрегаты','HAVING','SELECT'],dates:['Календарные границы','FROM / generate_series','JOIN / WHERE','GROUP BY период','SELECT'],joins:['FROM','JOIN ... ON','WHERE','SELECT'],cte:['WITH: этапы','Внешний SELECT','Результат'],windows:['Исходные строки','PARTITION BY','ORDER BY','OVER: значение'],product:['События','Зерно и уникальные люди','JOIN / CTE','Когорта / канал','Агрегаты и метрика'],audit:['Выбрать зерно','Проверить ключи','Свернуть детали','JOIN / CTE','Сверить метрику']};
// Specific flows keep UNION, aggregates and windows from inheriting misleading JOIN diagrams.
const lessonFlows={
 'keys-relations':['PK справочника','FK заказа','Число совпадений','Зерно ответа'],
 'cross-join':['Таблица A','Таблица B','Все пары A × B','Дополнительный WHERE'],
 'self-join':['Источник a','Тот же источник b','Условие связи','Исключение зеркальных пар'],
 'logical-order':['FROM / JOIN','WHERE','GROUP BY','HAVING','SELECT','ORDER BY','LIMIT'],
 'set-union':['SELECT A','SELECT B','UNION / UNION ALL','Повторы','Результат'],
 'set-compare':['Набор A','Набор B','INTERSECT / EXCEPT','Общие / отсутствующие'],
 'safe-ratios':['Подходящие строки','Числитель','NULLIF(знаменатель,0)','Процент'],
 'string-agg':['Строки группы','ORDER BY внутри агрегата','STRING_AGG','Одна подпись'],
 'correlated-scalar':['Внешняя строка','Связанный SELECT','Одно значение','Следующая строка'],
 'window-ntile':['ORDER BY','PARTITION BY','NTILE / PERCENT_RANK','Новый столбец'],
 'stat-median':['Подходящие суммы','ORDER BY внутри PERCENTILE','Медиана / перцентиль','Один итог'],
 'rollup-totals':['GROUP BY фактов','ROLLUP / GROUPING SETS','Подытоги','Общий итог']
};
function flowChart(m,lessonId){const items=lessonFlows[lessonId]||flow[m]||flow.start;return `<div class="flow-steps">${items.map((item,i)=>`${i?'<i>→</i>':''}<span>${esc(item)}</span>`).join('')}</div>`;}
function taskEditor(state,task,exam=false,withHelp=false){
 const note=state.progress.drafts[task.id]??task.brokenSQL??'',result=state.result?.taskId===task.id?state.result:null;
 return `<section class="card lesson-task" id="task-editor">
  <div class="task-head"><div><p class="task-overline">САМОСТОЯТЕЛЬНЫЙ SQL · ${esc(task.id)}</p><h2>${esc(task.title)}</h2></div>${done(state,task.id)?pill('✓ Решено','teal'):pill('Задача')}</div>
  <p class="task-desc">${esc(task.prompt)}</p>
  <div class="editor-shell"><div class="editor-top"><span>query.sql · PostgreSQL</span><strong>${state.engineReady?'● Готов к запросам':'○ Инициализация'}</strong></div>
  <textarea class="sql-editor" id="sql-editor" spellcheck="false" autocomplete="off" autocapitalize="off" data-draft="${esc(task.id)}" aria-label="SQL-редактор">${esc(note)}</textarea>
  <div class="editor-shortcuts"><span>Ctrl / Cmd + Enter — проверить</span><span>SQL · read only</span></div></div>
  <div class="task-actions"><button class="btn primary" data-action="check" data-task-id="${esc(task.id)}" ${!state.engineReady?'disabled':''}>Проверить SQL</button><button class="btn" data-action="run" data-task-id="${esc(task.id)}" ${!state.engineReady?'disabled':''}>Выполнить</button>${exam?'':`${withHelp?'':`<button class="btn" data-action="hint" data-task-id="${esc(task.id)}">Подсказка</button>`}<button class="btn" data-action="solution" data-task-id="${esc(task.id)}">Разобрать решение</button>`}</div>
  ${withHelp?`<div class="lesson-hints"><strong>Если застрял — открой помощь по одному шагу</strong><details><summary>Подсказка 1 · с чего начать</summary><p>${esc(getLessonGuide(task.lessonId||state.route?.id)?.goal||'Определи, что означает одна строка будущего результата.')}</p></details><details><summary>Подсказка 2 · какую ошибку проверить</summary><p>${esc(getLessonGuide(task.lessonId||state.route?.id)?.pitfall||'Проверь смысл строк и условия выборки.')}</p></details><details><summary>Подсказка 3 · проверь себя перед отправкой</summary><p>${esc(getLessonGuide(task.lessonId||state.route?.id)?.check||'Проверь ожидаемые строки, имена и порядок результата.')}</p></details></div>`:''}
  <div id="task-feedback" role="status" aria-live="polite">${result?renderFeedback(result):''}</div><div id="task-result">${result?.query?renderQueryTable(result.query):''}</div>
 </section>`;
}
function renderDifference(details){
 if(!details)return '';
 let lines=[];
 if(details.kind==='columns'){
  if(details.missing.length)lines.push('Не хватает столбцов: '+details.missing.join(', '));
  if(details.extra.length)lines.push('Лишние столбцы: '+details.extra.join(', '));
 }
 if(details.kind==='rows')lines.push('Твой запрос: '+details.actual+' строк. Ожидаемый результат: '+details.expected+' строк. Проверь, что каждая итоговая строка означает нужную сущность.');
 if(details.kind==='ordered')lines.push('Первое расхождение — строка №'+details.row+'. Ожидалось: '+details.expected+'. Получилось: '+details.actual+'.');
 if(details.kind==='values'){
  if(details.missing)lines.push('Пример недостающей строки: '+details.missing);
  if(details.extra)lines.push('Пример лишней строки: '+details.extra);
 }
 return lines.length?'<div class="feedback-diff"><strong>Где именно расходится результат</strong>'+lines.map(s=>'<p>'+esc(s)+'</p>').join('')+'</div>':'';
}
export function renderFeedback(result){
 if(result.loading)return '<div class="feedback info">Выполняем запрос и проверяем результат на двух наборах данных…</div>';
 if(result.error)return `<div class="feedback error"><strong>PostgreSQL вернул ошибку</strong>${esc(result.error)}</div>`;
 if(result.passed)return '<div class="feedback success"><strong>Задача зачтена</strong>Запрос дал правильный результат на основном и дополнительном наборе данных. Эквивалентные варианты решения принимаются.</div>';
 if(result.message)return `<div class="feedback ${result.gradeFailed?'error':'info'}"><strong>${result.gradeFailed?'Решение пока не зачтено':'Запрос выполнен'}</strong>${esc(result.message)}${result.gradeFailed?renderDifference(result.details):''}</div>`;
 return '';
}
const formatted=value=>value===null?'<span class="null-token">NULL</span>':esc(value instanceof Date?value.toISOString():typeof value==='object'?JSON.stringify(value):String(value));
export function renderQueryTable(output){
 const fields=(output?.fields||[]).map(field=>field.name),rows=output?.rows||[];
 if(!fields.length)return '<div class="feedback info">Запрос выполнен, но табличных столбцов нет.</div>';
 return `<div class="result-box"><div class="result-title"><span>Результат SQL</span><small>${rows.length} строк · показано до 80</small></div><div class="table-scroll" tabindex="0" role="region" aria-label="Результат SQL, прокручиваемая таблица">
 <table class="data-table"><thead><tr>${fields.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>
 ${rows.length?rows.slice(0,80).map(row=>`<tr>${fields.map(f=>`<td>${formatted(row[f])}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${fields.length}">Нет строк</td></tr>`}</tbody></table></div></div>`;
}
function masteryPanel(state,l){const m=mastery(state.progress,l);return `<section class="card side-card"><h3>Твой прогресс по уроку</h3>
 <div class="skill-list"><div class="skill-row"><strong>Материал</strong><div class="progress-track"><span style="width:${m.read?100:0}%"></span></div><small>${m.read?'✓':'—'}</small></div>
 <div class="skill-row"><strong>Понимание</strong><div class="progress-track"><span style="width:${m.quiz?100:0}%"></span></div><small>${m.quiz?'✓':'—'}</small></div>
 <div class="skill-row"><strong>SQL</strong><div class="progress-track"><span style="width:${percentage(m.completed,m.total)}%"></span></div><small>${m.completed}/${m.total}</small></div></div>
 ${m.grandfathered?'<p class="small muted">Зачёт старой версии сохранён. Появились новые упражнения для дополнительного закрепления.</p>':'<p class="small muted">Отметка чтения сама по себе не подтверждает владение SQL.</p>'}
 <button class="btn small" data-action="read" data-lesson="${l.id}">${m.read?'✓ Материал прочитан':'Отметить прочитанным'}</button></section>`;}
function schemaPanel(state,scope=''){
 const available=scope==='support.'?SUPPORT_SCHEMA:scope==='inventory.'?INVENTORY_SCHEMA:SCHEMA;
 const names=Object.keys(available);
 const name=Object.hasOwn(available,state.schema)?state.schema:names[0];
 const selected=available[name]||[];
 const preview=state.previewTable?.name===name?state.previewTable.query:null;
 return `<section class="card side-card"><h3>${scope?'Самостоятельная схема · '+esc(scope.slice(0,-1)):'Учебная база / схема'}</h3>
 <div class="schema-menu">${names.map(key=>`<button data-schema="${esc(key)}" class="${key===name?'active':''}">${esc(key)}</button>`).join('')}</div>
 <table class="schema-table"><tbody>${selected.map(([column,type])=>`<tr><td>${esc(column)}</td><td>${esc(type)}</td></tr>`).join('')}</tbody></table>
 ${scope?`<button class="btn small" data-action="preview-schema" data-table-name="${esc(name)}" ${!state.engineReady?'disabled':''} style="margin-top:12px">Посмотреть первые 8 строк</button>${preview?renderQueryTable(preview):''}<p class="small muted">Таблицы находятся в отдельной схеме PostgreSQL <code>${esc(scope.slice(0,-1))}</code>. Исследуй состав данных перед решением.</p>`:`<p class="small muted" style="line-height:1.6;margin:13px 0 0">Видны настоящие таблицы PostgreSQL, доступные во всех упражнениях.</p>`}
 </section>`;}
function activeTask(state,l){return l.tasks.find(t=>t.id===state.activeTaskId)||l.tasks[0];}
export function renderLesson(state,id){
 const l=lessonById[id];if(!l)return renderNotFound();
 const m=moduleById[l.moduleId],t=activeTask(state,l);
 const index=lessons.findIndex(lesson=>lesson.id===l.id),previous=lessons[index-1],next=lessons[index+1];
 return `<a class="crumb-link" href="#/module/${m.id}">← Вернуться к модулю «${esc(m.title)}»</a>
 <div class="workspace"><div class="workspace-main">
 <div class="lesson-heading"><div><p class="section-eyebrow">УРОК ${String(l.lessonIndex+1).padStart(2,'0')} / ${m.lessons.length} · ${esc(m.title)}</p><h1>${esc(l.title)}</h1><p>${esc(l.lead)}</p></div>${pill('SQL · PostgreSQL')}</div>
 <div class="lesson-tools"><button class="tab active" data-scroll="lesson-theory">Объяснение</button><button class="tab" data-scroll="lesson-quiz">Понимание</button><button class="tab" data-scroll="task-editor">Практика</button></div>
 <section class="card lesson-section" id="lesson-theory">${objective(l,state)}<h2>Разберём по шагам</h2>
 ${l.theory.map(p=>`<p>${esc(p)}</p>`).join('')}
 <div class="subtle-line"></div><p class="section-eyebrow">ПРИМЕР ЗАПРОСА</p>
 ${renderWalkthrough(l)}
 ${predictionGuide(l,state)}
 <pre class="sql-code">${esc(l.example)}</pre>
 <div class="task-actions"><button class="btn" data-action="run-example" data-example-id="${esc(l.id)}" ${!state.engineReady?'disabled':''}>Выполнить и проверить предположение</button></div>
 <div id="lesson-example-result" aria-live="polite">${state.exampleResult?.lessonId===l.id?(state.exampleResult.error?`<div class="feedback error"><strong>Ошибка выполнения примера</strong>${esc(state.exampleResult.error)}</div>`:renderQueryTable(state.exampleResult.query)):''}</div>
 <p class="small muted">Логический путь от исходных данных к результату</p>${flowChart(m.id,l.id)}
 <p><strong>Почему это важно.</strong> ${esc(l.insight)}</p>${misconceptionGuide(l)}</section>
 <div id="lesson-quiz">${quiz(state,l)}</div>
 <div class="lesson-tools">${l.tasks.map((task,i)=>`<button class="tab ${task.id===t.id?'active':''}" data-task-tab="${task.id}">${done(state,task.id)?'✓ ':''}Задача ${i+1}</button>`).join('')}</div>
 ${taskEditor(state,t,false,true)}
 <div class="lesson-nav">${previous?button('← Предыдущий урок',`#/lesson/${previous.id}`):'<span></span>'}${next?button('Следующий урок →',`#/lesson/${next.id}`,true):button('Все задания','#/practice',true)}</div>
 </div><aside class="workspace-right">${masteryPanel(state,l)}${schemaPanel(state)}<section class="card side-card"><h3>Как решать самостоятельно</h3><p class="small muted" style="line-height:1.9">Сначала прочитай условие, затем напиши SQL без шаблона. Если запрос ошибочный, исправь его и проверь ещё раз. Подсказка доступна, но не заменяет решение.</p></section></aside>
 </div>`;
}
export function renderStandaloneTask(state,id){
 const t=taskById[id];if(!t)return renderNotFound();
 const l=lessonById[t.lessonId];
 return `<a class="crumb-link" href="#/practice">← К задачам</a>`+header('ПРАКТИКА / '+esc(moduleById[t.moduleId].title),t.title,'Самостоятельная задача без списка требуемых конструкций. Проверяем корректность ответа, а не форму SQL.')+
 `<div class="workspace"><div class="workspace-main">${taskEditor(state,t)}<div class="lesson-nav">${button('Открыть урок с объяснением',`#/lesson/${l.id}`)}</div></div><aside class="workspace-right">${schemaPanel(state)}</aside></div>`;
}
export function renderPractice(state){
 const filters=['all',...modules.map(m=>m.id)];
 const filtered=state.filter==='all'?tasks:tasks.filter(task=>task.moduleId===state.filter);
 const complete=tasks.filter(t=>done(state,t.id)).length;
 return header('ПРАКТИКА / ЗАДАНИЯ','Пиши SQL самостоятельно','Каждое упражнение проверяется на двух наборах данных. Здесь нет заранее перечисленных команд и таблиц.')+
 `<section class="card panel"><div class="between"><strong>${complete} из ${tasks.length} задач решено</strong>${pill(percentage(complete,tasks.length)+'%','teal')}</div>
 <div class="progress-track" style="margin-top:13px"><span style="width:${percentage(complete,tasks.length)}%"></span></div></section>
 <div class="filters" style="margin-top:20px">${filters.map(id=>`<button data-filter="${id}" class="${state.filter===id?'active':''}">${esc(id==='all'?'Все темы':moduleById[id].title)}</button>`).join('')}</div>
 <div class="task-index">${filtered.map(task=>`<a class="card exercise-card" href="#/task/${task.id}"><div class="between">${pill(moduleById[task.moduleId].title,'neutral')}${done(state,task.id)?pill('✓ Решено','teal'):pill('Новая')}</div><h3>${esc(task.title)}</h3><p>${esc(task.prompt)}</p><span class="small" style="color:var(--blue);font-weight:800">Открыть задачу →</span></a>`).join('')}</div>`;
}
export function renderExam(state,id){
 const exam=assessmentById[id];if(!exam)return renderNotFound();
 const task=exam.tasks.find(t=>t.id===state.activeTaskId)||exam.tasks[0];
 const solved=exam.tasks.filter(t=>done(state,t.id)).length;
 return `<a class="crumb-link" href="#/review">← Мои навыки</a>`+
 header('НАКОПИТЕЛЬНЫЙ ЭКЗАМЕН',exam.title,exam.description,pill(solved+'/'+exam.tasks.length+' сдано',solved===exam.tasks.length?'teal':''))+
 `<div class="workspace"><div class="workspace-main"><section class="card panel"><p class="section-eyebrow">НЕЗАВИСИМАЯ ПРОВЕРКА</p>
 <p class="muted">Задачи объединяют темы из разных уроков. Экзамен не подсказывает алгоритм и использует изменённые контрольные данные.</p>
 <div class="lesson-tools">${exam.tasks.map((t,i)=>`<button class="tab ${t.id===task.id?'active':''}" data-exam-tab="${t.id}">${done(state,t.id)?'✓ ':''}Задача ${i+1}</button>`).join('')}</div></section>
 ${taskEditor(state,task,true)}</div><aside class="workspace-right">${schemaPanel(state)}<section class="card side-card"><h3>Проверяемые навыки</h3><div class="future-list">${exam.skills.map(s=>`<span>${esc(s)}</span>`).join('')}</div></section></aside></div>`;
}
export function renderReview(state){
 const exams=assessments.map(a=>({a,p:a.tasks.filter(t=>done(state,t.id)).length}));
 return header('АНАЛИТИКА / ПРОГРЕСС','Твой профиль знаний','Здесь показаны результаты реальной SQL-практики и независимых контрольных, а не количество открытых страниц.')+
 `<section class="card panel" style="margin-bottom:17px"><div class="between"><div><h2 class="panel-title">Вернись к пройденному</h2><p class="small muted">${reviewSkills.filter(x=>reviewStatus(state.progress,x).due).length} навыков ждут повторения. Следующая проверка предлагается через 1, 3, 7 или 30 дней после успешного решения.</p></div>${button('Повторить SQL','#/recall',true)}</div></section>`+
 `<div class="review-grid"><section class="card panel"><h2 class="panel-title">Навыки по модулям</h2>
 <div class="skill-list">${modules.map(m=>{const p=skill(state,m);return `<div class="skill-row"><strong>${esc(m.title)}</strong><div class="progress-track"><span style="width:${p.percent}%"></span></div><small>${p.passed}/${p.total}</small></div>`}).join('')}</div></section>
 <section class="card panel"><h2 class="panel-title">Накопительные контрольные</h2>
 ${exams.map(({a,p})=>`<div class="mini-step"><span class="step-dot">${p===a.tasks.length?'✓':p+'/'+a.tasks.length}</span><div style="flex:1"><strong>${esc(a.title)}</strong><small>${esc(a.description)}</small></div>${button('Открыть',`#/exam/${a.id}`)}</div>`).join('')}
 <div class="feedback info"><strong>Что означает «освоил»?</strong>Чтение, вопрос на понимание и правильный SQL — разные показатели. Контрольная нужна, чтобы проверить использование нескольких навыков вместе.</div></section></div>`;
}

export function renderRecall(state){
 const now=Date.now();
 const entries=reviewSkills.map(skill=>({skill,status:reviewStatus(state.progress,skill,now)}));
 const due=entries.filter(item=>item.status.due);
 const active=due.find(item=>item.skill.id===state.activeTaskId)||due[0];
 const unlocked=entries.filter(item=>item.status.unlocked).length;
 const strong=entries.filter(item=>item.status.level>=4).length;
 const weak=entries.filter(item=>item.status.misses>0&&item.status.unlocked).length;
 const nextText=(status)=>status.nextDueAt<=now?'Пора повторить':
   'Через '+Math.max(1,Math.ceil((status.nextDueAt-now)/86400000))+' д.';
 return header('ПОВТОРЕНИЕ / ПАМЯТЬ О НАВЫКАХ','Повторять — значит уметь','Новые задачи по уже изученным темам. Успешное решение переносит следующее повторение на 1, 3, 7 и 30 дней. Не путай один зачёт с устойчивым навыком.')+
 `<div class="recall-overview">
   <div class="card stat"><label>К повторению сейчас</label><strong>${due.length}</strong><small>Доступные повторения</small></div>
   <div class="card stat"><label>Изученные навыки</label><strong>${unlocked}<span class="muted">/${entries.length}</span></strong><small>Открываются после практики уроков</small></div>
   <div class="card stat"><label>Пройдено 4 цикла</label><strong>${strong}</strong><small>Проверка раз в 30 дней продолжается</small></div>
   <div class="card stat"><label>Навыки с ошибками</label><strong>${weak}</strong><small>Ошибки учитываются для повторения</small></div>
 </div>
 ${state.recallFeedback?`<div class="feedback ${state.recallFeedback.ok?'success':'error'}" style="margin-bottom:18px"><strong>${state.recallFeedback.ok?'Повторение зачтено':'Нужно закрепить ещё раз'}</strong>${esc(state.recallFeedback.message)}</div>`:''}
 <div class="recall-list">
 ${entries.map(({skill,status})=>`<button class="recall-item card ${status.due?'due':''} ${active?.skill.id===skill.id?'active':''}" data-recall-skill="${esc(skill.id)}" ${!status.due?'disabled':''}>
 <span class="recall-mark">${status.unlocked?(status.level>=4?'✓':status.level+1):'–'}</span>
 <span class="recall-item-text"><strong>${esc(skill.title)}</strong><small>${esc(skill.category)} · ${status.unlocked?status.level+'/4 успешных цикла':'Откроется после практики урока'}</small></span>
 <span class="recall-date">${status.unlocked?esc(nextText(status)):'Закрыто'}</span></button>`).join('')}
 </div>
 ${active?`<div class="workspace" style="margin-top:20px"><div class="workspace-main">
  <section class="card panel"><p class="section-eyebrow">ПОВТОРЕНИЕ · ${esc(active.skill.category)}</p>
   <h2 class="panel-title">${esc(active.skill.title)}</h2>
   <p class="small muted">Новая формулировка без подсказки. Проверяется реальный SQL на двух наборах данных. После успешного результата следующая версия появится в назначенный интервал.</p>
   ${pill('Цикл '+(active.status.level+1)+' / 4','neutral')}
  </section>
  ${taskEditor(state,reviewTask(state.progress,active.skill),true)}
 </div><aside class="workspace-right">${schemaPanel(state)}<section class="card side-card"><h3>Почему не каждый день?</h3><p class="small muted" style="line-height:1.8">Повторение привязано к времени после успешного ответа. Ошибка возвращает навык к первому интервалу. На сайт нужно зайти самостоятельно: автоматических уведомлений и фоновой проверки здесь нет.</p></section></aside></div>`:
 `<section class="card panel" style="margin-top:18px"><h2 class="panel-title">На сегодня новых проверок нет</h2>
  <p class="small muted">Если навыки ещё не открыты — выполни задачи соответствующих уроков. Если уже повторял, новые задания появятся после истечения интервала. Упражнения основной практики доступны всегда.</p>
  ${button('Продолжить учебник','#/course',true)} ${button('Практиковаться','#/practice')}</section>`}
 `;
}

export function renderProjects(state){
 return header('ПРОЕКТЫ / РЕАЛЬНЫЕ КЕЙСЫ','Аналитическая мастерская','Самостоятельные исследования разных бизнес-доменов — отдельно от двух тренировочных историй, собранных из заданий курса.')+
 independentProjects.map(p=>`<div class="independent-project-highlight card">
   <div class="independent-project-copy"><p class="section-eyebrow">НОВЫЙ САМОСТОЯТЕЛЬНЫЙ ПРОЕКТ · ОТДЕЛЬНАЯ СХЕМА</p>
   <h2>${esc(p.title)}</h2>
   <p>${esc(p.problem)} ${p.tasks.length} независимых SQL-отчётов и аналитическая записка. Без готового алгоритма.</p>
   <div class="project-feature-meta">${pill(p.tasks.filter(t=>done(state,t.id)).length+'/'+p.tasks.length+' SQL-отчётов','teal')}${pill('PostgreSQL · схема '+p.schemaPrefix.slice(0,-1),'neutral')}${pill('2 набора данных','neutral')}</div>
   ${button('Открыть самостоятельный проект',`#/project/${p.id}`,true)}</div>
   <div class="independent-project-symbol" aria-hidden="true"><span>ANALYTICS</span><strong>${p.id==='support-ops'?'SUPPORT<br>OPS_':'STOCK<br>AUDIT_'}</strong><span>SQL PORTFOLIO</span></div>
 </div>`).join('')+`<p class="section-eyebrow" style="margin:25px 0 15px">УЧЕБНЫЕ КЕЙСЫ ИЗ ПРОЙДЕННЫХ МОДУЛЕЙ</p>`+
  `<div class="colgap">${projects.map((p,i)=>`
  <section class="card project-hero"><div><p class="section-eyebrow">АНАЛИТИЧЕСКИЙ КЕЙС ${String(i+1).padStart(2,'0')}</p><h2>${esc(p.title)}</h2>
  <p>${esc(p.lead)}</p>
  ${pill(p.taskIds.filter(id=>done(state,id)).length+'/'+p.taskIds.length+' этапов пройдено','teal')}
  ${button('Открыть кейс',`#/task/${p.taskIds[0]}`,true)}</div>
  <div class="project-art"><b>${esc(p.id.toUpperCase().replaceAll('-','_'))}</b><br>
  ${i===0?'orders: 18<br>stores: 6<br>customers: 10':'app_users: 13<br>user_events: 39<br>product funnels'}
  <br>SQL VERIFIED: ✓</div></section>
  <section class="card panel"><h2 class="panel-title">${esc(p.subtitle)} — этапы</h2><div class="lesson-list">
   ${p.taskIds.map((id,n)=>{const t=taskById[id];return `<a class="${done(state,id)?'done':''}" href="#/task/${id}"><span class="lesson-number">${String(n+1).padStart(2,'0')}</span><span>${esc(t?.title||id)}</span><small>${done(state,id)?'✓ Выполнено':'Открыть'}</small></a>`}).join('')}
  </div></section>`).join('')}</div>
 <section class="card panel" style="margin-top:17px"><p class="small muted" style="line-height:1.8">Эти два кейса объединяют задачи уже изученных модулей. Полноценные самостоятельные проекты на двух разных предметных областях находятся выше. Проверка аналитических выводов экспертом и портфолио-подтверждение пока не реализованы.</p></section>`;
}

export function renderIndependentProject(state,id){
 const project=independentProjectById[id];if(!project)return renderNotFound();
 const task=project.tasks.find(t=>t.id===state.activeTaskId)||project.tasks[0];
 const passed=project.tasks.filter(t=>done(state,t.id)).length;
 const note=state.progress.projectNotes?.[id]||'';
 return `<a class="crumb-link" href="#/projects">← Вернуться к проектам</a>`+
  header('АНАЛИТИЧЕСКАЯ МАСТЕРСКАЯ / НЕЗНАКОМАЯ БАЗА',project.title,project.subtitle,pill(passed+'/'+project.tasks.length+' отчётов','teal'))+
  `<div class="workspace"><div class="workspace-main">
   <section class="card panel" id="project-brief"><p class="section-eyebrow">ЗАКАЗЧИК И БИЗНЕС-ПРОБЛЕМА</p><h2 class="panel-title">Что нужно исследовать</h2>
   <p class="project-paragraph">${esc(project.problem)}</p><p class="project-paragraph">${esc(project.context)}</p>
   <div class="subtle-line"></div><h3>Условия и определения метрик</h3>
   <ul class="project-rules">${project.businessRules.map(rule=>`<li>${esc(rule)}</li>`).join('')}</ul>
   <div class="feedback info"><strong>Как проходить</strong>Изучи структуру и реальные строки таблиц в правой колонке. Выбирай порядок исследования самостоятельно. В проекте нет подсказок и готового решения до зачёта; SQL проверяется на другом наборе данных.</div>
   </section>
   <section class="card panel project-deliverables">
    <p class="section-eyebrow">РЕЗУЛЬТАТЫ ИССЛЕДОВАНИЯ</p><h2 class="panel-title">${project.tasks.length} связанных SQL-отчётов</h2>
    <div class="project-task-tabs">${project.tasks.map((t,i)=>`<button data-project-task="${t.id}" class="tab ${t.id===task.id?'active':''}">${done(state,t.id)?'✓ ':''}Этап ${i+1}</button>`).join('')}</div>
    <div class="learning-objective"><b>Контракт результата:</b> ${esc(task.deliverable)}</div>
    <p class="small muted">Форма ответа нужна для воспроизводимого отчёта; способ решения ты выбираешь сам.</p>
   </section>
   ${taskEditor(state,task,true)}
   <section class="card panel project-notes" id="project-review">
    <p class="section-eyebrow">АНАЛИТИЧЕСКАЯ ЗАПИСКА</p><h2 class="panel-title">Что показали данные?</h2>
    <p class="project-paragraph">${esc(project.reviewPrompt)}</p>
    <label for="project-notes">Твои выводы и аргументы</label>
    <textarea id="project-notes" data-project-id="${esc(id)}" maxlength="4000" rows="6" placeholder="Опиши ключевые показатели, риски, проверки расчётов и ограничения выводов.">${esc(note)}</textarea>
    <p class="small muted">Заметка сохраняется локально и включается в резервную копию. Она не оценивается автоматически; без профессиональной проверки нельзя считать защиту проекта пройденной.</p>
    <div class="project-summary">${pill(passed===project.tasks.length?'Все SQL-отчёты проверены':passed+' из '+project.tasks.length+' SQL-отчётов',passed===project.tasks.length?'teal':'neutral')}
      ${pill(note.trim().length>0?'Выводы записаны (без оценки)':'Выводы пока не записаны','neutral')}</div>
   </section>
  </div><aside class="workspace-right">${schemaPanel(state,project.schemaPrefix)}
  <section class="card side-card"><h3>Что означает освоение</h3><p class="small muted" style="line-height:1.8">Зачёт SQL означает совпадение результатов на двух наборах данных. Качество бизнес-выводов без проверки эксперта автоматически не подтверждается.</p></section>
  </aside></div>`;
}

export function renderPlayground(state){
 const output=state.result?.taskId==='playground'?state.result:null;
 return header('ИНСТРУМЕНТЫ / SQL-РЕДАКТОР','Свободная SQL-песочница','Выполняй безопасные запросы SELECT и WITH … SELECT на учебной базе PostgreSQL. Изменение таблиц запрещено.')+
 `<div class="workspace"><div class="workspace-main"><section class="card lesson-task">
 <div class="editor-shell"><div class="editor-top"><span>playground.sql</span><strong>${state.engineReady?'● PostgreSQL работает':'○ Подключаем'}</strong></div>
 <textarea class="sql-editor" id="sql-editor" spellcheck="false" data-draft="playground" aria-label="SQL-песочница">${esc(state.playground)}</textarea>
 <div class="editor-shortcuts"><span>Ctrl / Cmd + Enter — выполнить</span><span>Только чтение</span></div></div>
 <div class="task-actions"><button class="btn primary" data-action="run" data-task-id="playground" ${!state.engineReady?'disabled':''}>Выполнить запрос</button><button class="btn" data-action="sample">Пример: заказы по статусам</button><button class="btn" data-action="reset-playground">Очистить</button></div>
 <div id="task-feedback" role="status" aria-live="polite">${output?renderFeedback(output):''}</div><div id="task-result">${output?.query?renderQueryTable(output.query):''}</div>
 </section></div><aside class="workspace-right">${schemaPanel(state)}</aside></div>`;
}

export function renderXray(state){
 const selected=xrayById[state.xrayScenario]||xrayScenarios[0];
 const index=Math.max(0,Math.min(state.xrayStep,selected.steps.length-1));
 const stage=selected.steps[index],shown=state.xrayResult?.scenario===selected.id&&state.xrayResult?.index===index;
 return header('SQL X-RAY / ВИЗУАЛИЗАЦИЯ','Смотри, что SQL делает со строками','Не картинки с кругами: каждый этап выполняется в настоящем PostgreSQL. Сравни зерно, число строк и бизнес-смысл.')+
 `<div class="xray-scene-list">${xrayScenarios.map(item=>`<button class="card xray-scene ${item.id===selected.id?'active':''}" data-xray-scenario="${item.id}"><strong>${esc(item.title)}</strong><span>${esc(item.subtitle)}</span></button>`).join('')}</div>
 <div class="workspace" style="margin-top:20px"><div class="workspace-main">
 <section class="card panel"><p class="section-eyebrow">СЦЕНАРИЙ · ${esc(selected.title)}</p>
 <div class="xray-step-nav">${selected.steps.map((item,i)=>`<button class="xray-step ${i===index?'active':''}" data-xray-step="${selected.id}:${i}"><span>${i+1}</span>${esc(item.title)}</button>`).join('')}</div>
 <h2 class="panel-title" style="margin-top:20px">${esc(stage.title)}</h2><div class="xray-grain"><b>Зерно результата:</b> ${esc(stage.grain)}</div>
 <pre class="sql-code">${esc(stage.sql)}</pre>
 <div class="task-actions"><button class="btn primary" data-action="xray-run" ${!state.engineReady?'disabled':''}>Выполнить этот этап</button>
 ${index<selected.steps.length-1?`<button class="btn" data-xray-step="${selected.id}:${index+1}">Следующий шаг →</button>`:''}
 ${button('Перейти к уроку',`#/lesson/${selected.lesson}`)}</div>
 <div id="xray-result" role="status" aria-live="polite">${shown?(state.xrayResult.error?`<div class="feedback error">${esc(state.xrayResult.error)}</div>`:renderQueryTable(state.xrayResult.query)):''}</div>
 <div class="xray-explain"><strong>Почему результат именно такой</strong><p>${esc(stage.why)}</p></div>
 </section></div><aside class="workspace-right">${schemaPanel(state)}
 <section class="card side-card"><h3>Исследовательский метод</h3><p class="small muted" style="line-height:1.85">До запуска предскажи число строк. После запуска сравни фактический результат с ожиданием. Объясни, что теперь означает одна строка.</p></section></aside></div>`;
}
export function renderClinic(state){
 return header('ОТЛАДКА / КЛИНИКА ОШИБОК','Почини сломанный отчёт','Здесь SQL уже написан, но даёт неверный результат. Твоя задача — найти причину и исправить запрос без подсказанного алгоритма.')+
 `<div class="task-index">${clinicTasks.map((task,i)=>`<a class="card exercise-card" href="#/fix/${task.id}"><div class="between">${pill('Кейс '+String(i+1).padStart(2,'0'),'neutral')}${done(state,task.id)?pill('✓ Исправлено','teal'):pill('Ошибка в логике')}</div><h3>${esc(task.title)}</h3><p>${esc(task.prompt)}</p><span class="small" style="color:var(--blue);font-weight:800">Исследовать SQL →</span></a>`).join('')}</div>`;
}
export function renderFix(state,id){
 const task=clinicTaskById[id];if(!task)return renderNotFound();
 return `<a href="#/clinic" class="crumb-link">← К клинике ошибок</a>`+
 header('КЛИНИКА ОШИБОК / НЕЗНАКОМЫЙ КЕЙС',task.title,'В редактор уже вставлен ошибочный SQL. Он выполняется, но возвращает неверные данные. Исправь смысл, а не только синтаксис.')+
 `<div class="workspace"><div class="workspace-main"><section class="card panel"><div class="learning-objective"><b>Задача аналитика:</b> ${esc(task.prompt)}</div><p class="small muted">Проверь зерно, условия и количество строк. Запрос проверяется на исходной и изменённой базе. Эталон откроется только после зачёта.</p></section>
 ${taskEditor(state,task,true)}
 ${done(state,task.id)?`<section class="card lesson-section"><h2>Разбор ошибки</h2><p>${esc(task.diagnosis)}</p><pre class="sql-code">${esc(task.sql)}</pre></section>`:''}
 </div><aside class="workspace-right">${schemaPanel(state)}</aside></div>`;
}

export function renderNotFound(){return header('ОШИБКА МАРШРУТА','Раздел не найден','Вернись к учебной программе.',button('На главную','#/home',true));}
function renderRoute(state,route){
 if(route.page==='home')return {title:'Главная',html:renderHome(state)};
 if(route.page==='course')return {title:'Учебный маршрут',html:renderCourse(state)};
 if(route.page==='module')return {title:'Модуль',html:renderModule(state,route.id)};
 if(route.page==='lesson')return {title:lessonById[route.id]?.title||'Урок',html:renderLesson(state,route.id)};
 if(route.page==='practice')return {title:'Практика',html:renderPractice(state)};
 if(route.page==='task')return {title:taskById[route.id]?.title||'Задача',html:renderStandaloneTask(state,route.id)};
 if(route.page==='exam')return {title:'Контрольная',html:renderExam(state,route.id)};
 if(route.page==='review')return {title:'Мои навыки',html:renderReview(state)};
 if(route.page==='recall')return {title:'Повторение',html:renderRecall(state)};
 if(route.page==='projects')return {title:'Проекты',html:renderProjects(state)};
 if(route.page==='project')return {title:independentProjectById[route.id]?.title||'Проект',html:renderIndependentProject(state,route.id)};
 if(route.page==='playground')return {title:'SQL-песочница',html:renderPlayground(state)};
 if(route.page==='xray')return {title:'SQL X-Ray',html:renderXray(state)};
 if(route.page==='clinic')return {title:'Клиника ошибок',html:renderClinic(state)};
 if(route.page==='fix')return {title:'Исправление SQL',html:renderFix(state,route.id)};
 return {title:'Не найдено',html:renderNotFound()};
}
export function renderPage(state,route){
 const page=renderRoute(state,route);
 if(state.engineError)page.html=`<section class="feedback error" role="alert"><strong>PostgreSQL не запустился.</strong><p>Учебные материалы доступны. ${esc(state.engineError)}</p><button class="btn" data-action="retry-engine">Повторить запуск PostgreSQL</button></section>`+page.html;
 return page;
}
