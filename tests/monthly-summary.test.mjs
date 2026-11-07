import test from 'node:test';
import assert from 'node:assert/strict';
import {currentMonth,monthlySummary,dailySummary,closedMonthSummary} from '../lib/monthly-summary.ts';
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

test('daily summary uses only today and never falls back to the last report',()=>{
 const rows=[{date:'2026-11-04',source:'jt',total:10000,entregues:10000},{date:'2026-11-05',source:'jt',by_unit:{rbp:{total:100,entregues:60}}},{date:'2026-11-05',source:'jt_real',by_unit:{rbp:{total:100,entregues:80}}},{date:'2026-11-05',source:'imile',by_unit:{rbp:{total:50,entregues:40}}}];
 const today=dailySummary(rows,'2026-11-05');assert.equal(today.volume,150);assert.equal(today.delivered,120);assert.equal(today.rate,80);assert.equal(dailySummary(rows,'2026-11-06').days,0);
});

test('month rate excludes today and future dates and weights closed days by volume',()=>{
 const rows=[{date:'2026-11-01',source:'jt',by_unit:{rbp:{total:100,entregues:20}}},{date:'2026-11-01',source:'jt_real',by_unit:{rbp:{total:100,entregues:90}}},{date:'2026-11-06',source:'imile',by_unit:{rbp:{total:300,entregues:270}}},{date:'2026-11-07',source:'imile',by_unit:{rbp:{total:10000,entregues:1}}},{date:'2026-11-08',source:'imile',total:999,entregues:0}];
 const closed=closedMonthSummary(rows,'2026-11-07');assert.equal(closed.volume,400);assert.equal(closed.delivered,360);assert.equal(closed.rate,90);assert.equal(closed.units[0].rate,90);
 rows[3].by_unit.rbp.entregues=9999;assert.equal(closedMonthSummary(rows,'2026-11-07').rate,90);
});

test('first day has no closed monthly rate and cutoff follows Brasília across months and leap years',()=>{
 assert.equal(closedMonthSummary([{date:'2026-10-31',source:'imile',total:100,entregues:100},{date:'2026-11-01',source:'imile',total:100,entregues:0}],'2026-11-01').days,0);
 assert.equal(currentMonth(new Date('2027-01-01T03:00:00Z')).closedThrough,'2026-12-31');
 assert.equal(currentMonth(new Date('2028-03-01T03:00:00Z')).closedThrough,'2028-02-29');
 assert.equal(currentMonth(new Date('2026-11-07T02:59:00Z')).closedThrough,'2026-11-05');
});
