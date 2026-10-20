import {build} from 'esbuild';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist/assets',{recursive:true});
await cp('public','dist',{recursive:true});
await writeFile('dist/.nojekyll','');
await build({entryPoints:['src/main.tsx'],bundle:true,format:'esm',platform:'browser',target:['es2020'],minify:true,
  outdir:'dist/assets',entryNames:'app-[hash]',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  logLevel:'info'}).then(async result=>{
    const outputs=Object.keys(result.metafile.outputs);
    const javascript=outputs.find(path=>path.endsWith('.js')).replace(/^dist\//,'');
    const stylesheet=outputs.find(path=>path.endsWith('.css')).replace(/^dist\//,'');
    const html=(await readFile('index.html','utf8')).replace('assets/app.js',javascript).replace('assets/app.css',stylesheet);
    await writeFile('dist/index.html',html);
    await writeFile('dist/build-manifest.json',JSON.stringify({inputs:Object.keys(result.metafile.inputs)},null,2));
  });
