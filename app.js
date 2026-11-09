// Agenda Deluxe — painel da profissional
const $ = (id) => document.getElementById(id);
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const STATUS = { marcado: "Marcado", confirmado: "Confirmado", concluido: "Atendido", faltou: "Faltou", cancelado: "Cancelado" };

const st = { user: null, perfil: null, servicos: [], dia: AD.isoDia(), mes: AD.isoDia().slice(0, 7), modoLogin: false };

function mostra(v) { ["v-inicio", "v-perfil", "v-painel"].forEach((x) => $(x).classList.toggle("hide", x !== v)); }

// ---------- Autenticação ----------
function modoAuth(login) {
  st.modoLogin = login;
  $("auth-titulo").textContent = login ? "Entrar" : "Criar minha conta";
  $("a-ok").textContent = login ? "Entrar" : "Criar conta grátis";
  $("auth-troca-txt").textContent = login ? "Ainda não tem conta?" : "Já tem conta?";
  $("a-troca").textContent = login ? "Criar conta" : "Entrar";
}
$("a-troca").onclick = () => modoAuth(!st.modoLogin);
modoAuth(true); // começa em Entrar
$("a-ok").onclick = async () => {
  const email = $("a-email").value.trim(), password = $("a-senha").value;
  if (!email || password.length < 6) return AD.toast("Preencha e-mail e senha (mínimo 6 caracteres).", 1);
  $("a-ok").disabled = true;
  try {
    if (st.modoLogin) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: AD.base() } });
      if (error) throw error;
      if (data.user && (data.user.identities || []).length === 0) {
        // E-mail já cadastrado: o Supabase não manda e-mail nesse caso
        AD.toast("Esse e-mail já tem conta. Entre com a sua senha.", 1); modoAuth(true);
      } else if (!data.session) {
        AD.toast("Conta criada! Confirme pelo link que enviamos ao seu e-mail (veja também o spam)."); modoAuth(true);
      }
    }
  } catch (e) { AD.toast(AD.erro(e), 1); }
  $("a-ok").disabled = false;
};
$("sair").onclick = () => sb.auth.signOut();

sb.auth.onAuthStateChange((_ev, session) => {
  const u = session?.user || null;
  if (st.pronto && u?.id === st.user?.id) return;
  st.pronto = true;
  st.user = u;
  setTimeout(iniciar, 0); // fora do callback, evita travar o cliente do Supabase
});

async function iniciar() {
  if (!st.user) return mostra("v-inicio");
  const { data } = await sb.from("ad_profissionais").select("*").eq("id", st.user.id).maybeSingle();
  st.perfil = data;
  if (!data) {
    mostra("v-perfil");
    return;
  }
  mostra("v-painel");
  $("topo-nome").textContent = st.perfil.nome;
  // Voltou do Mercado Pago? Confere o status da assinatura
  if (AD_CONFIG.COBRANCA_ATIVA && new URLSearchParams(location.search).get("assinatura")) {
    history.replaceState(null, "", location.pathname);
    await sincronizaAssinatura(true);
  }
  atualizaAvisos();
  sb.rpc("ad_eh_admin").then(({ data: adm }) => $("link-admin").classList.toggle("hide", !adm));
  await carregaServicos();
  abaAtiva(liberado() ? "agenda" : "link");
}

// ---------- Assinatura ----------
const fimTeste = () => new Date(new Date(st.perfil.criado_em).getTime() + 14 * 864e5);
const diasTeste = () => Math.ceil((fimTeste() - Date.now()) / 864e5);
const assinante = () => st.perfil.assinatura_status === "authorized";
const liberado = () => !st.perfil.pausado && (!AD_CONFIG.COBRANCA_ATIVA || assinante() || fimTeste() > new Date());

function atualizaAvisos() {
  $("aviso-bloqueio").classList.toggle("hide", liberado());
  if (st.perfil.pausado) $("aviso-bloqueio").innerHTML = `<h3>⏸️ Sua conta está pausada</h3><p class="muted" style="margin:0">Fale com o suporte do Agenda Deluxe para reativar. Seus dados estão guardados.</p>`;
  const d = diasTeste();
  const mostraTeste = AD_CONFIG.COBRANCA_ATIVA && !assinante() && d > 0 && d <= 5;
  $("aviso-teste").classList.toggle("hide", !mostraTeste);
  if (mostraTeste) $("aviso-teste").innerHTML = `<div class="row between"><span class="muted">Seu teste grátis termina em <b>${d} dia${d > 1 ? "s" : ""}</b>.</span><button class="btn-gold btn-sm" onclick="abaAtiva('link')">Assinar</button></div>`;
}

