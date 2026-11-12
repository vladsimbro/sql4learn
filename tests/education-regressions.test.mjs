import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {reviewSkills,reviewTask,advanceReview,REVIEW_INTERVALS_DAYS} from '../src/review-bank.js';
import {normalizeProgress,exportProgress,importProgress} from '../src/progress.js';
import {SUPPORT_SEED_SQL,SUPPORT_ALTERNATE_SQL} from '../src/project-data.js';
import {independentProjectTaskById} from '../src/portfolio.js';
import {gradeSQL,queryReadOnly} from '../src/sql.js';
import {lessonGuides} from '../src/lesson-guides.js';

test('Long-running review keeps rotating after interval mastery and survives backups',()=>{
 const skill=reviewSkills[0],now=Date.UTC(2026,10,12);
 let progress=normalizeProgress({completed:['start-1']});
 for(let round=0;round<12;round++){
  assert.equal(reviewTask(progress,skill).prompt,skill.variants[round%3].prompt);
  const current=progress.review[skill.id];
  const advanced=advanceReview(current,true,now);
  assert.equal(advanced.level,Math.min(round+1,4));
  assert.equal(advanced.nextDueAt-now,REVIEW_INTERVALS_DAYS[Math.min(round,3)]*86400000);
  progress=importProgress(exportProgress({...progress,review:{[skill.id]:advanced}}));
 }
 const before=reviewTask(progress,skill).prompt;
 progress.review[skill.id]=advanceReview(progress.review[skill.id],false,now);
 assert.equal(progress.review[skill.id].level,0);
 assert.equal(progress.review[skill.id].misses,1);
 assert.equal(reviewTask(progress,skill).prompt,before,'Errors should allow correction of the same exercise');
 const legacy=normalizeProgress({review:{[skill.id]:{level:4,nextDueAt:0,misses:0}}});
 assert.equal(reviewTask(legacy,skill).prompt,skill.variants[1].prompt,'Legacy saves retain their current exercise');
 legacy.review[skill.id]=advanceReview(legacy.review[skill.id],true,now);
 assert.equal(reviewTask(legacy,skill).prompt,skill.variants[2].prompt,'Legacy mastery starts rotating again');
});

test('JOIN prerequisite closure includes cardinality, aggregation, and NULL knowledge',()=>{
 const closure=new Set();
 const visit=id=>{for(const prerequisite of lessonGuides[id].requires){if(!closure.has(prerequisite)){closure.add(prerequisite);visit(prerequisite);}}};
 visit('inner');
 assert.ok(closure.has('keys-relations'));
 assert.ok(closure.has('group-by'));
 // LEFT JOIN practice relies on both grouping and missing-value semantics.
 visit('left');
 assert.ok(closure.has('aggr-basic'));
 assert.ok(closure.has('null-range'));
});

test('Support first reply ignores pre-open events, keeps unanswered tickets and accepts equivalent SQL',async()=>{
 const base=new PGlite(),alternate=new PGlite();
 try{
  await base.exec(SUPPORT_SEED_SQL);
  await alternate.exec(SUPPORT_SEED_SQL+SUPPORT_ALTERNATE_SQL);
  const replyTask=independentProjectTaskById['portfolio-support-2'];
  const slaTask=independentProjectTaskById['portfolio-support-3'];
  const result=await queryReadOnly(alternate,replyTask.sql);
  const row=id=>result.rows.find(item=>item.ticket_id===id);
  assert.equal(Number(row(3001).first_reply_minutes),18,'Early bad reply must not hide the first valid response');
  assert.equal(row(3017).first_reply_minutes,null,'Only pre-open replies mean no valid response');
  assert.equal(Number(row(3016).first_reply_minutes),60,'Exactly 60 minutes remains eligible');
  const summary=(await queryReadOnly(alternate,slaTask.sql)).rows.find(item=>item.agent_id===5);
  assert.deepEqual([summary.total_tickets,summary.met_sla,summary.unanswered].map(Number),[3,2,1]);
  const brittle="WITH r AS(SELECT ticket_id,MIN(event_at) FILTER(WHERE event_type='reply') AS first_reply FROM support.ticket_events GROUP BY ticket_id) SELECT t.ticket_id,ROUND(EXTRACT(EPOCH FROM (r.first_reply-t.opened_at))/60,1) AS first_reply_minutes FROM support.tickets t LEFT JOIN r ON r.ticket_id=t.ticket_id";
  const rejected=await gradeSQL(replyTask,brittle,base,alternate);
  assert.equal(rejected.ok,false);
  assert.equal(rejected.case,'alternate','The counterexample must distinguish a coincidentally correct base answer');
  const alternative="SELECT t.ticket_id,ROUND(EXTRACT(EPOCH FROM ((SELECT MIN(e.event_at) FROM support.ticket_events e WHERE e.ticket_id=t.ticket_id AND e.event_type='reply' AND e.event_at>=t.opened_at)-t.opened_at))/60,1) AS first_reply_minutes FROM support.tickets t";
  assert.equal((await gradeSQL(replyTask,alternative,base,alternate)).ok,true);
  // A response at the precise opening timestamp is a valid zero-minute reply.
  await alternate.exec("INSERT INTO support.ticket_events VALUES(53,3017,'2026-06-10 09:00','reply')");
  const immediate=(await queryReadOnly(alternate,replyTask.sql)).rows.find(item=>item.ticket_id===3017);
  assert.equal(Number(immediate.first_reply_minutes),0);
 }finally{await Promise.all([base.close(),alternate.close()]);}
});

