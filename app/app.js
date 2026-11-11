// Nay Nails Gestão — app de gestão do salão (mesma agenda do site de agendamento)
"use strict";
const SUPA_URL = "https://izpsmlbfponhqwzjodyf.supabase.co";
const SUPA_KEY = "sb_publishable_AvyHVWMBYWUlw5SRiDJt3w_KH2eIhbm";
const SITE = "https://agenda-deluxe.pages.dev/nayara/";
const CONFIRMAR = "https://agenda-deluxe.pages.dev/confirmar?id=";
const GOOGLE = "https://share.google/AJ7Rs87t4wpcrDhNh";
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);
// Cada app mostra só os dados do próprio salão (uma mesma conta pode ter acesso a mais de um salão)
const ESCOPO_SALAO = new Set(["ad_agendamentos", "ad_avisos", "ad_bloqueios", "ad_clientes", "ad_equipe", "ad_fidelidade", "ad_horarios", "ad_lancamentos", "ad_loja", "ad_movimentos", "ad_pagamentos", "ad_pedidos", "ad_produtos", "ad_servicos"]);
{
  const _from = sb.from.bind(sb);
  sb.from = (t) => {
    const b = _from(t);
    if (!ESCOPO_SALAO.has(t)) return b;
    const filtra = (r) => (st.prof ? r.eq("profissional_id", st.prof.id) : r);
    return { select: (...a) => filtra(b.select(...a)), update: (...a) => filtra(b.update(...a)), delete: (...a) => filtra(b.delete(...a)), insert: (...a) => b.insert(...a), upsert: (...a) => b.upsert(...a) };
  };
}

const TZ = "America/Sao_Paulo";

// ---------- utilidades ----------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hora = (d) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const dataCurta = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: TZ });
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const dataLonga = (d) => cap(new Date(d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }));
const diaSemana = (d) => cap(new Date(d).toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ }));
const isoDia = (d = new Date()) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
const somaDias = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const inicioDia = (iso) => new Date(iso + "T00:00:00-03:00").toISOString();
const meioDia = (iso) => new Date(iso + "T12:00:00Z");
const dur = (m) => (m < 60 ? m + " min" : Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : ""));
const zapNum = (n) => { n = String(n || "").replace(/\D/g, ""); return n.length <= 11 ? "55" + n : n; };
const fmtTel = (z) => { z = String(z || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""); return z.length >= 10 ? `(${z.slice(0, 2)}) ${z.slice(2, -4)}-${z.slice(-4)}` : z; };
const iniciais = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0];
const STATUS = { marcado: "A confirmar", confirmado: "Confirmado", chegou: "Chegou", atendendo: "Em atendimento", concluido: "Concluído", faltou: "Não compareceu", cancelado: "Cancelado" };
const FORMAS = { pix: "Pix", dinheiro: "Dinheiro", credito: "Cartão de crédito", debito: "Cartão de débito", outro: "Outro" };
const SEM3 = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SEM = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ATIVOS = ["marcado", "confirmado", "chegou", "atendendo"];

const IC = {
  mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  agenda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  cliente: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M19 3v4M17 5h4"/></svg>',
  bloqueio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
  dinheiro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="13" rx="3"/><circle cx="12" cy="12.5" r="2.5"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>',
  local: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  tesoura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  sino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>',
  salao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/></svg>',
  sair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/></svg>',
  cadeado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>',
  lua: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  estrela: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  baixar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
};

function toast(msg, erro) {
  const t = $("toast"); t.textContent = msg; t.className = "on" + (erro ? " erro" : "");
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 3200);
}
function erroMsg(e) {
  const m = e?.message || String(e);
  if (m.includes("ad_sem_conflito")) return "Já existe um atendimento nesse horário.";
  if (m.includes("Invalid login")) return "E-mail ou senha incorretos. Se nunca entrou, toque em \"Primeiro acesso\".";
  if (m.includes("Email not confirmed")) return "Confirme seu e-mail pelo link que enviamos e tente de novo.";
  if (m.includes("already registered")) return "Esse e-mail já tem conta. Entre ou use \"Esqueci minha senha\".";
  if (/weak|Password should/i.test(m)) return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
  if (m.includes("valid email") || m.includes("invalid format")) return "Confira o e-mail digitado.";
  if (m.includes("Failed to fetch")) return "Sem internet. Tente de novo.";
  return m;
}
async function q(promessa) { const { data, error } = await promessa; if (error) { toast(erroMsg(error), 1); throw error; } return data; }

function abreZap(url) { const w = window.open(url, "_blank"); if (!w) location.href = url; }

// ---------- folha (detalhes e formulários) ----------
const pilhaFolha = [];
function abreFolha(html, aoAbrir) {
  $("folha-conteudo").innerHTML = html;
  $("folha").classList.add("on"); $("fundo").classList.add("on");
  $("folha").scrollTop = 0;
  $("folha-conteudo").querySelectorAll("[data-fechar]").forEach((b) => (b.onclick = fechaFolha));
  aoAbrir && aoAbrir($("folha-conteudo"));
}
function fechaFolha() { $("folha").classList.remove("on"); $("fundo").classList.remove("on"); if (location.hash) history.replaceState(null, "", location.pathname); if (st.pendente) { st.pendente = false; setTimeout(() => atualizaSilencioso(), 350); } }
$("fundo").onclick = fechaFolha;
const cabFolha = (titulo, sub) => `<div class="cab"><div class="cresce"><h2>${titulo}</h2>${sub ? `<p class="mudo" style="margin-top:4px">${sub}</p>` : ""}</div><button class="fechar" data-fechar aria-label="Fechar">✕</button></div>`;

// ---------- estado ----------
const st = { user: null, prof: null, aba: "inicio", servicos: [], agendaModo: "dia", dia: isoDia(), mes: isoDia().slice(0, 7), caixaPer: "hoje", busca: "", naoLidos: 0 };

// ---------- entrar ----------
$("l-entrar").onclick = async () => {
  const email = $("l-email").value.trim(), password = $("l-senha").value;
  if (!email || !password) return toast("Preencha e-mail e senha.", 1);
  $("l-entrar").disabled = true;
  if (modoCriar) {
    if (password.length < 8) { $("l-entrar").disabled = false; return toast("A senha precisa ter pelo menos 8 caracteres.", 1); }
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
    $("l-entrar").disabled = false;
    if (error) return toast(erroMsg(error), 1);
    if (data.user && data.user.identities && data.user.identities.length === 0) return toast("Esse e-mail já tem conta. Toque em \"Já tenho conta\" e entre, ou use \"Esqueci minha senha\".", 1);
    if (!data.session) return toast("Conta criada! Abra o e-mail que enviamos para confirmar e depois entre aqui.");
    return;
  }
  const { error } = await sb.auth.signInWithPassword({ email, password });
  $("l-entrar").disabled = false;
  if (error) toast(erroMsg(error), 1);
};
$("l-senha").addEventListener("keydown", (e) => { if (e.key === "Enter") $("l-entrar").click(); });
$("l-email").addEventListener("keydown", (e) => { if (e.key === "Enter") $("l-senha").focus(); });
let modoCriar = false;
$("l-criar").onclick = () => {
  modoCriar = !modoCriar;
  $("l-titulo-form").textContent = modoCriar ? "Criar minha conta" : "Entrar";
  $("l-entrar").textContent = modoCriar ? "Criar conta" : "Entrar";
  $("l-criar").textContent = modoCriar ? "Já tenho conta — entrar" : "Primeiro acesso? Criar minha conta";
  $("l-senha").autocomplete = modoCriar ? "new-password" : "current-password";
  $("l-senha").placeholder = modoCriar ? "Crie uma senha (mínimo 8 caracteres)" : "";
  $("l-esqueci").classList.toggle("hide", modoCriar);
};
$("l-ver").onclick = () => { const i = $("l-senha"); i.type = i.type === "password" ? "text" : "password"; $("l-ver").textContent = i.type === "password" ? "Mostrar" : "Ocultar"; };
$("l-esqueci").onclick = async () => {
  const email = $("l-email").value.trim();
  if (!email) return toast("Escreva seu e-mail acima primeiro.", 1);
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  toast(error ? erroMsg(error) : "Enviamos um link para criar uma nova senha no seu e-mail.", !!error);
};

sb.auth.onAuthStateChange((ev, session) => {
  const u = session?.user || null;
  if (ev === "PASSWORD_RECOVERY") setTimeout(novaSenha, 300);
  if (st._pronto && u?.id === st.user?.id) return;
  st._pronto = true; st.user = u;
  setTimeout(iniciar, 0);
});

function semAcesso() {
  $("v-app").classList.add("hide"); $("v-login").classList.remove("hide");
  $("l-cartao").innerHTML = `<h2 style="font-size:19px">Conta criada ✓</h2>
    <p class="mudo" style="margin-top:8px">Você entrou como <b style="color:var(--ink)">${esc(st.user.email)}</b>, mas este e-mail ainda não tem acesso ao salão.</p>
    <p class="mudo" style="margin-top:8px">Peça para quem administra o app liberar este e-mail em <b style="color:var(--ink)">Mais › Quem pode acessar</b>. Depois é só abrir o app de novo.</p>
    <button class="btn ouro cheio" style="margin-top:16px" onclick="location.reload()">Já liberaram, tentar de novo</button>
    <button class="link" style="display:block;margin:12px auto 0" onclick="sb.auth.signOut().then(()=>location.reload())">Entrar com outro e-mail</button>`;
}

async function iniciar() {
  if (!st.user) { $("v-app").classList.add("hide"); $("v-login").classList.remove("hide"); return; }
  const { data: salao } = await sb.rpc("ad_meu_salao");
  const { data: prof } = salao ? await sb.from("ad_profissionais").select("*").eq("id", salao).maybeSingle() : { data: null };
  if (!prof) { semAcesso(); return; }
  st.prof = prof;
  $("b-perfil").textContent = iniciais(prof.nome);
  $("v-login").classList.add("hide"); $("v-app").classList.remove("hide");
  const pedeSenha = () => { if (!travaCfg() && !localStorage.getItem("nay.trava.perguntou")) setTimeout(() => { localStorage.setItem("nay.trava.perguntou", "1"); criaSenha(true); }, 500); };
  if (travaCfg()) mostraTrava();
  if (!localStorage.getItem("nay.tutorial")) mostraTutorial(pedeSenha); else pedeSenha();
  await carregaServicos();
  tempoReal(); contaAvisos(); registraSW(); vigia();
  const m = location.hash.match(/ag=([0-9a-f-]{36})/);
  const atalho = location.hash.slice(1);
  if (atalho === "agenda") vaiPara("agenda");
  else if (atalho === "esmaltes") { st.estSeg = "esmaltes"; vaiPara("estoque"); }
  else vaiPara("inicio");
  if (atalho === "novo") novoAgendamento({});
  if (m) detalheAg(m[1]);
}

async function carregaServicos() { st.servicos = await q(sb.from("ad_servicos").select("*").order("nome")); }

// ---------- navegação ----------
document.querySelectorAll("#abas button").forEach((b) => (b.onclick = () => vaiPara(b.dataset.aba)));
const TITULOS = { inicio: "Início", agenda: "Agenda", clientes: "Clientes", caixa: "Financeiro", mais: "Mais", estoque: "Estoque e esmaltes" };
const ORDEM_ABAS = ["inicio", "agenda", "clientes", "caixa", "mais"];
function vaiPara(aba) {
  st.direcao = ORDEM_ABAS.indexOf(aba) >= ORDEM_ABAS.indexOf(st.aba || "inicio") ? "da-direita" : "da-esquerda";
  if (aba === st.aba) st.direcao = "";
  st.aba = aba;
  atualizaFab();
  document.querySelectorAll("#abas button").forEach((b) => b.classList.toggle("on", b.dataset.aba === aba));
  $("titulo").innerHTML = aba === "inicio" ? `Nayara Fernandes<small>Nails e cuidados</small>` : (TITULOS[aba] || "") + `<small>${esc(dataLonga(new Date()))}</small>`;
  scrollTo(0, 0);
  $("conteudo").innerHTML = `<div style="padding-top:4px">${[64, 120, 120, 88, 88].map((h) => `<div class="esqueleto" style="height:${h}px"></div>`).join("")}</div>`;
  return atualizaTela();
}
function atualizaTela() {
  return ({ inicio: telaInicio, agenda: telaAgenda, clientes: telaClientes, caixa: telaCaixa, mais: telaMais, estoque: telaEstoque })[st.aba]();
}
function saudacao() {
  const h = Number(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", timeZone: TZ }));
  return (h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite") + ", " + primeiroNome(st.prof.nome) + "!";
}
const tela = (html) => { $("conteudo").innerHTML = `<div class="tela ${st.silencioso ? "quieta" : st.direcao || ""}">${html}</div>`; st.direcao = ""; if (!st.silencioso) contaNumeros($("conteudo")); return $("conteudo"); };
// Números sobem até o valor (dinheiro e quantidades)
const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;
function contaNumeros(raiz) {
  if (calma) return;
  raiz.querySelectorAll(".ind .stat b, .stat b, .hero .v, .hero .hstats b, .resumo-val b").forEach((el) => {
    const txt = el.textContent.trim();
    const dinheiro = /^-?R\$/.test(txt.replace(/\s/g, "")) || txt.includes("R$");
    const n = dinheiro ? Number(txt.replace(/[^\d,-]/g, "").replace(",", ".")) : /^\d+$/.test(txt) ? Number(txt) : NaN;
    if (!isFinite(n) || n === 0) return;
    const t0 = performance.now(), dur = 650;
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = n * e;
      el.textContent = dinheiro ? brl(v) : String(Math.round(v));
      if (k < 1) requestAnimationFrame(passo); else el.textContent = txt;
    };
    requestAnimationFrame(passo);
  });
}

// ---------- dados ----------
async function agsEntre(deIso, ateIso) {
  return q(sb.from("ad_agendamentos").select("*").gte("inicio", inicioDia(deIso)).lt("inicio", inicioDia(ateIso)).order("inicio"));
}
async function pagsEntre(deIso, ateIso) {
  return q(sb.from("ad_pagamentos").select("*").gte("recebido_em", inicioDia(deIso)).lt("recebido_em", inicioDia(ateIso)).order("recebido_em", { ascending: false }));
}
async function livres(dataIso, min) {
  const { data } = await sb.rpc("ad_horarios_livres_min", { p_slug: st.prof.slug, p_min: min, p_data: dataIso });
  return data || [];
}

// ---------- tempo real ----------
let canal, recarga;
function tempoReal() {
  if (canal) sb.removeChannel(canal);
  canal = sb.channel("nay-gestao")
    .on("postgres_changes", { event: "*", schema: "public", table: "ad_agendamentos", filter: `profissional_id=eq.${st.prof.id}` }, () => {
      clearTimeout(recarga); recarga = setTimeout(() => { if (!$("folha").classList.contains("on")) atualizaTela(); }, 600);
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "ad_avisos", filter: `profissional_id=eq.${st.prof.id}` }, (p) => {
      toast(p.new.titulo + " — " + p.new.corpo); contaAvisos();
      const sino = $("b-sino"); sino.classList.remove("toca"); void sino.offsetWidth; sino.classList.add("toca");
    })
    .subscribe();
}
// ---------- atualização automática (a cada 5 segundos) ----------
// Além do tempo real, confere o banco a cada 5 s. Se algo mudou (agendamento novo, remarcado,
// cancelado, pago, estoque, caixa), a tela é refeita sozinha sem atrapalhar o que ela está fazendo.
let assinatura = null, vigiaTimer = null;
async function assinaDados() {
  const ini = new Date(Date.now() - 864e5).toISOString();
  const [ags, pags, lanc, prods, avisos] = await Promise.all([
    sb.from("ad_agendamentos").select("id,status,inicio,fim,pago,preco").gte("inicio", ini).order("id").limit(1000),
    sb.from("ad_pagamentos").select("id", { count: "exact", head: true }),
    sb.from("ad_lancamentos").select("id", { count: "exact", head: true }),
    sb.from("ad_produtos").select("id,quantidade,catalogo").order("id").limit(2000),
    sb.from("ad_avisos").select("id", { count: "exact", head: true }).eq("lido", false),
  ]);
  if (ags.error) return null;
  const txt = JSON.stringify([ags.data, pags.count, lanc.count, prods.data, avisos.count]);
  let h = 0; for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) | 0;
  return { h, nAgs: ags.data.filter((a) => a.status !== "cancelado").length, avisos: avisos.count || 0 };
}
async function confere() {
  if (document.hidden || !st.prof || $("trava")) return;
  try {
    const a = await assinaDados(); if (!a) return;
    const antes = assinatura; assinatura = a;
    if (!antes || antes.h === a.h) return;
    if (a.nAgs > antes.nAgs) toast("📅 Novo agendamento chegou!");
    if (a.avisos !== antes.avisos) contaAvisos();
    atualizaSilencioso();
  } catch { /* sem internet: tenta de novo em 5 s */ }
}
function atualizaSilencioso() {
  const ocupada = $("folha").classList.contains("on") || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (ocupada) { st.pendente = true; return; }
  const y = scrollY; st.silencioso = true;
  Promise.resolve(atualizaTela()).finally(() => { st.silencioso = false; scrollTo(0, y); });
}
function vigia() {
  clearInterval(vigiaTimer); vigiaTimer = setInterval(confere, 5000); confere();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { confere(); swReg?.update().catch(() => {}); } });
  // nova versão do app publicada: troca sozinho quando ela não estiver no meio de algo
  setInterval(() => swReg?.update().catch(() => {}), 60000);
  let recarregou = false;
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (recarregou) return; recarregou = true;
    const tenta = () => ($("folha").classList.contains("on") ? setTimeout(tenta, 3000) : location.reload());
    tenta();
  });
}
async function contaAvisos() {
  const { count } = await sb.from("ad_avisos").select("id", { count: "exact", head: true }).eq("lido", false);
  st.naoLidos = count || 0;
  $("n-avisos").textContent = st.naoLidos > 9 ? "9+" : st.naoLidos;
  $("n-avisos").classList.toggle("hide", !st.naoLidos);
  if (st.naoLidos && !st._sinoTocou) { st._sinoTocou = true; const sino = $("b-sino"); setTimeout(() => sino.classList.add("toca"), 800); }
}

// ---------- cartões ----------
function cartaoAg(a, mostraData) {
  const pago = a.pago ? ` · <span class="chip pago">Pago</span>` : "";
  return `<div class="ag ${a.status}" data-ag="${a.id}" style="--cs:${corServico(a)}">
    <div class="h">${hora(a.inicio)}<small>${mostraData ? dataCurta(a.inicio) : "até " + hora(a.fim)}</small></div>
    <div class="cresce"><div class="n">${esc(a.cliente_nome)}${a.serie_id ? ' <span title="Horário fixo" style="font-size:12px">🔁</span>' : ""}${a.atrasou ? ' <span class="chip faltou" style="font-size:10.5px">Atrasou</span>' : ""}</div><div class="s"><i class="bola" style="background:${corServico(a)}"></i>${esc(a.servico_nome)}</div></div>
    <div class="d"><span class="chip ${a.status}">${STATUS[a.status]}</span><span class="v">${brl(a.preco)}</span></div>
  </div>`;
}
function ligaCartoes(raiz) { raiz.querySelectorAll("[data-ag]").forEach((el) => (el.onclick = () => detalheAg(el.dataset.ag))); }

