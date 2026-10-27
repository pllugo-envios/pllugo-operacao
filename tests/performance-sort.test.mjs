import test from 'node:test';
import assert from 'node:assert/strict';
import {sortPerformance} from '../lib/performance-sort.ts';
const row=(id,total,done,overdue,known,onTime)=>({id,name:id,mine:Array(total),r:{done:Array(done),overdue:Array(overdue)},known:Array(known),onTime});
const rows=[row('A',5,4,1,4,2),row('B',10,5,3,5,5),row('C',2,0,0,0,0),row('Z',0,0,0,0,0)];
test('defaults to completion descending and does not mutate the source',()=>{
 assert.deepEqual(sortPerformance([...rows].reverse()).map(r=>r.id),['A','B','C','Z']);assert.deepEqual(rows.map(r=>r.id),['A','B','C','Z']);
});
test('all four metrics support both directions; missing metrics stay last',()=>{
 const expected={completion:[['A','B','C','Z'],['C','B','A','Z']],done:[['B','A','C','Z'],['C','A','B','Z']],overdue:[['B','A','C','Z'],['C','A','B','Z']],onTime:[['B','A','C','Z'],['A','B','C','Z']]};
 for(const [key,[desc,asc]] of Object.entries(expected)){assert.deepEqual(sortPerformance(rows,key,'desc').map(r=>r.id),desc);assert.deepEqual(sortPerformance(rows,key,'asc').map(r=>r.id),asc)}
 const ties=[row('José',3,1,1,1,1),row('Ana',3,1,1,1,1)];assert.deepEqual(sortPerformance(ties).map(r=>r.id),['Ana','José']);
});
