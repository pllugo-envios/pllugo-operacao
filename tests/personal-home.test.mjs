import test from 'node:test';
import assert from 'node:assert/strict';
import {personalTasks,personalSummary} from '../lib/personal-tasks.ts';
test('personal home excludes other people, units, deleted tasks and other days',()=>{
 const task={kind:'task',date:'2026-11-19',unit:'U1',assigneeId:'a',time:'12:00',status:'pending'};
 const user={id:'a',units:['U1']};
 const rows=personalTasks([task,{...task,assigneeId:'b'},{...task,unit:'U2'},{...task,date:'2026-11-18'},{...task,deleted:true},{...task,kind:'template'},{...task,time:'09:00',status:'done'}],user,task.date);
 assert.equal(rows.length,2);assert.equal(rows[0].status,'done');
 assert.deepEqual(personalSummary(rows,'13:00'),{total:2,completed:1,pending:1,overdue:1,percent:50});
 assert.equal(personalSummary([],'13:00').percent,0);
});