// =====================================================================
// INÍCIO
// =====================================================================
async function telaInicio() {
  const hoje = isoDia(), amanha = somaDias(hoje, 1);
  const iniMes = hoje.slice(0, 8) + "01";
  const [ags, agsAmanha, pags, avisos, livresHoje, devendo, pagsMes, despMes, prods, novos, contas] = await Promise.all([
    agsEntre(hoje, amanha), agsEntre(amanha, somaDias(hoje, 2)), pagsEntre(hoje, amanha),
    q(sb.from("ad_avisos").select("*").eq("lido", false).order("criado_em", { ascending: false }).limit(3)),
    livres(hoje, 30),
    q(sb.from("ad_agendamentos").select("id,preco").eq("status", "concluido").eq("pago", false)),
    pagsEntre(iniMes, amanha),
    q(sb.from("ad_lancamentos").select("valor,pago").eq("tipo", "saida").gte("data", iniMes).lt("data", amanha)),
    q(sb.from("ad_produtos").select("id,quantidade,minimo,validade,categoria,catalogo")),
    q(sb.from("ad_agendamentos").select("id").gte("criado_em", new Date(Date.now() - 864e5).toISOString()).neq("status", "cancelado")),
    q(sb.from("ad_lancamentos").select("id,valor,vencimento").eq("tipo", "saida").eq("pago", false).lte("vencimento", somaDias(hoje, 7))),
  ]);
  const [proximos, atendMes, pags7, clis] = await Promise.all([
    q(sb.from("ad_agendamentos").select("*").in("status", ATIVOS).gte("fim", new Date().toISOString()).order("inicio").limit(3)),
    q(sb.from("ad_agendamentos").select("cliente_id,cliente_whatsapp").eq("status", "concluido").gte("inicio", meioDia(iniMes).toISOString())),
    pagsEntre(somaDias(hoje, -6), amanha),
    q(sb.from("ad_clientes").select("id,nome,whatsapp,aniversario,foto_url").not("aniversario", "is", null)),
  ]);
  const clientesMes = new Set(atendMes.map((a) => a.cliente_id || a.cliente_whatsapp)).size;
  const pendenteValor = devendo.reduce((s, a) => s + Number(a.preco), 0);
  const dias7 = Array.from({ length: 7 }, (_, i) => somaDias(hoje, i - 6)).map((d) => ({ d, v: pags7.filter((p) => isoDia(new Date(p.recebido_em)) === d).reduce((s, p) => s + Number(p.valor), 0) }));
  const mx7 = Math.max(1, ...dias7.map((x) => x.v));
  const aniv = clis.filter((c) => c.aniversario).map((c) => { const [, mm, dd] = c.aniversario.split("-"); let alvo = `${hoje.slice(0, 4)}-${mm}-${dd}`; if (alvo < hoje) alvo = `${Number(hoje.slice(0, 4)) + 1}-${mm}-${dd}`; return { ...c, alvo, falta: Math.round((meioDia(alvo) - meioDia(hoje)) / 864e5) }; })
    .filter((c) => c.falta <= 7).sort((x, y) => x.falta - y.falta);
  const recMes = pagsMes.reduce((s, p) => s + Number(p.valor), 0);
  const gastoMes = despMes.filter((l) => l.pago !== false).reduce((s, l) => s + Number(l.valor), 0);
  const estq = resumoEstoque(prods);
  const ativos = ags.filter((a) => a.status !== "cancelado");
  const agora = Date.now();
  const aConfirmar = [...ags, ...agsAmanha].filter((a) => a.status === "marcado" && new Date(a.inicio).getTime() > agora);
  const faturado = pags.reduce((s, p) => s + Number(p.valor), 0);
  const cancel = ags.filter((a) => a.status === "cancelado").length;
  const previsto = ativos.filter((a) => a.status !== "faltou").reduce((s, a) => s + Number(a.preco), 0);
  const meta = Number(st.prof.meta_mensal || 0);
  let metaHtml = "";
  if (meta) {
    const pct = Math.min(100, Math.round((recMes / meta) * 100));
    const chave = "nay.meta." + hoje.slice(0, 7);
    if (pct >= 100 && !localStorage.getItem(chave)) { localStorage.setItem(chave, "1"); setTimeout(() => { festa(); toast("Meta do mês batida! Parabéns! 🏆"); }, 900); }
    metaHtml = `<div class="meta"><small><span>Meta do mês · ${brl(recMes)} de ${brl(meta)}</span><span>${pct}%</span></small><div class="barra"><span style="width:${pct}%"></span></div></div>`;
  }

  const alertas = [];
  avisos.forEach((v) => alertas.push(`<button class="item aviso-item novo" data-aviso="${v.id}" data-agid="${v.agendamento_id || ""}"><span class="ponto"></span><div class="cresce"><b>${esc(v.titulo)}</b><div class="pequeno">${esc(v.corpo)}</div></div></button>`));
  if (aConfirmar.length) alertas.push(`<button class="item" data-ir="confirmar"><div class="ic">${IC.sino}</div><div class="cresce"><b>${aConfirmar.length} cliente${aConfirmar.length > 1 ? "s" : ""} sem confirmar</b><div class="pequeno">Hoje e amanhã. Toque para enviar o lembrete.</div></div><span class="seta">›</span></button>`);
  if (estq.baixos.length) alertas.push(`<button class="item" data-ir="estoque"><div class="ic">${IC.caixa}</div><div class="cresce"><b>${estq.baixos.length} produto${estq.baixos.length > 1 ? "s" : ""} acabando</b><div class="pequeno">Veja o estoque e programe a compra.</div></div><span class="seta">›</span></button>`);
  if (estq.vencendo.length + estq.vencidos.length) alertas.push(`<button class="item" data-ir="estoque"><div class="ic">${IC.relogio}</div><div class="cresce"><b>${estq.vencendo.length + estq.vencidos.length} produto${estq.vencendo.length + estq.vencidos.length > 1 ? "s" : ""} com validade perto</b><div class="pequeno">Vence em até 30 dias${estq.vencidos.length ? " ou já venceu" : ""}.</div></div><span class="seta">›</span></button>`);
  if (estq.revisao.length) alertas.push(`<button class="item" data-ir="esmaltes"><div class="ic">${IC.esmalte}</div><div class="cresce"><b>${estq.revisao.length} cor${estq.revisao.length > 1 ? "es" : ""} esperando conferência</b><div class="pequeno">Publique para aparecerem no site.</div></div><span class="seta">›</span></button>`);
  if (contas.length) alertas.push(`<button class="item" data-ir="caixa"><div class="ic" style="background:var(--red2);color:var(--red)">${IC.dinheiro}</div><div class="cresce"><b>${contas.length} conta${contas.length > 1 ? "s" : ""} para pagar · ${brl(contas.reduce((s, l) => s + Number(l.valor), 0))}</b><div class="pequeno">Vencem nos próximos 7 dias${contas.some((l) => l.vencimento < hoje) ? " (há conta atrasada)" : ""}.</div></div><span class="seta">›</span></button>`);
  if (devendo.length) alertas.push(`<button class="item" data-ir="caixa"><div class="ic">${IC.dinheiro}</div><div class="cresce"><b>${devendo.length} atendimento${devendo.length > 1 ? "s" : ""} sem pagamento registrado</b><div class="pequeno">Registre para o caixa ficar certo.</div></div><span class="seta">›</span></button>`);

  const r = tela(`
    <div class="saud"><p>${esc(dataLonga(new Date()))}</p><h2>${esc(saudacao())}</h2></div>
    <div class="painel-hoje">
      <div class="linha entre"><span class="rot">Recebido hoje</span>${novos.length ? `<span class="selo">${novos.length} novo${novos.length > 1 ? "s" : ""} pelo site</span>` : ""}</div>
      <div class="valor">${brl(faturado)}</div>
      <div class="rot">de ${brl(previsto)} previstos para hoje</div>
      <div class="hoje-nums">
        <button data-ir="agenda"><b>${ativos.length}</b><small>atendimento${ativos.length !== 1 ? "s" : ""}</small></button>
        <button data-ir="confirmar"><b>${aConfirmar.length}</b><small>a confirmar</small></button>
        <button data-ir="agenda"><b>${livresHoje.length}</b><small>horários livres</small></button>
      </div>
    </div>
    ${proximos.length ? `<div class="tit-linha"><h2>Próximas clientes</h2><button data-ir="agenda">Agenda</button></div>
      <div class="proximas">${proximos.map((a, k) => { const agoraAt = new Date(a.inicio).getTime() <= agora; const dia = isoDia(new Date(a.inicio));
        return `<div class="prox-item ${k === 0 ? "primeira" : ""}" data-ag="${a.id}" style="--cs:${corServico(a)}">
          <div class="prox-hora">${hora(a.inicio)}<small>${agoraAt ? "agora" : dia === hoje ? "hoje" : dia === amanha ? "amanhã" : dataCurta(a.inicio)}</small></div>
          <div class="cresce"><b>${esc(a.cliente_nome)}</b><div class="pequeno">${esc(a.servico_nome)} · ${brl(a.preco)}</div></div>
          ${k === 0 && a.cliente_whatsapp ? `<a class="btn zap mini" target="_blank" rel="noopener" href="https://wa.me/${zapNum(a.cliente_whatsapp)}" data-parar>${IC.zap}</a>` : `<span class="chip ${a.status}">${STATUS[a.status]}</span>`}
        </div>`; }).join("")}</div>`
      : `<div class="cartao calmo"><b>Nenhuma cliente marcada por agora</b><p class="mudo" style="margin-top:2px">${livresHoje.length ? `Ainda há ${livresHoje.length} horários livres hoje. Divulgue seu link.` : "Aproveite para descansar ou organizar o salão."}</p></div>`}
    <div class="cartao mes-resumo" data-ir="caixa">
      <div class="linha entre"><h2 style="margin:0">Este mês</h2><span class="seta">›</span></div>
      <div class="mes-nums">
        <div><small>Faturamento</small><b>${brl(recMes)}</b></div>
        <div><small>Despesas</small><b>${brl(gastoMes)}</b></div>
        <div><small>Lucro</small><b class="${recMes - gastoMes < 0 ? "neg" : "ouro-t"}">${brl(recMes - gastoMes)}</b></div>
      </div>
      <div class="mes-nums" style="margin-top:10px">
        <div><small>Clientes atendidas</small><b>${clientesMes}</b></div>
        <div><small>A receber</small><b class="${pendenteValor ? "neg" : ""}">${brl(pendenteValor)}</b></div>
        <div><small>Contas a pagar</small><b>${brl(contas.reduce((s, l) => s + Number(l.valor), 0))}</b></div>
      </div>
      ${metaHtml}
    </div>
    <div class="cartao semana" data-ir="caixa">
      <div class="linha entre"><h2 style="margin:0">Últimos 7 dias</h2><b class="ouro-t">${brl(dias7.reduce((s, x) => s + x.v, 0))}</b></div>
      <div class="mini-graf">${dias7.map((x) => `<div><span style="height:${Math.max(3, (x.v / mx7) * 100)}%" class="${x.d === hoje ? "hoje" : ""}" title="${brl(x.v)}"></span><small>${x.d === hoje ? "hoje" : new Date(x.d + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "").slice(0, 3)}</small></div>`).join("")}</div>
    </div>
    ${aniv.length ? `<div class="cartao"><h2>🎂 Aniversariantes</h2>${aniv.map((c) => `<div class="linha" style="gap:10px;padding:8px 0;border-top:1px solid var(--line)">${avatarCli(c, 36)}<div class="cresce"><b>${esc(c.nome)}</b><div class="pequeno">${c.falta === 0 ? "Hoje!" : c.falta === 1 ? "Amanhã" : `Em ${c.falta} dias`} · ${c.aniversario.slice(8)}/${c.aniversario.slice(5, 7)}</div></div><a class="btn claro mini" target="_blank" rel="noopener" href="https://wa.me/${zapNum(c.whatsapp)}?text=${encodeURIComponent(`Feliz aniversário, ${primeiroNome(c.nome)}! 🎂💅 Desejo um dia lindo.${fid().ativo && fid().aniversario ? " Seu presente: " + fid().aniversario + "." : ""} Um beijo da Nayara!`)}">Parabéns</a></div>`).join("")}</div>` : ""}
    ${alertas.length ? `<div class="tit-linha"><h2>Avisos</h2><button data-ir="avisos">Ver todos</button></div><div class="lista">${alertas.join("")}</div>` : ""}
    <div id="banner-notif"></div>
    <div class="tit-linha"><h2>Atalhos</h2><button id="ed-atalhos">Editar</button></div>
    <div class="atalhos">${htmlAtalhos()}
    </div>
    <div class="tit-linha"><h2>Hoje</h2><button data-ir="agenda">Agenda completa</button></div>
    ${ags.length ? ags.map((a) => cartaoAg(a)).join("") : `<div class="vazio">${IC.calendario}<div>Nenhum agendamento hoje.</div></div>`}
  `);
  ligaCartoes(r);
  r.querySelectorAll("[data-aviso]").forEach((b) => (b.onclick = async () => {
    await sb.from("ad_avisos").update({ lido: true }).eq("id", b.dataset.aviso); contaAvisos();
    const v = avisos.find((x) => x.id === b.dataset.aviso);
    if (v?.tipo === "confirmar") lembretesEmSequencia(); else if (v?.tipo === "aniversario") { vaiPara("clientes"); } else if (b.dataset.agid) detalheAg(b.dataset.agid); else telaInicio();
  }));
  r.querySelectorAll("[data-ir]").forEach((b) => (b.onclick = () => {
    const ir = b.dataset.ir;
    if (ir === "confirmar") listaConfirmar(aConfirmar);
    else if (ir === "avisos") telaAvisos();
    else if (ir === "esmaltes") { st.estSeg = "esmaltes"; vaiPara("estoque"); }
    else if (ir === "estoque") { st.estSeg = estq.baixos.some((p) => p.categoria !== "Esmaltes") ? "produtos" : "esmaltes"; vaiPara("estoque"); }
    else vaiPara(ir);
  }));
  r.querySelectorAll("[data-atalho]").forEach((b) => (b.onclick = () => ATALHOS[b.dataset.atalho][2]()));
  $("ed-atalhos").onclick = editaAtalhos;
  r.querySelectorAll("[data-parar]").forEach((x) => x.addEventListener("click", (e) => e.stopPropagation()));
  bannerNotificacao();
}

function listaConfirmar(lista) {
  abreFolha(cabFolha("Clientes sem confirmar", "Toque em Lembrete para mandar a mensagem com o link de confirmação.") + `<button class="btn prim cheio" style="margin-bottom:12px" onclick="lembretesEmSequencia()">📲 Enviar todos em sequência</button>` +
    `<div class="lista">${lista.map((a) => `<div class="item" style="cursor:default"><div class="cresce"><b>${esc(a.cliente_nome)}</b><div class="pequeno">${dataCurta(a.inicio)} às ${hora(a.inicio)} · ${esc(a.servico_nome)}</div></div>
      <a class="btn zap mini" target="_blank" rel="noopener" href="${linkZap(a, "lembrete")}">Lembrete</a></div>`).join("")}</div>`);
}

// Previsto x recebido x a receber de um conjunto de atendimentos (mostra quanto vai entrar)
async function resumoValores(ags, despesas) {
  const validos = ags.filter((a) => !["cancelado", "faltou"].includes(a.status));
  const previsto = validos.reduce((s, a) => s + Number(a.preco), 0);
  const ids = validos.map((a) => a.id);
  let recebido = 0;
  if (ids.length) recebido = (await q(sb.from("ad_pagamentos").select("valor").in("agendamento_id", ids))).reduce((s, p) => s + Number(p.valor), 0);
  const falta = Math.max(previsto - recebido, 0);
  if (despesas != null) {
    const lucro = previsto - despesas;
    return `<div class="resumo-val"><div><small>Previsto</small><b>${brl(previsto)}</b></div><div><small>Despesas</small><b class="neg">${brl(despesas)}</b></div><div><small>Lucro previsto</small><b class="${lucro >= 0 ? "pos" : "neg"}">${brl(lucro)}</b></div></div>`;
  }
  return `<div class="resumo-val"><div><small>Previsto</small><b>${brl(previsto)}</b></div><div><small>Já recebido</small><b class="pos">${brl(recebido)}</b></div><div><small>Falta receber</small><b>${brl(falta)}</b></div></div>`;
}
async function despesasEntre(deIso, ateIso) {
  return (await q(sb.from("ad_lancamentos").select("valor").eq("tipo", "saida").gte("data", deIso).lt("data", ateIso))).reduce((s, l) => s + Number(l.valor), 0);
}

// =====================================================================
// AGENDA
// =====================================================================
async function telaAgenda() {
  const modos = { dia: "Dia", semana: "Semana", mes: "Mês", proximos: "Próximos" };
  const topo = `<div class="seg">${Object.entries(modos).map(([k, v]) => `<button data-modo="${k}" class="${st.agendaModo === k ? "on" : ""}">${v}</button>`).join("")}</div>`;
  let corpo = "";
  const hoje = isoDia();

  if (st.agendaModo === "dia") {
    const ags = await agsEntre(st.dia, somaDias(st.dia, 1));
    const ativos = ags.filter((a) => !["cancelado"].includes(a.status));
    const { data: bloq } = await sb.from("ad_bloqueios").select("*").lt("inicio", inicioDia(somaDias(st.dia, 1))).gt("fim", inicioDia(st.dia)).order("inicio");
    corpo = `<div class="navdia"><button class="redondo" data-d="-1" aria-label="Dia anterior">‹</button>
      <div class="cresce">${st.dia === hoje ? "Hoje" : diaSemana(meioDia(st.dia))}<small>${meioDia(st.dia).toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" })}</small></div>
      <button class="redondo" data-d="1" aria-label="Próximo dia">›</button></div>
      ${await resumoValores(ags)}
      <div class="linha entre" style="margin:0 4px 10px"><span class="mudo">${ativos.length} atendimento${ativos.length !== 1 ? "s" : ""}</span>
      ${st.dia !== hoje ? `<button class="link" data-hoje>Ir para hoje</button>` : ""}</div>
      ${await (async () => {
        const alm = await cartaoAlmocoDia(st.dia);
        const itens = ags.map((a) => ({ t: new Date(a.inicio).getTime(), html: cartaoAg(a) }));
        if (alm) itens.push(alm);
        (bloq || []).forEach((b) => {
          const diaTodo = new Date(b.inicio) <= new Date(inicioDia(st.dia)) && new Date(b.fim) >= new Date(inicioDia(somaDias(st.dia, 1)));
          itens.push({ t: diaTodo ? 0 : new Date(b.inicio).getTime(), html: `<div class="ag" style="cursor:default;background:repeating-linear-gradient(135deg,rgba(176,64,64,.10) 0 10px,transparent 10px 20px);border-style:dashed"><div class="h">${diaTodo ? "Dia" : hora(b.inicio)}<small>${diaTodo ? "inteiro" : "até " + hora(b.fim)}</small></div><div><div class="n">🚫 ${esc(b.motivo || "Horário bloqueado")}</div><div class="s">Ninguém consegue marcar</div></div><div class="d"><button class="link" data-desbloq="${b.id}">Liberar</button></div></div>` });
        });
        itens.sort((x, y) => x.t - y.t);
        return ags.length || alm || (bloq || []).length ? itens.map((i) => i.html).join("") + (ags.length ? "" : `<div class="vazio">${IC.calendario}<div>Nenhum agendamento neste dia.</div></div>`) : `<div class="vazio">${IC.calendario}<div>Nenhum agendamento neste dia.</div></div>`;
      })()}
      <div class="grade2" style="margin-top:6px"><button class="btn ouro" data-novo>${IC.mais}Agendar</button><button class="btn claro" data-bloq-dia>${IC.bloqueio}Bloquear</button></div>`;
  } else if (st.agendaModo === "semana") {
    const ini = st.dia, fim = somaDias(st.dia, 7);
    const ags = await agsEntre(ini, fim);
    const dias = Array.from({ length: 7 }, (_, i) => somaDias(ini, i));
    corpo = `<div class="navdia"><button class="redondo" data-d="-7">‹</button><div class="cresce">${dataCurta(meioDia(ini))} a ${dataCurta(meioDia(somaDias(ini, 6)))}<small>${ags.filter((a) => a.status !== "cancelado").length} atendimentos</small></div><button class="redondo" data-d="7">›</button></div>
      ${await resumoValores(ags)}
      <div class="semana">${dias.map((d) => { const l = ags.filter((a) => isoDia(a.inicio) === d); return `<div class="dia-sem"><h3>${d === hoje ? "Hoje" : SEM[meioDia(d).getUTCDay()]}, ${meioDia(d).getUTCDate()}<span>${l.length ? l.length + " · " + brl(l.filter((a) => a.status !== "cancelado").reduce((s, a) => s + Number(a.preco), 0)) : "livre"}</span></h3>${l.map((a) => cartaoAg(a)).join("")}</div>`; }).join("")}</div>`;
  } else if (st.agendaModo === "mes") {
    const [a, m] = st.mes.split("-").map(Number);
    const primeiro = `${st.mes}-01`, prox = new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 10);
    const ags = await agsEntre(primeiro, prox);
    const cont = {}; ags.filter((x) => x.status !== "cancelado").forEach((x) => { const d = isoDia(x.inicio); cont[d] = (cont[d] || 0) + 1; });
    const iniSem = meioDia(primeiro).getUTCDay();
    const nDias = new Date(Date.UTC(a, m, 0)).getUTCDate();
    let cel = SEM3.map((s) => `<div class="cab">${s}</div>`).join("") + Array(iniSem).fill('<div></div>').join("");
    for (let d = 1; d <= nDias; d++) { const iso = `${st.mes}-${String(d).padStart(2, "0")}`; cel += `<button data-dia="${iso}" class="${iso === hoje ? "hoje" : ""}">${d}<i>${cont[iso] ? cont[iso] + "×" : ""}</i></button>`; }
    const nomeMes = cap(new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }));
    corpo = `<div class="navdia"><button class="redondo" data-m="-1">‹</button><div class="cresce">${nomeMes}<small>${ags.filter((x) => x.status !== "cancelado").length} atendimentos · ${brl(ags.filter((x) => x.status !== "cancelado").reduce((s, x) => s + Number(x.preco), 0))}</small></div><button class="redondo" data-m="1">›</button></div>
      ${await resumoValores(ags, await despesasEntre(primeiro, prox))}
      <div class="mes">${cel}</div><p class="pequeno" style="text-align:center;margin-top:10px">Toque em um dia para ver os atendimentos.</p>`;
  } else {
    const ags = (await agsEntre(hoje, somaDias(hoje, 45))).filter((a) => ATIVOS.includes(a.status) && new Date(a.fim) > new Date());
    let ult = "";
    corpo = ags.length ? ags.map((a) => { const d = isoDia(a.inicio); const cab = d !== ult ? `<h3 style="font:600 15px var(--sans);margin:16px 2px 8px">${d === hoje ? "Hoje" : dataLonga(a.inicio)}</h3>` : ""; ult = d; return cab + cartaoAg(a); }).join("")
      : `<div class="vazio">${IC.calendario}<div>Nenhum atendimento nos próximos dias.</div></div>`;
  }

  const r = tela(topo + corpo);
  ligaCartoes(r);
  r.querySelectorAll("[data-modo]").forEach((b) => (b.onclick = () => { st.agendaModo = b.dataset.modo; telaAgenda(); }));
  r.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => { st.dia = somaDias(st.dia, Number(b.dataset.d)); telaAgenda(); }));
  r.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { const [a, m] = st.mes.split("-").map(Number); st.mes = new Date(Date.UTC(a, m - 1 + Number(b.dataset.m), 1)).toISOString().slice(0, 7); telaAgenda(); }));
  r.querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => { st.dia = b.dataset.dia; st.agendaModo = "dia"; telaAgenda(); }));
  r.querySelector("[data-hoje]")?.addEventListener("click", () => { st.dia = hoje; telaAgenda(); });
  r.querySelector("[data-novo]")?.addEventListener("click", () => novoAgendamento({ data: st.dia }));
  r.querySelector("[data-bloq-dia]")?.addEventListener("click", () => novoBloqueio(st.dia));
  r.querySelectorAll("[data-desbloq]").forEach((b) => (b.onclick = async () => {
    if (!confirm("Liberar este horário para as clientes agendarem?")) return;
    await q(sb.from("ad_bloqueios").delete().eq("id", b.dataset.desbloq)); toast("Horário liberado."); telaAgenda();
  }));
}

