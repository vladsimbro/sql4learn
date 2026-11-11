import {lessons,tasks} from './content.js';
import {assessmentTasks} from './assessments.js';
export const STORAGE_KEY='sql4learn-progress-v1';
export function initialProgress(){return {version:1,completed:[],quiz:{},read:[],drafts:{},notes:{},theme:'light',lastRoute:'#/home'};}
const ids=new Set([...tasks,...assessmentTasks].map(item=>item.id)),lessonIds=new Set(lessons.map(lesson=>lesson.id));
const record=obj=>obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
const safeRecord=(input,allowed,keyLimit=10000)=>Object.fromEntries(Object.entries(record(input)).filter(([k,v])=>allowed.has(k)&&typeof v==='string'&&v.length<=keyLimit));
export function normalizeProgress(value){
  const x=record(value);
  if(x.version!==undefined&&x.version!==1)throw new Error('Неподдерживаемая версия сохранения.');
  return {
    version:1,
    completed:[...new Set((Array.isArray(x.completed)?x.completed:[]).filter(id=>ids.has(id)))],
    quiz:Object.fromEntries(Object.entries(record(x.quiz)).filter(([key,val])=>lessonIds.has(key)&&Number.isInteger(val)&&val>=0&&val<=9)),
    read:[...new Set((Array.isArray(x.read)?x.read:[]).filter(id=>lessonIds.has(id)))],
    drafts:safeRecord(x.drafts,ids),
    notes:safeRecord(x.notes,lessonIds,4000),
    theme:x.theme==='dark'?'dark':'light',
    lastRoute:typeof x.lastRoute==='string'&&/^#\/[A-Za-z0-9/_-]+$/.test(x.lastRoute)?x.lastRoute:'#/home'
  };
}
export function loadProgress(){
 try{return normalizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}
 catch(error){console.warn('Повреждённый прогресс:',error);return initialProgress();}
}
export function storeProgress(value){
 const normal=normalizeProgress(value);
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(normal));}
 catch(error){console.warn('Недоступно хранилище прогресса:',error);}
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
 read:progress.read.includes(lesson.id),
 quiz:progress.quiz[lesson.id]===lesson.quiz.correct,
 total:lesson.tasks.length,
 completed:lesson.tasks.filter(task=>progress.completed.includes(task.id)).length
});
