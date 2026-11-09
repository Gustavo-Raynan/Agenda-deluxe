// Configuração pública do Supabase (chave publicável — pode ficar no front-end;
// a segurança é feita pelas regras RLS e funções no banco).
window.AD_CONFIG = {
  SUPABASE_URL: "https://izpsmlbfponhqwzjodyf.supabase.co",
  SUPABASE_KEY: "sb_publishable_AvyHVWMBYWUlw5SRiDJt3w_KH2eIhbm",
  PRECO_MENSAL: 20,
};
window.sb = window.supabase.createClient(AD_CONFIG.SUPABASE_URL, AD_CONFIG.SUPABASE_KEY);

// Utilitários compartilhados
window.AD = {
  TZ: "America/Sao_Paulo",
  base() { return location.origin + location.pathname.replace(/[^/]*$/, ""); },
  esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
  brl(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); },
  hora(d) { return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: this.TZ }); },
  dataLonga(d) { return new Date(d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: this.TZ }); },
  dataCurta(d) { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: this.TZ }); },
  // data (YYYY-MM-DD) no fuso de São Paulo
  isoDia(d = new Date()) { return new Date(d).toLocaleDateString("en-CA", { timeZone: this.TZ }); },
  somaDias(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); },
  // início/fim do dia em São Paulo como ISO (UTC-3, sem horário de verão)
  inicioDia(iso) { return new Date(iso + "T00:00:00-03:00").toISOString(); },
  zap(n) { n = String(n || "").replace(/\D/g, ""); if (n.length <= 11) n = "55" + n; return n; },
  toast(msg, erro) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.className = "show" + (erro ? " erro" : "");
    clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 3500);
  },
  erro(e) {
    const m = e?.message || String(e);
    if (m.includes("ad_sem_conflito")) return "Já existe um agendamento nesse horário.";
    if (m.includes("ad_profissionais_slug_key") || m.includes("duplicate key")) return "Esse link já está em uso. Escolha outro.";
    if (m.includes("Invalid login")) return "E-mail ou senha incorretos.";
    if (m.includes("Email not confirmed")) return "Confirme seu e-mail pelo link que enviamos.";
    return m;
  },
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