// =====================================================================
// DETALHE DO AGENDAMENTO
// =====================================================================
function mensagem(a, tipo) {
  const n = primeiroNome(a.cliente_nome), d = dataLonga(a.inicio), h = hora(a.inicio);
  const end = st.prof.endereco ? `\n📍 ${st.prof.endereco}` : "";
  const pol = `\n\n⚠️ *Política de cancelamento:* cancelamentos com menos de 24h de antecedência têm taxa de 100% do valor do serviço.`;
  return ({
    confirmacao: `Olá, ${n}! 💅 Seu horário de *${a.servico_nome}* está confirmado para *${d}* às *${h}*.${end}${pol}\n\nAté lá! Nayara Fernandes · Nails e cuidados`,
    lembrete: `Olá, ${n}! 😊 Passando para lembrar do seu horário de *${a.servico_nome}* ${isoDia(a.inicio) === somaDias(isoDia(), 1) ? "amanhã" : "em " + d} às *${h}*.\n\nConfirme ou desmarque por aqui:\n${CONFIRMAR}${a.id}${pol}`,
    alteracao: `Olá, ${n}! Seu horário de *${a.servico_nome}* foi alterado para *${d}* às *${h}*. Se não puder, me avise por aqui. 💗${pol}`,
    cancelamento: `Olá, ${n}! Precisei cancelar seu horário de *${a.servico_nome}* de ${d} às ${h}. Desculpe! Você pode escolher outro horário aqui: ${SITE}`,
    agradecimento: `Obrigada pela visita, ${n}! 💗 Foi um prazer cuidar de você. Quando quiser voltar, é só agendar: ${SITE}`,
    avaliacao: `Oi, ${n}! Se gostou do atendimento, me ajuda muito deixar sua avaliação no Google ⭐: ${GOOGLE}\nObrigada! 💗`,
  })[tipo];
}
const linkZap = (a, tipo) => `https://wa.me/${zapNum(a.cliente_whatsapp)}?text=${encodeURIComponent(mensagem(a, tipo))}`;

async function detalheAg(id) {
  const [a, pags] = await Promise.all([
    q(sb.from("ad_agendamentos").select("*").eq("id", id).maybeSingle()),
    q(sb.from("ad_pagamentos").select("*").eq("agendamento_id", id).order("recebido_em")),
  ]);
  if (!a) return toast("Agendamento não encontrado.", 1);
  const coresAtuais = a.cores?.length ? await q(sb.from("ad_produtos").select("id,quantidade").in("id", a.cores.map((c) => c.id).filter(Boolean))) : [];
  const pago = pags.reduce((s, p) => s + Number(p.valor), 0);
  const prox = { marcado: ["confirmado", "Confirmar horário"], confirmado: ["chegou", "Cliente chegou"], chegou: ["atendendo", "Iniciar atendimento"], atendendo: ["concluido", "Finalizar atendimento"] }[a.status];
  const passado = new Date(a.inicio) < new Date();
  abreFolha(cabFolha(esc(a.cliente_nome), `<span class="chip ${a.status}">${STATUS[a.status]}</span>${a.pago ? ' <span class="chip pago">Pago</span>' : ""}`) + `
    <div class="cartao">
      <dl class="info-ag">
        <dt>Serviço</dt><dd>${esc(a.servico_nome)}</dd>
        <dt>Data</dt><dd>${dataLonga(a.inicio)}</dd>
        <dt>Horário</dt><dd>${hora(a.inicio)} às ${hora(a.fim)} · ${dur(Math.round((new Date(a.fim) - new Date(a.inicio)) / 60000))}</dd>
        ${a.serie_id ? `<dt>Repete</dt><dd>🔁 ${esc(a.serie_regra || "Sim")}</dd>` : ""}
        <dt>Valor</dt><dd>${brl(a.preco)}</dd>
        <dt>Recebido</dt><dd>${pago ? brl(pago) + " · " + pags.map((p) => FORMAS[p.forma]).join(", ") : "—"}</dd>
        <dt>Telefone</dt><dd>${a.cliente_whatsapp ? `<a href="tel:+${zapNum(a.cliente_whatsapp)}">${fmtTel(a.cliente_whatsapp)}</a>` : "Sem telefone"}</dd>
      </dl>
      ${a.observacao ? `<p style="margin-top:12px;padding:10px 12px;background:var(--blush-2);border-radius:12px;font-size:14.5px">📝 ${esc(a.observacao)}</p>` : ""}
    </div>
    ${htmlCores(a.cores, coresAtuais)}
    <div class="pilha">
      ${prox ? `<button class="btn ouro cheio" data-st="${prox[0]}">${prox[1]}</button>` : ""}
      ${["concluido", "atendendo", "chegou"].includes(a.status) && !a.pago ? `<button class="btn cheio" data-pagar>${IC.dinheiro}Registrar pagamento</button>` : ""}
      ${a.cliente_whatsapp ? `<a class="btn zap cheio" target="_blank" rel="noopener" href="https://wa.me/${zapNum(a.cliente_whatsapp)}">${IC.zap}Conversar no WhatsApp</a>` : ""}
      <div class="grade2">
        <button class="btn claro" data-msgs>Mensagens prontas</button>
        <button class="btn claro" data-cli>Ver cliente</button>
      </div>
      ${ATIVOS.includes(a.status) || a.status === "concluido" ? `<div class="grade2">${!a.pago ? `<button class="btn claro" data-sinal>${a.sinal ? "Sinal: " + brl(a.sinal) : "Registrar sinal"}</button>` : ""}<button class="btn claro" data-atraso>${a.atrasou ? "Tirar atraso" : "Marcar atraso"}</button></div>` : ""}
      ${ATIVOS.includes(a.status) ? `<div class="grade2"><button class="btn claro" data-remarcar>Remarcar</button>${passado ? `<button class="btn perigo" data-st="faltou">Não compareceu</button>` : `<button class="btn perigo" data-cancelar>Cancelar</button>`}</div>` : ""}
      ${a.serie_id && ATIVOS.includes(a.status) ? `<button class="btn claro cheio" data-cancela-serie>🔁 Cancelar este e os próximos da série</button>` : ""}
      ${a.status === "concluido" || a.pago ? `<button class="btn claro cheio" data-pagar>${IC.dinheiro}${a.pago ? "Registrar outro pagamento" : "Registrar pagamento"}</button>` : ""}
      ${["cancelado", "faltou"].includes(a.status) ? `<button class="btn claro cheio" data-reabrir>Reabrir agendamento</button>` : ""}
    </div>`, (r) => {
    r.querySelectorAll("[data-st]").forEach((b) => (b.onclick = async () => {
      const novo = b.dataset.st;
      if (novo === "faltou" && !confirm("Marcar que a cliente não compareceu?")) return;
      await q(sb.from("ad_agendamentos").update({ status: novo }).eq("id", a.id));
      toast({ confirmado: "Horário confirmado.", chegou: "Chegada registrada.", atendendo: "Atendimento iniciado.", concluido: "Atendimento finalizado.", faltou: "Falta registrada." }[novo]);
      if (novo === "concluido") { festa(); return registraPagamento(a, true); }
      detalheAg(a.id); atualizaTela();
    }));
    r.querySelector("[data-cancelar]")?.addEventListener("click", async () => {
      if (!confirm("Cancelar este agendamento? O horário volta a ficar livre no site.")) return;
      await q(sb.from("ad_agendamentos").update({ status: "cancelado" }).eq("id", a.id));
      toast("Agendamento cancelado.");
      if (confirm("Avisar a cliente pelo WhatsApp?")) abreZap(linkZap(a, "cancelamento"));
      fechaFolha(); atualizaTela();
    });
    r.querySelector("[data-reabrir]")?.addEventListener("click", async () => {
      const { error } = await sb.from("ad_agendamentos").update({ status: "marcado" }).eq("id", a.id);
      if (error) return toast(erroMsg(error), 1);
      toast("Agendamento reaberto."); detalheAg(a.id); atualizaTela();
    });
    r.querySelectorAll("[data-pagar]").forEach((b) => (b.onclick = () => registraPagamento(a)));
    r.querySelector("[data-sinal]")?.addEventListener("click", () => registraPagamento(a, false, true));
    r.querySelector("[data-atraso]")?.addEventListener("click", async () => { await q(sb.from("ad_agendamentos").update({ atrasou: !a.atrasou }).eq("id", a.id)); toast(a.atrasou ? "Atraso removido." : "Atraso registrado."); detalheAg(a.id); atualizaTela(); });
    r.querySelector("[data-remarcar]")?.addEventListener("click", () => remarcar(a));
    r.querySelector("[data-cancela-serie]")?.addEventListener("click", () => cancelaSerie(a));
    r.querySelector("[data-cli]").onclick = () => a.cliente_id ? detalheCliente(a.cliente_id) : toast("Cliente sem cadastro.", 1);
    r.querySelector("[data-msgs]").onclick = () => mensagensProntas(a);
  });
}

function mensagensProntas(a) {
  const tipos = [["confirmacao", "Confirmar agendamento"], ["lembrete", "Lembrete com link de confirmação"], ["alteracao", "Avisar alteração de horário"], ["cancelamento", "Avisar cancelamento"], ["agradecimento", "Agradecer a visita"], ["avaliacao", "Pedir avaliação no Google"]];
  abreFolha(cabFolha("Mensagens prontas", `Para ${esc(a.cliente_nome)}. Abre o WhatsApp com o texto pronto.`) +
    `<div class="lista">${tipos.map(([t, n]) => `<a class="item" target="_blank" rel="noopener" href="${linkZap(a, t)}"><div class="ic" style="color:var(--zap)">${IC.zap}</div><div class="cresce"><b>${n}</b><div class="pequeno" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(mensagem(a, t).replace(/\*/g, "").slice(0, 70))}…</div></div><span class="seta">›</span></a>`).join("")}</div>
    <button class="btn claro cheio" data-voltar>Voltar</button>`, (r) => (r.querySelector("[data-voltar]").onclick = () => detalheAg(a.id)));
}

// ---------- escolher dia e horário (usado em novo agendamento e remarcar) ----------
function seletorHorario(r, minutos, dataInicial, aoMudar) {
  const caixa = r.querySelector("[data-horario]");
  let escolhido = null;
  caixa.innerHTML = `<label class="f">Dia</label><input class="campo" type="date" data-data value="${dataInicial}" min="${isoDia()}">
    <label class="f">Horário livre</label><div class="slots" data-slots><p class="pequeno" style="grid-column:1/-1">Carregando…</p></div>
    <button class="link" data-outro style="margin-top:10px">Usar outro horário</button>
    <div class="hide" data-manual><label class="f">Horário (fora da lista)</label><input class="campo" type="time" step="300" data-hora></div>`;
  const carrega = async () => {
    escolhido = null; aoMudar(null);
    const d = caixa.querySelector("[data-data]").value; const mins = minutos();
    const sl = caixa.querySelector("[data-slots]");
    if (!d || !mins) { sl.innerHTML = `<p class="pequeno" style="grid-column:1/-1">Escolha o serviço e o dia.</p>`; return; }
    sl.innerHTML = `<p class="pequeno" style="grid-column:1/-1">Carregando…</p>`;
    const lv = await livres(d, mins);
    sl.innerHTML = lv.length ? lv.map((t) => `<button type="button" data-t="${t}">${hora(t)}</button>`).join("") : `<p class="pequeno" style="grid-column:1/-1">Sem horários livres neste dia. Use "outro horário" se quiser encaixar.</p>`;
    sl.querySelectorAll("button").forEach((b) => (b.onclick = () => { sl.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); escolhido = b.dataset.t; caixa.querySelector("[data-hora]").value = ""; aoMudar(escolhido); }));
  };
  caixa.querySelector("[data-data]").onchange = carrega;
  caixa.querySelector("[data-outro]").onclick = () => caixa.querySelector("[data-manual]").classList.toggle("hide");
  caixa.querySelector("[data-hora]").onchange = (e) => {
    if (!e.target.value) return;
    caixa.querySelectorAll("[data-slots] button").forEach((x) => x.classList.remove("on"));
    escolhido = new Date(`${caixa.querySelector("[data-data]").value}T${e.target.value}:00-03:00`).toISOString(); aoMudar(escolhido);
  };
  carrega();
  return { recarrega: carrega };
}

async function remarcar(a) {
  const mins = Math.round((new Date(a.fim) - new Date(a.inicio)) / 60000);
  let novo = null;
  abreFolha(cabFolha("Remarcar", `${esc(a.cliente_nome)} · ${esc(a.servico_nome)}<br>Hoje: ${dataLonga(a.inicio)} às ${hora(a.inicio)}`) +
    `<div class="cartao"><div data-horario></div></div><button class="btn ouro cheio" data-salvar disabled>Salvar novo horário</button>
     <button class="btn claro cheio" data-voltar style="margin-top:10px">Voltar</button>`, (r) => {
    seletorHorario(r, () => mins, isoDia(a.inicio), (t) => { novo = t; r.querySelector("[data-salvar]").disabled = !t; });
    r.querySelector("[data-voltar]").onclick = () => detalheAg(a.id);
    r.querySelector("[data-salvar]").onclick = async () => {
      const ini = new Date(novo), fim = new Date(ini.getTime() + mins * 60000);
      const { error } = await sb.from("ad_agendamentos").update({ inicio: ini.toISOString(), fim: fim.toISOString(), aviso_breve: false }).eq("id", a.id);
      if (error) return toast(erroMsg(error), 1);
      toast("Horário remarcado.");
      const atualizado = { ...a, inicio: ini.toISOString(), fim: fim.toISOString() };
      if (confirm("Avisar a cliente do novo horário pelo WhatsApp?")) abreZap(linkZap(atualizado, "alteracao"));
      detalheAg(a.id); atualizaTela();
    };
  });
}

// =====================================================================
// NOVO AGENDAMENTO
// =====================================================================
async function novoAgendamento({ data, cliente }) {
  const clientes = await q(sb.from("ad_clientes").select("id,nome,whatsapp").order("nome"));
  let horario = null, cli = cliente || null;
  const servs = st.servicos.filter((s) => s.ativo);
  abreFolha(cabFolha("Novo agendamento") + `
    <div class="cartao">
      <label class="f">Cliente</label>
      <input class="campo" data-cli list="lista-clientes" placeholder="Digite o nome" value="${cli ? esc(cli.nome) : ""}" autocomplete="off">
      <datalist id="lista-clientes">${clientes.map((c) => `<option value="${esc(c.nome)}">${fmtTel(c.whatsapp)}</option>`).join("")}</datalist>
      <label class="f">WhatsApp da cliente <span class="pequeno">(opcional)</span></label>
      <input class="campo" data-zap inputmode="tel" placeholder="(31) 99999-9999" value="${cli ? fmtTel(cli.whatsapp) : ""}">
      <label class="f">Serviço</label>
      <select class="campo" data-serv><option value="">Escolha…</option>${servs.map((s) => `<option value="${s.id}">${esc(s.nome)} · ${brl(s.preco)} · ${dur(s.duracao_min)}</option>`).join("")}</select>
      <div data-horario></div>
      ${htmlRepetir()}
      <label class="f">Observação</label><textarea class="campo" data-obs placeholder="Opcional"></textarea>
    </div>
    <button class="btn ouro cheio" data-salvar>Agendar</button>`, (r) => {
    const serv = () => servs.find((s) => s.id === r.querySelector("[data-serv]").value);
    let rep = null;
    const sel = seletorHorario(r, () => serv()?.duracao_min, data || isoDia(), (t) => { horario = t; rep?.atualiza(); });
    rep = ligaRepetir(r, () => horario);
    r.querySelector("[data-serv]").onchange = () => sel.recarrega();
    r.querySelector("[data-cli]").oninput = (e) => {
      const c = clientes.find((x) => x.nome.toLowerCase() === e.target.value.trim().toLowerCase());
      if (c) { cli = c; r.querySelector("[data-zap]").value = fmtTel(c.whatsapp); } else cli = null;
    };
    r.querySelector("[data-salvar]").onclick = async () => {
      const nome = r.querySelector("[data-cli]").value.trim(), zap = r.querySelector("[data-zap]").value.replace(/\D/g, ""), s = serv();
      if (nome.length < 2) return toast("Escreva o nome da cliente.", 1);
      if (zap.length && zap.length < 10) return toast("Escreva o WhatsApp com DDD (ou deixe em branco).", 1);
      if (!s) return toast("Escolha o serviço.", 1);
      if (!horario) return toast("Escolha o horário.", 1);
      const ini = new Date(horario);
      const base = {
        profissional_id: st.prof.id, servico_id: s.id, servico_nome: s.nome, preco: s.preco,
        cliente_nome: nome, cliente_whatsapp: zap, cliente_id: cli?.id || null, status: "confirmado",
        observacao: r.querySelector("[data-obs]").value.trim() || null,
      };
      if (rep.repete()) {
        const inicios = rep.ocorrencias();
        if (inicios.length < 2) return toast("Complete a repetição (dias, datas ou quando termina).", 1);
        const linhas = await salvaSerie(base, inicios, s.duracao_min, rep.regra());
        if (!linhas) return;
        toast(`${linhas.length} horários agendados! 🔁`);
        if (zap && confirm("Enviar a lista de horários para a cliente no WhatsApp?")) abreZap(`https://wa.me/${zapNum(zap)}?text=${encodeURIComponent(msgSerie(base, linhas))}`);
        fechaFolha(); st.dia = isoDia(ini); atualizaTela(); return;
      }
      const { error } = await sb.from("ad_agendamentos").insert({
        ...base, inicio: ini.toISOString(), fim: new Date(ini.getTime() + s.duracao_min * 60000).toISOString(),
      });
      if (error) return toast(erroMsg(error), 1);
      toast("Agendado!");
      const a = { cliente_nome: nome, cliente_whatsapp: zap, servico_nome: s.nome, inicio: ini.toISOString() };
      if (zap && confirm("Enviar a confirmação para a cliente no WhatsApp?")) abreZap(linkZap(a, "confirmacao"));
      fechaFolha(); st.dia = isoDia(ini); atualizaTela();
    };
  });
}

