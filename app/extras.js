// Nay Nails Gestão — configurações extras: atalhos, taxas, custos, fidelidade, aparência, PDF
"use strict";

// ---------- configuração do salão (ad_profissionais.config) ----------
const cfg = () => st.prof?.config || {};
async function salvaCfg(parcial) {
  const novo = { ...cfg(), ...parcial };
  await q(sb.from("ad_profissionais").update({ config: novo }).eq("id", st.prof.id));
  st.prof.config = novo;
  return novo;
}

// ---------- cor de cada serviço na agenda ----------
const CORES_SERV = ["#B08A4E", "#C46A7A", "#5E8C7A", "#6F7FB3", "#A06BB0", "#C9893F", "#4F9A9A", "#B5544A", "#7A8B4E", "#8C6B5A"];
function corServico(a) {
  const s = st.servicos.find((x) => x.id === a.servico_id) || st.servicos.find((x) => x.nome === a.servico_nome);
  return s?.cor || "var(--acc)";
}
function custoServico(a) {
  const s = st.servicos.find((x) => x.id === a.servico_id) || st.servicos.find((x) => x.nome === a.servico_nome);
  return Number(s?.custo_material || 0);
}

// ---------- taxas de cartão ----------
const taxaPct = (forma) => Number((cfg().taxas || {})[forma] || 0);
function telaTaxas() {
  const t = cfg().taxas || {};
  abreFolha(cabFolha("Taxas e custos", "O app desconta isso para mostrar o lucro real.") + `
    <div class="cartao"><h2>Taxa da maquininha (%)</h2>
      <p class="pequeno" style="margin:4px 0 6px">Quanto a operadora cobra em cada venda. Ex.: 3,5 para 3,5%.</p>
      <div class="grade2">
        <div><label class="f">Crédito</label><input class="campo" data-credito type="number" inputmode="decimal" step="0.01" min="0" value="${t.credito ?? ""}" placeholder="0"></div>
        <div><label class="f">Débito</label><input class="campo" data-debito type="number" inputmode="decimal" step="0.01" min="0" value="${t.debito ?? ""}" placeholder="0"></div>
      </div>
      <div class="grade2">
        <div><label class="f">Pix</label><input class="campo" data-pix type="number" inputmode="decimal" step="0.01" min="0" value="${t.pix ?? ""}" placeholder="0"></div>
        <div><label class="f">Outro</label><input class="campo" data-outro type="number" inputmode="decimal" step="0.01" min="0" value="${t.outro ?? ""}" placeholder="0"></div>
      </div>
    </div>
    <div class="cartao"><h2>Custo de material por serviço</h2>
      <p class="pequeno" style="margin:4px 0 8px">Quanto você gasta de material (esmalte, algodão, lixa, luva…) em cada atendimento.</p>
      ${st.servicos.map((s) => `<div class="linha" style="gap:10px;padding:6px 0;border-top:1px solid var(--line)"><span class="bola" style="background:${s.cor || "var(--acc)"}"></span><span class="cresce">${esc(s.nome)}<br><small class="mudo">${brl(s.preco)}</small></span><input class="campo" data-custo="${s.id}" type="number" inputmode="decimal" step="0.01" min="0" value="${Number(s.custo_material) || ""}" placeholder="R$ 0" style="width:100px"></div>`).join("")}
    </div>
    <button class="btn prim cheio" data-salvar>Salvar</button>`, (r) => {
    r.querySelector("[data-salvar]").onclick = async () => {
      const n = (k) => Number(r.querySelector(`[data-${k}]`).value || 0);
      await salvaCfg({ taxas: { credito: n("credito"), debito: n("debito"), pix: n("pix"), outro: n("outro") } });
      for (const inp of r.querySelectorAll("[data-custo]")) {
        const v = Number(inp.value || 0), s = st.servicos.find((x) => x.id === inp.dataset.custo);
        if (Number(s.custo_material) !== v) await q(sb.from("ad_servicos").update({ custo_material: v }).eq("id", s.id));
      }
      await carregaServicos(); toast("Taxas e custos salvos."); fechaFolha(); if (st.aba === "caixa") telaCaixa();
    };
  });
}

// ---------- atalhos personalizáveis do Início ----------
const ATALHOS = {
  novo: ["Agendar", "mais", () => novoAgendamento({})],
  agenda: ["Agenda", "agenda", () => vaiPara("agenda")],
  clientes: ["Clientes", "cliente", () => vaiPara("clientes")],
  financeiro: ["Financeiro", "dinheiro", () => vaiPara("caixa")],
  pagamento: ["Receber", "dinheiro", () => registraPagamento(null)],
  despesa: ["Despesa", "carrinho", () => novaDespesa()],
  esmaltes: ["Esmaltes", "esmalte", () => { st.estSeg = "esmaltes"; vaiPara("estoque"); }],
  estoque: ["Estoque", "caixa", () => { st.estSeg = "produtos"; vaiPara("estoque"); }],
  compras: ["Compras", "carrinho", () => registraCompra()],
  relatorios: ["Relatórios", "grafico", () => telaRelatorios()],
  bloquear: ["Bloquear", "bloqueio", () => novoBloqueio()],
  livres: ["Horários livres", "calendario", () => telaLivres()],
  fidelidade: ["Fidelidade", "estrela", () => telaFidelidade()],
  site: ["Meu link", "link", () => telaSite()],
  config: ["Ajustes", "engrenagem", () => vaiPara("mais")],
};
const ATALHOS_PADRAO = ["novo", "livres", "bloquear", "clientes", "financeiro", "esmaltes", "estoque", "relatorios"];
const meusAtalhos = () => (cfg().atalhos || ATALHOS_PADRAO).filter((k) => ATALHOS[k]);
function htmlAtalhos() {
  return meusAtalhos().map((k) => `<button class="atalho" data-atalho="${k}"><span>${IC[ATALHOS[k][1]] || IC.estrela}</span>${ATALHOS[k][0]}</button>`).join("");
}
function editaAtalhos() {
  let sel = [...meusAtalhos()];
  const desenha = (r) => {
    r.querySelector("[data-l]").innerHTML = Object.keys(ATALHOS).map((k) => { const i = sel.indexOf(k);
      return `<label class="item" style="cursor:pointer"><div class="ic">${IC[ATALHOS[k][1]] || IC.estrela}</div><div class="cresce"><b>${ATALHOS[k][0]}</b>${i >= 0 ? `<div class="pequeno">Posição ${i + 1}</div>` : ""}</div><input type="checkbox" data-k="${k}" ${i >= 0 ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--acc)"></label>`; }).join("");
    r.querySelectorAll("[data-k]").forEach((c) => (c.onchange = () => {
      if (c.checked) { if (sel.length >= 8) { c.checked = false; return toast("Escolha no máximo 8.", 1); } sel.push(c.dataset.k); } else sel = sel.filter((x) => x !== c.dataset.k);
      desenha(r);
    }));
  };
  abreFolha(cabFolha("Seus atalhos", "Marque até 8, na ordem que quiser que apareçam.") + `<div class="lista" data-l></div>
    <div class="grade2"><button class="btn" data-padrao>Voltar ao padrão</button><button class="btn prim" data-salvar>Salvar</button></div>`, (r) => {
    desenha(r);
    r.querySelector("[data-padrao]").onclick = () => { sel = [...ATALHOS_PADRAO]; desenha(r); };
    r.querySelector("[data-salvar]").onclick = async () => { if (!sel.length) return toast("Escolha pelo menos um.", 1); await salvaCfg({ atalhos: sel }); toast("Atalhos salvos."); fechaFolha(); if (st.aba === "inicio") telaInicio(); };
  });
}

