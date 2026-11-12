import {ensureSelect} from './sql.js';

export const SQL_LIMITS=Object.freeze({sqlCharacters:20000,resultRows:1000,resultCharacters:1000000,queryMilliseconds:8000,gradeMilliseconds:20000,initializationMilliseconds:90000});

// Only messages and cloned results cross this boundary. PGlite never runs on the UI thread.
export class SqlRuntime{
 constructor({createWorker=()=>new Worker(new URL('./sql-worker.js',import.meta.url),{type:'module'}),onState=()=>{},limits={}}={}){
  this.createWorker=createWorker;this.onState=onState;this.limits={...SQL_LIMITS,...limits};
  this.worker=null;this.pending=null;this.sequence=0;this.ready=false;this.queue=Promise.resolve();this.closed=false;
 }
 enqueue(operation){
  const next=this.queue.catch(()=>{}).then(operation);
  this.queue=next.catch(()=>{});return next;
 }
 start(){return this.enqueue(()=>this.initialize());}
 async initialize(){
  if(this.closed)throw new Error('SQL-среда закрыта.');
  if(this.ready)return;
  this.onState('loading');
  try{
   const worker=this.createWorker();this.worker=worker;
   worker.onmessage=event=>{
    if(this.worker!==worker||!this.pending||event.data?.id!==this.pending.id)return;
    const pending=this.pending;this.pending=null;clearTimeout(pending.timer);
    if(event.data.error){const error=new Error(event.data.error.message);error.code=event.data.error.code;pending.reject(error);}
    else pending.resolve(event.data.result);
   };
   worker.onerror=()=>this.fail(new Error('SQL-среда остановилась. Повтори запуск PostgreSQL.'),this.pending?.method!=='init');
   worker.onmessageerror=()=>this.fail(new Error('Не удалось получить результат SQL. Повтори запуск PostgreSQL.'),this.pending?.method!=='init');
   await this.send('init',{},this.limits.initializationMilliseconds);
   this.ready=true;this.onState('ready');
  }catch(error){this.discard();this.onState('failed',error.message);throw error;}
 }
 validate(sql){
  if(typeof sql!=='string'||sql.length>this.limits.sqlCharacters)throw new Error('Запрос слишком большой: максимум '+this.limits.sqlCharacters+' символов.');
  return ensureSelect(sql);
 }
 query(sql){
  let safe;try{safe=this.validate(sql);}catch(error){return Promise.reject(error);}
  return this.enqueue(async()=>{await this.initialize();return this.send('query',{sql:safe},this.limits.queryMilliseconds);});
 }
 grade(task,sql){
  let safe;try{safe=this.validate(sql);this.validate(task.sql);}catch(error){return Promise.reject(error);}
  return this.enqueue(async()=>{await this.initialize();return this.send('grade',{sql:safe,task:{sql:task.sql,ordered:task.ordered===true}},this.limits.gradeMilliseconds);});
 }
 send(method,payload,timeout){
  if(!this.worker)return Promise.reject(new Error('SQL-среда не запущена.'));
  return new Promise((resolve,reject)=>{
   const id=++this.sequence;
   const timer=setTimeout(()=>{
    const error=new Error(method==='init'?'Не удалось запустить PostgreSQL. Проверь соединение и повтори запуск.':'Превышено время выполнения SQL. Среда перезапускается; сократи объём данных или упрости запрос.');
    error.code='SQL_TIMEOUT';this.fail(error,method!=='init');
   },timeout);
   this.pending={id,method,resolve,reject,timer};
   try{this.worker.postMessage({id,method,...payload});}
   catch(error){this.fail(error,method!=='init');}
  });
 }
 discard(){
  this.ready=false;const worker=this.worker;this.worker=null;
  if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();}
 }
 fail(error,recover){
  const pending=this.pending;this.pending=null;
  if(pending){clearTimeout(pending.timer);pending.reject(error);}
  this.discard();
  if(recover&&!this.closed){this.onState('loading',error.message);this.start().catch(()=>{});}
 }
 close(){
  this.closed=true;this.fail(new Error('SQL-среда закрыта.'),false);
 }
}

export const queryReadOnly=(runtime,sql)=>runtime.query(sql);
export const gradeSQL=(task,sql,runtime)=>runtime.grade(task,sql);