test('Inventory reconciliation compares both balances at one instant and rejects stale physical counts',async()=>{
 const {INVENTORY_SEED_SQL,INVENTORY_ALTERNATE_SQL}=await import('../src/inventory-data.js');
 const base=new PGlite(),alternate=new PGlite();
 try{
  await base.exec(INVENTORY_SEED_SQL);
  await alternate.exec(INVENTORY_SEED_SQL+INVENTORY_ALTERNATE_SQL);
  const auditTask=independentProjectTaskById['portfolio-inventory-3'];
  const summaryTask=independentProjectTaskById['portfolio-inventory-6'];
  const books=await queryReadOnly(alternate,independentProjectTaskById['portfolio-inventory-1'].sql);
  assert.equal(Number(books.rows.find(row=>row.location_id===1&&row.product_id===101).book_qty),7);
  const result=await queryReadOnly(alternate,auditTask.sql);
  assert.ok(!result.rows.some(row=>row.location_id===1&&row.product_id===101),'Dispatch after the latest count changes both balances, not the discrepancy');
  const summary=(await queryReadOnly(alternate,summaryTask.sql)).rows.find(row=>row.location_id===1);
  assert.deepEqual([summary.counted_positions,summary.discrepant_positions,summary.absolute_gap_units].map(Number),[4,2,2]);
  const oldBook="WITH book AS (SELECT l.location_id,p.product_id,COALESCE(o.quantity,0)+COALESCE(m.qty,0) AS book_qty FROM inventory.locations l CROSS JOIN inventory.products p LEFT JOIN inventory.opening_stock o ON o.location_id=l.location_id AND o.product_id=p.product_id LEFT JOIN (SELECT location_id,product_id,SUM(delta) AS qty FROM inventory.movements WHERE moved_at>=TIMESTAMP '2026-08-01 00:00' AND moved_at<TIMESTAMP '2026-08-10 12:00' GROUP BY location_id,product_id) m ON m.location_id=l.location_id AND m.product_id=p.product_id), counted AS (SELECT location_id,product_id,physical_qty,ROW_NUMBER() OVER(PARTITION BY location_id,product_id ORDER BY counted_at DESC,count_id DESC) AS rn FROM inventory.stocktakes WHERE counted_at<TIMESTAMP '2026-08-10 12:00')";
  const oldAudit=oldBook+" SELECT b.location_id,b.product_id,b.book_qty,c.physical_qty,c.physical_qty-b.book_qty AS difference FROM book b JOIN counted c ON c.location_id=b.location_id AND c.product_id=b.product_id AND c.rn=1 WHERE c.physical_qty<>b.book_qty";
  const stale=await gradeSQL(auditTask,oldAudit,base,alternate);
  assert.equal(stale.ok,false);
  assert.equal(stale.case,'alternate','A stale-count solution coincidentally works on the old data but must fail the counterexample');
  const oldSummary=oldBook+", checked AS(SELECT b.location_id,b.product_id,ABS(c.physical_qty-b.book_qty) AS gap FROM book b JOIN counted c ON c.location_id=b.location_id AND c.product_id=b.product_id AND c.rn=1) SELECT l.location_id,COUNT(c.product_id) AS counted_positions,COUNT(c.product_id) FILTER(WHERE c.gap>0) AS discrepant_positions,COALESCE(SUM(c.gap),0) AS absolute_gap_units FROM inventory.locations l LEFT JOIN checked c ON c.location_id=l.location_id GROUP BY l.location_id";
  assert.equal((await gradeSQL(summaryTask,oldSummary,base,alternate)).ok,false);
  const equivalent="WITH latest AS(SELECT DISTINCT ON(location_id,product_id) location_id,product_id,counted_at,physical_qty FROM inventory.stocktakes WHERE counted_at<TIMESTAMP '2026-08-10 12:00' ORDER BY location_id,product_id,counted_at DESC,count_id DESC),balances AS(SELECT c.location_id,c.product_id,COALESCE((SELECT quantity FROM inventory.opening_stock o WHERE o.location_id=c.location_id AND o.product_id=c.product_id),0)+COALESCE((SELECT SUM(delta) FROM inventory.movements m WHERE m.location_id=c.location_id AND m.product_id=c.product_id AND m.moved_at>=TIMESTAMP '2026-08-01 00:00' AND m.moved_at<TIMESTAMP '2026-08-10 12:00'),0) AS book_qty,c.physical_qty+COALESCE((SELECT SUM(delta) FROM inventory.movements m WHERE m.location_id=c.location_id AND m.product_id=c.product_id AND m.moved_at>c.counted_at AND m.moved_at<TIMESTAMP '2026-08-10 12:00'),0) AS physical_qty FROM latest c) SELECT location_id,product_id,book_qty,physical_qty,physical_qty-book_qty AS difference FROM balances WHERE physical_qty<>book_qty";
  assert.equal((await gradeSQL(auditTask,equivalent,base,alternate)).ok,true,'DISTINCT ON and scalar subqueries are a valid alternative');
  // Same-timestamp movement is already included in the measurement; a later count wins ties.
  // A new measurement exactly at cutoff is outside the report, as is the seed's 12:00 movement.
  await alternate.exec("INSERT INTO inventory.movements VALUES(23,1,101,'2026-08-10 11:55',3,'receipt'); INSERT INTO inventory.stocktakes VALUES(19,1,101,'2026-08-10 11:55',12),(20,1,101,'2026-08-10 12:00',999)");
  const boundary=await queryReadOnly(alternate,auditTask.sql);
  assert.ok(!boundary.rows.some(row=>row.location_id===1&&row.product_id===101),'Do not double-count a movement already included in a tied latest measurement');
  assert.equal((await gradeSQL(auditTask,equivalent,base,alternate)).ok,true);
 }finally{await Promise.all([base.close(),alternate.close()]);}
});
