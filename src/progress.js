import {lessons,tasks} from './content.js';
import {supplementaryLessonPractice} from './curriculum-practice.js';
import {assessmentTasks} from './assessments.js';
import {clinicTasks} from './clinic.js';
import {independentProjects,independentProjectTasks} from './portfolio.js';
import {reviewSkills} from './review-bank.js';
export const STORAGE_KEY='sql4learn-progress-v1';
// A successful later write cannot establish that an earlier failed read recovered
// the user's old results. Keep that warning for the lifetime of this page.
let storageReadError='',storageWriteError='';
export function progressStorageStatus(){return [storageReadError,storageWriteError].filter(Boolean).join(' ');}
export function initialProgress(){return {version:1,curriculumVersion:2,legacyMastered:[],completed:[],quiz:{},read:[],drafts:{},notes:{},projectNotes:{},review:{},theme:'light',lastRoute:'#/home'};}
const ids=new Set([...tasks,...assessmentTasks,...clinicTasks,...independentProjectTasks].map(item=>item.id)),lessonIds=new Set(lessons.map(lesson=>lesson.id)),projectIds=new Set(independentProjects.map(project=>project.id)),reviewIds=new Set(reviewSkills.map(skill=>skill.id)),draftIds=new Set([...ids,...reviewIds]);
const optionalPracticeIds=new Set(supplementaryLessonPractice.map(entry=>entry.task.id));
const record=obj=>obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
const safeRecord=(input,allowed,keyLimit=10000)=>Object.fromEntries(Object.entries(record(input)).filter(([k,v])=>allowed.has(k)&&typeof v==='string'&&v.length<=keyLimit));
export function normalizeProgress(value){
  const x=record(value);
  if(x.version!==undefined&&x.version!==1)throw new Error('Неподдерживаемая версия сохранения.');
  const completed=[...new Set((Array.isArray(x.completed)?x.completed:[]).filter(id=>ids.has(id)))];
  const quiz=Object.fromEntries(Object.entries(record(x.quiz)).filter(([key,val])=>lessonIds.has(key)&&Number.isInteger(val)&&val>=0&&val<=9));
  // Old progress completed before extra exercises were added must not regress.
  // New learners (curriculumVersion:2) must solve the updated lesson in full.
  const historical=x.curriculumVersion===2?[]:lessons.filter(lesson=>{
    const originalTasks=lesson.tasks.filter(task=>!optionalPracticeIds.has(task.id));
    return originalTasks.length>0&&originalTasks.every(task=>completed.includes(task.id))&&quiz[lesson.id]===lesson.quiz.correct;
  }).map(lesson=>lesson.id);
  const legacyMastered=[...new Set([...(Array.isArray(x.legacyMastered)?x.legacyMastered:[]),...historical].filter(id=>lessonIds.has(id)))];
  return {
    version:1,
    curriculumVersion:2,
    legacyMastered,
    completed,
    quiz,
    read:[...new Set((Array.isArray(x.read)?x.read:[]).filter(id=>lessonIds.has(id)))],
    drafts:safeRecord(x.drafts,draftIds),
    notes:safeRecord(x.notes,lessonIds,4000),
    projectNotes:safeRecord(x.projectNotes,projectIds,4000),
    review:Object.fromEntries(Object.entries(record(x.review)).filter(([key,value])=>reviewIds.has(key)&&value&&typeof value==='object'&&!Array.isArray(value)).map(([key,value])=>[key,{
      level:Number.isInteger(value.level)?Math.min(4,Math.max(0,value.level)):0,
      ...(Number.isSafeInteger(value.round)&&value.round>=0?{round:value.round}:{}),
      nextDueAt:typeof value.nextDueAt==='number'&&Number.isFinite(value.nextDueAt)&&value.nextDueAt>=0?Math.min(value.nextDueAt,4102444800000):0,
      misses:Number.isInteger(value.misses)?Math.min(100000,Math.max(0,value.misses)):0
    }])),
    theme:x.theme==='dark'?'dark':'light',
    lastRoute:typeof x.lastRoute==='string'&&/^#\/[A-Za-z0-9/_-]+$/.test(x.lastRoute)?x.lastRoute:'#/home'
  };
}
export function loadProgress(){
 let saved;
 try{saved=localStorage.getItem(STORAGE_KEY);}
 catch{
  storageReadError='Не удалось прочитать прогресс из хранилища браузера. Открыт пустой учебный маршрут. Экспортируйте новые результаты перед закрытием страницы.';
  return initialProgress();
 }
 try{return normalizeProgress(JSON.parse(saved||'{}'));}
 catch{
  storageReadError='Сохранённый прогресс повреждён или имеет неподдерживаемый формат. Открыт пустой учебный маршрут. Если есть резервная копия, восстановите её.';
  return initialProgress();
 }
}
export function storeProgress(value){
 const normal=normalizeProgress(value);
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(normal));storageWriteError='';}
 catch(error){
  const full=error?.name==='QuotaExceededError'||error?.name==='NS_ERROR_DOM_QUOTA_REACHED';
  storageWriteError=(full?'Хранилище браузера заполнено. ':'Не удалось сохранить прогресс в браузере. ')+
   'Последние изменения доступны только в этой вкладке. Экспортируйте прогресс перед её закрытием.';
 }
 return normal;
}
export function exportProgress(value){
 return JSON.stringify({product:'SQL4Learn',format:1,createdAt:new Date().toISOString(),progress:normalizeProgress(value)},null,2);
}
export function importProgress(text){
 if(text.length>1024*1024)throw new Error('Файл прогресса слишком большой.');
 let data;try{data=JSON.parse(text);}catch{throw new Error('Это не JSON-файл прогресса.');}
 if(!data||data.product!=='SQL4Learn'||data.format!==1||!data.progress)throw new Error('Неизвестный формат резервной копии.');
 return normalizeProgress(data.progress);
}
export const mastery=(progress,lesson)=>({
 grandfathered:Array.isArray(progress.legacyMastered)&&progress.legacyMastered.includes(lesson.id),
 read:progress.read.includes(lesson.id),
 quiz:progress.quiz[lesson.id]===lesson.quiz.correct,
 total:lesson.tasks.length,
 completed:lesson.tasks.filter(task=>progress.completed.includes(task.id)).length
});
