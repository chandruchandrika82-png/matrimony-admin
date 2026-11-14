const idOf = value => String(value?._id || value || '');
export function interestRows(members) {
  const users = members.filter(m => m.role !== 'admin');
  const index = new Map(users.map(m => [idOf(m), m]));
  const rows = new Map();
  for (const receiver of users) {
    for (const [field, status] of [['interestRequests', 'Pending'], ['acceptedRequests', 'Accepted']]) {
      for (const reference of Array.isArray(receiver[field]) ? receiver[field] : []) {
        const sender = index.get(idOf(reference));
        if (!sender || sender === receiver) continue;
        const key = JSON.stringify([idOf(sender), idOf(receiver)]);
        if (rows.get(key)?.status === 'Accepted') continue;
        rows.set(key, { key, sender, receiver, status });
      }
    }
  }
  return [...rows.values()];
}