// ---------- fidelidade ----------
const FID_PADRAO = { ativo: false, a_cada: 5, recompensa: "Uma esmaltação grátis", aniversario: "10% de desconto no mês do seu aniversário", indicacao: "R$ 10 de desconto para você e para a amiga indicada" };
const fid = () => ({ ...FID_PADRAO, ...(cfg().fidelidade || {}) });
function telaFidelidade() {
  const f = fid();
  abreFolha(cabFolha("Programa de fidelidade", "Você escolhe as regras. O app conta os atendimentos sozinho.") + `
    <div class="cartao">
      <label class="interruptor"><span><b>Programa ativo</b><span class="pequeno" style="display:block">Mostra o cartão fidelidade na ficha de cada cliente.</span></span><input type="checkbox" data-ativo ${f.ativo ? "checked" : ""}></label>
      <label class="f">A cada quantos atendimentos a cliente ganha?</label>
      <div class="opcoes" data-n>${[3, 4, 5, 6, 8, 10].map((n) => `<button type="button" data-v="${n}" class="${n === Number(f.a_cada) ? "on" : ""}">${n}</button>`).join("")}</div>
      <label class="f">O que ela ganha</label><input class="campo" data-rec value="${esc(f.recompensa)}">
      <label class="f">Cupom de aniversário</label><input class="campo" data-aniv value="${esc(f.aniversario)}">
      <label class="f">Prêmio por indicar uma amiga</label><input class="campo" data-ind value="${esc(f.indicacao)}">
    </div>
    <div class="cartao calmo"><b>Exemplo</b><p class="pequeno" style="margin-top:4px" data-ex></p></div>
    <button class="btn prim cheio" data-salvar>Salvar regras</button>`, (r) => {
    let n = Number(f.a_cada);
    const ex = () => (r.querySelector("[data-ex]").textContent = `A cada ${n} atendimentos concluídos, a cliente ganha: ${r.querySelector("[data-rec]").value || "—"}.`);
    r.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { n = Number(b.dataset.v); r.querySelectorAll("[data-v]").forEach((x) => x.classList.toggle("on", x === b)); ex(); }));
    r.querySelector("[data-rec]").oninput = ex; ex();
    r.querySelector("[data-salvar]").onclick = async () => {
      await salvaCfg({ fidelidade: { ativo: r.querySelector("[data-ativo]").checked, a_cada: n, recompensa: r.querySelector("[data-rec]").value.trim() || FID_PADRAO.recompensa,
        aniversario: r.querySelector("[data-aniv]").value.trim(), indicacao: r.querySelector("[data-ind]").value.trim() } });
      toast("Regras de fidelidade salvas. 💛"); fechaFolha();
    };
  });
}
// Situação do cartão de uma cliente: carimbos atuais e se tem prêmio para resgatar
function situacaoFid(c) {
  const f = fid(), n = Math.max(1, Number(f.a_cada)), res = Number(c.resgates || 0);
  const disponiveis = Math.max(0, Math.floor(c.visitas / n) - res);
  const carimbos = disponiveis > 0 ? n : Math.max(0, Math.min(n, c.visitas - res * n));
  return { f, n, disponiveis, carimbos };
}
function htmlFidelidade(c) {
  const s = situacaoFid(c);
  if (!s.f.ativo) return "";
  const pontos = Array.from({ length: s.n }, (_, i) => `<span class="carimbo ${i < s.carimbos ? "on" : ""}">${i < s.carimbos ? "✓" : i + 1}</span>`).join("");
  return `<div class="cartao fid">
    <div class="linha entre"><b>Cartão fidelidade</b><span class="pequeno">${s.disponiveis ? "🎁 prêmio disponível" : `${s.carimbos} de ${s.n}`}</span></div>
    <div class="carimbos">${pontos}</div>
    <p class="pequeno" style="margin:8px 0 0">${s.disponiveis ? `Ela ganhou: <b>${esc(s.f.recompensa)}</b>` : `Faltam ${s.n - s.carimbos} atendimento${s.n - s.carimbos !== 1 ? "s" : ""} para: ${esc(s.f.recompensa)}`}</p>
    ${s.disponiveis ? `<button class="btn prim cheio" data-resgatar style="margin-top:10px">Entregar prêmio</button>` : ""}
    <div class="grade2" style="margin-top:8px">
      ${s.f.aniversario && c.aniversario ? `<a class="btn claro mini" target="_blank" rel="noopener" href="https://wa.me/${zapNum(c.whatsapp)}?text=${encodeURIComponent(`Feliz aniversário, ${primeiroNome(c.nome)}! 🎂💅 Seu presente da Nayara: ${s.f.aniversario}. Agende: ${SITE}`)}">Cupom aniversário</a>` : ""}
      ${s.f.indicacao ? `<a class="btn claro mini" target="_blank" rel="noopener" href="https://wa.me/${zapNum(c.whatsapp)}?text=${encodeURIComponent(`Oi, ${primeiroNome(c.nome)}! 💗 Indique uma amiga para a Nayara: ${s.f.indicacao}. É só ela agendar por aqui e dizer seu nome: ${SITE}`)}">Indicar amiga</a>` : ""}
    </div></div>`;
}
async function resgataFid(c) {
  const s = situacaoFid(c);
  if (!confirm(`Entregar "${s.f.recompensa}" para ${c.nome}?`)) return false;
  await q(sb.from("ad_clientes").update({ resgates: Number(c.resgates || 0) + 1 }).eq("id", c.id));
  await q(sb.from("ad_fidelidade").insert({ profissional_id: st.prof.id, cliente_id: c.id, tipo: "resgate", descricao: s.f.recompensa }));
  festa(); toast("Prêmio entregue! 🎁"); return true;
}

