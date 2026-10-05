export function exportMembers(members) {
  const cell = value => {
    let text = String(value ?? "");
    if (/^[=+@\-\t\r\n]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows = [["Name", "Email", "Age", "Gender", "District", "Religion", "Membership"], ...members.map(m => [m.name, m.email, m.age, m.gender, m.district, m.religion, m.isPremium ? "Premium" : "Standard"])];
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url; link.download = "namakkal-matrimony-members.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
