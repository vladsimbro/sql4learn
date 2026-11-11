import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {modules,lessons,tasks,projects,upcomingModules,taskById,lessonById} from '../src/content.js';
import {assessments,assessmentTasks} from '../src/assessments.js';
import {clinicTasks} from '../src/clinic.js';
import {xrayScenarios} from '../src/xray.js';
import {SEED_SQL,ALTERNATE_SQL,SCHEMA} from '../src/data.js';
import {SUPPORT_SCHEMA,SUPPORT_SEED_SQL,SUPPORT_ALTERNATE_SQL} from '../src/project-data.js';
import {independentProjects,independentProjectTasks,independentProjectTaskById} from '../src/portfolio.js';
import {reviewSkills,reviewStatus,reviewTask,advanceReview,reviewUnlocked,REVIEW_INTERVALS_DAYS} from '../src/review-bank.js';
import {splitSQL,ensureSelect,queryReadOnly,compareResults,gradeSQL} from '../src/sql.js';
import {initialProgress,normalizeProgress,exportProgress,importProgress,mastery} from '../src/progress.js';
import {lessonGuides,modulePedagogy} from '../src/lesson-guides.js';

const all=[...tasks,...assessmentTasks,...clinicTasks,...independentProjectTasks];
test('Only real finished lessons are offered, with unique skill and task IDs',()=>{
 assert.equal(modules.length,9);
 assert.equal(lessons.length,44);
 assert.equal(tasks.length,119);
 assert.equal(assessments.length,6);
 assert.equal(assessmentTasks.length,14);
 assert.deepEqual(assessments.map(a=>a.after),['filter','joins','dates','windows','audit','product'],'Cumulative exams must match the taught curriculum sequence');
 assert.equal(clinicTasks.length,13);
 assert.equal(xrayScenarios.length,8);
 assert.equal(xrayScenarios.flatMap(x=>x.steps).length,33);
 assert.equal(new Set(lessons.map(x=>x.id)).size,lessons.length);
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 assert.ok(xrayScenarios.some(x=>x.id==='logical-order'&&x.steps.length===6),'SQL logical order must have a live multi-stage data-flow demonstration');
 assert.ok(upcomingModules.length>=3);
 assert.equal(projects.length,2);
 assert.equal(independentProjects.length,1,'Release includes a genuinely independent project rather than relabelled lesson tasks');
 assert.equal(reviewSkills.length,9);
 assert.equal(reviewSkills.flatMap(x=>x.variants).length,27);
 assert.equal(new Set(reviewSkills.map(x=>x.id)).size,9);
 assert.equal(new Set(reviewSkills.flatMap(x=>x.variants.map(v=>v.prompt))).size,27,'Every repetition variant must use a different business framing');
 assert.equal(independentProjectTasks.length,6);
 assert.equal(Object.keys(SUPPORT_SCHEMA).length,4);
 assert.ok(independentProjectTaskById['portfolio-support-6'].ordered);
 for(const task of independentProjectTasks){assert.ok(task.prompt.length>65&&task.deliverable.length>45,task.id+' needs business requirements and testable output contract');}
 for(const project of projects){assert.equal(project.taskIds.length,4);for(const id of project.taskIds)assert.ok(taskById[id],project.id+' references an unknown task');}
 assert.ok(lessons[0].tasks.length>=2);
 for(const lesson of lessons){
  assert.ok(lesson.lead.length>35 && lesson.insight.length>80,lesson.id);
  assert.ok(Array.isArray(lesson.theory)&&lesson.theory.length>=2,lesson.id);
  assert.ok(lesson.example.length>10&&lesson.tasks.length>=2,lesson.id);
  assert.equal(lesson.quiz.choices.length,3,lesson.id);
  assert.ok(Number.isInteger(lesson.quiz.correct)&&lesson.quiz.correct>=0&&lesson.quiz.correct<3,lesson.id);
  for(const task of lesson.tasks)assert.ok(task.prompt.length>=45&&task.sql.length>15,task.id);
 }
 assert.equal(Object.keys(SCHEMA).length,8);
 assert.ok(taskById['start-1']&&lessonById['first-query']);
 assert.ok(taskById['date-15']&&lessonById['date-calendar']);
 assert.ok(taskById['product-18']&&lessonById['product-cohorts']);
 assert.ok(taskById['audit-18']&&lessonById['audit-full-join']);
 assert.deepEqual(modules.map(m=>m.id),['start','filter','aggregate','joins','dates','cte','windows','audit','product'],'Module order must flow from basic SQL through validated data quality to product metrics');
 assert.ok(lessonById['limit-top']&&lessonById['case-basic']&&lessonById['logical-order'],'Missing fundamental prerequisites must be taught explicitly');
 assert.ok(taskById['start-13']&&taskById['case-3']&&taskById['logic-3']&&taskById['filter-13'],'New early and cumulative tasks must be independently graded');
 assert.equal(taskById['filter-11'].lessonId,'date-types','Time bounds must not be a practice task before DATE/TIMESTAMP explanation');
 for(const id of ['join-5','join-6'])assert.doesNotMatch(taskById[id].sql,/\bNOT\s+EXISTS\b/i,'An anti-join must use previously learned LEFT JOIN rather than untaught subquery');
 assert.ok(modules.findIndex(m=>m.id==='audit')<modules.findIndex(m=>m.id==='product'),'Data integrity and JOIN cardinality must precede product analytics');
 assert.ok(lessons.findIndex(l=>l.id==='logical-order')>lessons.findIndex(l=>l.id==='fanout'),'SQL logical order should follow required filtering and JOIN topics');
 assert.ok(modules.findIndex(m=>m.id==='product')>modules.findIndex(m=>m.id==='windows'),'Product cohort analytics must follow windows and CTEs');
 assert.equal(Object.keys(lessonGuides).length,lessons.length,'A learning contract is required for every lesson');
 assert.equal(Object.keys(modulePedagogy).length,modules.length,'Every module must explain why it follows the last');
 const index=Object.fromEntries(lessons.map((lesson,i)=>[lesson.id,i]));
 for(const lesson of lessons){
   const guide=lessonGuides[lesson.id];
   assert.ok(guide,lesson.id+' missing its lesson guide');
   for(const field of ['goal','predict','pitfall','check'])assert.ok(typeof guide[field]==='string'&&guide[field].length>=45,lesson.id+' has incomplete '+field);
   assert.ok(Array.isArray(guide.requires)&&new Set(guide.requires).size===guide.requires.length,lesson.id+' must define unique prerequisites');
   for(const prereq of guide.requires)assert.ok(index[prereq]!==undefined&&index[prereq]<index[lesson.id],lesson.id+' refers to a topic not yet taught: '+prereq);
 }
 assert.equal(new Set(Object.values(lessonGuides).map(g=>g.predict)).size,lessons.length,'Predictions must differ across subjects');
 assert.equal(new Set(Object.values(lessonGuides).map(g=>g.pitfall)).size,lessons.length,'Typical errors must be subject-specific rather than generic boilerplate');
 const moduleIndex=modules.findIndex(module=>module.id==='dates');
 assert.ok(moduleIndex>modules.findIndex(module=>module.id==='joins')&&moduleIndex<modules.findIndex(module=>module.id==='cte'),'Date training must follow joins but precede multistage CTEs');
});
test('Spaced repetition unlocks after authentic SQL, rotates variants and schedules bounded intervals',()=>{
 const now=Date.UTC(2026,10,11,12);
 const skill=reviewSkills[0],base={completed:[],review:{}};
 assert.equal(reviewUnlocked(base,skill),false);
 assert.equal(reviewStatus(base,skill,now).due,false);
 const unlocked={completed:[lessonById[skill.lessonId].tasks[0].id],review:{}};
 assert.equal(reviewStatus(unlocked,skill,now).due,true);
 assert.equal(reviewTask(unlocked,skill).title,skill.variants[0].title);
 let value;
 for(let level=1;level<=4;level++){
  value=advanceReview(value,true,now);
  assert.equal(value.level,level);
  assert.equal(value.nextDueAt-now,REVIEW_INTERVALS_DAYS[level-1]*86400000);
 }
 const scheduled=reviewStatus({...unlocked,review:{[skill.id]:value}},skill,now);
 assert.equal(scheduled.due,false);
 assert.equal(reviewTask({...unlocked,review:{[skill.id]:value}},skill).title,skill.variants[1].title);
 const reset=advanceReview(value,false,now);
 assert.equal(reset.level,0);
 assert.equal(reset.misses,1);
 assert.equal(reset.nextDueAt,now);
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
 const source={completed:['start-1','start-1','evil','checkpoint-1a','portfolio-support-1'],read:['first-query','evil'],quiz:{'first-query':0,evil:100},drafts:{'start-1':'SELECT 1','portfolio-support-1':'SELECT 42',evil:'DROP TABLE orders'},projectNotes:{'support-ops':'SLA и распределение нагрузок проверены.','fake-project':'bad'},theme:'dark'};
 const progress=normalizeProgress(source);
 assert.deepEqual(progress.completed,['start-1','checkpoint-1a','portfolio-support-1']);
 assert.deepEqual(progress.read,['first-query']);
 assert.deepEqual(progress.drafts,{'start-1':'SELECT 1','portfolio-support-1':'SELECT 42'});
 assert.deepEqual(progress.projectNotes,{'support-ops':'SLA и распределение нагрузок проверены.'});
 assert.deepEqual(progress.review,{});
 const scheduled=normalizeProgress({review:{'recall-first':{level:3,nextDueAt:1770000000000,misses:2},bad:{level:999,nextDueAt:0}}});
 assert.deepEqual(scheduled.review,{'recall-first':{level:3,nextDueAt:1770000000000,misses:2}});
 assert.deepEqual(importProgress(exportProgress(scheduled)).review,scheduled.review);
 assert.deepEqual(importProgress(exportProgress(source)).projectNotes,progress.projectNotes);
 assert.deepEqual(normalizeProgress({version:1,completed:['start-1']}).projectNotes,{},'Older backup remains valid after new project notes are introduced');
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
  await base.exec(SUPPORT_SEED_SQL);
  await alt.exec(SUPPORT_SEED_SQL);
  await alt.exec(SUPPORT_ALTERNATE_SQL);
  const supportCounts=await base.query('SELECT (SELECT COUNT(*) FROM support.clients) AS clients,(SELECT COUNT(*) FROM support.agents) AS agents,(SELECT COUNT(*) FROM support.tickets) AS tickets,(SELECT COUNT(*) FROM support.ticket_events) AS events');
  assert.deepEqual(Object.values(supportCounts.rows[0]).map(Number),[6,5,16,38],'Initial project is an independent, grounded business dataset');
  const altSupportCounts=await alt.query('SELECT (SELECT COUNT(*) FROM support.clients) AS clients,(SELECT COUNT(*) FROM support.agents) AS agents,(SELECT COUNT(*) FROM support.tickets) AS tickets,(SELECT COUNT(*) FROM support.ticket_events) AS events');
  assert.deepEqual(Object.values(altSupportCounts.rows[0]).map(Number),[8,6,20,50],'Second dataset must change staff, clients, tickets and event history');
  const exactly60=await base.query("SELECT EXTRACT(EPOCH FROM ((SELECT MIN(event_at) FROM support.ticket_events WHERE ticket_id=3016 AND event_type='reply')-(SELECT opened_at FROM support.tickets WHERE ticket_id=3016)))/60 AS minutes");
  assert.equal(Number(exactly60.rows[0].minutes),60,'SLA cutoff must include the exact boundary');
  const rowCounts=await base.query('SELECT (SELECT COUNT(*) FROM orders) AS orders_count, (SELECT COUNT(*) FROM stores) AS stores_count');
  assert.equal(Number(rowCounts.rows[0].orders_count),18);
  assert.equal(Number(rowCounts.rows[0].stores_count),6);
  const prodCounts=await base.query('SELECT (SELECT COUNT(*) FROM app_users) AS users, (SELECT COUNT(*) FROM user_events) AS events');
  assert.equal(Number(prodCounts.rows[0].users),13);
  assert.equal(Number(prodCounts.rows[0].events),39);
  const noEvents=await base.query('SELECT COUNT(*) AS n FROM user_events WHERE user_id=15');
  assert.equal(Number(noEvents.rows[0].n),0,'Control user must have no events');
  const premature=await base.query("SELECT COUNT(*) AS n FROM user_events WHERE user_id=10 AND event_type='purchase' AND event_at < (SELECT MIN(event_at) FROM user_events WHERE user_id=10 AND event_type='view')");
  assert.equal(Number(premature.rows[0].n),1,'Strict funnel must detect purchase before first view');
  const events=await base.query('SELECT COUNT(*) AS n FROM order_events');
  const altEvents=await alt.query('SELECT COUNT(*) AS n FROM order_events');
  assert.equal(Number(events.rows[0].n),38,'The original data must have a meaningful order history');
  assert.equal(Number(altEvents.rows[0].n),46,'The changed data must contain extra history events');
  const cross=await base.query('SELECT COUNT(*) AS n FROM orders o JOIN order_items i ON i.order_id=o.order_id JOIN order_events e ON e.order_id=o.order_id WHERE o.order_id=1001');
  assert.equal(Number(cross.rows[0].n),4,'Two independent one-to-many joins must demonstrate 2×2 fanout');
  const duplicate=await base.query("SELECT COUNT(*) AS n FROM order_events WHERE order_id=1004 AND event_type='assigned'");
  assert.equal(Number(duplicate.rows[0].n),2,'The base fixture must contain a meaningful potential duplicate');
  const withoutHistory=await base.query('SELECT COUNT(*) AS n FROM order_events WHERE order_id=1014');
  assert.equal(Number(withoutHistory.rows[0].n),0,'The base fixture must include missing event history');
  for(const lesson of lessons){
    const observed=await queryReadOnly(base,lesson.example);
    assert.ok(observed.fields.length>0,lesson.id+' example must execute in actual PostgreSQL');
    const other=await queryReadOnly(alt,lesson.example);
    assert.ok(other.fields.length>0,lesson.id+' example must also execute on alternate data');
  }
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
  for(const skill of reviewSkills){
    for(const variant of skill.variants){
      const task={...variant,id:skill.id};
      const first=await queryReadOnly(base,variant.sql);
      const other=await queryReadOnly(alt,variant.sql);
      assert.ok(first.fields.length>0&&other.fields.length>0,skill.id+' retrieval variant must return SQL columns');
      assert.ok(first.rows.length>0&&other.rows.length>0,skill.id+' retrieval variant must be answerable on both PostgreSQL datasets');
      assert.equal((await gradeSQL(task,variant.sql,base,alt)).ok,true,skill.id+' variant '+variant.title);
    }
  }
  const brittle=await gradeSQL(independentProjectTaskById['portfolio-support-1'],
    'SELECT a.agent_id,a.agent_name,COUNT(t.ticket_id) AS tickets_count FROM support.agents a JOIN support.tickets t ON t.agent_id=a.agent_id GROUP BY a.agent_id,a.agent_name',base,alt);
  assert.equal(brittle.ok,false,'Project must reject a plausible but invalid INNER JOIN that drops agents without tickets');
  const oldBacklog=await queryReadOnly(base,independentProjectTaskById['portfolio-support-6'].sql);
  const newBacklog=await queryReadOnly(alt,independentProjectTaskById['portfolio-support-6'].sql);
  assert.equal(oldBacklog.rows.length+1,newBacklog.rows.length,'Alternate dataset must expose hard-coded overdue queue counts');
  const incorrect=await gradeSQL(taskById['filter-2'],"SELECT order_id,status FROM orders WHERE status='cancelled'",base,alt);
  assert.equal(incorrect.ok,false);
  await assert.rejects(()=>queryReadOnly(base,"WITH changed AS (UPDATE orders SET amount=0 RETURNING order_id) SELECT * FROM changed"),/read-only|read only|cannot execute/i);
  assert.equal((await base.query('SELECT amount FROM orders WHERE order_id=1001')).rows[0].amount,'1200.00');
 }finally{await base.close();await alt.close();}
});
