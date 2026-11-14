import { interestRows } from './interests';
test('maps sender to receiver and accepted overrides stale pending entries', () => {
 const a={_id:'a',name:'A'}, b={_id:'b',name:'B',interestRequests:['a','a','missing','b'],acceptedRequests:[{_id:'a'}]};
 expect(interestRows([a,b])).toEqual([{key:JSON.stringify(['a','b']),sender:a,receiver:b,status:'Accepted'}]);
});
test('keeps reciprocal requests distinct and ignores admin and malformed arrays', () => {
 const a={_id:'a',interestRequests:['b','admin']},b={_id:'b',interestRequests:['a'],acceptedRequests:null};
 expect(interestRows([a,b,{_id:'admin',role:'admin',interestRequests:['a']}]).map(r=>r.status)).toEqual(['Pending','Pending']);
 expect(interestRows([{_id:'x',interestRequests:'invalid'}])).toEqual([]);
});
