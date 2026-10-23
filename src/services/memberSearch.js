export function matchesMemberSearch(member, query) {
  const search = query.trim().toLowerCase();
  return !search || String(member.age ?? "") === search || [member.name, member.email, member.district, member.religion].some(value => String(value || "").toLowerCase().includes(search));
}
