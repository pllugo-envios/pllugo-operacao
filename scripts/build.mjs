import {build} from 'esbuild';
import {cp,mkdir,writeFile} from 'node:fs/promises';
await mkdir('dist/assets',{recursive:true});
await cp('public','dist',{recursive:true});
await cp('index.html','dist/index.html');
await writeFile('dist/.nojekyll','');
await build({entryPoints:['src/main.tsx'],bundle:true,format:'esm',platform:'browser',target:['es2020'],minify:true,
  outfile:'dist/assets/app.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  logLevel:'info'}).then(async result=>writeFile('dist/build-manifest.json',JSON.stringify({inputs:Object.keys(result.metafile.inputs)},null,2)));
