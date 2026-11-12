import test from 'node:test';
import assert from 'node:assert/strict';

let instance=0;
const freshProgress=()=>import('../src/progress.js?storage-test='+instance++);
async function withStorage(descriptor,run){
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,...descriptor});
 try{await run();}
 finally{
  if(original)Object.defineProperty(globalThis,'localStorage',original);
  else delete globalThis.localStorage;
 }
}
const unavailable=()=>{const error=new Error('Storage blocked');error.name='SecurityError';throw error;};

test('Unavailable browser storage reports an actionable warning and preserves in-memory progress',async()=>{
 await withStorage({get:unavailable},async()=>{
  const {loadProgress,storeProgress,progressStorageStatus}=await freshProgress();
  const progress=loadProgress();
  assert.deepEqual(progress.completed,[]);
  assert.match(progressStorageStatus(),/Не удалось прочитать прогресс/);
  progress.completed.push('start-1');
  const normalized=storeProgress(progress);
  assert.deepEqual(normalized.completed,['start-1']);
  assert.match(progressStorageStatus(),/Не удалось сохранить прогресс/);
  assert.match(progressStorageStatus(),/Экспортируйте прогресс/);
 });
});

test('Quota failure is visible; a successful later write clears only the write warning',async()=>{
 const records=new Map();let blocked=true;
 await withStorage({value:{
  getItem:key=>records.get(key)||null,
  setItem:(key,value)=>{
   if(blocked){const error=new Error('Quota');error.name='QuotaExceededError';throw error;}
   records.set(key,value);
  }
 }},async()=>{
  const {STORAGE_KEY,loadProgress,storeProgress,progressStorageStatus}=await freshProgress();
  const progress=loadProgress();
  assert.equal(progressStorageStatus(),'');
  progress.completed=['start-1','start-1','unknown-task'];
  const normalized=storeProgress(progress);
  assert.deepEqual(normalized.completed,['start-1']);
  assert.match(progressStorageStatus(),/Хранилище браузера заполнено/);
  assert.equal(records.has(STORAGE_KEY),false);
  blocked=false;
  const saved=storeProgress(normalized);
  assert.equal(progressStorageStatus(),'');
  assert.deepEqual(JSON.parse(records.get(STORAGE_KEY)),saved);
 });
});

test('Corrupt saved JSON is not overwritten on load and its warning survives later successful writes',async()=>{
 const records=new Map([['sql4learn-progress-v1','{broken json']]);
 await withStorage({value:{getItem:key=>records.get(key)||null,setItem:(key,value)=>records.set(key,value)}},async()=>{
  const {STORAGE_KEY,loadProgress,storeProgress,progressStorageStatus}=await freshProgress();
  const progress=loadProgress();
  assert.deepEqual(progress.completed,[]);
  assert.equal(records.get(STORAGE_KEY),'{broken json');
  const warning=progressStorageStatus();
  assert.match(warning,/Сохранённый прогресс повреждён/);
  assert.match(warning,/резервная копия/);
  progress.completed=['start-1'];
  storeProgress(progress);
  assert.deepEqual(JSON.parse(records.get(STORAGE_KEY)).completed,['start-1']);
  assert.equal(progressStorageStatus(),warning,'Writing new results does not recover the corrupt old results');
 });
});

test('Unsupported saved version produces the recovery warning instead of throwing',async()=>{
 await withStorage({value:{getItem:()=>JSON.stringify({version:99}),setItem:()=>{}}},async()=>{
  const {loadProgress,progressStorageStatus}=await freshProgress();
  assert.equal(loadProgress().version,1);
  assert.match(progressStorageStatus(),/неподдерживаемый формат/);
 });
});

test('Storage test mocks restore the original global property even after a failure',async()=>{
 const before=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 await assert.rejects(withStorage({value:{}},async()=>{throw new Error('Expected test interruption');}),/Expected test interruption/);
 assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis,'localStorage'),before);
});