// ---------- aparência: cor de destaque e fonte ----------
const ACENTOS = {
  dourado: ["Dourado", "#B08A4E", "#9A7540", "#F5ECDD", "176,138,78", "#C9A86A", "#E2C48E"],
  rose: ["Rosé", "#B9707E", "#9C5563", "#F6E6E9", "185,112,126", "#D79AA6", "#EBB8C2"],
  bordo: ["Bordô", "#8E3B4A", "#7A2F3D", "#F3E3E6", "142,59,74", "#C07A87", "#D9A0AB"],
  terracota: ["Terracota", "#B4673F", "#985332", "#F7E9E1", "180,103,63", "#D08B63", "#E8B396"],
  oliva: ["Oliva", "#7D8450", "#666C3F", "#EEF0E2", "125,132,80", "#A3AA73", "#C7CC9E"],
  azul: ["Azul-petróleo", "#3F7A80", "#2F6268", "#E2EFF0", "63,122,128", "#6BA7AD", "#9DCACE"],
};
const FONTES = {
  manrope: ["Manrope (padrão)", "Manrope", ""],
  inter: ["Inter", "Inter", "Inter:wght@400;500;600;700;800"],
  nunito: ["Nunito (arredondada)", "Nunito", "Nunito:wght@400;600;700;800"],
  lora: ["Lora (elegante)", "Lora", "Lora:wght@400;500;600;700"],
};
function aplicaVisual() {
  const ac = ACENTOS[localStorage.getItem("nay.acento") || "dourado"] || ACENTOS.dourado;
  const fo = FONTES[localStorage.getItem("nay.fonte") || "manrope"] || FONTES.manrope;
  const escuro = document.documentElement.dataset.tema === "escuro";
  let el = $("estilo-visual"); if (!el) { el = document.createElement("style"); el.id = "estilo-visual"; document.head.appendChild(el); }
  el.textContent = `:root, [data-tema] { --acc:${escuro ? ac[5] : ac[1]}; --ouro:${escuro ? ac[6] : ac[2]}; --acc2:${escuro ? `rgba(${ac[4]},.14)` : ac[3]}; --ouro2:${escuro ? `rgba(${ac[4]},.12)` : ac[3]}; --accRGB:${ac[4]}; --grad:${escuro ? ac[5] : ac[1]}; --gradOuro:${ac[5]}; --escuroOuro:${ac[6]}; ${escuro ? `--btn:${ac[5]};` : ""} }
    ${fo[1] !== "Manrope" ? `body, button, input, select, textarea { font-family: "${fo[1]}", system-ui, sans-serif; }` : ""}`;
  if (fo[2] && !document.querySelector(`link[data-fonte="${fo[1]}"]`)) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.fonte = fo[1];
    l.href = `https://fonts.googleapis.com/css2?family=${fo[2]}&display=swap`; document.head.appendChild(l);
  }
}
function telaAparencia() {
  const ac = localStorage.getItem("nay.acento") || "dourado", fo = localStorage.getItem("nay.fonte") || "manrope";
  abreFolha(cabFolha("Aparência", "Muda só neste celular.") + `
    <div class="cartao"><h2>Tema</h2><div class="seg" style="margin:10px 0 0">${[["claro", "Claro"], ["escuro", "Escuro"]].map(([k, n]) => `<button data-t="${k}" class="${temaAtual() === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="cartao"><h2>Cor de destaque</h2><div class="cores-tema">${Object.entries(ACENTOS).map(([k, v]) => `<button data-a="${k}" class="${ac === k ? "on" : ""}"><i style="background:${v[1]}"></i>${v[0]}</button>`).join("")}</div></div>
    <div class="cartao"><h2>Tipo de letra</h2><p class="pequeno" style="margin:4px 0 8px">Muda o desenho das letras em todo o app. Toque para ver como fica.</p><div class="lista">${Object.entries(FONTES).map(([k, v]) => `<button class="item" data-f="${k}"><div class="cresce"><b style="font-family:'${v[1]}',system-ui;font-size:17px">${v[0]}</b><div class="pequeno" style="font-family:'${v[1]}',system-ui">Exemplo: Bom dia, Nayara! 💅</div></div>${fo === k ? '<span class="chip confirmado">Em uso</span>' : ""}</button>`).join("")}</div></div>`, (r) => {
    Object.values(FONTES).forEach((v) => { if (v[2] && !document.querySelector(`link[data-fonte="${v[1]}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.fonte = v[1]; l.href = `https://fonts.googleapis.com/css2?family=${v[2]}&display=swap`; document.head.appendChild(l); } });
    r.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { aplicaTema(b.dataset.t); aplicaVisual(); telaAparencia(); }));
    r.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => { localStorage.setItem("nay.acento", b.dataset.a); aplicaVisual(); telaAparencia(); }));
    r.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { localStorage.setItem("nay.fonte", b.dataset.f); aplicaVisual(); telaAparencia(); }));
  });
}

// ---------- foto da cliente ----------
async function fotoCliente(arquivo) {
  const img = await carregaImagem(arquivo);
  const W = img.naturalWidth, H = img.naturalHeight, lado = Math.min(W, H);
  const cv = paraCanvas(img, 400, [(W - lado) / 2, (H - lado) / 2, lado, lado]);
  return enviaFoto(cv);
}
const avatarCli = (c, tam = 42) => c.foto_url
  ? `<img src="${esc(c.foto_url)}" alt="" class="avatar" style="width:${tam}px;height:${tam}px;object-fit:cover;padding:0">`
  : `<div class="avatar" style="width:${tam}px;height:${tam}px">${esc(iniciais(c.nome))}</div>`;

// ---------- salvar em PDF (impressão da janela aberta) ----------
function salvaPDF(titulo) {
  document.body.classList.add("imprimindo");
  const antes = document.title; document.title = titulo || "Nay Nails Gestão";
  setTimeout(() => { print(); document.title = antes; document.body.classList.remove("imprimindo"); }, 100);
}

// =====================================================================
// AGENDAMENTO RECORRENTE
// =====================================================================
const REPETE = [["nao", "Não repete"], ["semana", "Toda semana"], ["2semanas", "A cada 2 semanas"], ["mes", "Todo mês"], ["dia", "Todo dia"], ["dias", "Dias da semana"], ["datas", "Datas específicas"]];
const SEM_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const diasEntre = (a, b) => Math.round((Date.UTC(...b.split("-").map((n, i) => i === 1 ? n - 1 : +n)) - Date.UTC(...a.split("-").map((n, i) => i === 1 ? n - 1 : +n))) / 864e5);
const semanaDe = (iso) => new Date(iso + "T12:00:00Z").getUTCDay();
function somaMes(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const alvo = new Date(Date.UTC(y, m - 1 + n, 1)); const ult = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ult)); return alvo.toISOString().slice(0, 10);
}

