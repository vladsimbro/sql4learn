import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderPage} from '../src/views.js';
import {initialProgress} from '../src/progress.js';
import {modules,lessons,tasks} from '../src/content.js';
import {assessments} from '../src/assessments.js';
import {independentProjects} from '../src/portfolio.js';
import {clinicTasks} from '../src/clinic.js';

const groups={module:modules,lesson:lessons,task:tasks,exam:assessments,project:independentProjects,fix:clinicTasks};
const pages=['home','course','practice','review','recall','projects','playground','xray','clinic'];
const routes=[...pages.map(page=>({page})),...Object.entries(groups).flatMap(([page,items])=>items.map(({id})=>({page,id})))];
const state={progress:initialProgress(),engineReady:true,schema:'orders',filter:'all',activeTaskId:null,result:null,playground:'',xrayScenario:'join-fanout',xrayStep:0};
const valid=new Set(routes.map(({page,id})=>'#/'+page+(id?'/'+id:'')));
test('Every rendered curriculum link targets an existing route and page IDs are unique',async()=>{
 const documents=[{name:'shell',html:await readFile(new URL('../index.html',import.meta.url),'utf8')},...routes.map(route=>({name:JSON.stringify(route),html:renderPage({...state,route},route).html}))];
 for(const {name,html} of documents){
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,name+' contains duplicated DOM identifiers');
  for(const match of html.matchAll(/href="(#[^"]+)"/g)){
   if(match[1]==='#app')continue;
   assert.ok(valid.has(match[1]),name+' has a broken route '+match[1]);
  }
 }
});
test('Unknown routes and identifiers render an honest not-found page',()=>{
 for(const route of [{page:'missing'},...Object.keys(groups).map(page=>({page,id:'missing'}))])
  assert.match(renderPage({...state,route},route).html,/Раздел не найден/);
});