// =====================================================================
// PAGAMENTOS
// =====================================================================
async function registraPagamento(a, depoisDeFinalizar, ehSinal) {
  let pago = 0;
  if (a) pago = (await q(sb.from("ad_pagamentos").select("valor").eq("agendamento_id", a.id))).reduce((s, p) => s + Number(p.valor), 0);
  const sugestao = ehSinal ? "" : a ? Math.max(Number(a.preco) - pago, 0) : "";
  let forma = "pix";
  abreFolha(cabFolha(ehSinal ? "Registrar sinal" : "Registrar pagamento", a ? `${esc(a.cliente_nome)} · ${esc(a.servico_nome)}${pago ? `<br>Já recebido: ${brl(pago)}` : ""}` : "Recebimento avulso") + `
    <div class="cartao">
      <label class="f">Valor recebido (R$)</label>
      <input class="campo" data-valor type="number" inputmode="decimal" step="0.01" min="0" value="${sugestao || ""}" style="font-size:22px;font-weight:600">
      <label class="f">Forma de pagamento</label>
      <div class="opcoes" data-formas>${Object.entries(FORMAS).map(([k, v]) => `<button type="button" data-f="${k}" class="${k === forma ? "on" : ""}">${v}</button>`).join("")}</div>
      <p class="pequeno" data-taxa style="margin-top:8px"></p>
      ${a ? "" : `<label class="f">Descrição</label><input class="campo" data-obs placeholder="Ex.: venda de esmalte">`}
    </div>
    <button class="btn ouro cheio" data-salvar>Salvar pagamento</button>
    ${depoisDeFinalizar ? `<button class="btn claro cheio" data-depois style="margin-top:10px">Registrar depois</button>` : ""}`, (r) => {
    const mostraTaxa = () => { const v = Number(r.querySelector("[data-valor]").value || 0), p = taxaPct(forma); r.querySelector("[data-taxa]").textContent = p && v ? `Taxa da maquininha (${String(p).replace(".", ",")}%): ${brl(v * p / 100)} · fica ${brl(v - v * p / 100)}` : ""; };
    r.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { forma = b.dataset.f; r.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("on", x === b)); mostraTaxa(); }));
    r.querySelector("[data-valor]").addEventListener("input", mostraTaxa); mostraTaxa();
    r.querySelector("[data-depois]")?.addEventListener("click", () => { detalheAg(a.id); atualizaTela(); });
    r.querySelector("[data-salvar]").onclick = async () => {
      const valor = Number(r.querySelector("[data-valor]").value);
      if (!(valor > 0)) return toast("Informe o valor.", 1);
      await q(sb.from("ad_pagamentos").insert({ profissional_id: st.prof.id, agendamento_id: a?.id || null, cliente_id: a?.cliente_id || null, valor, forma, taxa: Math.round(valor * taxaPct(forma)) / 100, observacao: ehSinal ? "Sinal" : r.querySelector("[data-obs]")?.value.trim() || null }));
      if (ehSinal) await q(sb.from("ad_agendamentos").update({ sinal: Number(a.sinal || 0) + valor }).eq("id", a.id));
      if (a && pago + valor >= Number(a.preco) - 0.009) await q(sb.from("ad_agendamentos").update({ pago: true }).eq("id", a.id));
      toast(`Pagamento de ${brl(valor)} registrado. ✨`); festa();
      if (a) { if (a.status === "concluido" && confirm("Mandar mensagem de agradecimento para a cliente?")) abreZap(linkZap(a, "agradecimento")); detalheAg(a.id); }
      else fechaFolha();
      atualizaTela();
    };
  });
}

// =====================================================================
// CLIENTES
// =====================================================================
async function dadosClientes() {
  const [clientes, ags, pags] = await Promise.all([
    q(sb.from("ad_clientes").select("*").order("nome")),
    q(sb.from("ad_agendamentos").select("id,cliente_id,status,inicio,preco,servico_nome")),
    q(sb.from("ad_pagamentos").select("cliente_id,valor")),
  ]);
  const agora = new Date();
  return clientes.map((c) => {
    const meus = ags.filter((a) => a.cliente_id === c.id);
    const feitos = meus.filter((a) => a.status === "concluido").sort((x, y) => new Date(x.inicio) - new Date(y.inicio));
    const ult = feitos[feitos.length - 1];
    const prox = meus.filter((a) => ATIVOS.includes(a.status) && new Date(a.inicio) > agora).sort((x, y) => new Date(x.inicio) - new Date(y.inicio))[0];
    return { ...c, ags: meus, visitas: feitos.length, ultima: ult?.inicio || null, primeira: feitos[0]?.inicio || null, proxima: prox?.inicio || null,
      cancel: meus.filter((a) => a.status === "cancelado").length, faltas: meus.filter((a) => a.status === "faltou").length,
      gasto: pags.filter((p) => p.cliente_id === c.id).reduce((s, p) => s + Number(p.valor), 0),
      diasSem: ult ? Math.max(0, Math.floor((agora - new Date(ult.inicio)) / 864e5)) : null,
      favoritos: Object.entries(feitos.reduce((m, a) => ((m[a.servico_nome] = (m[a.servico_nome] || 0) + 1), m), {})).sort((x, y) => y[1] - x[1]).slice(0, 2).map((x) => x[0]) };
  });
}

async function telaClientes() {
  const todas = await dadosClientes();
  const r = tela(`
    <div class="busca">${IC.busca}<input class="campo" id="busca-cli" placeholder="Buscar por nome ou telefone" value="${esc(st.busca)}" autocomplete="off"></div>
    <div class="seg" id="filtro-cli">
      <button data-f="todas" class="on">Todas</button><button data-f="vip">VIP</button><button data-f="frequentes">Frequentes</button><button data-f="novas">Novas</button><button data-f="sumidas">Inativas</button><button data-f="aniver">Aniver.</button>
    </div>
    <div id="lista-cli"></div>
    <button class="btn ouro cheio" id="nova-cli">${IC.mais}Cadastrar cliente</button>`);
  let filtro = "todas";
  const mesAtual = isoDia().slice(5, 7);
  const desenha = () => {
    const t = st.busca.toLowerCase().replace(/\D/g, "") || null, n = st.busca.toLowerCase().trim();
    let l = todas.filter((c) => !n || c.nome.toLowerCase().includes(n) || (t && c.whatsapp.includes(t)));
    if (filtro === "frequentes") l = l.filter((c) => c.visitas >= 3).sort((a, b) => b.visitas - a.visitas);
    if (filtro === "sumidas") l = l.filter((c) => c.diasSem !== null && c.diasSem >= 30 && !c.proxima).sort((a, b) => b.diasSem - a.diasSem);
    if (filtro === "vip") l = l.filter((c) => c.vip);
    if (filtro === "novas") l = l.filter((c) => c.visitas <= 1 && (Date.now() - new Date(c.criado_em)) / 864e5 <= 30);
    if (filtro === "aniver") l = l.filter((c) => c.aniversario && c.aniversario.slice(5, 7) === mesAtual).sort((a, b) => a.aniversario.slice(8) - b.aniversario.slice(8));
    $("lista-cli").innerHTML = (filtro === "sumidas" && l.length ? `<p class="pequeno" style="margin:0 4px 8px">Clientes há 30 dias ou mais sem voltar e sem horário marcado. Toque em "Convidar" para mandar uma mensagem pronta.</p>` : "") + (l.length ? `<div class="lista">${l.map((c) => `<button class="item" data-c="${c.id}">${avatarCli(c)}
      <div class="cresce"><b>${esc(c.nome)}</b>${c.vip ? ' <span class="chip vip">VIP</span>' : ""}${c.visitas >= 3 ? ' <span class="chip concluido">Frequente</span>' : ""}
      <div class="pequeno">${c.proxima ? "Próximo: " + dataCurta(c.proxima) + " às " + hora(c.proxima) : c.ultima ? (c.diasSem === 0 ? "Última visita hoje" : `Última visita há ${c.diasSem} dia${c.diasSem !== 1 ? "s" : ""}`) : "Ainda sem visitas"}${filtro === "aniver" && c.aniversario ? " · 🎂 " + c.aniversario.slice(8) + "/" + c.aniversario.slice(5, 7) : ""}</div></div>
      ${filtro === "sumidas" ? `<a class="btn zap mini" target="_blank" rel="noopener" data-parar href="https://wa.me/${zapNum(c.whatsapp)}?text=${encodeURIComponent(msgVolta(c))}">Convidar</a>` : '<span class="seta">›</span>'}</button>`).join("")}</div>`
      : `<div class="vazio">${IC.cliente}<div>${todas.length ? "Nenhuma cliente nesta lista." : "As clientes que agendam pelo site aparecem aqui automaticamente."}</div></div>`);
    $("lista-cli").querySelectorAll("[data-parar]").forEach((x) => x.addEventListener("click", (e) => e.stopPropagation()));
    $("lista-cli").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => detalheCliente(b.dataset.c)));
  };
  $("busca-cli").oninput = (e) => { st.busca = e.target.value; desenha(); };
  $("filtro-cli").querySelectorAll("button").forEach((b) => (b.onclick = () => { filtro = b.dataset.f; $("filtro-cli").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); desenha(); }));
  $("nova-cli").onclick = () => editaCliente(null);
  desenha();
}

function msgVolta(c) {
  const n = primeiroNome(c.nome), fav = c.favoritos?.[0];
  return `Oi, ${n}! 💗 Faz um tempinho que você não vem${c.diasSem ? ` (${c.diasSem} dias!)` : ""}. Bora deixar as unhas lindas de novo${fav ? ` com ${fav.toLowerCase()}` : ""}? Escolha seu horário aqui: ${SITE}`;
}
async function detalheCliente(id) {
  const c = (await dadosClientes()).find((x) => x.id === id);
  if (!c) return toast("Cliente não encontrada.", 1);
  const hist = [...c.ags].sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
  const n = primeiroNome(c.nome);
  const msgRetorno = msgVolta(c);
  const msgAniver = `Feliz aniversário, ${n}! 🎂💅 Desejo um dia lindo e cheio de carinho. Um beijo da Nayara!`;
  const freq = c.visitas >= 2 ? Math.round((new Date(c.ultima) - new Date(c.primeira)) / 864e5 / (c.visitas - 1)) : null;
  abreFolha(`<div class="cli-topo">${avatarCli(c, 64)}<div class="cresce">${cabFolha(esc(c.nome) + (c.vip ? ' <span class="chip vip">VIP</span>' : ""), `${fmtTel(c.whatsapp)}${c.email ? " · " + esc(c.email) : ""}${c.aniversario ? " · 🎂 " + c.aniversario.slice(8) + "/" + c.aniversario.slice(5, 7) : ""}`)}</div></div>` + `
    ${c.proxima || c.favoritos.length || c.indicada_por ? `<div class="cartao calmo">${c.proxima ? `<div>📅 Próximo: <b>${dataCurta(c.proxima)} às ${hora(c.proxima)}</b></div>` : ""}${c.favoritos.length ? `<div style="margin-top:4px">💅 Gosta de: <b>${c.favoritos.map(esc).join(", ")}</b></div>` : ""}${c.indicada_por ? `<div style="margin-top:4px">🤝 Indicada por: <b>${esc(c.indicada_por)}</b></div>` : ""}</div>` : ""}
    <div class="stats">
      <div class="stat"><small>Visitas</small><b>${c.visitas}</b><i>${c.primeira ? "desde " + dataCurta(c.primeira) : "—"}</i></div>
      <div class="stat"><small>Total pago</small><b>${brl(c.gasto)}</b><i>${freq ? "volta a cada ~" + freq + " dias" : ""}</i></div>
      <div class="stat"><small>Cancelamentos</small><b>${c.cancel}</b><i>${c.faltas ? c.faltas + " falta" + (c.faltas > 1 ? "s" : "") : "sem faltas"}</i></div>
      <div class="stat"><small>Última visita</small><b style="font-size:20px">${c.ultima ? dataCurta(c.ultima) : "—"}</b><i>${c.diasSem === null ? "" : c.diasSem === 0 ? "hoje" : "há " + c.diasSem + " dia" + (c.diasSem !== 1 ? "s" : "")}</i></div>
    </div>
    ${c.cancel + c.faltas >= 2 ? `<p class="cartao" style="background:var(--alerta-bg);color:var(--alerta);font-size:14.5px">⚠️ Essa cliente já cancelou ou faltou ${c.cancel + c.faltas} vezes.</p>` : ""}
    ${htmlFidelidade(c)}
    ${c.observacao ? `<div class="cartao"><b>Anotações</b><p class="mudo" style="margin-top:4px;white-space:pre-wrap">${esc(c.observacao)}</p></div>` : ""}
    <div class="pilha">
      ${c.whatsapp ? `<a class="btn zap cheio" target="_blank" rel="noopener" href="https://wa.me/${zapNum(c.whatsapp)}">${IC.zap}Conversar no WhatsApp</a>` : `<p class="pequeno" style="text-align:center">Sem telefone cadastrado. Toque em Editar para adicionar.</p>`}
      <button class="btn ouro cheio" data-agendar>${IC.mais}Novo agendamento</button>
      <div class="grade2">
        <a class="btn claro" target="_blank" rel="noopener" href="https://wa.me/${zapNum(c.whatsapp)}?text=${encodeURIComponent(msgRetorno)}">Convidar a voltar</a>
        <a class="btn claro" target="_blank" rel="noopener" href="https://wa.me/${zapNum(c.whatsapp)}?text=${encodeURIComponent(msgAniver)}">Parabéns 🎂</a>
      </div>
      <div class="grade2"><button class="btn claro" data-vip>${c.vip ? "Tirar do VIP" : "⭐ Marcar como VIP"}</button><button class="btn claro" data-editar>Editar dados</button></div>
    </div>
    <div class="tit-linha"><h2>Histórico</h2></div>
    ${hist.length ? hist.map((a) => cartaoAg(a, true)).join("") : `<div class="vazio">Sem atendimentos ainda.</div>`}`, (r) => {
    r.querySelector("[data-agendar]").onclick = () => novoAgendamento({ cliente: c });
    r.querySelector("[data-editar]").onclick = () => editaCliente(c);
    r.querySelector("[data-vip]").onclick = async () => { await q(sb.from("ad_clientes").update({ vip: !c.vip }).eq("id", c.id)); toast(c.vip ? "Cliente tirada do VIP." : "Cliente marcada como VIP ⭐"); detalheCliente(c.id); };
    r.querySelector("[data-resgatar]")?.addEventListener("click", async () => { if (await resgataFid(c)) detalheCliente(c.id); });
    ligaCartoes(r);
  });
}

function editaCliente(c) {
  abreFolha(cabFolha(c ? "Editar cliente" : "Cadastrar cliente") + `
    <div class="cartao">
      <div class="linha" style="gap:12px;margin-bottom:6px"><div data-prev>${c ? avatarCli(c, 64) : `<div class="avatar" style="width:64px;height:64px">${IC.camera}</div>`}</div><label class="btn mini" style="cursor:pointer">${IC.camera}Foto<input type="file" accept="image/*" data-foto hidden></label></div>
      <label class="f">Nome completo</label><input class="campo" data-nome value="${esc(c?.nome || "")}" autocomplete="off">
      <label class="f">WhatsApp <span class="pequeno">(opcional)</span></label><input class="campo" data-zap inputmode="tel" value="${c ? fmtTel(c.whatsapp) : ""}" placeholder="(31) 99999-9999">
      <label class="f">E-mail</label><input class="campo" data-email type="email" value="${esc(c?.email || "")}" placeholder="Opcional">
      <label class="f">Aniversário</label><input class="campo" data-aniver type="date" value="${c?.aniversario || ""}">
      <label class="f">Indicada por</label><input class="campo" data-ind value="${esc(c?.indicada_por || "")}" placeholder="Nome de quem indicou (opcional)">
      <label class="interruptor" style="margin-top:8px"><span>Cliente VIP</span><input type="checkbox" data-vip ${c?.vip ? "checked" : ""}></label>
      <label class="f">Anotações particulares</label><textarea class="campo" data-obs placeholder="Preferências, cores favoritas, cuidados…">${esc(c?.observacao || "")}</textarea>
    </div>
    <button class="btn ouro cheio" data-salvar>Salvar</button>`, (r) => {
    let foto = null;
    r.querySelector("[data-foto]").onchange = (e) => { foto = e.target.files[0]; if (foto) r.querySelector("[data-prev]").innerHTML = `<img src="${URL.createObjectURL(foto)}" class="avatar" style="width:64px;height:64px;object-fit:cover;padding:0">`; };
    r.querySelector("[data-salvar]").onclick = async () => {
      const d = { nome: r.querySelector("[data-nome]").value.trim(), whatsapp: r.querySelector("[data-zap]").value.replace(/\D/g, ""), vip: r.querySelector("[data-vip]").checked, indicada_por: r.querySelector("[data-ind]").value.trim() || null,
        email: r.querySelector("[data-email]").value.trim() || null, aniversario: r.querySelector("[data-aniver]").value || null, observacao: r.querySelector("[data-obs]").value.trim() || null };
      if (d.nome.length < 2) return toast("Escreva o nome.", 1);
      if (d.whatsapp.length && d.whatsapp.length < 10) return toast("Escreva o WhatsApp com DDD (ou deixe em branco).", 1);
      if (!d.whatsapp) d.whatsapp = null;
      if (foto) { try { d.foto_url = await fotoCliente(foto); } catch { return; } }
      const { data, error } = c ? await sb.from("ad_clientes").update(d).eq("id", c.id).select().single()
        : await sb.from("ad_clientes").insert({ ...d, profissional_id: st.prof.id }).select().single();
      if (error) return toast(error.message.includes("duplicate") ? "Já existe uma cliente com esse WhatsApp." : erroMsg(error), 1);
      toast("Cliente salva."); detalheCliente(data.id); if (st.aba === "clientes") telaClientes();
    };
  });
}

