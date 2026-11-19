import test from 'node:test';
import assert from 'node:assert/strict';
import {personalTasks,personalSummary,personalInsights,dueSoon} from '../lib/personal-tasks.ts';
test('personal home excludes other people, units, deleted tasks and other days',()=>{
 const task={kind:'task',date:'2026-11-19',unit:'U1',assigneeId:'a',time:'12:00',status:'pending'};
 const user={id:'a',units:['U1']};
 const rows=personalTasks([task,{...task,assigneeId:'b'},{...task,unit:'U2'},{...task,date:'2026-11-18'},{...task,deleted:true},{...task,kind:'template'},{...task,time:'09:00',status:'done'}],user,task.date);
 assert.equal(rows.length,2);assert.equal(rows[0].status,'done');
 assert.deepEqual(personalSummary(rows,'13:00'),{total:2,completed:1,pending:1,overdue:1,percent:50});
 assert.equal(personalSummary([],'13:00').percent,0);
});
test('planning indicators count only pending requirements and respect hour boundaries',()=>{
 const pending={status:'pending',client:'iMile',time:'12:00',minPhotos:3,photos:['a']};
 const rows=[pending,{...pending,time:'12:30',status:'done'},{...pending,client:'J&T',time:'13:01',minPhotos:1,photos:['a','b']},{...pending,time:'10:00',minPhotos:2,photos:[]}];
 const result=personalInsights(rows,'12:00');
 assert.equal(result.dueSoon,1);assert.equal(result.nextDeadline,'12:00');assert.equal(result.photosRemaining,4);
 assert.deepEqual(result.periods.map(p=>p.total),[1,3,0]);assert.equal(result.clients.reduce((n,c)=>n+c.total,0),4);
 assert.equal(dueSoon({...pending,time:'13:00'},'12:00'),true);assert.equal(dueSoon({...pending,time:'11:59'},'12:00'),false);
 assert.equal(dueSoon({...pending,time:'00:10'},'23:30'),false);assert.equal(dueSoon({...pending,status:'done'},'12:00'),false);
 assert.equal(personalInsights([],'12:00').nextDeadline,null);
});