function htmlRepetir() {
  return `<label class="f">Repetir</label>
    <select class="campo" data-rep>${REPETE.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>
    <div class="hide" data-rep-dias style="margin-top:10px"><div class="opcoes">${SEM_CURTO.map((t, i) => `<button type="button" data-sem="${i}">${t}</button>`).join("")}</div></div>
    <div class="hide" data-rep-datas style="margin-top:10px">
      <div style="display:flex;gap:8px"><input class="campo" type="date" data-nova-data min="${isoDia()}"><button type="button" class="btn claro" data-add-data style="flex:none">Adicionar</button></div>
      <div class="opcoes" data-lista-datas style="margin-top:8px"></div>
    </div>
    <div class="hide" data-rep-fim>
      <label class="f">Termina</label>
      <div class="seg" data-fim-tipo><button type="button" class="on" data-v="vezes">Depois de</button><button type="button" data-v="data">Em uma data</button></div>
      <div data-fim-vezes style="display:flex;align-items:center;gap:10px"><input class="campo" type="number" min="2" max="60" value="8" data-vezes style="width:110px"><span>vezes</span></div>
      <div class="hide" data-fim-data><input class="campo" type="date" data-ate min="${isoDia()}"></div>
    </div>
    <p class="pequeno hide" data-rep-prev style="margin-top:10px;padding:10px 12px;background:var(--soft);border-radius:12px"></p>`;
}

// liga os controles; primeiro() devolve o ISO do 1º horário (ou null)
function ligaRepetir(r, primeiro) {
  const $ = (s) => r.querySelector(s);
  const sems = new Set(), extras = new Set(); let fimTipo = "vezes";
  const tipo = () => $("[data-rep]").value;
  const ocorrencias = () => {
    const p = primeiro(); if (!p) return [];
    const base = isoDia(p), t = tipo(), out = [base];
    if (t === "nao") return [p];
    if (t === "datas") [...extras].filter((d) => d > base).sort().forEach((d) => out.push(d));
    else {
      const max = fimTipo === "vezes" ? Math.max(2, Math.min(60, Number($("[data-vezes]").value) || 2)) : 60;
      const ate = fimTipo === "data" ? $("[data-ate]").value : null;
      if (fimTipo === "data" && !ate) return [p];
      let i = 0, d = base;
      while (out.length < max && i < 400) {
        i++;
        d = t === "dia" || t === "dias" ? somaDias(base, i) : t === "semana" ? somaDias(base, i * 7) : t === "2semanas" ? somaDias(base, i * 14) : somaMes(base, i);
        if (ate && d > ate) break;
        if (t === "dias" && !sems.has(semanaDe(d))) continue;
        out.push(d);
      }
    }
    return out.map((d) => new Date(new Date(p).getTime() + diasEntre(base, d) * 864e5).toISOString());
  };
  const regra = () => {
    const t = tipo(), h = primeiro() ? hora(primeiro()) : "";
    if (t === "dias") return `${[...sems].sort().map((i) => SEM_CURTO[i]).join(", ")} às ${h}`;
    if (t === "datas") return "Datas específicas";
    return `${REPETE.find((x) => x[0] === t)[1]} às ${h}`;
  };
  const prev = () => {
    const t = tipo(), el = $("[data-rep-prev]");
    $("[data-rep-dias]").classList.toggle("hide", t !== "dias");
    $("[data-rep-datas]").classList.toggle("hide", t !== "datas");
    $("[data-rep-fim]").classList.toggle("hide", t === "nao" || t === "datas");
    if (t === "nao") return el.classList.add("hide");
    el.classList.remove("hide");
    const oc = ocorrencias();
    if (!primeiro()) { el.textContent = "Escolha o dia e o horário do primeiro atendimento."; return; }
    if (oc.length < 2) { el.textContent = t === "datas" ? "Adicione as outras datas." : t === "dias" ? "Toque nos dias da semana." : "Escolha quando a série termina."; return; }
    const lista = oc.slice(0, 6).map((x) => `${SEM_CURTO[semanaDe(isoDia(x))]} ${dataCurta(x)}`).join(" · ");
    el.innerHTML = `🔁 Serão criados <b>${oc.length} horários</b> às ${hora(oc[0])}:<br>${lista}${oc.length > 6 ? ` … até ${dataCurta(oc[oc.length - 1])}` : ""}`;
  };
  $("[data-rep]").onchange = () => {
    if (tipo() === "dias" && !sems.size && primeiro()) { sems.add(semanaDe(isoDia(primeiro()))); r.querySelector(`[data-sem="${semanaDe(isoDia(primeiro()))}"]`).classList.add("on"); }
    prev();
  };
  r.querySelectorAll("[data-sem]").forEach((b) => (b.onclick = () => { const i = +b.dataset.sem; sems.has(i) ? sems.delete(i) : sems.add(i); b.classList.toggle("on", sems.has(i)); prev(); }));
  r.querySelectorAll("[data-fim-tipo] button").forEach((b) => (b.onclick = () => {
    fimTipo = b.dataset.v; r.querySelectorAll("[data-fim-tipo] button").forEach((x) => x.classList.toggle("on", x === b));
    $("[data-fim-vezes]").classList.toggle("hide", fimTipo !== "vezes"); $("[data-fim-data]").classList.toggle("hide", fimTipo !== "data"); prev();
  }));
  $("[data-vezes]").oninput = prev; $("[data-ate]").onchange = prev;
  const desenhaDatas = () => {
    $("[data-lista-datas]").innerHTML = [...extras].sort().map((d) => `<button type="button" class="on" data-tira="${d}">${dataCurta(d + "T12:00:00-03:00")} ✕</button>`).join("");
    r.querySelectorAll("[data-tira]").forEach((b) => (b.onclick = () => { extras.delete(b.dataset.tira); desenhaDatas(); prev(); }));
  };
  $("[data-add-data]").onclick = () => { const v = $("[data-nova-data]").value; if (!v) return toast("Escolha a data.", 1); extras.add(v); $("[data-nova-data]").value = ""; desenhaDatas(); prev(); };
  return { ocorrencias, regra, atualiza: prev, repete: () => tipo() !== "nao" };
}