// =====================================================================
// CAIXA
// =====================================================================
async function telaCaixa() {
  const hoje = isoDia();
  const per = st.caixaPer;
  const ini = per === "hoje" ? hoje : per === "semana" ? somaDias(hoje, -6) : hoje.slice(0, 8) + "01";
  const fim = somaDias(hoje, 1);
  const [a0, m0] = hoje.split("-").map(Number);
  const fimMes = new Date(Date.UTC(a0, m0, 1)).toISOString().slice(0, 10);
  const [pags, ags, desp, agsMesTodo, pagsMesAnt] = await Promise.all([
    pagsEntre(ini, fim), agsEntre(ini, fim),
    q(sb.from("ad_lancamentos").select("*").eq("tipo", "saida").eq("pago", true).gte("data", ini).lt("data", fim).order("data", { ascending: false })),
    per === "mes" ? agsEntre(ini, fimMes) : Promise.resolve(null),
    per === "mes" ? (async () => { const i = new Date(Date.UTC(a0, m0 - 2, 1)).toISOString().slice(0, 10); const d = Math.min(Number(hoje.slice(8)), new Date(Date.UTC(a0, m0 - 1, 0)).getUTCDate()); return pagsEntre(i, somaDias(i, d)); })() : Promise.resolve(null),
  ]);
  const aPagar = await q(sb.from("ad_lancamentos").select("*").eq("tipo", "saida").eq("pago", false).order("vencimento"));
  const recebido = pags.reduce((s, p) => s + Number(p.valor), 0);
  const despesas = desp.reduce((s, l) => s + Number(l.valor), 0);
  // Lucro real: bruto − taxas da maquininha − material gasto nos atendimentos − despesas.
  // Se o custo de material por serviço estiver cadastrado, as compras de material não entram de novo (evita contar duas vezes).
  const usaCustoServ = st.servicos.some((x) => Number(x.custo_material) > 0);
  const taxas = pags.reduce((s, p) => s + Number(p.taxa || 0), 0);
  const materiais = usaCustoServ ? ags.filter((a) => a.status === "concluido").reduce((s, a) => s + custoServico(a), 0) : 0;
  const COMPRA = ["Compra de esmaltes", "Compra de materiais"];
  const despOper = usaCustoServ ? desp.filter((l) => !COMPRA.includes(l.categoria)).reduce((s, l) => s + Number(l.valor), 0) : despesas;
  const fixas = desp.filter((l) => l.fixa).reduce((s, l) => s + Number(l.valor), 0);
  const lucro = recebido - taxas - materiais - despOper;
  const comAg = pags.filter((p) => p.agendamento_id);
  const atend = new Set(comAg.map((p) => p.agendamento_id)).size;
  const ticket = atend ? comAg.reduce((s, p) => s + Number(p.valor), 0) / atend : 0;
  const pendentes = ags.filter((a) => a.status === "concluido" && !a.pago);
  const pendente = pendentes.reduce((s, a) => s + Number(a.preco), 0);
  const cancel = ags.filter((a) => a.status === "cancelado"), faltas = ags.filter((a) => a.status === "faltou");
  const porForma = {}; pags.forEach((p) => (porForma[p.forma] = (porForma[p.forma] || 0) + Number(p.valor)));
  const agPorId = Object.fromEntries(ags.map((a) => [a.id, a]));
  const porServ = {}; comAg.forEach((p) => { const nm = agPorId[p.agendamento_id]?.servico_nome || "Outros"; porServ[nm] = (porServ[nm] || 0) + Number(p.valor); });
  const maxF = Math.max(1, ...Object.values(porForma)), maxS = Math.max(1, ...Object.values(porServ));
  const ant = pagsMesAnt ? pagsMesAnt.reduce((s, p) => s + Number(p.valor), 0) : null;
  const variacao = ant ? Math.round(((recebido - ant) / ant) * 100) : null;
  const rot = { hoje: "hoje", semana: "nos últimos 7 dias", mes: "neste mês" }[per];
  // previsão do mês: recebido + o que ainda está agendado até o fim do mês
  const aindaVem = agsMesTodo ? agsMesTodo.filter((a) => ATIVOS.includes(a.status) && new Date(a.inicio) > new Date()).reduce((s, a) => s + Number(a.preco), 0) : 0;
  const meta = Number(st.prof.meta_mensal || 0);
  const pctMeta = meta ? Math.min(100, Math.round((recebido / meta) * 100)) : 0;

  const r = tela(`
    <div class="seg" id="per"><button data-p="hoje" class="${per === "hoje" ? "on" : ""}">Hoje</button><button data-p="semana" class="${per === "semana" ? "on" : ""}">7 dias</button><button data-p="mes" class="${per === "mes" ? "on" : ""}">Mês</button></div>
    <div class="hero">
      <div class="l">Lucro real ${rot}</div>
      <div class="v">${brl(lucro)}</div>
      <div class="sub">${variacao !== null ? (variacao >= 0 ? "▲ " : "▼ ") + Math.abs(variacao) + "% de recebimentos vs. o mesmo período do mês passado" : "O que sobrou de verdade"}</div>
      <div class="hstats">
        <div><small>Faturamento bruto</small><b>${brl(recebido)}</b></div>
        <div><small>Taxas + material</small><b>${brl(taxas + materiais)}</b></div>
        <div><small>Despesas</small><b>${brl(despOper)}</b></div>
      </div>
      ${per === "mes" ? `<div class="meta">${meta ? `<small><span>Meta do mês: ${brl(meta)}</span><span>${pctMeta}%</span></small><div class="barra"><span style="width:${pctMeta}%"></span></div>` : ""}
        <small style="margin-top:8px"><span>Previsão do mês (recebido + agendado): <b>${brl(recebido + aindaVem)}</b></span></small></div>` : ""}
    </div>
    <div class="grade2" style="margin-bottom:12px">
      <button class="btn prim" id="pag-avulso">${IC.mais}Recebimento</button>
      <button class="btn" id="nova-desp">${IC.mais}Despesa</button>
    </div>
    <div class="cartao calmo conta">
      <div class="linha entre"><span>Faturamento bruto</span><b>${brl(recebido)}</b></div>
      <div class="linha entre"><span>− Taxas da maquininha</span><span>${brl(taxas)}</span></div>
      ${usaCustoServ ? `<div class="linha entre"><span>− Material dos atendimentos</span><span>${brl(materiais)}</span></div>` : ""}
      <div class="linha entre"><span>− Despesas${fixas ? ` (fixas ${brl(fixas)})` : ""}</span><span>${brl(despOper)}</span></div>
      <div class="linha entre total"><b>= Lucro real</b><b class="${lucro < 0 ? "neg" : "ouro-t"}">${brl(lucro)}</b></div>
      ${!usaCustoServ || !taxaPct("credito") ? `<button class="link" id="b-taxas" style="margin-top:8px">${!taxaPct("credito") ? "Cadastrar taxa da maquininha" : ""}${!taxaPct("credito") && !usaCustoServ ? " e " : ""}${!usaCustoServ ? "custo de material por serviço" : ""} ›</button>` : `<p class="pequeno" style="margin-top:6px">Compras de esmalte e material não entram aqui, porque o custo já vem de cada atendimento.</p>`}
    </div>
    <div class="stats">
      <div class="stat"><small>A receber</small><b>${brl(pendente)}</b><i>${pendentes.length} atendido${pendentes.length !== 1 ? "s" : ""} sem pagar</i></div>
      <div class="stat"><small>Ticket médio</small><b>${brl(ticket)}</b><i>por atendimento</i></div>
      <div class="stat"><small>Cancelamentos</small><b>${cancel.length}</b><i>${faltas.length} falta${faltas.length !== 1 ? "s" : ""}</i></div>
      <div class="stat"><small>${per === "mes" ? "Ainda vem no mês" : "Atendimentos"}</small><b>${per === "mes" ? brl(aindaVem) : atend}</b><i>${per === "mes" ? "já agendado" : rot}</i></div>
      <div class="stat"><small>Perdido com faltas</small><b>${brl([...cancel, ...faltas].reduce((s, a) => s + Number(a.preco), 0))}</b><i>${rot}</i></div>
    </div>
    ${per === "mes" ? `<button class="btn cheio" id="b-meta" style="margin-bottom:12px">${meta ? "Mudar a meta do mês" : "Definir uma meta para o mês"}</button>` : ""}
    <div id="dicas"></div>
    ${pendentes.length ? `<div class="tit-linha"><h2>A receber</h2></div>${pendentes.map((a) => cartaoAg(a, true)).join("")}` : ""}
    <div class="cartao"><h2>Por forma de pagamento</h2>${Object.keys(porForma).length ? Object.entries(porForma).sort((x, y) => y[1] - x[1]).map(([f, v]) => `<div style="margin-top:12px"><div class="linha entre"><span>${FORMAS[f]}</span><b>${brl(v)}</b></div><div class="barra-h"><span style="width:${(v / maxF) * 100}%"></span></div></div>`).join("") : `<p class="mudo">Nenhum pagamento registrado ${rot}.</p>`}</div>
    <div class="cartao"><h2>Serviços que mais faturaram</h2>${Object.keys(porServ).length ? Object.entries(porServ).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([sv, v]) => `<div style="margin-top:12px"><div class="linha entre"><span class="cresce" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sv)}</span><b>${brl(v)}</b></div><div class="barra-h"><span style="width:${(v / maxS) * 100}%"></span></div></div>`).join("") : `<p class="mudo">Aparece aqui quando houver pagamentos de atendimentos.</p>`}</div>
    <div class="tit-linha"><h2>Contas a pagar</h2><span class="pequeno">${aPagar.length ? brl(aPagar.reduce((s, l) => s + Number(l.valor), 0)) : ""}</span></div>
    ${aPagar.length ? `<div class="lista">${aPagar.map((l) => { const atras = l.vencimento && l.vencimento < hoje; return `<div class="item" style="cursor:default"><div class="ic" style="background:var(--red2);color:var(--red)">${IC.relogio}</div><div class="cresce"><b>${esc(l.descricao)}</b><div class="pequeno">${esc(l.categoria || "Outras despesas")} · ${atras ? '<span style="color:var(--red)">venceu</span>' : "vence"} ${l.vencimento ? dataCurta(meioDia(l.vencimento)) : ""}</div></div><b>${brl(l.valor)}</b><button class="btn mini" data-pagou="${l.id}">Paguei</button></div>`; }).join("")}</div>` : `<p class="mudo" style="margin:0 4px 12px">Nenhuma conta em aberto. Ao registrar uma despesa, escolha "Conta a pagar" para anotar aluguel, energia, água...</p>`}
    <div class="cartao"><h2>Despesas por categoria</h2>${desp.length ? (() => { const pc = {}; desp.forEach((l) => (pc[l.categoria || "Outras despesas"] = (pc[l.categoria || "Outras despesas"] || 0) + Number(l.valor))); const mx = Math.max(...Object.values(pc)); return Object.entries(pc).sort((x, y) => y[1] - x[1]).map(([c, v]) => `<div style="margin-top:12px"><div class="linha entre"><span>${esc(c)}</span><b>${brl(v)}</b></div><div class="barra-h"><span style="width:${(v / mx) * 100}%;background:var(--red)"></span></div></div>`).join(""); })() : `<p class="mudo">Nenhuma despesa ${rot}.</p>`}</div>
    <button class="btn cheio" id="b-relat" style="margin-bottom:12px">${IC.grafico}Relatório dos últimos 6 meses</button>
    <div class="tit-linha"><h2>Despesas pagas</h2><button id="nova-desp2">+ Adicionar</button></div>
    ${desp.length ? `<div class="lista">${desp.map((l) => `<div class="item" style="cursor:default"><div class="ic" style="background:var(--red2);color:var(--red)">${IC.dinheiro}</div><div class="cresce"><b>${esc(l.descricao)}</b><div class="pequeno">${esc(l.categoria || "Outros")} · ${dataCurta(meioDia(l.data))}</div></div><b style="color:var(--red)">− ${brl(l.valor)}</b><button class="fechar" data-del-desp="${l.id}" aria-label="Apagar" style="width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:var(--soft);color:var(--mute);flex:none">✕</button></div>`).join("")}</div>` : `<p class="mudo" style="margin:0 4px 12px">Registre materiais, aluguel e contas para saber o lucro de verdade.</p>`}
    <div class="tit-linha"><h2>Recebimentos</h2></div>
    ${pags.length ? `<div class="lista">${pags.map((p) => { const a = agPorId[p.agendamento_id]; return `<div class="item" ${a ? `data-ag="${a.id}"` : 'style="cursor:default"'}><div class="ic" style="background:var(--ok2);color:var(--ok)">${IC.dinheiro}</div><div class="cresce"><b>${a ? esc(a.cliente_nome) : esc(p.observacao || "Recebimento avulso")}</b><div class="pequeno">${FORMAS[p.forma]} · ${dataCurta(p.recebido_em)} ${hora(p.recebido_em)}${a ? " · " + esc(a.servico_nome) : ""}</div></div><b style="color:var(--ok)">${brl(p.valor)}</b></div>`; }).join("")}</div>` : `<div class="vazio">${IC.dinheiro}<div>Os pagamentos registrados aparecem aqui.</div></div>`}`);
  ligaCartoes(r);
  $("per").querySelectorAll("button").forEach((b) => (b.onclick = () => { st.caixaPer = b.dataset.p; telaCaixa(); }));
  $("pag-avulso").onclick = () => registraPagamento(null);
  $("nova-desp").onclick = $("nova-desp2").onclick = novaDespesa;
  $("b-meta")?.addEventListener("click", editaMeta);
  $("b-relat").onclick = telaRelatorios;
  $("b-taxas")?.addEventListener("click", telaTaxas);
  r.querySelectorAll("[data-pagou]").forEach((b) => (b.onclick = async () => { await q(sb.from("ad_lancamentos").update({ pago: true, data: isoDia() }).eq("id", b.dataset.pagou)); toast("Conta paga e lançada nas despesas."); telaCaixa(); }));
  r.querySelectorAll("[data-del-desp]").forEach((b) => (b.onclick = async () => { if (!confirm("Apagar esta despesa?")) return; await q(sb.from("ad_lancamentos").delete().eq("id", b.dataset.delDesp)); toast("Despesa apagada."); telaCaixa(); }));
  dicas().then((h) => { if ($("dicas")) $("dicas").innerHTML = h; });
}

const CATS_DESP = ["Compra de esmaltes", "Compra de materiais", "Produtos de limpeza", "Aluguel", "Energia", "Água", "Internet", "Manutenção", "Outras despesas"];

// Relatório: faturamento x despesas dos últimos 6 meses + indicadores
async function telaRelatorios() {
  const hoje = isoDia(), [a0, m0] = hoje.split("-").map(Number);
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(Date.UTC(a0, m0 - 6 + i, 1)); return d.toISOString().slice(0, 10); });
  const fimTudo = new Date(Date.UTC(a0, m0, 1)).toISOString().slice(0, 10);
  const [pags, desp, ags] = await Promise.all([
    pagsEntre(meses[0], fimTudo),
    q(sb.from("ad_lancamentos").select("valor,data,categoria,fixa").eq("tipo", "saida").eq("pago", true).gte("data", meses[0]).lt("data", fimTudo)),
    agsEntre(meses[0], fimTudo),
  ]);
  const chaveMes = (iso) => iso.slice(0, 7);
  const dados = meses.map((m) => {
    const k = chaveMes(m);
    const pm = pags.filter((p) => isoDia(new Date(p.recebido_em)).slice(0, 7) === k);
    const rec = pm.reduce((s, p) => s + Number(p.valor), 0), tx = pm.reduce((s, p) => s + Number(p.taxa || 0), 0);
    const gas = desp.filter((l) => l.data.slice(0, 7) === k).reduce((s, l) => s + Number(l.valor), 0);
    const at = ags.filter((a) => isoDia(new Date(a.inicio)).slice(0, 7) === k && a.status === "concluido").length;
    return { k, nome: new Date(m + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""), rec, gas: gas + tx, lucro: rec - gas - tx, at };
  });
  const mx = Math.max(1, ...dados.map((d) => Math.max(d.rec, d.gas)));
  const tot = dados.reduce((s, d) => ({ rec: s.rec + d.rec, gas: s.gas + d.gas, at: s.at + d.at }), { rec: 0, gas: 0, at: 0 });
  const melhor = [...dados].sort((x, y) => y.lucro - x.lucro)[0];
  // fluxo de caixa do mês atual, semana a semana
  const mesAtual = hoje.slice(0, 7);
  const semanas = [1, 8, 15, 22, 29].map((d0) => { const ini = `${mesAtual}-${String(d0).padStart(2, "0")}`, fimS = d0 === 29 ? `${mesAtual}-31` : `${mesAtual}-${String(d0 + 6).padStart(2, "0")}`;
    const ent = pags.filter((p) => { const d = isoDia(new Date(p.recebido_em)); return d >= ini && d <= fimS; }).reduce((s, p) => s + Number(p.valor) - Number(p.taxa || 0), 0);
    const sai = desp.filter((l) => l.data >= ini && l.data <= fimS).reduce((s, l) => s + Number(l.valor), 0);
    return { rot: `${d0}–${d0 === 29 ? "fim" : d0 + 6}`, ent, sai }; });
  let saldo = 0; semanas.forEach((w) => (w.saldo = saldo += w.ent - w.sai));
  // lucro estimado por serviço (preço − material − taxa média)
  const txMedia = pags.reduce((s, p) => s + Number(p.valor), 0) ? pags.reduce((s, p) => s + Number(p.taxa || 0), 0) / pags.reduce((s, p) => s + Number(p.valor), 0) : 0;
  const porServ = st.servicos.filter((x) => x.ativo !== false).map((x) => { const n = ags.filter((a) => a.status === "concluido" && (a.servico_id === x.id || a.servico_nome === x.nome)).length;
    const lu = Number(x.preco) - Number(x.custo_material || 0) - Number(x.preco) * txMedia; return { x, n, lu, total: lu * n }; }).sort((a, b) => b.total - a.total || b.lu - a.lu);
  abreFolha(cabFolha("Relatórios", "Últimos 6 meses, com os dados reais do salão.") + `
    <button class="btn cheio nao-imprime" data-pdf style="margin-bottom:12px">${IC.baixar}Salvar relatório em PDF</button>
    <div class="cartao"><h2>Faturamento × despesas</h2>
      <div class="grafico">${dados.map((d) => `<div class="g-col"><div class="g-barras"><span class="g-rec" style="height:${(d.rec / mx) * 100}%" title="${brl(d.rec)}"></span><span class="g-gas" style="height:${(d.gas / mx) * 100}%" title="${brl(d.gas)}"></span></div><small>${d.nome}</small></div>`).join("")}</div>
      <div class="linha" style="gap:14px;margin-top:10px"><span class="pequeno"><i class="g-leg" style="background:var(--acc)"></i>Recebido</span><span class="pequeno"><i class="g-leg" style="background:var(--red)"></i>Despesas</span></div>
    </div>
    <div class="resumo-val"><div><small>Recebido (6 meses)</small><b class="pos">${brl(tot.rec)}</b></div><div><small>Despesas</small><b class="neg">${brl(tot.gas)}</b></div><div><small>Lucro líquido</small><b>${brl(tot.rec - tot.gas)}</b></div></div>
    <div class="resumo-val"><div><small>Atendimentos</small><b>${tot.at}</b></div><div><small>Ticket médio</small><b>${brl(tot.at ? tot.rec / tot.at : 0)}</b></div><div><small>Melhor mês</small><b style="font-size:14px">${melhor.lucro > 0 ? melhor.nome : "—"}</b></div></div>
    <div class="cartao"><h2>Fluxo de caixa deste mês</h2><p class="pequeno" style="margin:2px 0 6px">Entradas (já sem taxas) e saídas, semana a semana, com o saldo acumulado.</p>
      <div class="linha entre pequeno" style="padding:6px 0"><span style="width:56px">Dias</span><span>Entrou</span><span>Saiu</span><b>Saldo</b></div>
      ${semanas.map((w) => `<div class="linha entre" style="padding:7px 0;border-top:1px solid var(--line)"><span style="width:56px">${w.rot}</span><span class="pos">${brl(w.ent)}</span><span class="neg">${brl(w.sai)}</span><b class="${w.saldo < 0 ? "neg" : ""}">${brl(w.saldo)}</b></div>`).join("")}</div>
    <div class="cartao"><h2>Lucro por serviço</h2><p class="pequeno" style="margin:2px 0 6px">Preço menos material e taxa média. Cadastre o custo em Mais › Taxas e custos.</p>
      ${porServ.map((p) => `<div class="linha" style="gap:10px;padding:7px 0;border-top:1px solid var(--line)"><span class="bola" style="background:${p.x.cor || "var(--acc)"}"></span><span class="cresce">${esc(p.x.nome)}<br><small class="mudo">${p.n} feito${p.n !== 1 ? "s" : ""} em 6 meses · ${brl(p.lu)} por atendimento</small></span><b>${brl(p.total)}</b></div>`).join("")}</div>
    <div class="cartao"><h2>Mês a mês</h2>${dados.slice().reverse().map((d) => `<div class="linha entre" style="padding:8px 0;border-top:1px solid var(--line)"><span style="text-transform:capitalize">${d.nome}</span><span class="pequeno">${d.at} atend.</span><b class="${d.lucro < 0 ? "neg" : ""}">${brl(d.lucro)}</b></div>`).join("")}</div>
    <p class="pequeno" style="text-align:center">Gerado em ${dataLonga(new Date())} · Nay Nails Gestão</p>`, (r) => {
    r.querySelector("[data-pdf]").onclick = () => salvaPDF("Relatório Nay Nails " + hoje.slice(0, 7));
  });
}

