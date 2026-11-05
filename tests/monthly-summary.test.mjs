import test from 'node:test';
import assert from 'node:assert/strict';
import {currentMonth,monthlySummary} from '../lib/monthly-summary.ts';
test('current month follows Brasília at midnight and year boundaries',()=>{
 assert.equal(currentMonth(new Date('2026-12-01T01:30:00Z')).key,'2026-11');assert.equal(currentMonth(new Date('2026-12-01T03:00:00Z')).start,'2026-12-01');assert.equal(currentMonth(new Date('2027-01-01T03:00:00Z')).key,'2027-01');
});
test('monthly totals prefer official J&T per unit without dropping the preview of another unit or counting both',()=>{
 const rows=[{date:'2026-11-01',source:'jt',by_unit:{maua:{total:100,entregues:60},rbp:{total:50,entregues:40}},updated_at:'2026-11-01T21:00:00Z'},{date:'2026-11-01',source:'jt_real',by_unit:{maua:{total:100,entregues:90}},updated_at:'2026-11-02T00:00:00Z'},{date:'2026-11-01',source:'imile',by_unit:{maua:{total:50,entregues:40}}},{date:'2026-11-02',source:'imile',by_unit:{rbp:{total:100,entregues:100}}},{date:'2026-10-31',source:'imile',total:99999,entregues:99999}];
 const result=monthlySummary(rows,'2026-11');assert.equal(result.volume,300);assert.equal(result.delivered,270);assert.equal(result.rate,90);assert.equal(result.days,2);assert.equal(result.provisional,true);assert.equal(result.updatedAt,'2026-11-02T00:00:00Z');assert.deepEqual(result.units.map(u=>[u.key,u.volume,u.delivered]),[['maua',150,130],['rbp',150,140]]);
});
test('empty months are empty, unit two does not inherit another unit, and scoped results stay scoped',()=>{
 assert.equal(monthlySummary([],'2026-11').days,0);const result=monthlySummary([{date:'2026-11-01',source:'imile',total:1000,entregues:1000,by_unit:{maua2:{total:5,entregues:4}}}],'2026-11');assert.equal(result.volume,5);assert.deepEqual(result.units.map(u=>u.key),['maua2']);assert.equal(result.rate,80);
});
