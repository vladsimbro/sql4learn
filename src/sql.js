// Shared safe SQL execution and result-oriented grading. This module also runs in Node tests.
export function splitSQL(input){
  const source=String(input||''),parts=[];let current='',quote='',block=0,line=false,dollar='';
  for(let i=0;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){current+=c;if(c==='\n')line=false;continue;}
    if(block){current+=c;if(c==='/'&&source[i-1]==='*')block--;else if(c==='/'&&n==='*'){block++;current+=n;i++;}continue;}
    if(dollar){if(source.startsWith(dollar,i)){current+=dollar;i+=dollar.length-1;dollar='';}else current+=c;continue;}
    if(quote){current+=c;if(c===quote){if(n===quote){current+=n;i++;}else quote='';}continue;}
    if(c==='-'&&n==='-'){line=true;current+=c+n;i++;continue;}
    if(c==='/'&&n==='*'){block=1;current+=c+n;i++;continue;}
    if(c==="'"||c==='"'){quote=c;current+=c;continue;}
    if(c==='$'){const m=/^\$[A-Za-z_0-9]*\$/.exec(source.slice(i));if(m){dollar=m[0];current+=dollar;i+=dollar.length-1;continue;}}
    if(c===';'){if(current.trim())parts.push(current.trim());current='';continue;}
    current+=c;
  }
  if(current.trim())parts.push(current.trim());
  if(quote||block||dollar)throw new Error('SQL-запрос не завершён: проверь кавычки и комментарии.');
  return parts;
}
export function ensureSelect(sql){
  const statements=splitSQL(sql);
  if(statements.length!==1)throw new Error('Напиши один запрос SELECT или WITH … SELECT.');
  let lead=statements[0].replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*/g,'').trimStart();
  if(!/^(SELECT|WITH)\b/i.test(lead))throw new Error('В учебном редакторе разрешены только читающие SELECT и WITH … SELECT.');
  // The PostgreSQL read-only transaction is the final guard for data-changing CTEs.
  return statements[0];
}
const canonical=value=>{
  if(value===null)return ['null'];
  if(value instanceof Date)return ['date',value.toISOString()];
  if(typeof value==='bigint')return ['bigint',value.toString()];
  if(typeof value==='number')return ['number',Object.is(value,-0)?'0':String(value)];
  if(typeof value==='string')return ['string',value];
  if(typeof value==='boolean')return ['boolean',value];
  if(Array.isArray(value))return ['array',value.map(canonical)];
  if(value&&typeof value==='object')return ['object',Object.keys(value).sort().map(key=>[key,canonical(value[key])])];
  return [typeof value,String(value)];
};
export const normalizeResult=result=>({
  columns:(result.fields||[]).map(field=>field.name),
  rows:(result.rows||[]).map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value])))
});
export function compareResults(actual,expected,ordered=false){
  const a=normalizeResult(actual),e=normalizeResult(expected);
  if(a.columns.length!==e.columns.length || new Set(a.columns).size!==a.columns.length || JSON.stringify([...a.columns].sort())!==JSON.stringify([...e.columns].sort()))
    return {ok:false,type:'columns',message:'Состав или названия столбцов отличаются от ожидаемых. Проверь SELECT и псевдонимы.'};
  if(a.rows.length!==e.rows.length)
    return {ok:false,type:'rows',message:'Количество строк отличается: получено '+a.rows.length+', ожидалось '+e.rows.length+'. Проверь фильтрацию, JOIN и зерно результата.'};
  const columns=[...e.columns].sort();
  const signature=rows=>rows.map(row=>JSON.stringify(columns.map(col=>canonical(row[col]))));
  const left=signature(a.rows),right=signature(e.rows);
  if(!ordered){left.sort();right.sort();}
  if(JSON.stringify(left)!==JSON.stringify(right))
    return {ok:false,type:'values',message:ordered?'Значения или порядок строк отличаются. Проверь ORDER BY и дополнительный ключ сортировки.':'Значения или повторения строк отличаются. Проверь расчёт и связи между таблицами.'};
  return {ok:true,type:'success',message:'Результат корректен: столбцы, значения и количество повторений совпадают.'};
}
const dbQueues=new WeakMap();
export function queryReadOnly(db,sql){
  const safe=ensureSelect(sql);
  const previous=dbQueues.get(db)||Promise.resolve();
  const execution=previous.catch(()=>{}).then(async()=>{
    await db.exec('BEGIN TRANSACTION READ ONLY');
    try{return await db.query(safe);}
    finally{await db.exec('ROLLBACK');}
  });
  dbQueues.set(db,execution.catch(()=>{}));
  return execution;
}
export async function gradeSQL(task,sql,db,secondaryDB){
  const actual=await queryReadOnly(db,sql);
  const expected=await queryReadOnly(db,task.sql);
  const primary=compareResults(actual,expected,task.ordered);
  if(!primary.ok)return {ok:false,primary,actual,case:'base'};
  if(!secondaryDB)throw new Error('Контрольный набор данных ещё загружается.');
  const secondaryActual=await queryReadOnly(secondaryDB,sql);
  const secondaryExpected=await queryReadOnly(secondaryDB,task.sql);
  const secondary=compareResults(secondaryActual,secondaryExpected,task.ordered);
  if(!secondary.ok)return {ok:false,primary,secondary,actual,case:'alternate'};
  return {ok:true,primary,secondary,actual,case:'both'};
}