// cria a série pulando horários que já têm cliente
async function salvaSerie(linhaBase, inicios, minutos, regra) {
  const fins = inicios.map((i) => new Date(new Date(i).getTime() + minutos * 60000).toISOString());
  const ocupados = await q(sb.from("ad_agendamentos").select("inicio,fim").in("status", ATIVOS).lt("inicio", fins[fins.length - 1]).gt("fim", inicios[0]));
  const bate = (i) => ocupados.some((o) => new Date(o.inicio) < new Date(fins[i]) && new Date(o.fim) > new Date(inicios[i]));
  const livres = inicios.map((x, i) => i).filter((i) => !bate(i)), choques = inicios.filter((x, i) => bate(i));
  if (choques.length && !confirm(`${choques.length} data(s) já têm cliente nesse horário:\n${choques.map(dataCurta).join(", ")}\n\nCriar as outras ${livres.length} e pular essas?`)) return null;
  if (!livres.length) { toast("Todos esses horários já estão ocupados.", 1); return null; }
  const serie = crypto.randomUUID();
  const linhas = livres.map((i) => ({ ...linhaBase, inicio: inicios[i], fim: fins[i], serie_id: serie, serie_regra: regra }));
  const { error } = await sb.from("ad_agendamentos").insert(linhas);
  if (error) { toast(erroMsg(error), 1); return null; }
  return linhas;
}

function msgSerie(a, linhas) {
  const n = primeiroNome(a.cliente_nome);
  const datas = linhas.map((l) => `• ${diaSemana(l.inicio).slice(0, 3)} ${dataCurta(l.inicio)} às ${hora(l.inicio)}`).join("\n");
  return `Olá, ${n}! 💅 Seus horários fixos de *${a.servico_nome}* estão confirmados (${linhas[0].serie_regra.toLowerCase()}):\n\n${datas}\n\n⚠️ *Política de cancelamento:* cancelamentos com menos de 24h de antecedência têm taxa de 100% do valor do serviço.\n\nAté lá! Nayara Fernandes · Nails e cuidados`;
}

// cancela este e os próximos da série
async function cancelaSerie(a) {
  const prox = await q(sb.from("ad_agendamentos").select("id,inicio").eq("serie_id", a.serie_id).in("status", ATIVOS).gte("inicio", a.inicio).order("inicio"));
  if (!prox.length) return toast("Não há próximos horários nesta série.", 1);
  if (!confirm(`Cancelar ${prox.length} horário(s) desta série, de ${dataCurta(prox[0].inicio)} até ${dataCurta(prox[prox.length - 1].inicio)}?`)) return;
  const { error } = await sb.from("ad_agendamentos").update({ status: "cancelado" }).in("id", prox.map((p) => p.id));
  if (error) return toast(erroMsg(error), 1);
  toast(`${prox.length} horário(s) cancelados.`); fechaFolha(); atualizaTela();
}

// =====================================================================
// HORÁRIO DE ALMOÇO
// =====================================================================
const almoco = () => ({ ativo: true, ini: "12:00", fim: "13:30", ...(cfg().almoco || {}) });
const minDe = (h) => { const [a, b] = h.slice(0, 5).split(":").map(Number); return a * 60 + b; };
const hDe = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// junta o buraco do almoço antigo e abre o novo, dia a dia
function aplicaAlmoco(horarios, antigo, novo) {
  const out = [];
  for (let d = 0; d < 7; d++) {
    let iv = horarios.filter((h) => h.dia_semana === d).map((h) => [minDe(h.inicio), minDe(h.fim)]).sort((a, b) => a[0] - b[0]);
    if (!iv.length) continue;
    if (antigo?.ativo) {
      const ai = minDe(antigo.ini), af = minDe(antigo.fim), j = [];
      for (const x of iv) { const u = j[j.length - 1]; if (u && u[1] === ai && x[0] === af) u[1] = x[1]; else j.push([...x]); }
      iv = j;
    }
    if (novo?.ativo) {
      const ni = minDe(novo.ini), nf = minDe(novo.fim), s = [];
      for (const [a, b] of iv) {
        if (nf <= a || ni >= b) { s.push([a, b]); continue; }
        if (ni > a) s.push([a, ni]);
        if (nf < b) s.push([nf, b]);
      }
      iv = s;
    }
    iv.filter(([a, b]) => b - a >= 15).forEach(([a, b]) => out.push({ dia_semana: d, inicio: hDe(a), fim: hDe(b) }));
  }
  return out;
}

function htmlAlmocoCartao() {
  const a = almoco();
  return `<div class="cartao"><h2>🍽️ Horário de almoço</h2><p class="pequeno">Nesse horário ninguém consegue marcar (nem no site, nem no app) e ele aparece na sua agenda.</p>
    <label class="linha" style="gap:10px;margin:10px 0"><input type="checkbox" data-alm-on ${a.ativo ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--ouro)"><b>Ter horário de almoço</b></label>
    <div class="linha" style="gap:8px"><input class="campo" type="time" data-alm-ini value="${a.ini}"><span>às</span><input class="campo" type="time" data-alm-fim value="${a.fim}"></div>
    <button class="btn ouro cheio" data-alm-salvar style="margin-top:12px">Salvar almoço</button></div>`;
}

function ligaAlmoco(r, recarrega) {
  r.querySelector("[data-alm-salvar]").onclick = async () => {
    const novo = { ativo: r.querySelector("[data-alm-on]").checked, ini: r.querySelector("[data-alm-ini]").value, fim: r.querySelector("[data-alm-fim]").value };
    if (novo.ativo && (!novo.ini || !novo.fim || novo.fim <= novo.ini)) return toast("O fim do almoço precisa ser depois do início.", 1);
    const antigo = almoco();
    const hs = await q(sb.from("ad_horarios").select("dia_semana,inicio,fim"));
    const novos = aplicaAlmoco(hs, antigo, novo);
    await q(sb.from("ad_horarios").delete().eq("profissional_id", st.prof.id));
    if (novos.length) await q(sb.from("ad_horarios").insert(novos.map((h) => ({ ...h, profissional_id: st.prof.id }))));
    await salvaCfg({ almoco: novo });
    toast(novo.ativo ? `Almoço das ${novo.ini} às ${novo.fim} salvo.` : "Horário de almoço desligado.");
    recarrega?.();
  };
}

// cartão do almoço na agenda do dia (só em dia de trabalho, se cair dentro do expediente)
async function cartaoAlmocoDia(diaIso) {
  const a = almoco(); if (!a.ativo) return null;
  const dow = new Date(diaIso + "T12:00:00Z").getUTCDay();
  const hs = (await q(sb.from("ad_horarios").select("inicio,fim").eq("dia_semana", dow)));
  if (!hs.length) return null;
  const ini = Math.min(...hs.map((h) => minDe(h.inicio))), fim = Math.max(...hs.map((h) => minDe(h.fim)));
  if (minDe(a.fim) <= ini || minDe(a.ini) >= fim) return null;
  return { t: new Date(`${diaIso}T${a.ini}:00-03:00`).getTime(), html: `<div class="ag" style="cursor:default;background:repeating-linear-gradient(135deg,var(--nude) 0 10px,transparent 10px 20px);border-style:dashed"><div class="h">${a.ini}<small>até ${a.fim}</small></div><div><div class="n">🍽️ Horário de almoço</div><div class="s">Bloqueado para agendamentos</div></div></div>` };
}