function novaDespesa() {
  const cats = CATS_DESP;
  let cat = cats[0], jaPaga = true;
  abreFolha(cabFolha("Registrar despesa", "Entra no cálculo do lucro.") + `
    <div class="cartao">
      <label class="f">Valor (R$)</label><input class="campo" data-valor type="number" inputmode="decimal" step="0.01" min="0" style="font-size:22px;font-weight:700">
      <label class="f">Tipo</label><div class="opcoes" data-cats>${cats.map((c) => `<button type="button" data-c="${c}" class="${c === cat ? "on" : ""}">${c}</button>`).join("")}</div>
      <label class="f">Descrição</label><input class="campo" data-desc placeholder="Ex.: esmaltes, lixas, algodão">
      <label class="f">Tipo</label><div class="seg" data-tipo style="margin:0 0 4px"><button type="button" data-fx="0" class="on">Variável</button><button type="button" data-fx="1">Fixa (todo mês)</button></div>
      <label class="f">Situação</label><div class="seg" data-sit style="margin:0"><button type="button" data-pg="1" class="on">Já paguei</button><button type="button" data-pg="0">Conta a pagar</button></div>
      <label class="f" data-rot-data>Data do pagamento</label><input class="campo" data-data type="date" value="${isoDia()}">
    </div>
    <button class="btn prim cheio" data-salvar>Salvar despesa</button>`, (r) => {
    let fixa = false;
    r.querySelectorAll("[data-fx]").forEach((b) => (b.onclick = () => { fixa = b.dataset.fx === "1"; r.querySelectorAll("[data-fx]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelectorAll("[data-pg]").forEach((b) => (b.onclick = () => { jaPaga = b.dataset.pg === "1"; r.querySelectorAll("[data-pg]").forEach((x) => x.classList.toggle("on", x === b)); r.querySelector("[data-rot-data]").textContent = jaPaga ? "Data do pagamento" : "Vencimento"; }));
    r.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { cat = b.dataset.c; r.querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelector("[data-salvar]").onclick = async () => {
      const valor = Number(r.querySelector("[data-valor]").value);
      if (!(valor > 0)) return toast("Informe o valor.", 1);
      const dt = r.querySelector("[data-data]").value || isoDia();
      await q(sb.from("ad_lancamentos").insert({ profissional_id: st.prof.id, tipo: "saida", valor, categoria: cat, descricao: r.querySelector("[data-desc]").value.trim() || cat, data: dt, pago: jaPaga, vencimento: jaPaga ? null : dt, fixa }));
      toast(jaPaga ? `Despesa de ${brl(valor)} registrada.` : `Conta de ${brl(valor)} anotada. Aviso quando estiver perto de vencer.`); fechaFolha(); atualizaTela();
    };
  });
}

function editaMeta() {
  abreFolha(cabFolha("Meta do mês", "Quanto você quer receber por mês. O app mostra o progresso.") + `
    <div class="cartao"><label class="f">Meta (R$)</label><input class="campo" data-meta type="number" inputmode="decimal" step="50" min="0" value="${st.prof.meta_mensal || ""}" style="font-size:22px;font-weight:700"></div>
    <button class="btn prim cheio" data-salvar>Salvar meta</button>`, (r) => {
    r.querySelector("[data-salvar]").onclick = async () => {
      const v = Number(r.querySelector("[data-meta]").value) || null;
      st.prof = await q(sb.from("ad_profissionais").update({ meta_mensal: v }).eq("id", st.prof.id).select().single());
      toast("Meta salva."); fechaFolha(); atualizaTela();
    };
  });
}

// Dicas calculadas só com os dados reais do salão (últimos 60 dias)
async function dicas() {
  const hoje = isoDia();
  const [hist, futuros] = await Promise.all([agsEntre(somaDias(hoje, -60), somaDias(hoje, 1)), agsEntre(hoje, somaDias(hoje, 7))]);
  const feitos = hist.filter((a) => !["cancelado", "faltou"].includes(a.status));
  const itens = [];
  if (feitos.length >= 5) {
    const porDia = {}, porHora = {}, porServ = {};
    feitos.forEach((a) => {
      const d = new Date(a.inicio).toLocaleDateString("en-US", { weekday: "short", timeZone: TZ });
      const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(d);
      porDia[idx] = (porDia[idx] || 0) + Number(a.preco);
      const h = hora(a.inicio).slice(0, 2); porHora[h] = (porHora[h] || 0) + 1;
      porServ[a.servico_nome] = (porServ[a.servico_nome] || 0) + 1;
    });
    const melhorDia = Object.entries(porDia).sort((x, y) => y[1] - x[1])[0];
    const piorDia = Object.entries(porDia).sort((x, y) => x[1] - y[1])[0];
    const pico = Object.entries(porHora).sort((x, y) => y[1] - x[1])[0];
    const top = Object.entries(porServ).sort((x, y) => y[1] - x[1])[0];
    itens.push(["📅", `<b>${SEM[melhorDia[0]]}</b> é o dia que mais fatura`, `${brl(melhorDia[1])} nos últimos 60 dias.${piorDia && piorDia[0] !== melhorDia[0] ? ` ${SEM[piorDia[0]]} é o mais fraco: bom dia para promoção.` : ""}`]);
    itens.push(["⏰", `Horário mais procurado: <b>${pico[0]}h</b>`, `${pico[1]} atendimentos começaram nesse horário.`]);
    itens.push(["💅", `Serviço mais pedido: <b>${esc(top[0])}</b>`, `${top[1]} vezes nos últimos 60 dias.`]);
  }
  const perdidos = hist.filter((a) => ["cancelado", "faltou"].includes(a.status));
  if (hist.length >= 5 && perdidos.length) itens.push(["⚠️", `${Math.round((perdidos.length / hist.length) * 100)}% de cancelamentos e faltas`, `${brl(perdidos.reduce((s, a) => s + Number(a.preco), 0))} deixaram de entrar. Mande o lembrete do dia anterior para todas.`]);
  const livres7 = await Promise.all(Array.from({ length: 7 }, (_, i) => somaDias(hoje, i)).map((d) => livres(d, 60).then((l) => l.length)));
  const vagas = livres7.reduce((s, n) => s + n, 0);
  const ticketMedio = feitos.length ? feitos.reduce((s, a) => s + Number(a.preco), 0) / feitos.length : 0;
  if (vagas && ticketMedio) itens.push(["✨", `Ainda há horários livres nos próximos 7 dias`, `Preenchendo só 5 deles, entram cerca de ${brl(5 * ticketMedio)} a mais. Divulgue seu link no status do WhatsApp.`]);
  if (!futuros.filter((a) => ATIVOS.includes(a.status)).length) itens.push(["📣", "Nenhum agendamento nos próximos 7 dias", "Que tal mandar uma mensagem para as clientes sumidas? Veja em Clientes › Sumidas."]);
  if (!itens.length) return "";
  return `<div class="cartao"><h2>Dicas para faturar mais</h2>${itens.map(([e, t, d]) => `<div class="dica"><div class="e">${e}</div><div><b>${t}</b><div class="pequeno" style="margin-top:2px">${d}</div></div></div>`).join("")}</div>`;
}

// =====================================================================
// MAIS
// =====================================================================
function telaMais() {
  const grupos = [
    ["Salão", [
      ["servicos", IC.tesoura, "Serviços e preços", "Preço, duração, cor na agenda e custo"],
      ["horarios", IC.relogio, "Horários e folgas", "Dias de trabalho, almoço, feriados e férias"],
      ["site", IC.link, "Site de agendamento", "Copiar e divulgar seu link"],
      ["salao", IC.salao, "Dados do salão", "Nome, WhatsApp, Instagram e endereço"],
      ["chegar", IC.local, "Como chegar", "Endereço, mapa e compartilhar localização"],
    ]],
    ["Gestão", [
      ["estoque", IC.caixa, "Estoque e esmaltes", "Esmaltes, produtos, compras e alertas"],
      ["relatorios", IC.grafico, "Relatórios", "Lucro real, fluxo de caixa, meses e PDF"],
      ["taxas", IC.dinheiro, "Taxas e custos", "Maquininha e material de cada serviço"],
      ["fidelidade", IC.estrela, "Fidelidade", fid().ativo ? `A cada ${fid().a_cada} atendimentos: ${fid().recompensa}` : "Cartão fidelidade, aniversário e indicação"],
    ]],
    ["Automação e avisos", [
      ["automacoes", IC.relogio, "Automações", "Finalizar sozinho, avisos às 18h, aniversários"],
      ["notificacoes", IC.sino, "Notificações", "Avisos no celular de novos agendamentos"],
    ]],
    ["App e conta", [
      ...(st.prof.id === st.user.id ? [["equipe", IC.cliente, "Quem pode acessar", "Liberar o app para outro e-mail"]] : []),
      ["seguranca", IC.cadeado, "Senha do app e biometria", travaCfg() ? "Ativada neste celular" : "Proteja o app com uma senha de números"],
      ["aparencia", IC.lua, "Aparência", "Tema, cor de destaque e letra"],
      ["tutorial", IC.estrela, "Tutorial do app", "Veja de novo como usar cada parte"],
      ["instalar", IC.baixar, "Instalar o app no celular", "Ícone na tela inicial, abre como aplicativo"],
      ["senha", IC.estrela, "Trocar senha da conta", "A senha do e-mail de login"],
      ["sair", IC.sair, "Sair", ""],
    ]],
  ];
  const r = tela(grupos.map(([g, itens]) => `<div class="tit-linha"><h2>${g}</h2></div><div class="lista">${itens.map(([k, ic, t, s]) => `<button class="item" data-m="${k}"><div class="ic">${ic}</div><div class="cresce"><b>${t}</b>${s ? `<div class="pequeno">${esc(s)}</div>` : ""}</div><span class="seta">›</span></button>`).join("")}</div>`).join("") + `
    <p class="pequeno" style="text-align:center;margin-top:20px">Nay Nails Gestão · versão 1.1<br>Mesma agenda do site de agendamento</p>`);
  r.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => ({
    estoque: () => vaiPara("estoque"), relatorios: telaRelatorios, taxas: telaTaxas, fidelidade: telaFidelidade, equipe: telaEquipe, servicos: telaServicos, horarios: telaHorarios, notificacoes: telaNotificacoes, chegar: comoChegar, site: telaSite, salao: dadosSalao, instalar: instrucoesInstalar, senha: novaSenha, seguranca: telaSeguranca, aparencia: telaAparencia, automacoes: telaAutomacoes, tutorial: () => mostraTutorial(),
    sair: async () => { if (confirm("Sair do app?")) { await sb.auth.signOut(); location.reload(); } },
  })[b.dataset.m]()));
}

// ---------- quem pode acessar ----------
async function telaEquipe() {
  const lista = await q(sb.from("ad_equipe").select("*").eq("profissional_id", st.prof.id).order("criado_em"));
  abreFolha(cabFolha("Quem pode acessar", "Libere o app para outra pessoa. Ela cria a conta com o próprio e-mail em \"Primeiro acesso\" e vê a mesma agenda.") + `
    <div class="lista"><div class="item" style="cursor:default"><div class="ic">${IC.cliente}</div><div class="cresce"><b>${esc(st.user.email)}</b><div class="pequeno">Você · administradora</div></div></div>
    ${lista.map((e) => `<div class="item" style="cursor:default"><div class="ic">${IC.cliente}</div><div class="cresce"><b>${esc(e.email)}</b><div class="pequeno">${e.user_id ? "Já entrou no app" : "Ainda não entrou"}</div></div><button class="btn mini" data-tira="${esc(e.email)}">Remover</button></div>`).join("")}</div>
    <div class="cartao"><label class="f">E-mail da pessoa</label><input class="campo" data-email type="email" inputmode="email" autocomplete="off" placeholder="nome@gmail.com"></div>
    <button class="btn prim cheio" data-add>Liberar acesso</button>`, (r) => {
    r.querySelector("[data-add]").onclick = async () => {
      const email = r.querySelector("[data-email]").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Confira o e-mail.", 1);
      await q(sb.from("ad_equipe").insert({ profissional_id: st.prof.id, email }));
      toast("Acesso liberado para " + email); telaEquipe();
    };
    r.querySelectorAll("[data-tira]").forEach((b) => (b.onclick = async () => {
      if (!confirm(`Tirar o acesso de ${b.dataset.tira}?`)) return;
      await q(sb.from("ad_equipe").delete().eq("profissional_id", st.prof.id).eq("email", b.dataset.tira)); toast("Acesso removido."); telaEquipe();
    }));
  });
}

// ---------- serviços ----------
async function telaServicos() {
  await carregaServicos();
  abreFolha(cabFolha("Serviços e preços", "As mudanças aparecem no site na hora.") +
    `<div class="lista">${st.servicos.map((s) => `<button class="item" data-s="${s.id}" style="${s.ativo ? "" : "opacity:.5"}"><span class="bola" style="background:${s.cor || "var(--acc)"}"></span><div class="cresce"><b>${esc(s.nome)}</b><div class="pequeno">${brl(s.preco)} · ${dur(s.duracao_min)}${Number(s.custo_material) ? " · lucro " + brl(s.preco - s.custo_material) : ""}${s.ativo ? "" : " · oculto no site"}</div></div><span class="seta">›</span></button>`).join("")}</div>
    <button class="btn ouro cheio" data-novo>${IC.mais}Adicionar serviço</button>`, (r) => {
    r.querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => editaServico(st.servicos.find((s) => s.id === b.dataset.s))));
    r.querySelector("[data-novo]").onclick = () => editaServico(null);
  });
}
function editaServico(s) {
  const durs = [15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180];
  abreFolha(cabFolha(s ? "Editar serviço" : "Novo serviço") + `
    <div class="cartao">
      <label class="f">Nome</label><input class="campo" data-nome value="${esc(s?.nome || "")}">
      <label class="f">Descrição (aparece no site)</label><textarea class="campo" data-desc maxlength="200" placeholder="Opcional">${esc(s?.descricao || "")}</textarea>
      <div class="grade2">
        <div><label class="f">Preço a partir de (R$)</label><input class="campo" data-preco type="number" inputmode="decimal" step="0.01" min="0" value="${s?.preco ?? ""}"></div>
        <div><label class="f">Duração</label><select class="campo" data-dur>${durs.map((d) => `<option value="${d}" ${(s?.duracao_min || 60) === d ? "selected" : ""}>${dur(d)}</option>`).join("")}${s && !durs.includes(s.duracao_min) ? `<option value="${s.duracao_min}" selected>${dur(s.duracao_min)}</option>` : ""}</select></div>
      </div>
      <div class="grade2">
        <div><label class="f">Custo de material (R$)</label><input class="campo" data-custo type="number" inputmode="decimal" step="0.01" min="0" value="${Number(s?.custo_material) || ""}" placeholder="0"></div>
        <div><label class="f">Lucro estimado</label><div class="campo" data-lucro style="background:var(--soft)"></div></div>
      </div>
      <label class="f">Cor na agenda</label><div class="cores-serv">${CORES_SERV.map((c) => `<button type="button" data-cor="${c}" class="${(s?.cor || CORES_SERV[0]) === c ? "on" : ""}" style="background:${c}" aria-label="Cor"></button>`).join("")}</div>
      <div class="interruptor" style="margin-top:8px"><span>Mostrar no site</span><input type="checkbox" data-ativo ${s?.ativo === false ? "" : "checked"}></div>
    </div>
    <button class="btn ouro cheio" data-salvar>Salvar</button>
    ${s ? `<button class="btn perigo cheio" data-excluir style="margin-top:10px">Excluir serviço</button>` : ""}`, (r) => {
    let cor = s?.cor || CORES_SERV[0];
    r.querySelectorAll("[data-cor]").forEach((b) => (b.onclick = () => { cor = b.dataset.cor; r.querySelectorAll("[data-cor]").forEach((x) => x.classList.toggle("on", x === b)); }));
    const lucro = () => { const p = Number(r.querySelector("[data-preco]").value || 0), c = Number(r.querySelector("[data-custo]").value || 0); r.querySelector("[data-lucro]").textContent = brl(p - c); };
    r.querySelector("[data-preco]").oninput = r.querySelector("[data-custo]").oninput = lucro; lucro();
    r.querySelector("[data-salvar]").onclick = async () => {
      const d = { nome: r.querySelector("[data-nome]").value.trim(), descricao: r.querySelector("[data-desc]").value.trim() || null, preco: Number(r.querySelector("[data-preco]").value || 0), duracao_min: Number(r.querySelector("[data-dur]").value), ativo: r.querySelector("[data-ativo]").checked, cor, custo_material: Number(r.querySelector("[data-custo]").value || 0) };
      if (!d.nome) return toast("Escreva o nome do serviço.", 1);
      await q(s ? sb.from("ad_servicos").update(d).eq("id", s.id) : sb.from("ad_servicos").insert({ ...d, profissional_id: st.prof.id }));
      toast("Serviço salvo."); await carregaServicos(); telaServicos();
    };
    r.querySelector("[data-excluir]")?.addEventListener("click", async () => {
      if (!confirm("Excluir este serviço? Os atendimentos antigos continuam guardados.")) return;
      await q(sb.from("ad_servicos").delete().eq("id", s.id)); toast("Serviço excluído."); telaServicos();
    });
  });
}

// ---------- horários, folgas e bloqueios ----------
async function telaHorarios() {
  const [hs, bloq] = await Promise.all([
    q(sb.from("ad_horarios").select("*").order("inicio")),
    q(sb.from("ad_bloqueios").select("*").gte("fim", new Date().toISOString()).order("inicio")),
  ]);
  let edit = hs.map((h) => ({ dia_semana: h.dia_semana, inicio: h.inicio.slice(0, 5), fim: h.fim.slice(0, 5) }));
  const desenha = (r) => {
    r.querySelector("[data-semana]").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const f = edit.map((h, i) => ({ ...h, i })).filter((h) => h.dia_semana === d);
      return `<div style="padding:12px 0;border-bottom:1px solid var(--linha)"><div class="linha entre"><b>${SEM[d]}</b><button class="link" data-add="${d}">${f.length ? "+ intervalo" : "Trabalhar"}</button></div>
        ${f.length ? f.map((h) => `<div class="linha" style="margin-top:8px"><input class="campo" type="time" value="${h.inicio}" data-i="${h.i}" data-k="inicio"><span>às</span><input class="campo" type="time" value="${h.fim}" data-i="${h.i}" data-k="fim"><button class="fechar" data-rm="${h.i}" aria-label="Remover" style="width:36px;height:36px;border-radius:50%;border:0;background:var(--nude);flex:none">✕</button></div>`).join("") : `<p class="pequeno" style="margin-top:4px">Folga</p>`}</div>`;
    }).join("");
    r.querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => { edit.push({ dia_semana: +b.dataset.add, inicio: edit.find((h) => h.dia_semana === +b.dataset.add) ? "14:00" : "09:00", fim: "18:00" }); desenha(r); }));
    r.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => { edit.splice(+b.dataset.rm, 1); desenha(r); }));
    r.querySelectorAll("input[data-i]").forEach((inp) => (inp.onchange = () => (edit[+inp.dataset.i][inp.dataset.k] = inp.value)));
  };
  abreFolha(cabFolha("Horários e folgas", "O site só mostra horários dentro destes períodos.") + `
    <div class="cartao"><h2>Semana de trabalho</h2><p class="pequeno">Para ter intervalo de almoço, use dois períodos no mesmo dia (ex.: 9h às 12h e 13h às 18h).</p><div data-semana></div>
      <button class="btn ouro cheio" data-salvar style="margin-top:14px">Salvar horários</button></div>
    ${htmlAlmocoCartao()}
    <div class="cartao"><h2>Até quando o site aceita marcações</h2><p class="pequeno">As clientes só conseguem marcar até esta data. Em branco: próximos 30 dias.</p>
      <div class="linha" style="margin-top:10px;gap:8px"><input class="campo" type="date" data-ate min="${isoDia()}" value="${cfg().agenda_ate || ""}"><button class="btn claro" data-ate-ok style="flex:none">Salvar</button></div></div>
    <div class="tit-linha"><h2>Folgas e bloqueios</h2><button data-bloq>+ Bloquear</button></div>
    ${bloq.length ? `<div class="lista">${bloq.map((b) => `<div class="item" style="cursor:default"><div class="ic">${IC.bloqueio}</div><div class="cresce"><b>${esc(b.motivo || "Bloqueado")}</b><div class="pequeno">${dataCurta(b.inicio)} ${hora(b.inicio)} até ${dataCurta(b.fim)} ${hora(b.fim)}</div></div><button class="link" data-lib="${b.id}">Liberar</button></div>`).join("")}</div>` : `<p class="mudo" style="margin:0 2px 14px">Nenhum bloqueio futuro. Use para folgas, feriados, férias ou compromissos.</p>`}`, (r) => {
    desenha(r);
    r.querySelector("[data-salvar]").onclick = async () => {
      if (edit.some((h) => !h.inicio || !h.fim || h.fim <= h.inicio)) return toast("Confira: o fim precisa ser depois do início.", 1);
      await q(sb.from("ad_horarios").delete().eq("profissional_id", st.prof.id));
      if (edit.length) await q(sb.from("ad_horarios").insert(edit.map((h) => ({ ...h, profissional_id: st.prof.id }))));
      toast("Horários salvos. O site já foi atualizado.");
    };
    ligaAlmoco(r, () => { fechaFolha(); telaHorarios(); });
    r.querySelector("[data-ate-ok]").onclick = async () => {
      const v = r.querySelector("[data-ate]").value || null;
      await salvaCfg({ agenda_ate: v });
      toast(v ? `Site aberto para marcações até ${dataCurta(v + "T12:00:00-03:00")}.` : "Site aberto para os próximos 30 dias.");
    };
    r.querySelector("[data-bloq]").onclick = () => novoBloqueio();
    r.querySelectorAll("[data-lib]").forEach((b) => (b.onclick = async () => { await q(sb.from("ad_bloqueios").delete().eq("id", b.dataset.lib)); toast("Liberado."); telaHorarios(); }));
  });
}

