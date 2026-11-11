import {modules,lessons,tasks,lessonById,taskById,moduleById} from './content.js';
import {assessments,assessmentTaskById,assessmentById} from './assessments.js';
import {SEED_SQL,ALTERNATE_SQL} from './data.js';
import {clinicTaskById} from './clinic.js';
import {xrayById,xrayScenarios} from './xray.js';
import {loadProgress,storeProgress,exportProgress,importProgress} from './progress.js';
import {queryReadOnly,gradeSQL} from './sql.js';
import {renderPage,renderFeedback,renderQueryTable} from './views.js';

const $=(selector,root=document)=>root.querySelector(selector);
const PGLITE_URL='https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.15/dist/index.js';
const state={
  progress:loadProgress(),engineReady:false,engineError:'',db:null,secondaryDB:null,secondaryPromise:null,
  schema:'orders',filter:'all',activeTaskId:null,result:null,route:null,xrayScenario:'join-fanout',xrayStep:0,xrayResult:null,
  playground:(()=>{try{return localStorage.getItem('sql4learn-playground-v1')||"SELECT status,COUNT(*) AS orders_count\nFROM orders\nGROUP BY status;";}catch{return "SELECT * FROM orders;"}})(),
  attempts:{},loading:false
};
function toast(text){
  const box=$('#toast');if(!box)return;
  box.textContent=text;box.classList.add('visible');clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>box.classList.remove('visible'),3300);
}
function progressSave(){state.progress=storeProgress(state.progress);updateSideProgress();}
function updateSideProgress(){
 const done=tasks.filter(task=>state.progress.completed.includes(task.id)).length;
 const pct=Math.round(100*done/tasks.length);
 const line=$('#side-progress-line'),value=$('#side-progress-percent'),caption=$('#side-progress-caption');
 if(line)line.style.width=pct+'%';
 if(value)value.textContent=pct+'%';
 if(caption)caption.textContent=done+' из '+tasks.length+' проверяемых SQL-задач';
}
function currentRoute(){
 const hash=window.location.hash;
 const parts=/^#\/([a-z-]+)(?:\/([a-z0-9-]+))?$/.exec(hash);
 if(!parts)return {page:'home'};
 try{return {page:parts[1],id:parts[2]?decodeURIComponent(parts[2]):null};}
 catch{return {page:'home'};}
}
function activeTask(route){
 if(route.page==='lesson'){
  const lesson=lessonById[route.id];
  if(lesson&&!lesson.tasks.some(task=>task.id===state.activeTaskId))state.activeTaskId=lesson.tasks[0]?.id||null;
 }else if(route.page==='task'||route.page==='fix')state.activeTaskId=route.id;
 else if(route.page==='exam'){
  const exam=assessmentById[route.id];
  if(exam&&!exam.tasks.some(task=>task.id===state.activeTaskId))state.activeTaskId=exam.tasks[0]?.id||null;
 }
}
function updateNav(route,title){
 $('#current-page').textContent=title;
 const page=route.page==='lesson'||route.page==='module'?'course':route.page==='task'?'practice':route.page==='exam'?'review':route.page==='fix'?'clinic':route.page;
 document.querySelectorAll('.primary-nav a').forEach(link=>{
  const active=link.dataset.page===page;link.classList.toggle('active',active);
  if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
}
function render({keepScroll=false}={}){
 const previous=window.scrollY;
 const route=currentRoute();state.route=route;activeTask(route);
 const page=renderPage(state,route);$('#app').innerHTML=page.html;
 updateNav(route,page.title);updateSideProgress();
 document.documentElement.dataset.theme=state.progress.theme;
 if(!keepScroll)window.scrollTo({top:0,behavior:'instant'});
 else window.scrollTo({top:previous,behavior:'instant'});
}
function engineStatus(ready=false,message='',failed=false){
 const pill=$('#engine-status');pill.classList.toggle('ready',ready);pill.classList.toggle('failed',failed);
 pill.querySelector('span').textContent=message|| (ready?'PostgreSQL готов':'Запуск PostgreSQL');
}
async function initDatabase(){
 if(state.loading)return;
 state.loading=true;state.engineReady=false;state.engineError='';
 engineStatus(false,'Подключаем PostgreSQL');render({keepScroll:true});
 try{
  const {PGlite}=await import(PGLITE_URL);
  const database=await PGlite.create();
  await database.exec(SEED_SQL);
  state.db=database;state.engineReady=true;engineStatus(true,'PostgreSQL готов');
  state.secondaryPromise=(async()=>{const extra=await PGlite.create();await extra.exec(SEED_SQL);await extra.exec(ALTERNATE_SQL);state.secondaryDB=extra;return extra;})();
  state.secondaryPromise.catch(error=>{console.error('Контрольная база не запустилась',error);});
  render({keepScroll:true});
 }catch(error){
  console.error('Не удалось запустить PostgreSQL',error);
  state.engineError=String(error.message||error);engineStatus(false,'Ошибка PostgreSQL',true);
  toast('Не удалось загрузить SQL-движок. Проверь соединение и обнови страницу.');
  render({keepScroll:true});
 }finally{state.loading=false;}
}
function getTask(id){return taskById[id]||assessmentTaskById[id]||clinicTaskById[id]||null;}
function getEditorText(){return $('#sql-editor')?.value||'';}
function currentTaskID(){return state.route?.page==='playground'?'playground':state.activeTaskId;}
function updateResults(){
 const feedback=$('#task-feedback'),output=$('#task-result');
 if(feedback)feedback.innerHTML=renderFeedback(state.result||{});
 if(output)output.innerHTML=state.result?.query?renderQueryTable(state.result.query):'';
}
async function runXray(){
 if(!state.engineReady||!state.db){toast('PostgreSQL ещё запускается.');return;}
 const scenario=xrayById[state.xrayScenario],step=scenario?.steps[state.xrayStep];
 if(!step)return;
 const id=scenario.id,index=state.xrayStep;
 try{
  const query=await queryReadOnly(state.db,step.sql);
  if(state.xrayScenario!==id||state.xrayStep!==index)return;
  state.xrayResult={scenario:id,index,query};
 }catch(error){state.xrayResult={scenario:id,index,error:String(error.message||error)};}
 render({keepScroll:true});
 document.getElementById('xray-result')?.scrollIntoView({block:'nearest'});
}
async function runQuery(mode,id){
 if(state.loading||!state.engineReady||!state.db){toast('PostgreSQL ещё запускается.');return;}
 if(id!==currentTaskID()){toast('Открой нужное задание.');return;}
 if(mode==='check'&&id==='playground')mode='run';
 const sql=getEditorText().trim();
 if(!sql){toast('SQL-редактор пуст.');return;}
 const button=$(`[data-action="${mode}"]`);if(button)button.disabled=true;
 state.result={taskId:id,loading:true};updateResults();
 try{
  if(mode==='check'){
    const task=getTask(id);if(!task)throw new Error('Задание не найдено.');
    if(!state.secondaryPromise)throw new Error('Контрольная база пока не готова.');
    const alt=await state.secondaryPromise;
    const grade=await gradeSQL(task,sql,state.db,alt);
    state.attempts[id]=(state.attempts[id]||0)+1;
    if(grade.ok){
      state.progress.completed=[...new Set([...state.progress.completed,id])];progressSave();
      state.result={taskId:id,passed:true,query:grade.actual};
      render({keepScroll:true});
      $('#task-feedback')?.scrollIntoView({block:'nearest'});
      return;
    }
    const outcome=grade.case==='alternate'?grade.secondary:grade.primary;
    state.result={taskId:id,gradeFailed:true,message:grade.case==='alternate'?
      'На исходных данных ответ верен, но на изменённом наборе — нет. '+outcome.message:outcome.message,
      query:grade.actual};
  }else{
    const query=await queryReadOnly(state.db,sql);
    state.result={taskId:id,query,message:'Запрос выполнен. Для зачёта нажми «Проверить SQL»: система сравнит результат ещё и с изменёнными данными.'};
  }
 }catch(error){
  state.result={taskId:id,error:String(error.message||error)};
 }finally{
  if(button)button.disabled=false;
  updateResults();
 }
}
function showHint(task){
 const l=task?.lessonId?lessonById[task.lessonId]:null;
 const text=l?.insight||'Определи зерно итоговой таблицы, затем проверь условия, JOIN и порядок вычислений.';
 toast(text.slice(0,300));
}
function showSolution(task){
 if(!state.progress.completed.includes(task.id)){toast('Эталонный SQL откроется после самостоятельного зачёта. Сначала попробуй решить задачу.');return;}
 state.result={taskId:task.id,message:'Эталонный вариант (один из возможных): '+task.sql};
 updateResults();
}
function onClick(event){
 const button=event.target.closest('button,[data-schema],[data-task-tab],[data-exam-tab],[data-filter],[data-scroll],[data-xray-scenario],[data-xray-step]');
 if(!button)return;
 if(button.id==='menu-toggle'){toggleMenu();return;}
 if(button.id==='theme-toggle'){
  state.progress.theme=state.progress.theme==='dark'?'light':'dark';progressSave();render({keepScroll:true});return;
 }
 if(button.id==='export-button'){exportFile();return;}
 if(button.dataset.schema){state.schema=button.dataset.schema;render({keepScroll:true});return;}
 if(button.dataset.xrayScenario){state.xrayScenario=button.dataset.xrayScenario;state.xrayStep=0;state.xrayResult=null;render({keepScroll:true});return;}
 if(button.dataset.xrayStep){const [scenario,index]=button.dataset.xrayStep.split(':');if(xrayById[scenario]?.steps[Number(index)]){state.xrayScenario=scenario;state.xrayStep=Number(index);state.xrayResult=null;render({keepScroll:true});}return;}
 if(button.dataset.filter){state.filter=button.dataset.filter;render({keepScroll:true});return;}
 if(button.dataset.scroll){document.getElementById(button.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(button.dataset.taskTab||button.dataset.examTab){
  state.activeTaskId=button.dataset.taskTab||button.dataset.examTab;state.result=null;
  render({keepScroll:true});document.getElementById('task-editor')?.scrollIntoView({block:'start'});return;
 }
 if(button.dataset.quiz!==undefined){
  const l=lessonById[button.dataset.lesson];
  if(l){state.progress.quiz[l.id]=Number(button.dataset.quiz);progressSave();render({keepScroll:true});}
  return;
 }
 const action=button.dataset.action,id=button.dataset.taskId||currentTaskID(),task=getTask(id);
 if(!action)return;
 if(action==='xray-run'){runXray();return;}
 if(action==='check'||action==='run'){runQuery(action,id);return;}
 if(action==='hint'&&task){showHint(task);return;}
 if(action==='solution'&&task){showSolution(task);return;}
 if(action==='read'){
  const l=lessonById[button.dataset.lesson];if(!l)return;
  if(!state.progress.read.includes(l.id))state.progress.read.push(l.id);
  progressSave();render({keepScroll:true});return;
 }
 if(action==='sample'){state.playground="SELECT status,COUNT(*) AS orders_count\nFROM orders\nGROUP BY status\nORDER BY orders_count DESC;";updatePlayground();return;}
 if(action==='reset-playground'){state.playground='';updatePlayground();return;}
 if(action==='retry-engine'){initDatabase();return;}
}
function updatePlayground(){
 const textarea=$('#sql-editor');if(textarea)textarea.value=state.playground;
 try{localStorage.setItem('sql4learn-playground-v1',state.playground);}catch{}
}
function onInput(event){
 if(event.target?.id!=='sql-editor')return;
 const key=event.target.dataset.draft;
 if(key==='playground'){state.playground=event.target.value;try{localStorage.setItem('sql4learn-playground-v1',state.playground);}catch{}}
 else if(getTask(key)){state.progress.drafts[key]=event.target.value;progressSave();}
}
function toggleMenu(open){
 const sidebar=$('#sidebar'),button=$('#menu-toggle');
 const show=typeof open==='boolean'?open:!sidebar.classList.contains('open');
 sidebar.classList.toggle('open',show);
 button.setAttribute('aria-expanded',String(show));
 let backdrop=$('#mobile-backdrop');
 if(show&&!backdrop){backdrop=document.createElement('div');backdrop.id='mobile-backdrop';backdrop.className='mobile-backdrop';backdrop.addEventListener('click',()=>toggleMenu(false));document.body.append(backdrop);}
 if(!show){backdrop?.remove();}
}
function exportFile(){
 const blob=new Blob([exportProgress(state.progress)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sql4learn-progress.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),500);toast('Резервная копия подготовлена.');
}
async function importFile(event){
 const file=event.target.files?.[0];event.target.value='';
 if(!file)return;
 try{
  if(file.size>1024*1024)throw new Error('Резервная копия больше 1 МБ.');
  const next=importProgress(await file.text());
  if(!window.confirm('Заменить текущие результаты и черновики данными из выбранного файла?'))return;
  state.progress=storeProgress(next);render({keepScroll:true});toast('Прогресс успешно восстановлен.');
 }catch(error){toast('Импорт не выполнен: '+error.message);}
}
function bind(){
 document.addEventListener('click',onClick);
 document.addEventListener('input',onInput);
 document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&document.activeElement?.id==='sql-editor'){
    event.preventDefault();runQuery(state.route?.page==='playground'?'run':'check',currentTaskID());
  }
  if(event.key==='Escape')toggleMenu(false);
 });
 window.addEventListener('hashchange',()=>{state.result=null;toggleMenu(false);render();try{state.progress.lastRoute=window.location.hash;progressSave();}catch{}});
 $('#import-file').addEventListener('change',importFile);
 window.addEventListener('error',event=>console.error('Ошибка приложения:',event.error||event.message));
}
function boot(){
 document.documentElement.dataset.theme=state.progress.theme;
 if(!location.hash||location.hash==='#')location.hash=state.progress.lastRoute||'#/home';
 bind();render();initDatabase();
}
boot();
