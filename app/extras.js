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
  fidelidade: ["Fidelidade", "estrela", () => telaFidelidade()],
  site: ["Meu link", "link", () => telaSite()],
  config: ["Ajustes", "engrenagem", () => vaiPara("mais")],
};
const ATALHOS_PADRAO = ["novo", "clientes", "financeiro", "esmaltes", "estoque", "compras", "relatorios", "config"];
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