function novoBloqueio(diaIni) {
  const tipos = { horario: "Horário específico", folga: "Dia inteiro", ferias: "Vários dias", feriado: "Feriado" };
  const dia0 = diaIni && diaIni >= isoDia() ? diaIni : isoDia();
  let tipo = "horario";
  abreFolha(cabFolha("Bloquear horário", "Nesse período o site não mostra horários para as clientes.") + `
    <div class="cartao">
      <div class="opcoes" data-tipos>${Object.entries(tipos).map(([k, v]) => `<button type="button" data-t="${k}" class="${k === tipo ? "on" : ""}">${v}</button>`).join("")}</div>
      <label class="f">Dia</label><input class="campo" type="date" data-de value="${dia0}" min="${isoDia()}">
      <div data-ate class="hide"><label class="f">Até o dia</label><input class="campo" type="date" data-ate-d value="${somaDias(dia0, 7)}" min="${isoDia()}"></div>
      <div data-horas>
        <label class="f">Atalho</label><div class="opcoes"><button type="button" data-rap="09:00-12:00">Manhã</button><button type="button" data-rap="13:30-18:00">Tarde</button><button type="button" data-rap="18:00-21:00">Noite</button></div>
        <div class="grade2"><div><label class="f">Das</label><input class="campo" type="time" data-h1 value="14:00"></div><div><label class="f">Até</label><input class="campo" type="time" data-h2 value="15:00"></div></div>
      </div>
      <label class="f">Motivo</label><input class="campo" data-motivo placeholder="Ex.: almoço, médico, viagem">
    </div>
    <button class="btn ouro cheio" data-salvar>Bloquear</button>`, (r) => {
    const ajusta = () => { r.querySelector("[data-ate]").classList.toggle("hide", tipo !== "ferias"); r.querySelector("[data-horas]").classList.toggle("hide", tipo !== "horario"); };
    r.querySelectorAll("[data-rap]").forEach((b) => (b.onclick = () => { const [h1, h2] = b.dataset.rap.split("-"); r.querySelector("[data-h1]").value = h1; r.querySelector("[data-h2]").value = h2; r.querySelectorAll("[data-rap]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { tipo = b.dataset.t; r.querySelectorAll("[data-t]").forEach((x) => x.classList.toggle("on", x === b)); ajusta(); }));
    ajusta();
    r.querySelector("[data-salvar]").onclick = async () => {
      const de = r.querySelector("[data-de]").value;
      let ini, fim;
      if (tipo === "horario") { ini = `${de}T${r.querySelector("[data-h1]").value}:00-03:00`; fim = `${de}T${r.querySelector("[data-h2]").value}:00-03:00`; }
      else { const ate = tipo === "ferias" ? r.querySelector("[data-ate-d]").value : de; ini = `${de}T00:00:00-03:00`; fim = `${somaDias(ate, 1)}T00:00:00-03:00`; }
      if (new Date(fim) <= new Date(ini)) return toast("Confira as datas e os horários.", 1);
      const motivo = r.querySelector("[data-motivo]").value.trim() || tipos[tipo].replace(/ \(.*\)/, "");
      await q(sb.from("ad_bloqueios").insert({ profissional_id: st.prof.id, inicio: new Date(ini).toISOString(), fim: new Date(fim).toISOString(), motivo }));
      const conflitos = (await agsEntre(isoDia(ini), somaDias(isoDia(new Date(new Date(fim) - 1)), 1))).filter((a) => ATIVOS.includes(a.status) && new Date(a.inicio) < new Date(fim) && new Date(a.fim) > new Date(ini));
      toast("Horário bloqueado.");
      if (conflitos.length) abreFolha(cabFolha("Atenção", `Já existem ${conflitos.length} cliente(s) marcadas nesse período. Remarque ou avise:`) + conflitos.map((a) => cartaoAg(a, true)).join(""), ligaCartoes);
      else fechaFolha();
      atualizaTela();
    };
  });
}

// ---------- notificações ----------
function b64(s) { const p = "=".repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map((c) => c.charCodeAt(0))); }
let swReg = null;
async function registraSW() {
  if (!("serviceWorker" in navigator)) return;
  try { swReg = await navigator.serviceWorker.register("sw.js"); } catch (e) { console.warn(e); }
}
const suportaPush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
async function inscricaoAtual() { if (!swReg) await registraSW(); return swReg ? swReg.pushManager.getSubscription() : null; }

async function ativaNotificacoes() {
  if (!suportaPush()) {
    if (ehIOS() && !instalado()) return instrucoesInstalar(true);
    return toast("Este navegador não aceita notificações. Use o Chrome no Android ou instale o app no iPhone.", 1);
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return toast("Permita as notificações nas configurações do celular para receber os avisos.", 1);
  const { data: chave } = await sb.rpc("ad_push_chave");
  if (!chave) return toast("Não foi possível preparar as notificações. Tente de novo.", 1);
  if (!swReg) await registraSW();
  await navigator.serviceWorker.ready;
  let sub = await swReg.pushManager.getSubscription();
  if (!sub) sub = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(chave) });
  const j = sub.toJSON();
  const { error } = await sb.from("ad_push").upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, profissional_id: st.prof.id }, { onConflict: "endpoint" });
  if (error) return toast(erroMsg(error), 1);
  toast("Notificações ativadas neste celular!");
  return true;
}

async function bannerNotificacao() {
  const el = $("banner-notif"); if (!el) return;
  const sub = suportaPush() ? await inscricaoAtual() : null;
  if (sub && Notification.permission === "granted") { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="cartao calmo"><b>Receba os avisos no celular</b><div class="pequeno" style="margin:2px 0 10px">Saiba na hora quando uma cliente agendar ou cancelar.</div><button class="btn prim mini" id="b-ativar">${IC.sino}Ativar avisos</button></div>`;
  $("b-ativar").onclick = async () => { if (await ativaNotificacoes()) bannerNotificacao(); };
}

async function telaNotificacoes() {
  const sub = suportaPush() ? await inscricaoAtual() : null;
  let prefs = { novo: true, cancelado: true, confirmado: true, breve: true, resumo: true };
  if (sub) { const { data } = await sb.from("ad_push").select("prefs").eq("endpoint", sub.endpoint).maybeSingle(); if (data?.prefs) prefs = { ...prefs, ...data.prefs }; }
  const nomes = { novo: "Novo agendamento pelo site", cancelado: "Cliente cancelou", confirmado: "Cliente confirmou presença", breve: "Atendimento começa em 30 minutos", resumo: "Resumo do dia (7h30)" };
  const ativo = sub && Notification.permission === "granted";
  abreFolha(cabFolha("Notificações", ativo ? "Ativadas neste celular ✅" : "Ainda não ativadas neste celular") + `
    ${ativo ? "" : `<div class="cartao rosa"><p style="margin-bottom:12px">Ative para receber os avisos mesmo com o app fechado.</p><button class="btn ouro cheio" data-ativar>Ativar notificações</button>${ehIOS() && !instalado() ? `<p class="pequeno" style="margin-top:10px">No iPhone, primeiro instale o app na tela inicial (Mais › Instalar o app).</p>` : ""}</div>`}
    <div class="cartao"><h2>Quero receber</h2>${Object.entries(nomes).map(([k, v]) => `<label class="interruptor"><span>${v}</span><input type="checkbox" data-p="${k}" ${prefs[k] !== false ? "checked" : ""} ${ativo ? "" : "disabled"}></label>`).join("")}</div>
    ${ativo ? `<button class="btn claro cheio" data-teste>Enviar notificação de teste</button>` : ""}
    <button class="btn claro cheio" data-avisos style="margin-top:10px">Ver todos os avisos</button>`, (r) => {
    r.querySelector("[data-ativar]")?.addEventListener("click", async () => { if (await ativaNotificacoes()) telaNotificacoes(); });
    r.querySelectorAll("[data-p]").forEach((c) => (c.onchange = async () => {
      prefs[c.dataset.p] = c.checked;
      await q(sb.from("ad_push").update({ prefs }).eq("endpoint", sub.endpoint)); toast("Preferência salva.");
    }));
    r.querySelector("[data-teste]")?.addEventListener("click", async () => {
      const { data, error } = await sb.functions.invoke("ad-push", { body: { acao: "teste", salao: st.prof.id } });
      toast(error ? "Não foi possível enviar o teste." : data?.enviados ? "Teste enviado! Deve chegar em instantes." : "Nenhum celular inscrito. Ative de novo.", !!error || !data?.enviados);
    });
    r.querySelector("[data-avisos]").onclick = telaAvisos;
  });
}

async function telaAvisos() {
  const avisos = await q(sb.from("ad_avisos").select("*").order("criado_em", { ascending: false }).limit(60));
  await sb.from("ad_avisos").update({ lido: true }).eq("lido", false);
  contaAvisos();
  abreFolha(cabFolha("Avisos") + (avisos.length ? `<div class="lista">${avisos.map((v) => `<button class="item ${v.lido ? "" : "aviso-item novo"}" data-agid="${v.agendamento_id || ""}">${v.lido ? "" : '<span class="ponto"></span>'}<div class="cresce"><b>${esc(v.titulo)}</b><div class="pequeno">${esc(v.corpo)}</div><div class="pequeno" style="margin-top:2px">${dataCurta(v.criado_em)} ${hora(v.criado_em)}</div></div></button>`).join("")}</div>`
    : `<div class="vazio">${IC.sino}<div>Nenhum aviso ainda. Quando uma cliente agendar pelo site, aparece aqui.</div></div>`), (r) => {
    r.querySelectorAll("[data-agid]").forEach((b) => (b.onclick = () => b.dataset.agid && detalheAg(b.dataset.agid)));
  });
}
$("b-sino").onclick = telaAvisos;
$("b-perfil").onclick = () => vaiPara("mais");

// ---------- como chegar ----------
function comoChegar() {
  const end = st.prof.endereco || "";
  const enc = encodeURIComponent(end);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Nayara Fernandes Nails, " + end)}`;
  const msg = `📍 *${st.prof.nome}*\n${end}\n\nGoogle Maps: ${maps}\nWaze: https://waze.com/ul?q=${enc}&navigate=yes`;
  abreFolha(cabFolha("Como chegar", esc(end) || "Cadastre o endereço em Dados do salão") + `
    <div class="cartao" style="padding:0;overflow:hidden"><iframe title="Mapa" loading="lazy" style="width:100%;aspect-ratio:4/3;border:0;display:block" src="https://maps.google.com/maps?q=${encodeURIComponent("Nayara Fernandes Nails, " + end)}&z=16&hl=pt-BR&output=embed"></iframe></div>
    <div class="pilha">
      <div class="grade2"><a class="btn claro" target="_blank" rel="noopener" href="${maps}">Google Maps</a><a class="btn claro" target="_blank" rel="noopener" href="https://waze.com/ul?q=${enc}&navigate=yes">Waze</a></div>
      <a class="btn zap cheio" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">${IC.zap}Enviar localização pelo WhatsApp</a>
      <div class="grade2"><button class="btn claro" data-copiar>Copiar endereço</button><button class="btn claro" data-compart>Compartilhar</button></div>
    </div>`, (r) => {
    r.querySelector("[data-copiar]").onclick = () => copiar(end, "Endereço copiado.");
    r.querySelector("[data-compart]").onclick = () => compartilhar({ title: st.prof.nome, text: msg.replace(/\*/g, "") });
  });
}
async function copiar(t, ok) { try { await navigator.clipboard.writeText(t); toast(ok); } catch { prompt("Copie:", t); } }
async function compartilhar(d) { if (navigator.share) { try { await navigator.share(d); } catch {} } else copiar(d.url || d.text, "Copiado para colar onde quiser."); }

// ---------- site ----------
function telaSite() {
  const txt = `💅 Agende seu horário com a ${primeiroNome(st.prof.nome)} em menos de um minuto: ${SITE}`;
  abreFolha(cabFolha("Site de agendamento", "As clientes escolhem o serviço e o horário sozinhas. Tudo cai aqui no app.") + `
    <div class="cartao"><input class="campo" readonly value="${SITE}" onclick="this.select()"></div>
    <div class="pilha">
      <a class="btn ouro cheio" target="_blank" rel="noopener" href="${SITE}">Abrir o site</a>
      <div class="grade2"><button class="btn claro" data-copiar>Copiar link</button><button class="btn claro" data-compart>Compartilhar</button></div>
      <a class="btn zap cheio" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">${IC.zap}Divulgar no WhatsApp</a>
      <p class="pequeno">Dica: coloque o link na bio do Instagram e no status do WhatsApp.</p>
    </div>`, (r) => {
    r.querySelector("[data-copiar]").onclick = () => copiar(SITE, "Link copiado.");
    r.querySelector("[data-compart]").onclick = () => compartilhar({ title: "Agende seu horário", text: txt, url: SITE });
  });
}

// ---------- dados do salão ----------
function dadosSalao() {
  const p = st.prof;
  abreFolha(cabFolha("Dados do salão", "Aparecem no site de agendamento.") + `
    <div class="cartao">
      <label class="f">Nome</label><input class="campo" data-nome value="${esc(p.nome)}">
      <label class="f">O que faz</label><input class="campo" data-prof value="${esc(p.profissao || "")}">
      <label class="f">WhatsApp do salão</label><input class="campo" data-zap inputmode="tel" value="${fmtTel(p.whatsapp)}">
      <label class="f">Instagram (sem @)</label><input class="campo" data-insta value="${esc(p.instagram || "")}">
      <label class="f">Endereço</label><textarea class="campo" data-end>${esc(p.endereco || "")}</textarea>
    </div>
    <button class="btn ouro cheio" data-salvar>Salvar</button>`, (r) => {
    r.querySelector("[data-salvar]").onclick = async () => {
      const d = { nome: r.querySelector("[data-nome]").value.trim(), profissao: r.querySelector("[data-prof]").value.trim(), whatsapp: zapNum(r.querySelector("[data-zap]").value),
        instagram: r.querySelector("[data-insta]").value.replace(/^@/, "").trim() || null, endereco: r.querySelector("[data-end]").value.trim() || null };
      if (d.nome.length < 2) return toast("Escreva o nome.", 1);
      st.prof = await q(sb.from("ad_profissionais").update(d).eq("id", st.prof.id).select().single());
      toast("Dados salvos."); fechaFolha();
    };
  });
}

// ---------- instalar e senha ----------
function instrucoesInstalar(paraNotificar) {
  const passos = ehIOS()
    ? ["Abra este app no <b>Safari</b>.", "Toque no botão <b>Compartilhar</b> (quadrado com seta para cima).", "Escolha <b>Adicionar à Tela de Início</b> e toque em <b>Adicionar</b>.", "Abra o app pelo novo ícone <b>Nay Nails</b> e ative as notificações."]
    : ["Abra este app no <b>Chrome</b>.", "Toque nos <b>três pontinhos</b> no canto de cima.", "Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.", "Abra pelo novo ícone <b>Nay Nails</b>."];
  abreFolha(cabFolha("Instalar o app", paraNotificar ? "No iPhone, as notificações só funcionam com o app instalado na tela inicial." : "Fica com ícone próprio e abre como aplicativo.") +
    `<div class="cartao"><ol style="padding-left:20px;line-height:1.7">${passos.map((p) => `<li>${p}</li>`).join("")}</ol></div>
    ${window._promptInstalar ? `<button class="btn ouro cheio" data-inst>Instalar agora</button>` : ""}`, (r) => {
    r.querySelector("[data-inst]")?.addEventListener("click", async () => { window._promptInstalar.prompt(); window._promptInstalar = null; fechaFolha(); });
  });
}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window._promptInstalar = e; });

function novaSenha() {
  abreFolha(cabFolha("Nova senha") + `<div class="cartao"><label class="f">Nova senha (mínimo 8 caracteres)</label><input class="campo" type="password" data-s autocomplete="new-password"></div><button class="btn ouro cheio" data-salvar>Salvar senha</button>`, (r) => {
    r.querySelector("[data-salvar]").onclick = async () => {
      const s = r.querySelector("[data-s]").value;
      if (s.length < 8) return toast("Use pelo menos 8 caracteres.", 1);
      const { error } = await sb.auth.updateUser({ password: s });
      if (error) return toast(erroMsg(error), 1);
      toast("Senha alterada."); fechaFolha();
    };
  });
}

// ao voltar para o app, atualiza
let saiuEm = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { saiuEm = Date.now(); return; }
  if (st.prof && travaCfg() && Date.now() - saiuEm > 60000) { destravado = false; mostraTrava(); }
  if (st.prof && !$("folha").classList.contains("on")) { atualizaTela(); contaAvisos(); }
});
// toque na notificação com o app aberto
navigator.serviceWorker?.addEventListener("message", (e) => { if (e.data?.agendamento) detalheAg(e.data.agendamento); else if (e.data?.abrir === "avisos") telaAvisos(); });


