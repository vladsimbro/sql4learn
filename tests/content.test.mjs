import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {modules,lessons,tasks,upcomingModules,taskById,lessonById} from '../src/content.js';
import {assessments,assessmentTasks} from '../src/assessments.js';
import {clinicTasks} from '../src/clinic.js';
import {xrayScenarios} from '../src/xray.js';
import {SEED_SQL,ALTERNATE_SQL,SCHEMA} from '../src/data.js';
import {splitSQL,ensureSelect,queryReadOnly,compareResults,gradeSQL} from '../src/sql.js';
import {initialProgress,normalizeProgress,exportProgress,importProgress,mastery} from '../src/progress.js';

const all=[...tasks,...assessmentTasks,...clinicTasks];
test('Only real finished lessons are offered, with unique skill and task IDs',()=>{
 assert.equal(modules.length,8);
 assert.equal(lessons.length,35);
 assert.equal(tasks.length,91);
 assert.equal(assessments.length,5);
 assert.equal(assessmentTasks.length,11);
 assert.equal(clinicTasks.length,11);
 assert.equal(xrayScenarios.length,6);
 assert.equal(xrayScenarios.flatMap(x=>x.steps).length,23);
 assert.equal(new Set(lessons.map(x=>x.id)).size,lessons.length);
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 assert.ok(upcomingModules.length>=4);
 assert.ok(lessons[0].tasks.length>=2);
 for(const lesson of lessons){
  assert.ok(lesson.lead.length>35 && lesson.insight.length>80,lesson.id);
  assert.ok(Array.isArray(lesson.theory)&&lesson.theory.length>=2,lesson.id);
  assert.ok(lesson.example.length>10&&lesson.tasks.length>=2,lesson.id);
  assert.equal(lesson.quiz.choices.length,3,lesson.id);
  assert.ok(Number.isInteger(lesson.quiz.correct)&&lesson.quiz.correct>=0&&lesson.quiz.correct<3,lesson.id);
  for(const task of lesson.tasks)assert.ok(task.prompt.length>=45&&task.sql.length>15,task.id);
 }
 assert.equal(Object.keys(SCHEMA).length,7);
 assert.ok(taskById['start-1']&&lessonById['first-query']);
 assert.ok(taskById['date-15']&&lessonById['date-calendar']);
 assert.ok(taskById['product-18']&&lessonById['product-cohorts']);
 assert.ok(modules.findIndex(m=>m.id==='product')>modules.findIndex(m=>m.id==='windows'),'Product cohort analytics must follow windows and CTEs');
 const moduleIndex=modules.findIndex(module=>module.id==='dates');
 assert.ok(moduleIndex>modules.findIndex(module=>module.id==='joins')&&moduleIndex<modules.findIndex(module=>module.id==='cte'),'Date training must follow joins but precede multistage CTEs');
});
test('SQL statements are parsed without splitting comments and literals',()=>{
 assert.equal(splitSQL("SELECT ';' AS symbol;").length,1);
 assert.equal(splitSQL('/* ; test */ SELECT 1;').length,1);
 assert.equal(splitSQL('-- ; comment\nSELECT 1;').length,1);
 assert.equal(splitSQL('SELECT 1; SELECT 2;').length,2);
 assert.equal(splitSQL("SELECT $$a;b$$ AS example;").length,1);
 assert.throws(()=>ensureSelect('UPDATE orders SET amount=1'));
 assert.throws(()=>ensureSelect('SELECT 1; DROP TABLE orders'));
 assert.match(ensureSelect('WITH x AS (SELECT 1 AS a) SELECT a FROM x'),/^WITH/);
});
test('Comparison accepts equivalent ordering when not required, but not duplicate changes',()=>{
 const fields=[{name:'id'},{name:'amount'}];
 const expected={fields,rows:[{id:1,amount:9},{id:2,amount:9}]};
 const reordered={fields,rows:[{id:2,amount:9},{id:1,amount:9}]};
 assert.equal(compareResults(reordered,expected).ok,true);
 assert.equal(compareResults(reordered,expected,true).ok,false);
 assert.equal(compareResults({fields,rows:[{id:1,amount:9},{id:1,amount:9}]},expected).ok,false);
 assert.equal(compareResults({fields:[{name:'other'}],rows:[]},expected).type,'columns');
});
test('Progress is scoped to authored IDs and backups cannot import arbitrary state',()=>{
 const source={completed:['start-1','start-1','evil','checkpoint-1a'],read:['first-query','evil'],quiz:{'first-query':0,evil:100},drafts:{'start-1':'SELECT 1',evil:'DROP TABLE orders'},theme:'dark'};
 const progress=normalizeProgress(source);
 assert.deepEqual(progress.completed,['start-1','checkpoint-1a']);
 assert.deepEqual(progress.read,['first-query']);
 assert.deepEqual(progress.drafts,{'start-1':'SELECT 1'});
 assert.equal(importProgress(exportProgress(source)).theme,'dark');
 assert.throws(()=>importProgress('{"product":"other","format":1,"progress":{}}'));
 assert.equal(mastery(progress,lessonById['first-query']).completed,1);
 assert.equal(initialProgress().completed.length,0);
});
test('Every SQL answer executes on original and adversarial PostgreSQL fixtures',async()=>{
 const base=await PGlite.create(),alt=await PGlite.create();
 try{
  await base.exec(SEED_SQL);
  await alt.exec(SEED_SQL);
  await alt.exec(ALTERNATE_SQL);
  const rowCounts=await base.query('SELECT (SELECT COUNT(*) FROM orders) AS orders_count, (SELECT COUNT(*) FROM stores) AS stores_count');
  assert.equal(Number(rowCounts.rows[0].orders_count),18);
  assert.equal(Number(rowCounts.rows[0].stores_count),6);
  const noEvents=await base.query('SELECT COUNT(*) AS n FROM user_events WHERE user_id=15');
  assert.equal(Number(noEvents.rows[0].n),0,'Control user must have no events');
  const premature=await base.query("SELECT COUNT(*) AS n FROM user_events WHERE user_id=10 AND event_type='purchase' AND event_at < (SELECT MIN(event_at) FROM user_events WHERE user_id=10 AND event_type='view')");
  assert.equal(Number(premature.rows[0].n),1,'Strict funnel must detect purchase before first view');
  for(const task of all){
    const original=await queryReadOnly(base,task.sql);
    const variant=await queryReadOnly(alt,task.sql);
    assert.ok(original.fields.length>0,task.id+' returns no columns');
    assert.ok(original.rows.length>0,task.id+' unexpectedly empty on original dataset');
    assert.ok(variant.rows.length>0,task.id+' unexpectedly empty on test dataset');
    const checked=await gradeSQL(task,task.sql,base,alt);
    assert.equal(checked.ok,true,task.id);
  }
  for(const scenario of xrayScenarios){
    for(const step of scenario.steps){
      assert.ok(step.grain&&step.why&&step.sql,scenario.id+' incomplete explanatory step');
      const result=await queryReadOnly(base,step.sql);
      assert.ok(result.fields.length,scenario.id+' step must return real SQL columns');
      assert.ok((await queryReadOnly(alt,step.sql)).fields.length,scenario.id+' step fails on alternate data');
    }
  }
  for(const clinic of clinicTasks){
    const broken=await gradeSQL(clinic,clinic.brokenSQL,base,alt);
    assert.equal(broken.ok,false,clinic.id+' broken query must actually be wrong');
  }
  const incorrect=await gradeSQL(taskById['filter-2'],"SELECT order_id,status FROM orders WHERE status='cancelled'",base,alt);
  assert.equal(incorrect.ok,false);
  await assert.rejects(()=>queryReadOnly(base,"WITH changed AS (UPDATE orders SET amount=0 RETURNING order_id) SELECT * FROM changed"),/read-only|read only|cannot execute/i);
  assert.equal((await base.query('SELECT amount FROM orders WHERE order_id=1001')).rows[0].amount,'1200.00');
 }finally{await base.close();await alt.close();}
});