async function chamaAssinatura(acao, extra = {}) {
  const { data, error } = await sb.functions.invoke("ad-assinar", { body: { acao, ...extra } });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context.json()).erro || msg; } catch {}
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
}

async function sincronizaAssinatura(avisar) {
  try {
    const r = await chamaAssinatura("status");
    const { data } = await sb.from("ad_profissionais").select("*").eq("id", st.user.id).single();
    if (data) st.perfil = data;
    if (avisar) AD.toast(r.status === "authorized" ? "Assinatura ativa! Obrigado 💛" : "Pagamento ainda não confirmado. Pode levar alguns minutos.", r.status !== "authorized");
  } catch (e) { if (avisar) AD.toast(e.message, 1); }
}

// ---------- Perfil (primeiro acesso) ----------
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
$("p-nome").oninput = () => { if (!$("p-slug").dataset.mexeu) $("p-slug").value = slugify($("p-nome").value); };
$("p-slug").oninput = () => { $("p-slug").dataset.mexeu = 1; $("p-slug").value = slugify($("p-slug").value); };
$("p-ok").onclick = async () => {
  const p = { id: st.user.id, nome: $("p-nome").value.trim(), profissao: $("p-prof").value.trim(), whatsapp: $("p-zap").value.replace(/\D/g, ""), slug: slugify($("p-slug").value) };
  if (p.nome.length < 2) return AD.toast("Informe seu nome.", 1);
  if (p.slug.length < 3) return AD.toast("O link precisa ter pelo menos 3 letras.", 1);
  $("p-ok").disabled = true;
  const { error } = await sb.from("ad_profissionais").insert(p);
  $("p-ok").disabled = false;
  if (error) return AD.toast(AD.erro(error), 1);
  // Horário padrão: seg–sex 9h–18h, sáb 9h–13h (dá pra editar depois)
  const h = [1, 2, 3, 4, 5].map((d) => ({ profissional_id: p.id, dia_semana: d, inicio: "09:00", fim: "18:00" }));
  h.push({ profissional_id: p.id, dia_semana: 6, inicio: "09:00", fim: "13:00" });
  await sb.from("ad_horarios").insert(h);
  AD.toast("Perfil criado! Agora cadastre seus serviços.");
  await iniciar();
  abaAtiva("servicos");
};

