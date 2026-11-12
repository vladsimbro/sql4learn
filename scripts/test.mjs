import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

// The browser suite is a separate step: it needs a running static server.
const tests=(await readdir(new URL('../tests/',import.meta.url)))
  .filter(name=>name.endsWith('.test.mjs')&&name!=='browser.test.mjs')
  .sort().map(name=>new URL('../tests/'+name,import.meta.url).pathname);
if(!tests.length)throw new Error('No unit/SQL tests found.');
// Each SQL test process creates WASM databases. Serialize files to bound CI memory.
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...tests],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