// =====================================================================
// HORÁRIOS LIVRES (compartilhar lista + encontrar um horário)
// =====================================================================
const SEM_LONGO = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const MES_CURTO = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
const rotDia = (d) => { const x = new Date(d + "T12:00:00Z"); return [SEM_LONGO[x.getUTCDay()], `${x.getUTCDate()} de ${MES_CURTO[x.getUTCMonth()]}`]; };

async function livresPeriodo(de, ate, min) {
  const n = Math.min(62, diasEntre(de, ate) + 1);
  const dias = Array.from({ length: n }, (_, i) => somaDias(de, i));
  const res = await Promise.all(dias.map((d) => livres(d, min)));
  return dias.map((d, i) => ({ d, hs: res[i].map(hora) })).filter((x) => x.hs.length);
}

function telaLivres(aba = "compartilhar") {
  const servs = st.servicos.filter((s) => s.ativo);
  const padrao = servs.find((s) => /^p[ée] e m[ãa]o$/i.test(s.nome)) || servs[0];
  let servId = padrao?.id, de = isoDia(), ate = somaDias(isoDia(), 9), mes = isoDia().slice(0, 7), diaSel = null, lista = [];
  const serv = () => servs.find((s) => s.id === servId);
  abreFolha(cabFolha("Horários livres", "Mande para as clientes ou encontre um horário para encaixar.") + `
    <div class="seg" data-abas style="margin-bottom:12px"><button data-aba="compartilhar">Compartilhar</button><button data-aba="encontrar">Encontrar horário</button></div>
    <div class="cartao"><label class="f" style="margin-top:0">Serviço (define o tempo de cada horário)</label>
      <select class="campo" data-sv>${servs.map((s) => `<option value="${s.id}" ${s.id === servId ? "selected" : ""}>${esc(s.nome)} · ${dur(s.duracao_min)}</option>`).join("")}</select></div>
    <div data-corpo></div>`, (r) => {
    const corpo = r.querySelector("[data-corpo]");
    const abas = () => r.querySelectorAll("[data-aba]").forEach((b) => b.classList.toggle("on", b.dataset.aba === aba));

    async function compartilhar() {
      corpo.innerHTML = `<div class="cartao"><div class="grade2"><div><label class="f" style="margin-top:0">De</label><input class="campo" type="date" data-de value="${de}" min="${isoDia()}" style="min-width:0;width:100%"></div><div><label class="f" style="margin-top:0">Até</label><input class="campo" type="date" data-ate value="${ate}" min="${isoDia()}" style="min-width:0;width:100%"></div></div>
        <div class="opcoes" style="margin-top:10px"><button data-p="6">Esta semana</button><button data-p="13">2 semanas</button><button data-p="29">30 dias</button></div></div>
        <div data-prev><p class="mudo" style="text-align:center;padding:20px">Carregando horários…</p></div>`;
      corpo.querySelector("[data-de]").onchange = (e) => { de = e.target.value; if (ate < de) ate = de; compartilhar(); };
      corpo.querySelector("[data-ate]").onchange = (e) => { ate = e.target.value < de ? de : e.target.value; compartilhar(); };
      corpo.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { de = isoDia(); ate = somaDias(de, +b.dataset.p); compartilhar(); }));
      lista = await livresPeriodo(de, ate, serv()?.duracao_min || 60);
      const prev = corpo.querySelector("[data-prev]");
      prev.innerHTML = `<div class="cartao" style="padding:0;overflow:hidden">
          <div style="background:linear-gradient(135deg,#1F2A1C,#3A4A2E);color:#F4EBDD;padding:16px;display:flex;gap:12px;align-items:center">
            <img src="../nayara/logo.jpg" alt="" style="width:52px;height:52px;border-radius:50%;border:2px solid #C9A86A;object-fit:cover">
            <div class="cresce"><b style="font-size:17px">${esc(st.prof.nome || "")}</b><div style="font-size:12.5px;opacity:.85">${st.prof.whatsapp ? fmtTel(st.prof.whatsapp) : ""}</div></div>
            <span style="background:#C9A86A;color:#1B1608;border-radius:20px;padding:6px 12px;font-weight:700;font-size:12.5px">Agende já!</span></div>
          <div style="padding:12px 16px"><b>Horários disponíveis</b> <span class="pequeno">· ${esc(serv()?.nome || "")}</span>
          ${lista.length ? lista.map((x) => { const [s, d] = rotDia(x.d); return `<div style="display:grid;grid-template-columns:86px 1fr;gap:8px;padding:9px 0;border-top:1px solid var(--linha)"><div><b>${s}</b><div class="pequeno">${d}</div></div><div style="font-variant-numeric:tabular-nums;line-height:1.7">${x.hs.join("&nbsp;&nbsp; ")}</div></div>`; }).join("") : `<p class="mudo" style="padding:12px 0">Nenhum horário livre nesse período.</p>`}</div></div>
        ${lista.length ? `<button class="btn ouro cheio" data-img>${IC.baixar || ""}Compartilhar imagem</button><button class="btn claro cheio" data-txt style="margin-top:8px">Copiar texto para o WhatsApp</button>` : ""}`;
      prev.querySelector("[data-img]")?.addEventListener("click", compartilhaImagem);
      prev.querySelector("[data-txt]")?.addEventListener("click", async () => {
        const txt = `✨ *Horários disponíveis — ${st.prof.nome}*\n_${serv()?.nome}_\n\n` + lista.map((x) => { const [s, d] = rotDia(x.d); return `*${s} ${d}*\n${x.hs.join(" · ")}`; }).join("\n\n") + `\n\n📲 Agende pelo link: ${location.origin}/nayara/`;
        try { await navigator.clipboard.writeText(txt); toast("Texto copiado! É só colar no WhatsApp."); }
        catch { abreZap(`https://wa.me/?text=${encodeURIComponent(txt)}`); }
      });
    }

    async function compartilhaImagem() {
      const W = 1080, lh = 64, top = 330;
      const linhas = lista.map((x) => { const parts = []; for (let i = 0; i < x.hs.length; i += 6) parts.push(x.hs.slice(i, i + 6).join("    ")); return { x, parts }; });
      const H = Math.max(1080, top + 90 + linhas.reduce((s, l) => s + Math.max(2, l.parts.length) * lh + 24, 0) + 170);
      const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
      g.fillStyle = "#F7F2E8"; g.fillRect(0, 0, W, H);
      const gr = g.createLinearGradient(0, 0, W, 300); gr.addColorStop(0, "#1F2A1C"); gr.addColorStop(1, "#3A4A2E"); g.fillStyle = gr; g.fillRect(0, 0, W, 290);
      const logo = new Image(); logo.src = "../nayara/logo.jpg"; await new Promise((ok) => { logo.onload = ok; logo.onerror = ok; });
      g.save(); g.beginPath(); g.arc(150, 145, 95, 0, 7); g.closePath(); g.clip(); try { g.drawImage(logo, 55, 50, 190, 190); } catch {} g.restore();
      g.strokeStyle = "#C9A86A"; g.lineWidth = 6; g.beginPath(); g.arc(150, 145, 95, 0, 7); g.stroke();
      g.fillStyle = "#F4EBDD"; g.font = "700 54px system-ui, sans-serif"; g.fillText(st.prof.nome || "", 280, 125);
      g.font = "400 34px system-ui, sans-serif"; g.globalAlpha = .85; g.fillText(st.prof.whatsapp ? fmtTel(st.prof.whatsapp) : "Nails e cuidados", 280, 180); g.globalAlpha = 1;
      g.fillStyle = "#C9A86A"; g.font = "700 32px system-ui, sans-serif"; g.fillText(`Horários disponíveis · ${serv()?.nome || ""}`, 280, 232);
      let y = top + 20;
      g.fillStyle = "#1F2A1C"; g.font = "700 44px system-ui, sans-serif"; g.fillText("Horário disponível:", 60, y); y += 40;
      for (const { x, parts } of linhas) {
        g.strokeStyle = "#E3D9C6"; g.lineWidth = 2; g.beginPath(); g.moveTo(60, y); g.lineTo(W - 60, y); g.stroke(); y += 58;
        const [s, d] = rotDia(x.d);
        g.fillStyle = "#1F2A1C"; g.font = "700 40px system-ui, sans-serif"; g.fillText(s, 60, y);
        g.font = "400 32px system-ui, sans-serif"; g.fillStyle = "#6B6355"; g.fillText(d, 60, y + 44);
        g.fillStyle = "#1F2A1C"; g.font = "500 38px system-ui, sans-serif";
        parts.forEach((p, i) => g.fillText(p, 300, y + i * lh));
        y += Math.max(2, parts.length) * lh - 30;
      }
      g.fillStyle = "#C9A86A"; g.beginPath(); g.roundRect(60, H - 140, W - 120, 92, 46); g.fill();
      g.fillStyle = "#1B1608"; g.font = "700 38px system-ui, sans-serif"; g.textAlign = "center";
      g.fillText(`Agende: ${location.host}/nayara`, W / 2, H - 80); g.textAlign = "left";
      const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
      const arq = new File([blob], "horarios-disponiveis.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [arq] })) { try { await navigator.share({ files: [arq], title: "Horários disponíveis" }); return; } catch (e) { if (e.name === "AbortError") return; } }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = arq.name; a.click(); toast("Imagem salva. Agora é só enviar.");
    }

    async function encontrar() {
      const [y, m] = mes.split("-").map(Number);
      const ini = `${mes}-01`, nDias = new Date(Date.UTC(y, m, 0)).getUTCDate(), fimMes = `${mes}-${String(nDias).padStart(2, "0")}`;
      const nomeMes = cap(new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }));
      corpo.innerHTML = `<div class="cartao"><div class="navdia" style="margin:0 0 8px"><button class="redondo" data-m="-1" ${mes <= isoDia().slice(0, 7) ? "disabled" : ""}>‹</button><div class="cresce">${nomeMes}<small>Dias em verde têm horário livre</small></div><button class="redondo" data-m="1">›</button></div>
        <div class="mes" data-cal><p class="mudo" style="grid-column:1/-1;text-align:center;padding:20px">Procurando horários…</p></div></div><div data-slotsdia></div>`;
      corpo.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { const d = new Date(Date.UTC(y, m - 1 + +b.dataset.m, 1)); mes = d.toISOString().slice(0, 7); diaSel = null; encontrar(); }));
      const deDia = ini < isoDia() ? isoDia() : ini;
      const disp = deDia <= fimMes ? await livresPeriodo(deDia, fimMes, serv()?.duracao_min || 60) : [];
      const tem = Object.fromEntries(disp.map((x) => [x.d, x.hs]));
      const iniSem = new Date(ini + "T12:00:00Z").getUTCDay();
      let cel = SEM3.map((s) => `<div class="cab">${s}</div>`).join("") + Array(iniSem).fill("<div></div>").join("");
      for (let d = 1; d <= nDias; d++) {
        const iso = `${mes}-${String(d).padStart(2, "0")}`, ok = !!tem[iso];
        cel += `<button data-dia="${iso}" ${ok ? "" : "disabled"} style="${ok ? "color:#2E7D4F;font-weight:800" : "opacity:.35"}${iso === diaSel ? ";background:#2E7D4F;color:#fff;border-radius:50%" : ""}">${d}<i>${ok ? tem[iso].length : ""}</i></button>`;
      }
      corpo.querySelector("[data-cal]").innerHTML = cel;
      const mostra = () => {
        const box = corpo.querySelector("[data-slotsdia]");
        if (!diaSel || !tem[diaSel]) { box.innerHTML = disp.length ? `<p class="mudo" style="text-align:center">Toque num dia em verde.</p>` : `<p class="mudo" style="text-align:center">Nenhum horário livre neste mês para esse serviço.</p>`; return; }
        box.innerHTML = `<div class="cartao"><b>${cap(diaSemana(diaSel + "T12:00:00-03:00"))}, ${dataCurta(diaSel + "T12:00:00-03:00")}</b><div class="slots" style="margin-top:10px">${tem[diaSel].map((h) => `<button data-h="${h}">${h}</button>`).join("")}</div><p class="pequeno" style="margin-top:10px">Toque no horário para agendar uma cliente.</p></div>`;
        box.querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => novoAgendamento({ data: diaSel, servicoId: servId, horaIni: new Date(`${diaSel}T${b.dataset.h}:00-03:00`).toISOString() })));
      };
      corpo.querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => { diaSel = b.dataset.dia; encontrar(); }));
      mostra();
    }

    const desenha = () => { abas(); aba === "compartilhar" ? compartilhar() : encontrar(); };
    r.querySelectorAll("[data-aba]").forEach((b) => (b.onclick = () => { aba = b.dataset.aba; desenha(); }));
    r.querySelector("[data-sv]").onchange = (e) => { servId = e.target.value; desenha(); };
    desenha();
  });
}

