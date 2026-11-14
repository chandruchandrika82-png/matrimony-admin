export const defaultCompanySettings = { name: "New Varan Kongu Thirumana Matrimony", address: "Namakkal", phone: "9344973982", website: "www.newvaran.com", logo: "" };
export function getCompanySettings() { try { return { ...defaultCompanySettings, ...JSON.parse(localStorage.getItem("companySettings") || "{}") }; } catch { return defaultCompanySettings; } }
export function saveCompanySettings(settings) { const next = { ...defaultCompanySettings, ...settings }; localStorage.setItem("companySettings", JSON.stringify(next)); return next; }
