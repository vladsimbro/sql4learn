import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const context=await browser.newContext({viewport:{width:1400,height:900},reducedMotion:'reduce'});
const page=await context.newPage();
const ready=()=>page.locator('#engine-status.ready').waitFor({timeout:120000});
const run=async sql=>{
 await page.locator('#sql-editor').fill(sql);
 await page.locator('[data-action="run"]').click();
};
try{
 // The practice engine must work with third-party CDNs unavailable.
 await context.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto(base+'#/playground');await ready();
 await run('SELECT generate_series(1,1001) AS n');
 await page.locator('#task-feedback .error').waitFor();
 assert.match(await page.locator('#task-feedback').innerText(),/1000/);
 await run('SELECT missing_column FROM orders');
 await page.locator('#task-feedback .error').waitFor();
 await run('SELECT COUNT(*) AS total FROM orders');
 await page.locator('#task-result td').waitFor();
 assert.equal((await page.locator('#task-result td').first().innerText()).trim(),'18');

 await run('SELECT pg_sleep(30)');
 // A responsive main thread must process keyboard/focus/theme actions during WASM SQL.
 const theme=await page.locator('html').getAttribute('data-theme');
 await page.locator('#theme-toggle').click({timeout:2500});
 assert.notEqual(await page.locator('html').getAttribute('data-theme'),theme);
 await page.locator('#task-feedback .error').waitFor({timeout:15000});
 assert.match(await page.locator('#task-feedback').innerText(),/время выполнения/);
 await ready();
 await run('SELECT COUNT(*) AS total FROM orders');
 await page.locator('#task-result td').waitFor();
 assert.equal((await page.locator('#task-result td').first().innerText()).trim(),'18','A hard timeout must recreate intact training data');

 // Completing a query on the previous page must not overwrite another exercise.
 await run('SELECT pg_sleep(2)');
 await page.evaluate(()=>{location.hash='#/lesson/first-query';});
 await page.locator('.lesson-goal').waitFor();
 await page.waitForTimeout(2400);
 assert.equal(await page.locator('#task-feedback').innerText(),'');
 assert.match(await page.title(),/SQL4Learn/);

 // Skip navigation must focus the main without changing the course route.
 const route=await page.evaluate(()=>location.hash);
 await page.locator('.skip-link').focus();
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>location.hash),route);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'app');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#menu-toggle').click();
 assert.ok(await page.locator('#sidebar a').first().evaluate(el=>el===document.activeElement));
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'menu-toggle');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page must not overflow horizontally');

 await page.setViewportSize({width:1400,height:900});
 for(const theme of ['light','dark']){
  for(const hash of ['#/home','#/lesson/first-query','#/playground']){
   await page.evaluate(hash=>{location.hash=hash;},hash);
   await page.locator('h1').waitFor();
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   assert.deepEqual(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],theme+' '+hash+' automated accessibility violations');
  }
 }
 // A failed initialization offers an actual retry, while lessons remain readable.
 const broken=await context.newPage();
 await broken.route('**/vendor/pglite/**',route=>route.abort());
 await broken.goto(base+'#/lesson/first-query');
 await broken.locator('#engine-status.failed').waitFor({timeout:120000});
 await broken.locator('.lesson-goal').waitFor();
 await broken.unroute('**/vendor/pglite/**');
 await broken.locator('[data-action="retry-engine"]').click();
 await broken.locator('#engine-status.ready').waitFor({timeout:120000});
 await broken.close();
 const storage=await context.newPage();
 await storage.addInitScript(()=>{
  const set=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(key==='sql4learn-progress-v1')throw new DOMException('Quota exceeded','QuotaExceededError');
   return set.call(this,key,value);
  };
 });
 await storage.goto(base+'#/lesson/first-query');
 await storage.locator('#engine-status.ready').waitFor({timeout:120000});
 await storage.locator('#sql-editor').fill('SELECT 12 * 8 AS total;');
 await storage.locator('#storage-warning').waitFor({state:'visible'});
 assert.match(await storage.locator('#storage-warning').innerText(),/только в этой вкладке/);
 const downloadPromise=storage.waitForEvent('download');
 await storage.locator('#storage-export').click();
 const download=await downloadPromise;
 const stream=await download.createReadStream();let backup='';
 for await(const chunk of stream)backup+=chunk;
 assert.equal(JSON.parse(backup).progress.drafts['start-1'],'SELECT 12 * 8 AS total;','Export preserves progress even when browser storage refuses writes');
 await storage.close();
 console.log('Runtime browser checks passed: local engine, limits, hard timeout/recovery, stale results, keyboard/mobile and axe in both themes.');
}finally{await browser.close();}
