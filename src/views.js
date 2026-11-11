import {modules,lessons,tasks,lessonById,taskById,moduleById,upcomingModules,project} from './content.js';
import {assessments,assessmentById} from './assessments.js';
import {SCHEMA} from './data.js';
import {mastery} from './progress.js';

export const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const done=(state,id)=>state.progress.completed.includes(id);
const percentage=(n,d)=>d?Math.round(n/d*100):0;
const skill=(state,module)=> {
 const all=module.lessons.flatMap(l=>l.tasks),passed=all.filter(t=>done(state,t.id)).length;
 return {passed,total:all.length,percent:percentage(passed,all.length)};
};
const lessonDone=(state,l)=>l.tasks.length>0&&l.tasks.every(t=>done(state,t.id))&&state.progress.quiz[l.id]===l.quiz.correct;
const button=(label,href,primary=false)=>`<a class="btn ${primary?'primary':''}" href="${href}">${esc(label)}</a>`;
const pill=(label,style='')=>`<span class="pill ${style}">${esc(label)}</span>`;
const header=(eyebrow,title,description,action='')=>`<div class="page-header"><div><p class="section-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${action}</div>`;

export function renderHome(state){
 const completed=state.progress.completed.length;
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
 return header('КУРСЫ / ОСНОВНОЙ МАРШРУТ','SQL для аналитики','От первого SELECT до оконных функций. Только реализованные, работающие занятия — недостроенные темы честно отмечены отдельно.')+
 `<div class="module-grid">${modules.map((m,i)=>{const p=skill(state,m);return `<section class="card module-card">
    <div class="module-top"><span class="module-icon">${esc(m.icon)}</span>${pill(i===0?'Старт':'Модуль '+(i+1),i===0?'teal':'neutral')}</div>
    <h2>${esc(m.title)}</h2><p>${esc(m.subtitle)}</p>
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
function objective(l){return `<div class="learning-objective"><b>После урока:</b> объясни идею «${esc(l.title)}» и самостоятельно реши задачи, не повторяя текст примера.</div>`;}
function quiz(state,l){
 const selection=state.progress.quiz[l.id],hasAnswer=Number.isInteger(selection);
 return `<section class="card lesson-section"><p class="section-eyebrow">ПРОВЕРКА ПОНИМАНИЯ</p><h2>${esc(l.quiz.question)}</h2>
 <div class="question-options">${l.quiz.choices.map((text,i)=>`<button class="option ${hasAnswer&&selection===i?(i===l.quiz.correct?'correct':'wrong'):''}" data-quiz="${i}" data-lesson="${l.id}"><span>${String.fromCharCode(65+i)}</span>${esc(text)}</button>`).join('')}</div>
 ${hasAnswer?`<div class="feedback ${selection===l.quiz.correct?'success':'error'}"><strong>${selection===l.quiz.correct?'Верно.':'Есть ошибка — попробуй ещё раз.'}</strong>${esc(l.quiz.why)}</div>`:''}</section>`;
}
const flow={start:['SELECT','Вычисление выражений','Таблица результата'],filter:['FROM','WHERE','SELECT','ORDER BY'],aggregate:['FROM','WHERE','GROUP BY','Агрегаты','HAVING','SELECT'],joins:['FROM','JOIN ... ON','WHERE','SELECT'],cte:['WITH: этапы','Внешний SELECT','Результат'],windows:['Исходные строки','PARTITION BY','ORDER BY','OVER: значение']};
function flowChart(m){const items=flow[m]||flow.start;return `<div class="flow-steps">${items.map((item,i)=>`${i?'<i>→</i>':''}<span>${esc(item)}</span>`).join('')}</div>`;}
function taskEditor(state,task,exam=false){
 const note=state.progress.drafts[task.id]??'',result=state.result?.taskId===task.id?state.result:null;
 return `<section class="card lesson-task" id="task-editor">
  <div class="task-head"><div><p class="task-overline">САМОСТОЯТЕЛЬНЫЙ SQL · ${esc(task.id)}</p><h2>${esc(task.title)}</h2></div>${done(state,task.id)?pill('✓ Решено','teal'):pill('Задача')}</div>
  <p class="task-desc">${esc(task.prompt)}</p>
  <div class="editor-shell"><div class="editor-top"><span>query.sql · PostgreSQL</span><strong>${state.engineReady?'● Готов к запросам':'○ Инициализация'}</strong></div>
  <textarea class="sql-editor" id="sql-editor" spellcheck="false" autocomplete="off" autocapitalize="off" data-draft="${esc(task.id)}" aria-label="SQL-редактор">${esc(note)}</textarea>
  <div class="editor-shortcuts"><span>Ctrl / Cmd + Enter — проверить</span><span>SQL · read only</span></div></div>
  <div class="task-actions"><button class="btn primary" data-action="check" data-task-id="${esc(task.id)}" ${!state.engineReady?'disabled':''}>Проверить SQL</button><button class="btn" data-action="run" data-task-id="${esc(task.id)}" ${!state.engineReady?'disabled':''}>Выполнить</button>${exam?'':`<button class="btn" data-action="hint" data-task-id="${esc(task.id)}">Подсказка</button><button class="btn" data-action="solution" data-task-id="${esc(task.id)}">Разобрать решение</button>`}</div>
  <div id="task-feedback">${result?renderFeedback(result):''}</div><div id="task-result">${result?.query?renderQueryTable(result.query):''}</div>
 </section>`;
}
export function renderFeedback(result){
 if(result.loading)return '<div class="feedback info">Выполняем запрос и проверяем результат на двух наборах данных…</div>';
 if(result.error)return `<div class="feedback error"><strong>PostgreSQL вернул ошибку</strong>${esc(result.error)}</div>`;
 if(result.passed)return '<div class="feedback success"><strong>Задача зачтена</strong>Запрос дал правильный результат на основном и дополнительном наборе данных. Эквивалентные варианты решения принимаются.</div>';
 if(result.message)return `<div class="feedback ${result.gradeFailed?'error':'info'}"><strong>${result.gradeFailed?'Решение пока не зачтено':'Запрос выполнен'}</strong>${esc(result.message)}</div>`;
 return '';
}
const formatted=value=>value===null?'<span class="null-token">NULL</span>':esc(value instanceof Date?value.toISOString():typeof value==='object'?JSON.stringify(value):String(value));
export function renderQueryTable(output){
 const fields=(output?.fields||[]).map(field=>field.name),rows=output?.rows||[];
 if(!fields.length)return '<div class="feedback info">Запрос выполнен, но табличных столбцов нет.</div>';
 return `<div class="result-box"><div class="result-title"><span>Результат SQL</span><small>${rows.length} строк · показано до 80</small></div><div class="table-scroll">
 <table class="data-table"><thead><tr>${fields.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>
 ${rows.length?rows.slice(0,80).map(row=>`<tr>${fields.map(f=>`<td>${formatted(row[f])}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${fields.length}">Нет строк</td></tr>`}</tbody></table></div></div>`;
}
function masteryPanel(state,l){const m=mastery(state.progress,l);return `<section class="card side-card"><h3>Твой прогресс по уроку</h3>
 <div class="skill-list"><div class="skill-row"><strong>Материал</strong><div class="progress-track"><span style="width:${m.read?100:0}%"></span></div><small>${m.read?'✓':'—'}</small></div>
 <div class="skill-row"><strong>Понимание</strong><div class="progress-track"><span style="width:${m.quiz?100:0}%"></span></div><small>${m.quiz?'✓':'—'}</small></div>
 <div class="skill-row"><strong>SQL</strong><div class="progress-track"><span style="width:${percentage(m.completed,m.total)}%"></span></div><small>${m.completed}/${m.total}</small></div></div>
 <p class="small muted">Отметка чтения сама по себе не подтверждает владение SQL.</p>
 <button class="btn small" data-action="read" data-lesson="${l.id}">${m.read?'✓ Материал прочитан':'Отметить прочитанным'}</button></section>`;}
function schemaPanel(state){
 const selected=SCHEMA[state.schema]||SCHEMA.orders;
 return `<section class="card side-card"><h3>Учебная база / схема</h3>
 <div class="schema-menu">${Object.keys(SCHEMA).map(name=>`<button data-schema="${name}" class="${name===state.schema?'active':''}">${esc(name)}</button>`).join('')}</div>
 <table class="schema-table"><tbody>${selected.map(([name,type])=>`<tr><td>${esc(name)}</td><td>${esc(type)}</td></tr>`).join('')}</tbody></table>
 <p class="small muted" style="line-height:1.6;margin:13px 0 0">Видны настоящие таблицы PostgreSQL, доступные во всех упражнениях.</p></section>`;}
function activeTask(state,l){return l.tasks.find(t=>t.id===state.activeTaskId)||l.tasks[0];}
export function renderLesson(state,id){
 const l=lessonById[id];if(!l)return renderNotFound();
 const m=moduleById[l.moduleId],t=activeTask(state,l);
 const index=lessons.findIndex(lesson=>lesson.id===l.id),previous=lessons[index-1],next=lessons[index+1];
 return `<a class="crumb-link" href="#/module/${m.id}">← Вернуться к модулю «${esc(m.title)}»</a>
 <div class="workspace"><div class="workspace-main">
 <div class="lesson-heading"><div><p class="section-eyebrow">УРОК ${String(l.lessonIndex+1).padStart(2,'0')} / ${m.lessons.length} · ${esc(m.title)}</p><h1>${esc(l.title)}</h1><p>${esc(l.lead)}</p></div>${pill('SQL · PostgreSQL')}</div>
 <div class="lesson-tools"><button class="tab active" data-scroll="lesson-theory">Объяснение</button><button class="tab" data-scroll="lesson-quiz">Понимание</button><button class="tab" data-scroll="task-editor">Практика</button></div>
 <section class="card lesson-section" id="lesson-theory">${objective(l)}<h2>Разберём по шагам</h2>
 ${l.theory.map(p=>`<p>${esc(p)}</p>`).join('')}
 <div class="subtle-line"></div><p class="section-eyebrow">ПРИМЕР ЗАПРОСА</p><pre class="sql-code">${esc(l.example)}</pre>
 <p class="small muted">Логический путь от исходных данных к результату</p>${flowChart(m.id)}
 <p><strong>Почему это важно.</strong> ${esc(l.insight)}</p></section>
 <div id="lesson-quiz">${quiz(state,l)}</div>
 <div class="lesson-tools">${l.tasks.map((task,i)=>`<button class="tab ${task.id===t.id?'active':''}" data-task-tab="${task.id}">${done(state,task.id)?'✓ ':''}Задача ${i+1}</button>`).join('')}</div>
 ${taskEditor(state,t)}
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
 const complete=state.progress.completed.length;
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
 `<div class="review-grid"><section class="card panel"><h2 class="panel-title">Навыки по модулям</h2>
 <div class="skill-list">${modules.map(m=>{const p=skill(state,m);return `<div class="skill-row"><strong>${esc(m.title)}</strong><div class="progress-track"><span style="width:${p.percent}%"></span></div><small>${p.passed}/${p.total}</small></div>`}).join('')}</div></section>
 <section class="card panel"><h2 class="panel-title">Накопительные контрольные</h2>
 ${exams.map(({a,p})=>`<div class="mini-step"><span class="step-dot">${p===a.tasks.length?'✓':p+'/'+a.tasks.length}</span><div style="flex:1"><strong>${esc(a.title)}</strong><small>${esc(a.description)}</small></div>${button('Открыть',`#/exam/${a.id}`)}</div>`).join('')}
 <div class="feedback info"><strong>Что означает «освоил»?</strong>Чтение, вопрос на понимание и правильный SQL — разные показатели. Контрольная нужна, чтобы проверить использование нескольких навыков вместе.</div></section></div>`;
}
export function renderProjects(state){
 const p=project;
 return header('ПРОЕКТЫ / РЕАЛЬНЫЕ КЕЙСЫ','Аналитическая мастерская','Не разрозненные команды, а бизнес-задачи, для которых нужно выбрать подходящую стратегию.')+
 `<section class="card project-hero"><div><p class="section-eyebrow">ПЕРВЫЙ РЕАЛИЗОВАННЫЙ КЕЙС</p><h2>${esc(p.title)}</h2>
 <p>${esc(p.lead)}</p>
 ${pill('4 связанных этапа','teal')} ${button('Начать исследование',`#/task/${p.taskIds[0]}`,true)}</div><div class="project-art"><b>DELIVERY_PULSE</b><br>orders: 18<br>stores: 6<br>customers: 10<br>CHECK_METRICS: ✓</div></section>
 <section class="card panel" style="margin-top:16px"><h2 class="panel-title">Этапы исследования</h2>
 <div class="lesson-list">${p.taskIds.map((id,i)=>{const t=taskById[id];return `<a class="${done(state,id)?'done':''}" href="#/task/${id}"><span class="lesson-number">${String(i+1).padStart(2,'0')}</span><span>${esc(t?.title||id)}</span><small>${done(state,id)?'✓ Выполнено':'Открыть'}</small></a>`}).join('')}</div>
 <p class="small muted" style="line-height:1.75">Проект пока использует проверяемые задачи курса как этапы исследования. Расширенный самостоятельный проект с новой базой и письменной защитой запланирован на следующий релиз.</p></section>`;
}
export function renderPlayground(state){
 const output=state.result?.taskId==='playground'?state.result:null;
 return header('ИНСТРУМЕНТЫ / SQL-РЕДАКТОР','Свободная SQL-песочница','Выполняй безопасные запросы SELECT и WITH … SELECT на учебной базе PostgreSQL. Изменение таблиц запрещено.')+
 `<div class="workspace"><div class="workspace-main"><section class="card lesson-task">
 <div class="editor-shell"><div class="editor-top"><span>playground.sql</span><strong>${state.engineReady?'● PostgreSQL работает':'○ Подключаем'}</strong></div>
 <textarea class="sql-editor" id="sql-editor" spellcheck="false" data-draft="playground" aria-label="SQL-песочница">${esc(state.playground)}</textarea>
 <div class="editor-shortcuts"><span>Ctrl / Cmd + Enter — выполнить</span><span>Только чтение</span></div></div>
 <div class="task-actions"><button class="btn primary" data-action="run" data-task-id="playground" ${!state.engineReady?'disabled':''}>Выполнить запрос</button><button class="btn" data-action="sample">Пример: заказы по статусам</button><button class="btn" data-action="reset-playground">Очистить</button></div>
 <div id="task-feedback">${output?renderFeedback(output):''}</div><div id="task-result">${output?.query?renderQueryTable(output.query):''}</div>
 </section></div><aside class="workspace-right">${schemaPanel(state)}</aside></div>`;
}
export function renderNotFound(){return header('ОШИБКА МАРШРУТА','Раздел не найден','Вернись к учебной программе.',button('На главную','#/home',true));}
export function renderPage(state,route){
 if(route.page==='home')return {title:'Главная',html:renderHome(state)};
 if(route.page==='course')return {title:'Учебный маршрут',html:renderCourse(state)};
 if(route.page==='module')return {title:'Модуль',html:renderModule(state,route.id)};
 if(route.page==='lesson')return {title:lessonById[route.id]?.title||'Урок',html:renderLesson(state,route.id)};
 if(route.page==='practice')return {title:'Практика',html:renderPractice(state)};
 if(route.page==='task')return {title:taskById[route.id]?.title||'Задача',html:renderStandaloneTask(state,route.id)};
 if(route.page==='exam')return {title:'Контрольная',html:renderExam(state,route.id)};
 if(route.page==='review')return {title:'Мои навыки',html:renderReview(state)};
 if(route.page==='projects')return {title:'Проекты',html:renderProjects(state)};
 if(route.page==='playground')return {title:'SQL-песочница',html:renderPlayground(state)};
 return {title:'Не найдено',html:renderNotFound()};
}