// ---------- Abas ----------
document.querySelectorAll("nav.tabs button").forEach((b) => (b.onclick = () => abaAtiva(b.dataset.tab)));
function abaAtiva(t) {
  if (st.perfil && !liberado() && t !== "link") { AD.toast(st.perfil.pausado ? "Sua conta está pausada." : "Assine para usar a agenda.", 1); t = "link"; }
  document.querySelectorAll("nav.tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("hide", x.id !== "t-" + t));
  ({ agenda: renderAgenda, servicos: renderServicos, horarios: renderHorarios, resumo: renderResumo, link: renderLink })[t]();
  scrollTo(0, 0);
}

// ---------- Agenda ----------
$("d-ant").onclick = () => { st.dia = AD.somaDias(st.dia, -1); renderAgenda(); };
$("d-prox").onclick = () => { st.dia = AD.somaDias(st.dia, 1); renderAgenda(); };
$("d-hoje").onclick = () => { st.dia = AD.isoDia(); renderAgenda(); };

async function buscaAgendamentos(deIso, ateIso) {
  const { data, error } = await sb.from("ad_agendamentos").select("*")
    .gte("inicio", AD.inicioDia(deIso)).lt("inicio", AD.inicioDia(ateIso)).order("inicio");
  if (error) AD.toast(AD.erro(error), 1);
  return data || [];
}

function msgLembrete(a) {
  const quando = AD.isoDia(a.inicio) === AD.somaDias(AD.isoDia(), 1) ? "amanhã" : AD.dataLonga(a.inicio);
  const link = AD.base() + "confirmar.html?id=" + a.id;
  return `Olá, ${a.cliente_nome.split(" ")[0]}! 😊\nPassando para lembrar do seu horário de *${a.servico_nome}* ${quando} às *${AD.hora(a.inicio)}* com ${st.perfil.nome}.\n\nConfirme ou desmarque por aqui:\n${link}`;
}
const linkZap = (a) => `https://wa.me/${AD.zap(a.cliente_whatsapp)}?text=${encodeURIComponent(msgLembrete(a))}`;

async function renderAgenda() {
  $("d-titulo").textContent = st.dia === AD.isoDia() ? "Hoje, " + AD.dataCurta(st.dia + "T12:00:00Z") : AD.dataLonga(st.dia + "T12:00:00Z");
  const [doDia, amanha] = await Promise.all([
    buscaAgendamentos(st.dia, AD.somaDias(st.dia, 1)),
    buscaAgendamentos(AD.somaDias(AD.isoDia(), 1), AD.somaDias(AD.isoDia(), 2)),
  ]);

  // Caixa de lembretes de amanhã
  const pend = amanha.filter((a) => a.status === "marcado");
  $("lembretes-box").innerHTML = pend.length
    ? `<h3>📲 ${pend.length} lembrete${pend.length > 1 ? "s" : ""} para enviar</h3>
       <p class="muted" style="margin:0 0 10px">Clientes de amanhã que ainda não confirmaram. Toque para mandar no WhatsApp.</p>
       ${pend.map((a) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)">
         <div class="grow"><b>${AD.hora(a.inicio)}</b> · ${AD.esc(a.cliente_nome)}</div>
         <a class="btn btn-zap btn-sm" target="_blank" rel="noopener" href="${linkZap(a)}">Enviar</a></div>`).join("")}`
    : `<div class="row"><span style="font-size:1.4rem">✅</span><div class="muted">Nenhum lembrete pendente para amanhã.</div></div>`;

  const ativos = doDia.filter((a) => a.status !== "cancelado");
  const total = ativos.reduce((s, a) => s + Number(a.preco), 0);
  $("lista-ag").innerHTML = doDia.length
    ? `<p class="muted">${ativos.length} atendimento${ativos.length !== 1 ? "s" : ""} · previsto ${AD.brl(total)}</p>` +
      doDia.map((a) => `
      <div class="card ag ${a.status}">
        <div class="row">
          <div class="hora">${AD.hora(a.inicio)}</div>
          <div class="grow">
            <b>${AD.esc(a.cliente_nome)}</b><br>
            <span class="muted">${AD.esc(a.servico_nome)} · ${AD.brl(a.preco)} · até ${AD.hora(a.fim)}</span>
          </div>
        </div>
        ${a.observacao ? `<div class="obs">📝 ${AD.esc(a.observacao)}</div>` : ""}
        <div style="margin-top:8px"><span class="badge ${a.status}">${STATUS[a.status]}</span> ${a.pago ? '<span class="badge pago">Pago</span>' : ""}</div>
        <div class="acoes">
          <a class="btn btn-zap btn-sm" target="_blank" rel="noopener" href="${linkZap(a)}">Lembrete</a>
          <a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="https://wa.me/${AD.zap(a.cliente_whatsapp)}">Conversar</a>
          ${a.status !== "concluido" && a.status !== "cancelado" ? `<button class="btn-line btn-sm" data-st="concluido" data-id="${a.id}">Atendido</button>` : ""}
          ${a.status !== "faltou" && a.status !== "cancelado" ? `<button class="btn-line btn-sm" data-st="faltou" data-id="${a.id}">Faltou</button>` : ""}
          <button class="btn-line btn-sm" data-pago="${a.pago ? 0 : 1}" data-id="${a.id}">${a.pago ? "Desmarcar pago" : "Marcar pago"}</button>
          ${a.status !== "cancelado" ? `<button class="btn-line btn-sm" data-st="cancelado" data-id="${a.id}" style="color:var(--bad)">Cancelar</button>` : ""}
        </div>
      </div>`).join("")
    : `<div class="vazio">Nenhum agendamento neste dia.<br><br><button class="btn-line btn-sm" onclick="abaAtiva('link')">Divulgar meu link</button></div>`;

  $("lista-ag").querySelectorAll("button[data-id]").forEach((b) => (b.onclick = async () => {
    const upd = b.dataset.st ? { status: b.dataset.st } : { pago: b.dataset.pago === "1" };
    if (upd.status === "cancelado" && !confirm("Cancelar este agendamento? O horário volta a ficar livre.")) return;
    if (upd.status === "concluido") upd.pago = true;
    const { error } = await sb.from("ad_agendamentos").update(upd).eq("id", b.dataset.id);
    if (error) return AD.toast(AD.erro(error), 1);
    renderAgenda();
  }));
}

// Agendamento manual
$("novo-ag").onclick = () => {
  if (!st.servicos.filter((s) => s.ativo).length) { AD.toast("Cadastre um serviço primeiro.", 1); return abaAtiva("servicos"); }
  $("n-serv").innerHTML = st.servicos.filter((s) => s.ativo).map((s) => `<option value="${s.id}">${AD.esc(s.nome)} — ${AD.brl(s.preco)}</option>`).join("");
  $("n-dia").value = st.dia; $("n-hora").value = ""; $("n-nome").value = ""; $("n-zap").value = "";
  $("dlg-ag").showModal();
};
$("n-cancelar").onclick = () => $("dlg-ag").close();
$("f-ag").onsubmit = async (ev) => {
  ev.preventDefault();
  const s = st.servicos.find((x) => x.id === $("n-serv").value);
  const inicio = new Date(`${$("n-dia").value}T${$("n-hora").value}:00-03:00`);
  const zap = $("n-zap").value.replace(/\D/g, "");
  if (zap.length < 10) return AD.toast("WhatsApp inválido (coloque o DDD).", 1);
  const { error } = await sb.from("ad_agendamentos").insert({
    profissional_id: st.user.id, servico_id: s.id, servico_nome: s.nome, preco: s.preco,
    cliente_nome: $("n-nome").value.trim(), cliente_whatsapp: zap,
    inicio: inicio.toISOString(), fim: new Date(inicio.getTime() + s.duracao_min * 60000).toISOString(),
  });
  if (error) return AD.toast(AD.erro(error), 1);
  $("dlg-ag").close();
  st.dia = $("n-dia").value;
  AD.toast("Agendado!");
  renderAgenda();
};

// ---------- Serviços ----------
async function carregaServicos() {
  const { data } = await sb.from("ad_servicos").select("*").order("criado_em");
  st.servicos = data || [];
}
const durTxt = (m) => (m < 60 ? m + " min" : Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : ""));
function renderServicos() {
  $("lista-serv").innerHTML = st.servicos.length
    ? st.servicos.map((s) => `
      <div class="card row" style="${s.ativo ? "" : "opacity:.55"}">
        <div class="grow"><b>${AD.esc(s.nome)}</b><br><span class="muted">${AD.brl(s.preco)} · ${durTxt(s.duracao_min)}${s.ativo ? "" : " · oculto"}</span></div>
        <button class="btn-line btn-sm" data-tog="${s.id}">${s.ativo ? "Ocultar" : "Mostrar"}</button>
        <button class="btn-line btn-sm" data-del="${s.id}" style="color:var(--bad)">Excluir</button>
      </div>`).join("")
    : `<div class="vazio">Você ainda não tem serviços. Adicione o primeiro abaixo 👇</div>`;
  $("lista-serv").querySelectorAll("[data-tog]").forEach((b) => (b.onclick = async () => {
    const s = st.servicos.find((x) => x.id === b.dataset.tog);
    await sb.from("ad_servicos").update({ ativo: !s.ativo }).eq("id", s.id);
    await carregaServicos(); renderServicos();
  }));
  $("lista-serv").querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
    if (!confirm("Excluir este serviço? Os agendamentos antigos continuam salvos.")) return;
    await sb.from("ad_servicos").delete().eq("id", b.dataset.del);
    await carregaServicos(); renderServicos();
  }));
}
$("s-ok").onclick = async () => {
  const nome = $("s-nome").value.trim();
  if (!nome) return AD.toast("Dê um nome ao serviço.", 1);
  const { error } = await sb.from("ad_servicos").insert({ profissional_id: st.user.id, nome, preco: Number($("s-preco").value || 0), duracao_min: Number($("s-dur").value) });
  if (error) return AD.toast(AD.erro(error), 1);
  $("s-nome").value = ""; $("s-preco").value = "";
  await carregaServicos(); renderServicos();
  AD.toast("Serviço adicionado!");
};

// ---------- Horários ----------
let horEdit = [];
async function renderHorarios() {
  const { data } = await sb.from("ad_horarios").select("*").order("inicio");
  horEdit = (data || []).map((h) => ({ dia_semana: h.dia_semana, inicio: h.inicio.slice(0, 5), fim: h.fim.slice(0, 5) }));
  desenhaHorarios();
}
function desenhaHorarios() {
  $("lista-hor").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const faixas = horEdit.map((h, i) => ({ ...h, i })).filter((h) => h.dia_semana === d);
    return `<div class="card">
      <div class="row between"><b>${DIAS[d]}</b>
        <button class="btn-line btn-sm" data-add="${d}">+ faixa</button></div>
      ${faixas.length ? faixas.map((h) => `<div class="hrow">
          <input type="time" value="${h.inicio}" data-i="${h.i}" data-k="inicio">
          <input type="time" value="${h.fim}" data-i="${h.i}" data-k="fim">
          <button class="btn-line btn-sm" data-rm="${h.i}" aria-label="Remover">✕</button></div>`).join("")
        : `<p class="muted" style="margin:6px 0 0">Fechado</p>`}
    </div>`;
  }).join("");
  $("lista-hor").querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => { horEdit.push({ dia_semana: +b.dataset.add, inicio: "09:00", fim: "18:00" }); desenhaHorarios(); }));
  $("lista-hor").querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => { horEdit.splice(+b.dataset.rm, 1); desenhaHorarios(); }));
  $("lista-hor").querySelectorAll("input[data-i]").forEach((inp) => (inp.onchange = () => { horEdit[+inp.dataset.i][inp.dataset.k] = inp.value; }));
}
$("h-salvar").onclick = async () => {
  if (horEdit.some((h) => !h.inicio || !h.fim || h.fim <= h.inicio)) return AD.toast("Confira os horários: o fim precisa ser depois do início.", 1);
  $("h-salvar").disabled = true;
  const del = await sb.from("ad_horarios").delete().eq("profissional_id", st.user.id);
  const ins = horEdit.length ? await sb.from("ad_horarios").insert(horEdit.map((h) => ({ ...h, profissional_id: st.user.id }))) : {};
  $("h-salvar").disabled = false;
  if (del.error || ins.error) return AD.toast(AD.erro(del.error || ins.error), 1);
  AD.toast("Horários salvos!");
};

// ---------- Resumo do mês ----------
$("m-ant").onclick = () => { st.mes = mudaMes(st.mes, -1); renderResumo(); };
$("m-prox").onclick = () => { st.mes = mudaMes(st.mes, 1); renderResumo(); };
function mudaMes(m, n) { const [a, mm] = m.split("-").map(Number); const d = new Date(Date.UTC(a, mm - 1 + n, 1)); return d.toISOString().slice(0, 7); }
async function renderResumo() {
  const ini = st.mes + "-01", fim = mudaMes(st.mes, 1) + "-01";
  $("m-titulo").textContent = new Date(ini + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const ags = await buscaAgendamentos(ini, fim);
  const atend = ags.filter((a) => a.status === "concluido");
  const faltas = ags.filter((a) => a.status === "faltou");
  const futuros = ags.filter((a) => ["marcado", "confirmado"].includes(a.status));
  const faturado = atend.reduce((s, a) => s + Number(a.preco), 0);
  const perdido = faltas.reduce((s, a) => s + Number(a.preco), 0);
  const recebido = ags.filter((a) => a.pago && a.status !== "cancelado").reduce((s, a) => s + Number(a.preco), 0);
  const base = atend.length + faltas.length;
  $("kpis").innerHTML = `
    <div class="kpi"><small>Faturado</small><b>${AD.brl(faturado)}</b><small>${atend.length} atendimentos</small></div>
    <div class="kpi"><small>Recebido</small><b>${AD.brl(recebido)}</b><small>marcados como pagos</small></div>
    <div class="kpi"><small>Faltas</small><b style="color:var(--bad)">${faltas.length}</b><small>${base ? Math.round((faltas.length / base) * 100) : 0}% · ${AD.brl(perdido)} perdidos</small></div>
    <div class="kpi"><small>Ainda por vir</small><b>${futuros.length}</b><small>${AD.brl(futuros.reduce((s, a) => s + Number(a.preco), 0))} previstos</small></div>`;
  const porServ = {};
  atend.forEach((a) => { porServ[a.servico_nome] = porServ[a.servico_nome] || { n: 0, v: 0 }; porServ[a.servico_nome].n++; porServ[a.servico_nome].v += Number(a.preco); });
  const top = Object.entries(porServ).sort((a, b) => b[1].v - a[1].v);
  $("resumo-serv").innerHTML = `<h3>Serviços que mais faturaram</h3>` + (top.length
    ? top.map(([n, x]) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${AD.esc(n)} <span class="muted">(${x.n}x)</span></span><b>${AD.brl(x.v)}</b></div>`).join("")
    : `<p class="muted">Marque os atendimentos como "Atendido" na agenda para ver aqui.</p>`);
  const devendo = atend.filter((a) => !a.pago);
  $("resumo-dev").innerHTML = `<h3>Atendidos sem pagamento</h3>` + (devendo.length
    ? devendo.map((a) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${AD.esc(a.cliente_nome)} <span class="muted">${AD.dataCurta(a.inicio)}</span></span>
        <a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="https://wa.me/${AD.zap(a.cliente_whatsapp)}?text=${encodeURIComponent(`Olá, ${a.cliente_nome.split(" ")[0]}! Tudo bem? Ficou pendente o pagamento de ${AD.brl(a.preco)} do ${a.servico_nome} do dia ${AD.dataCurta(a.inicio)}. ${st.perfil.whatsapp ? "Pode fazer o Pix para " + st.perfil.whatsapp + ". " : ""}Obrigada!`)}">Cobrar ${AD.brl(a.preco)}</a></div>`).join("")
    : `<p class="muted">Ninguém devendo. 🎉</p>`);
}

// ---------- Meu link ----------
function renderLink() {
  const url = AD.linkAgendar(st.perfil.slug);
  $("meu-link").value = url;
  $("abrir-link").href = url;
  $("compartilhar").href = "https://wa.me/?text=" + encodeURIComponent(`Agora você pode marcar seu horário comigo direto por aqui, a qualquer hora: ${url}`);
  $("e-nome").value = st.perfil.nome; $("e-prof").value = st.perfil.profissao || ""; $("e-zap").value = st.perfil.whatsapp || "";
  $("card-assinatura").classList.toggle("hide", !AD_CONFIG.COBRANCA_ATIVA);
  if (!AD_CONFIG.COBRANCA_ATIVA) return;
  const d = diasTeste(), status = st.perfil.assinatura_status;
  const ST = { authorized: "ativa ✅", pending: "aguardando pagamento", paused: "pausada", cancelled: "cancelada" };
  $("assinatura-txt").innerHTML = assinante()
    ? `Assinatura <b>ativa</b>: R$ ${AD_CONFIG.PRECO_MENSAL}/mês, renovação automática pelo Mercado Pago.`
    : (d > 0 ? `Você está no teste grátis: faltam <b>${d} dia${d > 1 ? "s" : ""}</b> (até ${AD.dataCurta(fimTeste())}). Se assinar agora, a primeira cobrança só acontece quando o teste acabar.`
             : `Seu teste grátis terminou. Assine para reativar sua agenda.`)
      + (ST[status] && status !== "authorized" ? `<br>Situação: ${ST[status]}.` : "");
  $("assinar-box").classList.toggle("hide", assinante());
  $("cancelar-ass").classList.toggle("hide", !assinante());
  if (!$("mp-email").value) $("mp-email").value = st.user.email || "";
}
$("assinar").onclick = async () => {
  const email = $("mp-email").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return AD.toast("Informe um e-mail válido.", 1);
  $("assinar").disabled = true; $("assinar").textContent = "Abrindo o Mercado Pago…";
  try {
    const r = await chamaAssinatura("assinar", { email });
    location.href = r.url;
  } catch (e) {
    AD.toast(e.message, 1);
    $("assinar").disabled = false; $("assinar").textContent = `Assinar por R$ ${AD_CONFIG.PRECO_MENSAL}/mês`;
  }
};
$("cancelar-ass").onclick = async () => {
  if (!confirm("Cancelar sua assinatura? Sua agenda e seu link de agendamento serão pausados.")) return;
  try { await chamaAssinatura("cancelar"); await sincronizaAssinatura(); AD.toast("Assinatura cancelada."); atualizaAvisos(); renderLink(); }
  catch (e) { AD.toast(e.message, 1); }
};
$("copiar").onclick = async () => {
  try { await navigator.clipboard.writeText($("meu-link").value); AD.toast("Link copiado!"); }
  catch { $("meu-link").select(); AD.toast("Selecione e copie o link."); }
};
$("e-ok").onclick = async () => {
  const upd = { nome: $("e-nome").value.trim(), profissao: $("e-prof").value.trim(), whatsapp: $("e-zap").value.replace(/\D/g, "") };
  if (upd.nome.length < 2) return AD.toast("Informe seu nome.", 1);
  const { data, error } = await sb.from("ad_profissionais").update(upd).eq("id", st.user.id).select().single();
  if (error) return AD.toast(AD.erro(error), 1);
  st.perfil = data; AD.toast("Perfil salvo!");
};

