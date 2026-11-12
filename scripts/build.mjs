import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const target=new URL('../dist/',import.meta.url);
const packageInfo=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const runtimeRoot=new URL('../node_modules/@electric-sql/pglite/',import.meta.url);
const runtimeInfo=JSON.parse(await readFile(new URL('package.json',runtimeRoot),'utf8'));
if(runtimeInfo.version!==packageInfo.devDependencies['@electric-sql/pglite'])
  throw new Error('Installed PGlite differs from the pinned package version. Run npm ci.');

await rm(target,{recursive:true,force:true});
await mkdir(new URL('vendor/pglite/',target),{recursive:true});
// An explicit allowlist prevents publishing node_modules, tests, logs or local files.
for(const file of ['index.html','styles.css','favicon.svg'])
  await cp(new URL('../'+file,import.meta.url),new URL(file,target));
await mkdir(new URL('src/',target));
for(const file of await readdir(new URL('../src/',import.meta.url)))
  if(file.endsWith('.js'))await cp(new URL('../src/'+file,import.meta.url),new URL('src/'+file,target));

// PGlite resolves its JS chunks, initdb WASM and data image relative to itself.
// No extension archives, CommonJS builds, source maps or development types are shipped.
for(const file of await readdir(new URL('dist/',runtimeRoot)))
  if(/\.(js|wasm|data)$/.test(file))
    await cp(new URL('dist/'+file,runtimeRoot),new URL('vendor/pglite/'+file,target));
await cp(new URL('LICENSE',runtimeRoot),new URL('vendor/pglite/LICENSE',target));
await writeFile(new URL('.nojekyll',target),'');
let commit=process.env.GITHUB_SHA||'';
if(!commit){try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}}
await writeFile(new URL('release.json',target),JSON.stringify({
  product:'SQL4Learn',version:packageInfo.version,
  commit:/^[a-f0-9]{40}$/.test(commit)?commit:null,
  pglite:runtimeInfo.version
},null,2)+'\n');
console.log('Built dist/: application and local PGlite '+runtimeInfo.version+'.');
