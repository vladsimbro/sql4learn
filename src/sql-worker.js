import {SEED_SQL,ALTERNATE_SQL} from './data.js';
import {SUPPORT_SEED_SQL,SUPPORT_ALTERNATE_SQL} from './project-data.js';
import {INVENTORY_SEED_SQL,INVENTORY_ALTERNATE_SQL} from './inventory-data.js';
import {ensureSelect,queryReadOnly,gradeSQL} from './sql.js';
import {SQL_LIMITS} from './sql-client.js';

let base,alternate,queue=Promise.resolve();
function checkedSQL(sql){
 if(typeof sql!=='string'||sql.length>SQL_LIMITS.sqlCharacters)throw new Error('Запрос превышает допустимый размер.');
 return ensureSelect(sql);
}
function checkResult(result){
 if(result.rows.length>SQL_LIMITS.resultRows)throw new Error('Результат содержит больше '+SQL_LIMITS.resultRows+' строк. Добавь фильтр или LIMIT; усечённый ответ не засчитывается.');
 const text=JSON.stringify(result,(_key,value)=>typeof value==='bigint'?value.toString():value);
 if(text.length>SQL_LIMITS.resultCharacters)throw new Error('Результат слишком большой. Выбери меньше столбцов или сократи текстовые значения.');
 return result;
}
export function boundedDatabase(database){
 return {
  exec:async sql=>{
   const result=await database.exec(sql);
   if(sql==='BEGIN TRANSACTION READ ONLY'){
    try{await database.exec("SET LOCAL work_mem='8MB'; SET LOCAL temp_file_limit='16MB'");}
    catch(error){await database.exec('ROLLBACK');throw error;}
   }
   return result;
  },
  query:async sql=>{
   const safe=checkedSQL(sql);
   // A server-side cursor bounds rows before JavaScript result materialization.
   // FETCH preserves the original query's fields, duplicates and ordered stream.
   await database.exec('DECLARE sql4learn_result NO SCROLL CURSOR FOR '+safe);
   const result=await database.query('FETCH FORWARD '+(SQL_LIMITS.resultRows+1)+' FROM sql4learn_result');
   return checkResult(result);
  }
 };
}
async function initialize(){
 if(base&&alternate)return;
 const {PGlite}=await import('../vendor/pglite/index.js');
 const primary=await PGlite.create();
 await primary.exec(SEED_SQL);await primary.exec(SUPPORT_SEED_SQL);await primary.exec(INVENTORY_SEED_SQL);
 const secondary=await PGlite.create();
 await secondary.exec(SEED_SQL);await secondary.exec(ALTERNATE_SQL);
 await secondary.exec(SUPPORT_SEED_SQL);await secondary.exec(SUPPORT_ALTERNATE_SQL);
 await secondary.exec(INVENTORY_SEED_SQL);await secondary.exec(INVENTORY_ALTERNATE_SQL);
 base=boundedDatabase(primary);alternate=boundedDatabase(secondary);
}
async function respond(message){
 const {id,method}=message;
 try{
  let result;
  if(method==='init'){await initialize();result={ready:true};}
  else{
   if(!base||!alternate)throw new Error('SQL-среда ещё не готова.');
   const sql=checkedSQL(message.sql);
   if(method==='query')result=await queryReadOnly(base,sql);
   else if(method==='grade'){
    checkedSQL(message.task.sql);
    result=await gradeSQL(message.task,sql,base,alternate);
   }else throw new Error('Неизвестная операция SQL.');
  }
  self.postMessage({id,result});
 }catch(error){self.postMessage({id,error:{message:String(error.message||error),code:error.code||'SQL_ERROR'}});}
}
if(typeof self!=='undefined')self.onmessage=event=>{queue=queue.catch(()=>{}).then(()=>respond(event.data));};