// =====================================================================
// EDITAR SERVIÇOS E VALOR DE UM AGENDAMENTO
// =====================================================================
function editarServicos(a) {
  const todos = st.servicos.filter((s) => s.ativo || s.id === a.servico_id);
  const achar = (nm) => st.servicos.find((x) => x.nome.toLowerCase() === nm.toLowerCase());
  const nomes = String(a.servico_nome || "").split(/\s*\+\s*/).filter(Boolean);
  let itens = nomes.map((nm, i) => { const s = achar(nm) || (i === 0 && st.servicos.find((x) => x.id === a.servico_id)); return { id: s?.id || null, nome: s?.nome || nm, preco: s ? Number(s.preco) : 0, min: s?.duracao_min || 0 }; });
  const minAtual = Math.round((new Date(a.fim) - new Date(a.inicio)) / 60000);
  if (itens.length === 1 && !itens[0].min) itens[0].min = minAtual;
  let valorManual = true, valor = Number(a.preco), minManual = true, minutos = minAtual;
  let novoIni = null;
  abreFolha(cabFolha("Editar agendamento", esc(a.cliente_nome)) + `
    <div class="cartao"><label class="f" style="margin-top:0">Dia e horário</label>
      <div class="linha" style="justify-content:space-between;gap:8px"><b data-quando>${cap(dataLonga(a.inicio))} às ${hora(a.inicio)}</b><button type="button" class="link" data-mudar>Mudar</button></div>
      <div class="hide" data-boxhora><div data-horario></div></div></div>
    <div class="cartao"><label class="f" style="margin-top:0">Serviços</label><div data-lista></div>
      <div class="linha" style="gap:8px;margin-top:10px"><select class="campo" data-add><option value="">+ Adicionar serviço…</option>${todos.map((s) => `<option value="${s.id}">${esc(s.nome)} · ${brl(s.preco)} · ${dur(s.duracao_min)}</option>`).join("")}</select></div></div>
    <div class="cartao"><div class="grade2">
      <div><label class="f" style="margin-top:0">Valor total (R$)</label><input class="campo" data-valor inputmode="decimal" style="min-width:0"></div>
      <div><label class="f" style="margin-top:0">Duração (min)</label><input class="campo" data-min type="number" min="5" step="5" style="min-width:0"></div></div>
      <p class="pequeno" data-resumo style="margin-top:8px"></p>
      <button class="link" data-soma style="margin-top:6px">Usar soma dos preços da tabela</button></div>
    <button class="btn ouro cheio" data-salvar>Salvar alterações</button>`, (r) => {
    const $ = (x) => r.querySelector(x);
    const somaP = () => itens.reduce((s, i) => s + i.preco, 0), somaM = () => itens.reduce((s, i) => s + i.min, 0);
    const desenha = () => {
      $("[data-lista]").innerHTML = itens.length ? itens.map((i, k) => `<div class="item" style="padding:10px 0"><div class="cresce"><b>${esc(i.nome)}</b><div class="pequeno">${brl(i.preco)}${i.min ? " · " + dur(i.min) : ""}</div></div><button class="link" data-tira="${k}" style="color:var(--perigo,#b04040)">Remover</button></div>`).join("") : `<p class="mudo">Nenhum serviço. Adicione abaixo.</p>`;
      r.querySelectorAll("[data-tira]").forEach((b) => (b.onclick = () => { itens.splice(+b.dataset.tira, 1); valorManual = false; minManual = false; desenha(); }));
      if (!valorManual) valor = somaP();
      if (!minManual && somaM()) minutos = somaM();
      $("[data-valor]").value = String(valor.toFixed(2)).replace(".", ",");
      $("[data-min]").value = minutos;
      const ini0 = novoIni || a.inicio, fim = new Date(new Date(ini0).getTime() + minutos * 60000);
      $("[data-resumo]").textContent = `Horário: ${hora(ini0)} às ${hora(fim.toISOString())}${somaP() !== valor ? ` · Tabela: ${brl(somaP())}` : ""}`;
    };
    $("[data-add]").onchange = (e) => {
      const s = st.servicos.find((x) => x.id === e.target.value); if (!s) return;
      itens.push({ id: s.id, nome: s.nome, preco: Number(s.preco), min: s.duracao_min });
      valor += Number(s.preco); minutos += s.duracao_min; e.target.value = ""; desenha();
    };
    $("[data-valor]").oninput = (e) => { valorManual = true; valor = Number(e.target.value.replace(/\./g, "").replace(",", ".")) || 0; };
    $("[data-min]").oninput = (e) => { minManual = true; minutos = Math.max(5, Number(e.target.value) || 0); const ini0 = novoIni || a.inicio, fim = new Date(new Date(ini0).getTime() + minutos * 60000); $("[data-resumo]").textContent = `Horário: ${hora(ini0)} às ${hora(fim.toISOString())}`; };
    let selH = null;
    $("[data-mudar]").onclick = () => {
      $("[data-boxhora]").classList.toggle("hide");
      if (!selH) selH = seletorHorario(r, () => minutos, isoDia(a.inicio), (t) => {
        novoIni = t;
        $("[data-quando]").textContent = t ? `${cap(dataLonga(t))} às ${hora(t)} (novo)` : `${cap(dataLonga(a.inicio))} às ${hora(a.inicio)}`;
        desenha();
      });
    };
    $("[data-soma]").onclick = () => { valorManual = false; minManual = false; desenha(); };
    $("[data-salvar]").onclick = async () => {
      if (!itens.length) return toast("Deixe pelo menos um serviço.", 1);
      if (!(valor >= 0)) return toast("Valor inválido.", 1);
      const ini = novoIni || a.inicio;
      const fim = new Date(new Date(ini).getTime() + minutos * 60000).toISOString();
      const choque = await q(sb.from("ad_agendamentos").select("cliente_nome,inicio").in("status", ATIVOS).neq("id", a.id).lt("inicio", fim).gt("fim", ini));
      if (choque.length && !confirm(`Com essa duração, o horário encosta em ${choque.map((c) => `${c.cliente_nome} (${hora(c.inicio)})`).join(", ")}. Salvar mesmo assim?`)) return;
      const { error } = await sb.from("ad_agendamentos").update({
        servico_id: itens[0].id, servico_nome: itens.map((i) => i.nome).join(" + ").slice(0, 200), preco: Math.round(valor * 100) / 100, inicio: ini, fim,
        ...(novoIni ? { aviso_breve: false } : {}),
      }).eq("id", a.id);
      if (error) return toast(erroMsg(error), 1);
      toast("Agendamento atualizado!");
      if (novoIni && a.cliente_whatsapp && confirm("Avisar a cliente do novo dia/horário pelo WhatsApp?")) abreZap(linkZap({ ...a, inicio: ini, fim, servico_nome: itens.map((i) => i.nome).join(" + ") }, "alteracao"));
      detalheAg(a.id); atualizaTela();
    };
    desenha();
  });
}