// =====================================================================
// SENHA DO APP E BIOMETRIA (fica só neste celular, como no Tico Finances)
// =====================================================================
const TRAVA = "nay.trava";
let destravado = false;
function travaCfg() { try { return JSON.parse(localStorage.getItem(TRAVA) || "null"); } catch { return null; } }
async function sha(t) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
const b64u = (a) => btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ub64 = (t) => Uint8Array.from(atob(t.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const bioDisponivel = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
const nomeBio = () => (ehIOS() ? "Face ID" : /android/i.test(navigator.userAgent) ? "digital" : "biometria");
async function bioCadastra() {
  const c = await navigator.credentials.create({ publicKey: {
    challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: "Nay Nails Gestão" },
    user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "nayara", displayName: "Nay Nails Gestão" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" }, timeout: 60000 } });
  return b64u(c.rawId);
}
async function bioConfere(id) {
  const r = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: "public-key", id: ub64(id), transports: ["internal"] }], userVerification: "required", timeout: 60000 } });
  return !!r;
}

// Teclado numérico (usado para destravar e para criar a senha)
const IC_FACE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 16a3.5 3.5 0 0 0 5 0"/></svg>';
function teclado(el, { titulo, msg, tamanho, bio, aoCompletar, aoBio, rodape, semImagem }) {
  let pin = "";
  const desenha = (m, treme) => {
    el.innerHTML = `<div class="lk">${semImagem ? "" : '<img src="icone-192.png" alt="">'}<h3>${titulo}</h3><div class="s">${m || msg}</div>
      ${bio ? `<button type="button" class="bio-btn" data-k="bio">${IC_FACE}Entrar com ${nomeBio()}</button>` : ""}<div class="pins${treme ? " treme" : ""}">${Array.from({ length: tamanho }, (_, i) => `<i class="${i < pin.length ? "on" : ""}"></i>`).join("")}</div>
      <div class="kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-k="${n}">${n}</button>`).join("")}
        <span></span>
        <button type="button" data-k="0">0</button><button type="button" class="kb" data-k="del" aria-label="Apagar">⌫</button></div>
      ${rodape || ""}</div>`;
    el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => tecla(b.dataset.k)));
  };
  const tecla = async (k) => {
    if (k === "bio" || k === "bio-auto") return aoBio && aoBio(desenha, k === "bio-auto");
    if (k === "del") { pin = pin.slice(0, -1); return desenha(); }
    if (pin.length >= tamanho) return;
    pin += k; desenha();
    if (pin.length === tamanho) { const p = pin; pin = ""; setTimeout(() => aoCompletar(p, (m) => desenha(m, true), desenha), 120); }
  };
  el._tecla = tecla;
  desenha();
}
document.addEventListener("keydown", (e) => {
  const el = $("trava"); if (!el || !el._tecla) return;
  if (/^\d$/.test(e.key)) el._tecla(e.key); else if (e.key === "Backspace") el._tecla("del");
});

function mostraTrava() {
  const L = travaCfg(); if (!L || destravado) return;
  let el = $("trava");
  if (!el) { el = document.createElement("div"); el.id = "trava"; document.body.appendChild(el); }
  const libera = () => { destravado = true; el.remove(); };
  const temBio = !!(L.bio && bioDisponivel());
  teclado(el, {
    titulo: "Nay Nails Gestão", msg: temBio ? "ou digite a senha do app" : "Digite a senha do app", tamanho: L.len || 4, bio: temBio,
    aoCompletar: async (p, erro) => { if ((await sha(L.salt + p)) === L.hash) libera(); else erro("Senha incorreta. Tente de novo."); },
    aoBio: async (desenha, automatico) => { try { if (await bioConfere(L.bio)) libera(); } catch { if (!automatico) desenha(`${cap(nomeBio())} não confirmou. Tente de novo ou use a senha.`); } },
    rodape: `<button type="button" class="link" id="esqueci-pin" style="margin-top:18px">Esqueci a senha</button>`,
  });
  el.querySelector("#esqueci-pin").onclick = async () => {
    if (!confirm("Para tirar a senha, você vai sair e entrar de novo com e-mail e senha da conta. Continuar?")) return;
    localStorage.removeItem(TRAVA); await sb.auth.signOut(); location.reload();
  };
  // Abre o Face ID / digital sozinho (Android abre direto; no iPhone a Apple exige um toque no botão)
  if (temBio) setTimeout(() => el._tecla && el._tecla("bio-auto"), 350);
}

function criaSenha(primeiraVez) {
  let tamanho = 4;
  abreFolha(cabFolha("Senha do app", primeiraVez ? "Proteja o app com uma senha de números. Ela é pedida sempre que o app abrir." : "Escolha quantos números a senha vai ter.") + `
    <div class="opcoes" data-tam style="justify-content:center;margin-bottom:16px">${[4, 5, 6].map((n) => `<button type="button" data-n="${n}" class="${n === 4 ? "on" : ""}">${n} números</button>`).join("")}</div>
    <div id="cria-pin"></div>
    ${primeiraVez ? `<button class="btn cheio" data-fechar style="margin-top:16px">Agora não</button>` : ""}`, (r) => {
    const box = r.querySelector("#cria-pin");
    let primeira = null;
    const inicia = () => {
      primeira = null;
      teclado(box, { titulo: "Criar senha", msg: `Digite ${tamanho} números`, tamanho, semImagem: true,
        aoCompletar: async (p, erro, desenha) => {
          if (!primeira) { primeira = p; return desenha("Digite de novo para confirmar"); }
          if (p !== primeira) { primeira = null; return erro("As senhas não são iguais. Comece de novo."); }
          // Liga o Face ID / digital direto, sem perguntar (precisa acontecer logo após o toque)
          let bio = null;
          if (bioDisponivel()) { try { bio = await bioCadastra(); } catch { bio = null; } }
          const salt = b64u(crypto.getRandomValues(new Uint8Array(12)));
          const cfg = { len: tamanho, salt, hash: await sha(salt + p), bio };
          localStorage.setItem(TRAVA, JSON.stringify(cfg)); destravado = true;
          toast(bio ? `Senha criada. Agora o app abre com ${nomeBio()}!` : "Senha do app criada!"); fechaFolha(); if (st.aba === "mais") telaMais();
        } });
    };
    r.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => { tamanho = +b.dataset.n; r.querySelectorAll("[data-n]").forEach((x) => x.classList.toggle("on", x === b)); inicia(); }));
    inicia();
  });
}

function telaSeguranca() {
  const L = travaCfg();
  if (!L) return criaSenha(false);
  abreFolha(cabFolha("Senha do app e biometria", "Ativada neste celular ✅") + `
    <div class="cartao">
      <label class="interruptor"><span>Entrar com ${nomeBio()}</span><input type="checkbox" data-bio ${L.bio ? "checked" : ""} ${bioDisponivel() ? "" : "disabled"}></label>
      ${bioDisponivel() ? "" : `<p class="pequeno">Este celular ou navegador não oferece biometria para sites.</p>`}
      <p class="pequeno" style="margin-top:8px">O app trava sozinho quando fica mais de 1 minuto fechado.</p>
    </div>
    <div class="pilha">
      <button class="btn cheio" data-trocar>Trocar a senha do app</button>
      <button class="btn perigo cheio" data-remover>Remover a senha do app</button>
    </div>`, (r) => {
    r.querySelector("[data-bio]").onchange = async (e) => {
      const cfg = travaCfg();
      if (e.target.checked) { try { cfg.bio = await bioCadastra(); toast("Biometria ativada."); } catch { e.target.checked = false; return toast("Não foi possível ativar a biometria.", 1); } }
      else cfg.bio = null;
      localStorage.setItem(TRAVA, JSON.stringify(cfg));
    };
    r.querySelector("[data-trocar]").onclick = () => criaSenha(false);
    r.querySelector("[data-remover]").onclick = () => {
      if (!confirm("Remover a senha do app neste celular?")) return;
      localStorage.removeItem(TRAVA); toast("Senha do app removida."); fechaFolha(); if (st.aba === "mais") telaMais();
    };
  });
}

// ---------- aparência ----------
function temaAtual() { return localStorage.getItem("nay.tema2") || "claro"; }
function aplicaTema(t) {
  localStorage.setItem("nay.tema2", t); document.documentElement.dataset.tema = t;
  document.querySelector('meta[name="theme-color"]').content = t === "claro" ? "#F6F2EC" : "#121110";
}


// =====================================================================
// BOTÃO FLUTUANTE, CONFETE
// =====================================================================
function atualizaFab() {
  let f = $("fab");
  if (!f) { f = document.createElement("button"); f.id = "fab"; f.className = "fab"; f.innerHTML = IC.mais; document.body.appendChild(f); }
  const acao = { inicio: ["Novo agendamento", () => novoAgendamento({})], agenda: ["Novo agendamento", () => novoAgendamento({ data: st.dia })], clientes: ["Cadastrar cliente", () => editaCliente(null)], caixa: ["Registrar pagamento", () => registraPagamento(null)] }[st.aba];
  f.classList.toggle("hide", !acao);
  if (acao) { f.setAttribute("aria-label", acao[0]); f.onclick = acao[1]; }
}
function festa() {
  if (calma) return;
  const cores = ["#C5A568", "#DFC58E", "#F5F3ED", "#75A987", "#A6AA9C"];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("span"); c.className = "confete-app";
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, dist = 140 + Math.random() * 240;
    c.style.cssText = `left:${innerWidth / 2}px;top:${innerHeight * 0.55}px;background:${cores[i % cores.length]};--x:${Math.cos(ang) * dist}px;--y:${Math.sin(ang) * dist + 260}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.12}s`;
    document.body.appendChild(c); setTimeout(() => c.remove(), 1500);
  }
}

// =====================================================================
// AUTOMAÇÕES
// =====================================================================
function feriadosNacionais() {
  // Feriados nacionais (Sexta-feira Santa e Corpus Christi calculados para cada ano)
  const pascoa = (a) => { const f = Math.floor, b = a % 19, c = f(a / 100), d = a % 100, e = f(c / 4), g = c % 4, h = f((c + 8) / 25), i = f((c - h + 1) / 3), k = (19 * b + c - e - i + 15) % 30, l = f(d / 4), m = d % 4, n = (32 + 2 * g + 2 * l - k - m) % 7, o = f((b + 11 * k + 22 * n) / 451), mes = f((k + n - 7 * o + 114) / 31), dia = ((k + n - 7 * o + 114) % 31) + 1; return new Date(Date.UTC(a, mes - 1, dia)); };
  const lista = [];
  const ano = Number(isoDia().slice(0, 4));
  [ano, ano + 1].forEach((a) => {
    const p = pascoa(a), mais = (n) => { const d = new Date(p); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    lista.push([`${a}-01-01`, "Confraternização Universal"], [mais(-2), "Sexta-feira Santa"], [`${a}-04-21`, "Tiradentes"], [`${a}-05-01`, "Dia do Trabalho"], [mais(60), "Corpus Christi"],
      [`${a}-09-07`, "Independência"], [`${a}-10-12`, "Nossa Senhora Aparecida"], [`${a}-11-02`, "Finados"], [`${a}-11-15`, "Proclamação da República"], [`${a}-11-20`, "Consciência Negra"], [`${a}-12-25`, "Natal"]);
  });
  return lista.filter(([d]) => d >= isoDia()).sort().slice(0, 12);
}

async function telaAutomacoes() {
  const a = { concluir: true, confirmar18: true, aniversario: true, resumo: true, ...(st.prof.automacoes || {}) };
  const itens = [
    ["concluir", "Finalizar atendimentos sozinho", "1 hora depois do horário, os atendimentos confirmados viram concluídos e você recebe um aviso para registrar o pagamento."],
    ["confirmar18", "Aviso às 18h de quem não confirmou", "Todo dia às 18h, se alguma cliente de amanhã não confirmou, você recebe um aviso para mandar os lembretes."],
    ["aniversario", "Aniversários do dia às 8h", "Aviso com as clientes que fazem aniversário, para mandar os parabéns."],
    ["resumo", "Resumo da agenda às 7h30", "Quantas clientes, quanto está previsto e a primeira do dia."],
  ];
  abreFolha(cabFolha("Automações", "O app trabalha sozinho, mesmo fechado.") + `
    <div class="cartao">${itens.map(([k, t, d]) => `<label class="interruptor"><span><b>${t}</b><span class="pequeno" style="display:block;margin-top:2px">${d}</span></span><input type="checkbox" data-a="${k}" ${a[k] !== false ? "checked" : ""}></label>`).join("")}</div>
    <div class="pilha">
      <button class="btn prim cheio" data-lembretes>📲 Enviar lembretes de amanhã em sequência</button>
      <button class="btn cheio" data-feriados>🗓️ Bloquear feriados nacionais</button>
    </div>
    <p class="pequeno" style="margin-top:12px">Também automático: avisos de novo agendamento, cancelamento, confirmação e 30 minutos antes de cada cliente, e clientes cadastradas sozinhas quando agendam pelo site.</p>`, (r) => {
    r.querySelectorAll("[data-a]").forEach((c) => (c.onchange = async () => {
      a[c.dataset.a] = c.checked;
      st.prof = await q(sb.from("ad_profissionais").update({ automacoes: a }).eq("id", st.prof.id).select().single());
      toast(c.checked ? "Automação ligada." : "Automação desligada.");
    }));
    r.querySelector("[data-lembretes]").onclick = lembretesEmSequencia;
    r.querySelector("[data-feriados]").onclick = telaFeriados;
  });
}

async function telaFeriados() {
  const lista = feriadosNacionais();
  const bloq = await q(sb.from("ad_bloqueios").select("inicio").gte("inicio", inicioDia(isoDia())));
  const ja = new Set(bloq.map((b) => isoDia(b.inicio)));
  abreFolha(cabFolha("Feriados nacionais", "Marque os dias em que o salão não abre. O site deixa de oferecer horários neles.") + `
    <div class="cartao">${lista.map(([d, n]) => `<label class="interruptor"><span><b>${n}</b><span class="pequeno" style="display:block">${diaSemana(meioDia(d))}, ${meioDia(d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}${ja.has(d) ? " · já bloqueado" : ""}</span></span><input type="checkbox" data-d="${d}" data-n="${esc(n)}" ${ja.has(d) ? "checked disabled" : "checked"}></label>`).join("")}</div>
    <button class="btn prim cheio" data-salvar>Bloquear os marcados</button>`, (r) => {
    r.querySelector("[data-salvar]").onclick = async () => {
      const marcados = [...r.querySelectorAll("[data-d]:checked:not(:disabled)")].map((c) => ({ profissional_id: st.prof.id, inicio: inicioDia(c.dataset.d), fim: inicioDia(somaDias(c.dataset.d, 1)), motivo: "Feriado: " + c.dataset.n }));
      if (!marcados.length) return toast("Nenhum feriado novo marcado.", 1);
      await q(sb.from("ad_bloqueios").insert(marcados));
      toast(`${marcados.length} feriado${marcados.length > 1 ? "s bloqueados" : " bloqueado"}.`); festa(); fechaFolha(); atualizaTela();
    };
  });
}

// Envia os lembretes de amanhã um atrás do outro: ao voltar do WhatsApp, já aparece a próxima cliente
async function lembretesEmSequencia() {
  const amanha = somaDias(isoDia(), 1);
  const fila = (await agsEntre(amanha, somaDias(amanha, 1))).filter((a) => a.status === "marcado");
  if (!fila.length) { fechaFolha(); return toast("Todas as clientes de amanhã já confirmaram. 🎉"); }
  st.fila = fila; st.filaPos = 0; proximoLembrete();
}
function proximoLembrete() {
  const a = st.fila[st.filaPos];
  if (!a) { st.fila = null; fechaFolha(); festa(); return toast("Lembretes enviados! ✨"); }
  abreFolha(cabFolha(`Lembrete ${st.filaPos + 1} de ${st.fila.length}`, "Toque em enviar, mande no WhatsApp e volte para o app.") + `
    <div class="proxima"><small>Amanhã às ${hora(a.inicio)}</small><h3>${esc(a.cliente_nome)}</h3><div class="mudo">${esc(a.servico_nome)} · ${brl(a.preco)}</div></div>
    <a class="btn zap cheio" data-enviar target="_blank" rel="noopener" href="${linkZap(a, "lembrete")}">${IC.zap}Enviar lembrete</a>
    <div class="grade2" style="margin-top:10px"><button class="btn" data-pular>Pular</button><button class="btn" data-parar>Parar</button></div>`, (r) => {
    r.querySelector("[data-enviar]").onclick = () => { st.filaPos++; st.filaEsperando = true; };
    r.querySelector("[data-pular]").onclick = () => { st.filaPos++; proximoLembrete(); };
    r.querySelector("[data-parar]").onclick = () => { st.fila = null; fechaFolha(); };
  });
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && st.fila && st.filaEsperando) { st.filaEsperando = false; setTimeout(proximoLembrete, 300); } });

// =====================================================================
// TUTORIAL
// =====================================================================
const PASSOS_TUTORIAL = [
  { img: true, t: "Bem-vinda ao Nay Nails Gestão", d: "Tudo do salão no seu celular, ligado ao site onde as clientes agendam. É uma agenda só: o que elas marcam aparece aqui na hora." },
  { ic: "salao", t: "Início: o resumo do dia", l: ["Agendamentos de hoje e quanto já entrou", "Quem falta confirmar e horários livres", "A próxima cliente com o WhatsApp a um toque"] },
  { ic: "agenda", t: "Agenda", l: ["Veja por dia, semana ou mês, com o previsto e o lucro", "Toque numa cliente para confirmar, remarcar ou cancelar", "Use o botão dourado + para marcar um horário"] },
  { ic: "sino", t: "Avisos no celular", l: ["Nova cliente agendou, cancelou ou confirmou", "30 minutos antes de cada atendimento", "Resumo às 7h30 e lembrete às 18h"], extra: "Ative em Mais › Notificações." },
  { ic: "cliente", t: "Clientes", l: ["Histórico, quanto já gastou e de quanto em quanto tempo volta", "Filtros de frequentes, sumidas e aniversariantes", "Mensagens prontas: parabéns, convite para voltar e avaliação"] },
  { ic: "dinheiro", t: "Caixa e lucro", l: ["Registre pagamentos (Pix, dinheiro, cartão) e despesas", "Veja o lucro do dia, da semana e do mês", "Defina uma meta e receba dicas para faturar mais"] },
  { ic: "relogio", t: "Automações", l: ["Atendimentos finalizados sozinhos depois do horário", "Lembretes de amanhã enviados em sequência", "Feriados bloqueados com um toque"], extra: "Configure em Mais › Automações." },
  { ic: "cadeado", t: "Seu app protegido", d: "Crie uma senha de números e entre com Face ID ou digital. Ninguém mais vê sua agenda e suas clientes." },
];
function mostraTutorial(aoTerminar) {
  let i = 0;
  const el = document.createElement("div"); el.id = "tutorial"; document.body.appendChild(el);
  const fim = () => { localStorage.setItem("nay.tutorial", "1"); el.remove(); aoTerminar && aoTerminar(); };
  const desenha = (dir) => {
    const p = PASSOS_TUTORIAL[i], ult = i === PASSOS_TUTORIAL.length - 1;
    el.innerHTML = `<button class="pular" data-pular>${ult ? "" : "Pular"}</button>
      <div class="slide ${dir || ""}">
        <div class="big">${p.img ? '<img src="../nayara/logo.jpg" alt="">' : IC[p.ic]}</div>
        <h2>${p.t}</h2>${p.d ? `<p>${p.d}</p>` : ""}${p.l ? `<ul>${p.l.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}${p.extra ? `<p style="font-size:13.5px;color:var(--ouro)">${p.extra}</p>` : ""}
      </div>
      <div class="pontos">${PASSOS_TUTORIAL.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="acoes"><button class="btn" data-voltar ${i ? "" : "disabled"}>Voltar</button><button class="btn prim" data-prox>${ult ? "Começar a usar" : "Próximo"}</button></div>`;
    el.querySelector("[data-pular]").onclick = fim;
    el.querySelector("[data-voltar]").onclick = () => { if (i) { i--; desenha("volta"); } };
    el.querySelector("[data-prox]").onclick = () => { if (ult) { festa(); fim(); } else { i++; desenha("entra"); } };
  };
  let x0 = null;
  el.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  el.addEventListener("touchend", (e) => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (dx < -50 && i < PASSOS_TUTORIAL.length - 1) { i++; desenha("entra"); } else if (dx > 50 && i > 0) { i--; desenha("volta"); }
  });
  desenha();
}
