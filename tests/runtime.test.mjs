import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {SqlRuntime,SQL_LIMITS} from '../src/sql-client.js';
import {boundedDatabase} from '../src/sql-worker.js';
import {queryReadOnly,gradeSQL} from '../src/sql.js';
import {lessons,tasks} from '../src/content.js';
import {assessmentTasks} from '../src/assessments.js';
import {clinicTasks} from '../src/clinic.js';
import {independentProjectTasks} from '../src/portfolio.js';
import {reviewSkills} from '../src/review-bank.js';
import {xrayScenarios} from '../src/xray.js';
import {SEED_SQL,ALTERNATE_SQL} from '../src/data.js';
import {SUPPORT_SEED_SQL,SUPPORT_ALTERNATE_SQL} from '../src/project-data.js';
import {INVENTORY_SEED_SQL,INVENTORY_ALTERNATE_SQL} from '../src/inventory-data.js';

const result={rows:[{n:1}],fields:[{name:'n',dataTypeID:23}]};
function workerFactory(behavior){
 const workers=[];
 const createWorker=()=>{
  const worker={terminated:false,postMessage(message){
   const respond=(value=result)=>queueMicrotask(()=>worker.onmessage?.({data:{id:message.id,result:value}}));
   if(message.method==='init')respond({ready:true});else behavior(worker,message,respond);
  },terminate(){worker.terminated=true;}};
  workers.push(worker);return worker;
 };
 return {workers,createWorker};
}
test('A timed-out query terminates its worker, recovers both datasets and never replays SQL',async()=>{
 const calls=[],states=[];
 const factory=workerFactory((_worker,message,respond)=>{calls.push(message.sql);if(message.sql!=='SELECT pg_sleep(30)')respond();});
 const runtime=new SqlRuntime({...factory,onState:state=>states.push(state),limits:{queryMilliseconds:15,initializationMilliseconds:100}});
 try{
  await assert.rejects(runtime.query('SELECT pg_sleep(30)'),{code:'SQL_TIMEOUT'});
  assert.equal(factory.workers[0].terminated,true);
  assert.deepEqual(await runtime.query('SELECT 1 AS n'),result);
  assert.equal(factory.workers.length,2);
  assert.deepEqual(calls,['SELECT pg_sleep(30)','SELECT 1 AS n']);
  assert.ok(states.filter(state=>state==='ready').length>=2);
 }finally{runtime.close();}
});
test('RPCs stay serial and each deadline starts when its request is sent',async()=>{
 let respondFirst;
 const calls=[];
 const factory=workerFactory((_worker,message,respond)=>{calls.push(message.sql);if(message.sql==='SELECT 1')respondFirst=respond;else respond();});
 const runtime=new SqlRuntime({...factory,limits:{queryMilliseconds:100}});
 try{
  await runtime.start();
  const first=runtime.query('SELECT 1'),second=runtime.query('SELECT 2');
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(calls,['SELECT 1']);
  respondFirst();await first;await second;
  assert.deepEqual(calls,['SELECT 1','SELECT 2']);
 }finally{runtime.close();}
});
test('Oversized or multiple SQL statements never reach a worker',async()=>{
 const factory=workerFactory(()=>assert.fail('Invalid SQL reached worker'));
 const runtime=new SqlRuntime(factory);
 await assert.rejects(runtime.query('SELECT 1; DELETE FROM orders'));
 await assert.rejects(runtime.query('SELECT '+"'"+'x'.repeat(SQL_LIMITS.sqlCharacters)+"'"));
 assert.equal(factory.workers.length,0);runtime.close();
});
test('PostgreSQL cursor limits refuse truncated answers, preserve order/NULL/duplicates and roll back errors',async()=>{
 const database=await PGlite.create();
 const bounded=boundedDatabase(database);
 try{
  await database.exec('CREATE TABLE test_data(n integer); INSERT INTO test_data VALUES (2),(NULL),(2),(1)');
  const ordered=await queryReadOnly(bounded,'SELECT n FROM test_data ORDER BY n NULLS FIRST');
  assert.deepEqual(ordered.rows,[{n:null},{n:1},{n:2},{n:2}]);
  assert.equal(ordered.fields[0].dataTypeID,23);
  await assert.rejects(queryReadOnly(bounded,'SELECT generate_series(1,1001) AS n'),/больше 1000 строк/);
  await assert.rejects(queryReadOnly(bounded,"SELECT repeat('x',1000001) AS n"),/слишком большой/);
  await assert.rejects(queryReadOnly(bounded,'WITH changed AS (DELETE FROM test_data RETURNING *) SELECT * FROM changed'));
  await assert.rejects(queryReadOnly(bounded,'SELECT missing_column FROM test_data'));
  assert.equal((await queryReadOnly(bounded,'SELECT COUNT(*) AS n FROM test_data')).rows[0].n,4);
  const grade=await gradeSQL({sql:'SELECT n FROM test_data ORDER BY n NULLS FIRST',ordered:true},'WITH copied AS (SELECT n FROM test_data) SELECT n FROM copied ORDER BY n NULLS FIRST',bounded,bounded);
  assert.equal(grade.ok,true);
 }finally{await database.close();}
});
test('The worker cursor protocol executes every released example and task on both datasets',async()=>{
 const database=await PGlite.create(),bounded=boundedDatabase(database);
 const references=[...lessons.map(lesson=>({id:'example:'+lesson.id,sql:lesson.example})),...tasks,...assessmentTasks,...clinicTasks,...independentProjectTasks,...reviewSkills.flatMap(skill=>skill.variants.map((variant,index)=>({...variant,id:skill.id+':'+index}))),...xrayScenarios.flatMap(scenario=>scenario.steps.map((step,index)=>({...step,id:scenario.id+':'+index})))];
 try{
  await database.exec(SEED_SQL);await database.exec(SUPPORT_SEED_SQL);await database.exec(INVENTORY_SEED_SQL);
  for(const dataset of ['base','alternate']){
   if(dataset==='alternate'){await database.exec(ALTERNATE_SQL);await database.exec(SUPPORT_ALTERNATE_SQL);await database.exec(INVENTORY_ALTERNATE_SQL);}
   for(const reference of references){
    const output=await queryReadOnly(bounded,reference.sql);
    assert.ok(output.fields.length>0,reference.id+' on '+dataset);
   }
  }
 }finally{await database.close();}
});
