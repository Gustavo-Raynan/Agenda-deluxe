// Nay Nails Gestão — Estoque inteligente e catálogo digital de esmaltes
"use strict";
const CATS_PROD = ["Esmaltes", "Géis", "Bases", "Top coats", "Removedores", "Preparadores", "Materiais descartáveis", "Lixas", "Brocas", "Outros produtos"];
const TONS = ["Vermelhos", "Vinhos", "Rosas", "Nudes", "Marrons", "Brancos", "Pretos", "Cinzas", "Azuis", "Verdes", "Roxos", "Laranjas", "Amarelos", "Glitter", "Metalizados", "Perolados", "Translúcidos", "Outros"];
const ACABS = ["Cremoso", "Brilhante", "Fosco", "Glitter", "Metálico", "Perolado", "Cintilante"];
const MARCAS = ["Risqué", "Colorama", "Impala", "Dailus", "Vult", "Ana Hickmann", "Big Universo", "Avon", "O.P.I", "Essie", "Bella Brazil", "Anita", "Mohda", "Top Beauty", "Nati", "Hits", "Vòlia", "Beltrat", "D&Z", "Fand", "Blant", "Masterpiece", "Gel Polish", "Outra"];
const CAT_STATUS = { revisao: ["Em revisão", "marcado"], publicado: ["No site", "confirmado"], oculto: ["Fora do site", "cancelado"] };
const disponib = (p) => (Number(p.quantidade) <= 0 ? ["Indisponível", "cancelado"] : Number(p.quantidade) <= Number(p.minimo) ? ["Poucas unidades", "marcado"] : ["Disponível", "confirmado"]);
const qtd = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
IC.caixa = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>';
IC.esmalte = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9.5" y="2.5" width="5" height="7" rx="1.2"/><path d="M8 9.5h8l1.5 3V19a2.5 2.5 0 0 1-2.5 2.5H9A2.5 2.5 0 0 1 6.5 19v-6.5z"/><path d="M9.5 15h5"/></svg>';
IC.camera = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';
IC.galeria = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';
IC.grafico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
IC.carrinho = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.3h8.8a1.5 1.5 0 0 0 1.4-1.1L21.5 8H6"/></svg>';
IC.engrenagem = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

// ---------------------------------------------------------------------
// dados
// ---------------------------------------------------------------------
async function produtos() { return q(sb.from("ad_produtos").select("*").order("nome")); }
function resumoEstoque(lista) {
  const hoje = isoDia(), em30 = somaDias(hoje, 30);
  return {
    baixos: lista.filter((p) => Number(p.quantidade) <= Number(p.minimo)),
    vencendo: lista.filter((p) => p.validade && p.validade >= hoje && p.validade <= em30),
    vencidos: lista.filter((p) => p.validade && p.validade < hoje),
    revisao: lista.filter((p) => p.categoria === "Esmaltes" && p.catalogo === "revisao"),
  };
}
// Ilustração de frasco na cor do esmalte (quando ainda não tem foto)
function frasco(hex) {
  const c = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : "#CFC6BA";
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#F4EFE8"/><rect x="38" y="8" width="24" height="30" rx="4" fill="#2A2420"/><rect x="41" y="10" width="5" height="26" rx="2" fill="#fff" opacity=".18"/><path d="M30 40h40l6 10v34a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V50z" fill="${c}"/><path d="M30 40h40l6 10v34a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V50z" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/><path d="M31 52c2-6 4-8 8-9v38c-4-1-7-4-8-8z" fill="#fff" opacity=".28"/><rect x="24" y="38" width="52" height="5" rx="2.5" fill="#2A2420" opacity=".85"/></svg>`);
}
const swatch = (p, tam = 46) => !p.foto_url ? `<img src="${frasco(p.cor_hex)}" alt="" style="width:${tam}px;height:${tam}px;border-radius:14px;flex:none;border:1px solid var(--line2)">` : p.foto_url
  ? `<img src="${esc(p.foto_url)}" alt="" loading="lazy" style="width:${tam}px;height:${tam}px;border-radius:14px;object-fit:cover;flex:none;border:1px solid var(--line2)">`
  : `<span style="width:${tam}px;height:${tam}px;border-radius:14px;flex:none;background:${p.cor_hex || "var(--soft)"};border:1px solid var(--line2);display:grid;place-items:center;color:var(--mute)">${p.cor_hex ? "" : IC.esmalte}</span>`;

// ---------------------------------------------------------------------
// TELA ESTOQUE (Esmaltes | Produtos | Movimentações)
// ---------------------------------------------------------------------
st.estSeg = "esmaltes"; st.estTom = ""; st.estBusca = "";
async function telaEstoque() {
  const lista = await produtos();
  const r0 = resumoEstoque(lista);
  const seg = st.estSeg;
  let corpo = "";
  if (seg === "esmaltes") {
    const esm = lista.filter((p) => p.categoria === "Esmaltes");
    const busca = st.estBusca.toLowerCase();
    const filt = esm.filter((p) => (!st.estTom || p.tonalidade === st.estTom) && (!busca || [p.nome, p.marca, p.codigo].join(" ").toLowerCase().includes(busca)));
    const tons = TONS.filter((t) => esm.some((p) => p.tonalidade === t));
    corpo = `
      <div class="tres-bot"><button class="btn prim" data-lista>${IC.esmalte}Marcar os que tenho</button><button class="btn" data-foto>${IC.camera}Foto</button><button class="btn" data-manual>${IC.mais}À mão</button></div>
      ${r0.revisao.length ? `<div class="cartao" style="border-color:rgba(var(--accRGB),.45)"><div class="linha"><div class="cresce"><b>${r0.revisao.length} cor${r0.revisao.length > 1 ? "es" : ""} esperando sua conferência</b><div class="pequeno">Confira e publique para aparecerem no site.</div></div><button class="btn prim mini" data-revisar>Conferir</button></div></div>` : ""}
      <div class="busca">${IC.busca}<input class="campo" id="busca-esm" placeholder="Buscar cor, marca ou código" value="${esc(st.estBusca)}" autocomplete="off"></div>
      ${tons.length ? `<div class="opcoes" style="margin-bottom:12px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">${["", ...tons].map((t) => `<button type="button" data-tom="${t}" class="${st.estTom === t ? "on" : ""}" style="flex:none">${t || "Todas"}</button>`).join("")}</div>` : ""}
      <p class="pequeno" style="margin:0 4px 10px">${esm.length} cor${esm.length !== 1 ? "es" : ""} cadastrada${esm.length !== 1 ? "s" : ""} · ${esm.filter((p) => p.catalogo === "publicado").length} no site</p>
      ${filt.length ? `<div class="grade-esm">${filt.map((p) => { const d = disponib(p); return `<button class="esm" data-p="${p.id}">
          <div class="esm-foto"><img src="${p.foto_url ? esc(p.foto_url) : frasco(p.cor_hex)}" alt="" loading="lazy"><span class="chip ${CAT_STATUS[p.catalogo][1]}">${CAT_STATUS[p.catalogo][0]}</span></div>
          <b>${esc(p.nome)}</b><small>${esc(p.marca || "Sem marca")}${p.codigo ? " · " + esc(p.codigo) : ""}</small>
          <small class="${d[1] === "cancelado" ? "neg" : ""}">${qtd(p.quantidade)} un · ${d[0]}</small></button>`; }).join("")}</div>`
        : `<div class="vazio">${IC.esmalte}<div>${esm.length ? "Nenhuma cor encontrada." : "Adicione seus esmaltes: escolha da lista os que o app já conhece e fotografe só os outros. Dá para fotografar vários de uma vez."}</div></div>`}`;
  } else if (seg === "produtos") {
    const outros = lista.filter((p) => p.categoria !== "Esmaltes");
    const porCat = {}; outros.forEach((p) => (porCat[p.categoria] = porCat[p.categoria] || []).push(p));
    corpo = `<div class="grade2" style="margin-bottom:12px"><button class="btn prim" data-novo-prod>${IC.mais}Novo produto</button><button class="btn" data-compra>${IC.carrinho}Registrar compra</button></div>
      ${Object.keys(porCat).length ? CATS_PROD.filter((c) => porCat[c]).map((c) => `<div class="tit-linha"><h2>${c}</h2><span class="pequeno">${porCat[c].length}</span></div><div class="lista">${porCat[c].map((p) => { const d = disponib(p); const venc = p.validade && p.validade <= somaDias(isoDia(), 30);
          return `<button class="item" data-p="${p.id}">${swatch(p, 40)}<div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${esc(p.marca || "")}${p.validade ? ` · validade ${dataCurta(meioDia(p.validade))}` : ""}</div></div><div style="text-align:right"><b>${qtd(p.quantidade)} ${esc(p.unidade)}</b><div>${Number(p.quantidade) <= Number(p.minimo) ? '<span class="chip cancelado">Acabando</span>' : venc ? '<span class="chip marcado">Validade</span>' : `<span class="chip ${d[1]}">${d[0] === "Disponível" ? "OK" : d[0]}</span>`}</div></div></button>`; }).join("")}</div>`).join("")
        : `<div class="vazio">${IC.caixa}<div>Cadastre géis, bases, top coats, removedores, lixas, brocas e descartáveis.</div></div>`}`;
  } else {
    const movs = await q(sb.from("ad_movimentos").select("*").order("criado_em", { ascending: false }).limit(80));
    const porId = Object.fromEntries(lista.map((p) => [p.id, p]));
    const usados = {}; movs.filter((m) => ["retirada", "consumo"].includes(m.tipo)).forEach((m) => (usados[m.produto_id] = (usados[m.produto_id] || 0) + Math.abs(Number(m.quantidade))));
    const top = Object.entries(usados).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ROT = { compra: ["Compra", "confirmado", "+"], retirada: ["Retirada", "cancelado", "−"], consumo: ["Uso em atendimento", "marcado", "−"], ajuste: ["Ajuste", "chegou", "="] };
    corpo = `${top.length ? `<div class="cartao"><h2>Mais usados</h2>${top.map(([id, n]) => `<div class="linha entre" style="padding:6px 0"><span>${esc(porId[id]?.nome || "Produto removido")}</span><b>${qtd(n)}</b></div>`).join("")}</div>` : ""}
      ${movs.length ? `<div class="lista">${movs.map((m) => { const p = porId[m.produto_id]; const r = ROT[m.tipo]; return `<div class="item" style="cursor:default">${p ? swatch(p, 38) : ""}<div class="cresce"><b>${esc(p?.nome || "Produto")}</b><div class="pequeno">${r[0]} · ${dataCurta(m.criado_em)} ${hora(m.criado_em)}${m.motivo ? " · " + esc(m.motivo) : ""}${m.custo ? " · " + brl(m.custo) : ""}</div></div><span class="chip ${r[1]}">${r[2]}${qtd(Math.abs(m.quantidade))}</span></div>`; }).join("")}</div>` : `<div class="vazio">${IC.caixa}<div>As compras, retiradas e ajustes aparecem aqui.</div></div>`}`;
  }
  const r = tela(`
    <div class="resumo-val">
      <div><small>Acabando</small><b class="${r0.baixos.length ? "neg" : ""}">${r0.baixos.length}</b></div>
      <div><small>Validade em 30 dias</small><b>${r0.vencendo.length + r0.vencidos.length}</b></div>
      <div><small>Valor em estoque</small><b>${brl(lista.reduce((s, p) => s + Math.max(Number(p.quantidade), 0) * Number(p.preco_compra || 0), 0))}</b></div>
    </div>
    <div class="seg" id="seg-est"><button data-s="esmaltes" class="${seg === "esmaltes" ? "on" : ""}">Esmaltes</button><button data-s="produtos" class="${seg === "produtos" ? "on" : ""}">Produtos</button><button data-s="movimentos" class="${seg === "movimentos" ? "on" : ""}">Histórico</button></div>
    ${corpo}`);
  r.querySelectorAll("#seg-est [data-s]").forEach((b) => (b.onclick = () => { st.estSeg = b.dataset.s; telaEstoque(); }));
  r.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => fichaProduto(b.dataset.p)));
  r.querySelectorAll("[data-tom]").forEach((b) => (b.onclick = () => { st.estTom = b.dataset.tom; telaEstoque(); }));
  $("busca-esm")?.addEventListener("input", (e) => { st.estBusca = e.target.value; clearTimeout(st._tb); st._tb = setTimeout(async () => { await telaEstoque(); const i = $("busca-esm"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); });
  r.querySelector("[data-foto]")?.addEventListener("click", cadastroPorFoto);
  r.querySelector("[data-manual]")?.addEventListener("click", () => editaProduto(null, "Esmaltes"));
  r.querySelector("[data-lista]")?.addEventListener("click", daLista);
  r.querySelector("[data-revisar]")?.addEventListener("click", conferirCatalogo);
  r.querySelector("[data-novo-prod]")?.addEventListener("click", () => editaProduto(null, "Outros produtos"));
  r.querySelector("[data-compra]")?.addEventListener("click", () => registraCompra());
}

// ---------------------------------------------------------------------
// FICHA DO PRODUTO / ESMALTE
// ---------------------------------------------------------------------
async function fichaProduto(id) {
  const [p, movs, ags] = await Promise.all([
    q(sb.from("ad_produtos").select("*").eq("id", id).maybeSingle()),
    q(sb.from("ad_movimentos").select("*").eq("produto_id", id).order("criado_em", { ascending: false }).limit(15)),
    q(sb.from("ad_agendamentos").select("id,cliente_nome,inicio,status,cores").not("cores", "is", null).gte("inicio", new Date().toISOString())),
  ]);
  if (!p) return toast("Produto não encontrado.", 1);
  const esm = p.categoria === "Esmaltes";
  const d = disponib(p);
  const escolhida = ags.filter((a) => ATIVOS.includes(a.status) && (a.cores || []).some((c) => c.id === p.id));
  abreFolha(cabFolha(esc(p.nome), `${esc(p.marca || "Sem marca")}${p.codigo ? " · cód. " + esc(p.codigo) : ""} · ${esc(p.categoria)}`) + `
    ${p.foto_url || p.cor_hex ? `<div class="cartao" style="padding:0;overflow:hidden;background:${p.cor_hex || "var(--card)"}">${p.foto_url ? `<img src="${esc(p.foto_url)}" alt="" style="width:100%;max-height:300px;object-fit:cover;display:block">` : '<div style="height:120px"></div>'}</div>` : ""}
    <div class="resumo-val">
      <div><small>Quantidade</small><b>${qtd(p.quantidade)} ${esc(p.unidade)}</b></div>
      <div><small>Situação</small><b class="${d[1] === "cancelado" ? "neg" : d[1] === "confirmado" ? "pos" : ""}" style="font-size:14px">${d[0]}</b></div>
      <div><small>${esm ? "No site" : "Validade"}</small><b style="font-size:14px">${esm ? CAT_STATUS[p.catalogo][0] : p.validade ? dataCurta(meioDia(p.validade)) : "—"}</b></div>
    </div>
    ${escolhida.length ? `<div class="cartao" style="border-color:rgba(var(--accRGB),.45)"><b>${escolhida.length} cliente${escolhida.length > 1 ? "s escolheram" : " escolheu"} esta cor</b>${escolhida.map((a) => `<div class="pequeno" style="margin-top:4px">${esc(a.cliente_nome)} · ${dataCurta(a.inicio)} às ${hora(a.inicio)}</div>`).join("")}</div>` : ""}
    <div class="grade2" style="margin-bottom:10px">
      <button class="btn prim" data-mov="compra">${IC.mais}Entrada / compra</button>
      <button class="btn" data-mov="retirada">− Retirada</button>
    </div>
    ${esm ? `<div class="grade2" style="margin-bottom:10px">
      ${p.catalogo !== "publicado" ? `<button class="btn" data-cat="publicado">Publicar no site</button>` : `<button class="btn" data-cat="oculto">Tirar do site</button>`}
      <button class="btn" data-acabou>Acabou</button></div>` : `<button class="btn cheio" data-mov="ajuste" style="margin-bottom:10px">Ajustar quantidade</button>`}
    <button class="btn cheio" data-editar>Editar ficha</button>
    ${p.preco_compra || p.fornecedor || p.data_compra || p.observacao ? `<div class="cartao" style="margin-top:12px"><dl class="info-ag">
      ${p.preco_compra ? `<dt>Preço de compra</dt><dd>${brl(p.preco_compra)}</dd>` : ""}${p.fornecedor ? `<dt>Fornecedor</dt><dd>${esc(p.fornecedor)}</dd>` : ""}
      ${p.data_compra ? `<dt>Última compra</dt><dd>${dataCurta(meioDia(p.data_compra))}</dd>` : ""}${esm && p.tonalidade ? `<dt>Tonalidade</dt><dd>${esc(p.tonalidade)}</dd>` : ""}${esm && p.acabamento ? `<dt>Acabamento</dt><dd>${esc(p.acabamento)}</dd>` : ""}
    </dl>${p.observacao ? `<p class="pequeno" style="margin-top:10px">${esc(p.observacao)}</p>` : ""}</div>` : ""}
    ${movs.length ? `<div class="tit-linha"><h2>Movimentações</h2></div><div class="lista">${movs.map((m) => `<div class="item" style="cursor:default"><div class="cresce"><b>${{ compra: "Entrada", retirada: "Retirada", consumo: "Uso", ajuste: "Ajuste" }[m.tipo]}${m.motivo ? " · " + esc(m.motivo) : ""}</b><div class="pequeno">${dataCurta(m.criado_em)} ${hora(m.criado_em)}${m.custo ? " · " + brl(m.custo) : ""}</div></div><b>${m.tipo === "compra" ? "+" : m.tipo === "ajuste" ? "=" : "−"}${qtd(Math.abs(m.quantidade))}</b></div>`).join("")}</div>` : ""}`, (r) => {
    r.querySelectorAll("[data-mov]").forEach((b) => (b.onclick = () => movimento(p, b.dataset.mov)));
    r.querySelector("[data-editar]").onclick = () => editaProduto(p);
    r.querySelector("[data-acabou]")?.addEventListener("click", async () => {
      if (!confirm(`Marcar "${p.nome}" como acabado? No site ela fica "indisponível temporariamente".`)) return;
      await q(sb.from("ad_movimentos").insert({ profissional_id: st.prof.id, produto_id: p.id, tipo: "ajuste", quantidade: 0, motivo: "Acabou" }));
      toast("Cor marcada como acabada."); fichaProduto(p.id); if (st.aba === "estoque") telaEstoque();
    });
    r.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = async () => {
      await q(sb.from("ad_produtos").update({ catalogo: b.dataset.cat }).eq("id", p.id));
      toast(b.dataset.cat === "publicado" ? "Publicada no site! ✨" : "Retirada do site."); if (b.dataset.cat === "publicado") festa();
      fichaProduto(p.id); if (st.aba === "estoque") telaEstoque();
    }));
  });
}

function movimento(p, tipo) {
  const T = { compra: ["Entrada / compra", "Quantas unidades chegaram?"], retirada: ["Retirada", "Quantas unidades saíram?"], ajuste: ["Ajustar quantidade", "Quantas unidades existem agora?"] }[tipo];
  const motivos = { retirada: ["Uso no salão", "Acabou", "Quebrou", "Venceu", "Outro"] }[tipo];
  let motivo = motivos ? motivos[0] : null;
  abreFolha(cabFolha(T[0], `${esc(p.nome)} · hoje: ${qtd(p.quantidade)} ${esc(p.unidade)}`) + `
    <div class="cartao">
      <label class="f">${T[1]}</label><input class="campo" data-q type="number" inputmode="decimal" step="1" min="0" value="${tipo === "ajuste" ? qtd(p.quantidade).replace(",", ".") : 1}" style="font-size:22px;font-weight:800">
      ${tipo === "compra" ? `<label class="f">Valor pago no total (R$)</label><input class="campo" data-custo type="number" inputmode="decimal" step="0.01" min="0" placeholder="Opcional">
        <label class="interruptor" style="margin-top:6px"><span>Lançar como despesa no Caixa</span><input type="checkbox" data-desp checked></label>` : ""}
      ${motivos ? `<label class="f">Motivo</label><div class="opcoes">${motivos.map((m) => `<button type="button" data-m="${m}" class="${m === motivo ? "on" : ""}">${m}</button>`).join("")}</div>` : ""}
    </div>
    <button class="btn prim cheio" data-salvar>Salvar</button>`, (r) => {
    r.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { motivo = b.dataset.m; r.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelector("[data-salvar]").onclick = async () => {
      const n = Number(r.querySelector("[data-q]").value);
      if (!(n >= 0) || (tipo !== "ajuste" && !(n > 0))) return toast("Informe a quantidade.", 1);
      const custo = Number(r.querySelector("[data-custo]")?.value || 0) || null;
      await q(sb.from("ad_movimentos").insert({ profissional_id: st.prof.id, produto_id: p.id, tipo, quantidade: n, custo, motivo }));
      if (tipo === "compra" && custo && r.querySelector("[data-desp]").checked)
        await q(sb.from("ad_lancamentos").insert({ profissional_id: st.prof.id, tipo: "saida", valor: custo, categoria: p.categoria === "Esmaltes" ? "Compra de esmaltes" : "Compra de materiais", descricao: `${p.nome} (${qtd(n)} ${p.unidade})`, data: isoDia() }));
      toast("Estoque atualizado."); fichaProduto(p.id); if (st.aba === "estoque") telaEstoque();
    };
  });
}

async function registraCompra() {
  const lista = await produtos();
  abreFolha(cabFolha("Registrar compra", "Escolha o produto. A quantidade e a despesa são lançadas sozinhas.") + `
    <div class="busca">${IC.busca}<input class="campo" data-b placeholder="Buscar produto ou esmalte" autocomplete="off"></div>
    <div class="lista" data-l>${lista.map((p) => `<button class="item" data-p="${p.id}" data-t="${esc([p.nome, p.marca, p.codigo, p.categoria].join(" ").toLowerCase())}">${swatch(p, 36)}<div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${esc(p.categoria)} · ${qtd(p.quantidade)} ${esc(p.unidade)}</div></div><span class="seta">›</span></button>`).join("") || `<div class="vazio">Nenhum produto cadastrado ainda.</div>`}</div>
    <button class="btn cheio" data-novo>${IC.mais}Cadastrar produto novo</button>`, (r) => {
    r.querySelector("[data-b]").oninput = (e) => { const t = e.target.value.toLowerCase(); r.querySelectorAll("[data-t]").forEach((b) => b.classList.toggle("hide", !b.dataset.t.includes(t))); };
    r.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => movimento(lista.find((p) => p.id === b.dataset.p), "compra")));
    r.querySelector("[data-novo]").onclick = () => editaProduto(null, "Outros produtos");
  });
}

// ---------------------------------------------------------------------
// EDITAR / CADASTRAR À MÃO
// ---------------------------------------------------------------------
function editaProduto(p, catInicial) {
  const cat0 = p?.categoria || catInicial || "Outros produtos";
  let fotoNova = null;
  abreFolha(cabFolha(p ? "Editar ficha" : cat0 === "Esmaltes" ? "Novo esmalte" : "Novo produto") + `
    <div class="cartao">
      <div class="linha" style="margin-bottom:6px"><div data-prev>${p ? swatch(p, 64) : `<span style="width:64px;height:64px;border-radius:14px;background:var(--soft);display:grid;place-items:center;color:var(--mute)">${IC.camera}</span>`}</div>
        <label class="btn mini" style="cursor:pointer">${IC.camera}Foto<input type="file" accept="image/*" data-foto hidden></label></div>
      <label class="f">Categoria</label><select class="campo" data-cat>${CATS_PROD.map((c) => `<option ${c === cat0 ? "selected" : ""}>${c}</option>`).join("")}</select>
      <label class="f">Nome${cat0 === "Esmaltes" ? " da cor" : ""}</label><input class="campo" data-nome value="${esc(p?.nome || "")}">
      <div class="grade2"><div><label class="f">Marca</label><input class="campo" data-marca list="marcas-esm" value="${esc(p?.marca || "")}"></div><div><label class="f">Código</label><input class="campo" data-cod value="${esc(p?.codigo || "")}"></div></div>
      <datalist id="marcas-esm">${MARCAS.map((m) => `<option value="${m}">`).join("")}</datalist>
      <div data-esm>
        <div class="grade2"><div><label class="f">Tonalidade</label><select class="campo" data-tom><option value="">—</option>${TONS.map((t) => `<option ${p?.tonalidade === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div><label class="f">Acabamento</label><select class="campo" data-acab><option value="">—</option>${ACABS.map((t) => `<option ${p?.acabamento === t ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
        <div class="grade2"><div><label class="f">Linha</label><input class="campo" data-linha value="${esc(p?.linha || "")}"></div><div><label class="f">Cor</label><input class="campo" data-hex type="color" value="${p?.cor_hex || "#B05060"}" style="height:50px;padding:4px"></div></div>
      </div>
      <div class="grade2"><div><label class="f">Quantidade</label><input class="campo" data-q type="number" inputmode="decimal" min="0" step="1" value="${p ? qtd(p.quantidade).replace(",", ".") : 1}" ${p ? "disabled" : ""}></div>
        <div><label class="f">Avisar quando tiver</label><input class="campo" data-min type="number" inputmode="decimal" min="0" step="1" value="${p ? qtd(p.minimo).replace(",", ".") : 1}"></div></div>
      ${p ? `<p class="pequeno" style="margin-top:6px">Para mudar a quantidade, use Entrada, Retirada ou Ajustar na ficha.</p>` : ""}
      <div class="grade2"><div><label class="f">Preço de compra (un.)</label><input class="campo" data-preco type="number" inputmode="decimal" step="0.01" min="0" value="${p?.preco_compra ?? ""}"></div><div><label class="f">Unidade</label><input class="campo" data-un value="${esc(p?.unidade || "un")}"></div></div>
      <div class="grade2"><div><label class="f">Fornecedor</label><input class="campo" data-forn value="${esc(p?.fornecedor || "")}"></div><div><label class="f">Validade</label><input class="campo" data-val type="date" value="${p?.validade || ""}"></div></div>
      <label class="f">Observações</label><textarea class="campo" data-obs>${esc(p?.observacao || "")}</textarea>
    </div>
    <button class="btn prim cheio" data-salvar>Salvar</button>
    ${p ? `<button class="btn perigo cheio" data-excluir style="margin-top:10px">Excluir</button>` : ""}`, (r) => {
    const ajusta = () => r.querySelector("[data-esm]").classList.toggle("hide", r.querySelector("[data-cat]").value !== "Esmaltes");
    r.querySelector("[data-cat]").onchange = ajusta; ajusta();
    r.querySelector("[data-foto]").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const img = await carregaImagem(f); const cv = paraCanvas(img, 900); fotoNova = cv;
      const cor = corDominante(cv);
      r.querySelector("[data-prev]").innerHTML = `<img src="${cv.toDataURL("image/jpeg", .7)}" style="width:64px;height:64px;border-radius:14px;object-fit:cover">`;
      if (!p?.cor_hex) { r.querySelector("[data-hex]").value = cor; if (!r.querySelector("[data-tom]").value) r.querySelector("[data-tom]").value = tonalidadeDe(cor); }
    };
    r.querySelector("[data-salvar]").onclick = async () => {
      const g = (k) => r.querySelector(`[data-${k}]`).value.trim();
      const cat = g("cat"), esmalte = cat === "Esmaltes";
      const d = { categoria: cat, nome: g("nome"), marca: g("marca") || null, codigo: g("cod") || null, minimo: Number(g("min") || 0), unidade: g("un") || "un",
        preco_compra: g("preco") ? Number(g("preco")) : null, fornecedor: g("forn") || null, validade: g("val") || null, observacao: g("obs") || null,
        tonalidade: esmalte ? g("tom") || null : null, acabamento: esmalte ? g("acab") || null : null, linha: esmalte ? g("linha") || null : null, cor_hex: esmalte ? g("hex") : null };
      if (!d.nome) return toast("Escreva o nome.", 1);
      const bt = r.querySelector("[data-salvar]"); bt.disabled = true; bt.textContent = "Salvando…";
      try {
        if (fotoNova) d.foto_url = await enviaFoto(fotoNova);
        let id = p?.id;
        if (p) await q(sb.from("ad_produtos").update(d).eq("id", p.id));
        else {
          const novo = await q(sb.from("ad_produtos").insert({ ...d, profissional_id: st.prof.id, quantidade: 0, catalogo: "revisao" }).select().single()); id = novo.id;
          const n = Number(g("q") || 0); if (n > 0) await q(sb.from("ad_movimentos").insert({ profissional_id: st.prof.id, produto_id: id, tipo: "compra", quantidade: n, motivo: "Cadastro" }));
        }
        toast("Salvo."); fichaProduto(id); if (st.aba === "estoque") telaEstoque();
      } catch { bt.disabled = false; bt.textContent = "Salvar"; }
    };
    r.querySelector("[data-excluir]")?.addEventListener("click", async () => {
      if (!confirm(`Excluir "${p.nome}" e o histórico dele?`)) return;
      await q(sb.from("ad_produtos").delete().eq("id", p.id)); toast("Excluído."); fechaFolha(); if (st.aba === "estoque") telaEstoque();
    });
  });
}

// ---------------------------------------------------------------------
// FOTOS: carregar, reduzir, cor dominante, tonalidade, envio
// ---------------------------------------------------------------------
function carregaImagem(arquivo) {
  return new Promise((ok, erro) => { const img = new Image(); img.onload = () => ok(img); img.onerror = erro; img.src = URL.createObjectURL(arquivo); });
}
function paraCanvas(img, max, recorte) {
  const [sx, sy, sw, sh] = recorte || [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height];
  const k = Math.min(1, max / Math.max(sw, sh));
  const c = document.createElement("canvas"); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
// Cor mais presente no centro da foto (onde costuma estar o esmalte), ignorando reflexos e sombras
function corDominante(canvas) {
  const t = 64, c = document.createElement("canvas"); c.width = t; c.height = t;
  const ctx = c.getContext("2d"); ctx.drawImage(canvas, 0, 0, t, t);
  const px = ctx.getImageData(14, 12, 36, 40).data;
  const baldes = {};
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2], [, s, l] = rgbParaHsl(r, g, b);
    if (l > 0.94 || l < 0.05) continue;
    const k = (r >> 4) + "," + (g >> 4) + "," + (b >> 4);
    const bk = (baldes[k] = baldes[k] || { n: 0, r: 0, g: 0, b: 0, p: 0 });
    bk.n++; bk.r += r; bk.g += g; bk.b += b; bk.p += 1 + s * 2.5;
  }
  const melhor = Object.values(baldes).sort((a, b) => b.p - a.p)[0];
  if (!melhor) return "#B05060";
  const h = (v) => Math.round(v / melhor.n).toString(16).padStart(2, "0");
  return "#" + h(melhor.r) + h(melhor.g) + h(melhor.b);
}
function tonalidadeDe(hex) {
  const n = parseInt(hex.slice(1), 16), [h, s, l] = rgbParaHsl(n >> 16, (n >> 8) & 255, n & 255);
  if (l < 0.13) return "Pretos";
  if (l > 0.9) return "Brancos";
  if (s < 0.14) { if (l > 0.84) return "Brancos"; if (h >= 15 && h <= 50 && l > 0.5) return "Nudes"; return l < 0.2 ? "Pretos" : "Cinzas"; }
  if (h >= 345 || h < 12) return l < 0.32 ? "Vinhos" : l > 0.72 && s < 0.7 ? "Rosas" : "Vermelhos";
  if (h < 40) return l < 0.33 ? "Marrons" : s < 0.5 && l > 0.55 ? "Nudes" : "Laranjas";
  if (h < 65) return l < 0.33 ? "Marrons" : s < 0.42 && l > 0.6 ? "Nudes" : "Amarelos";
  if (h < 170) return "Verdes";
  if (h < 255) return "Azuis";
  if (h < 290) return "Roxos";
  return l < 0.33 ? "Vinhos" : "Rosas";
}
async function enviaFoto(canvas) {
  const blob = await new Promise((ok) => canvas.toBlob(ok, "image/webp", 0.82));
  const nome = `${st.prof.id}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from("ad-fotos").upload(nome, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) { toast("Não foi possível enviar a foto: " + error.message, 1); throw error; }
  return sb.storage.from("ad-fotos").getPublicUrl(nome).data.publicUrl;
}

// Leitura de rótulo (texto) no próprio celular — carregada só quando usada
let leitor = null;
async function leRotulo(canvas) {
  if (!window.Tesseract) await new Promise((ok, erro) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; s.onload = ok; s.onerror = erro; document.head.appendChild(s); });
  if (!leitor) leitor = await Tesseract.createWorker("por");
  const { data } = await leitor.recognize(canvas);
  const texto = (data.text || "").replace(/[|_~]/g, " ");
  const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const marca = MARCAS.find((m) => m !== "Outra" && semAcento(texto).includes(semAcento(m).replace(/[^a-z0-9& ]/g, "")));
  const codigo = (texto.match(/(?:n[ºo°.]?\s*|c[oó]d\.?\s*)?(\b\d{2,5}\b)/i) || [])[1] || "";
  const linhas = texto.split(/\n/).map((x) => x.trim()).filter((x) => /[a-zà-ú]{3,}/i.test(x) && x.length <= 32 && (!marca || !semAcento(x).includes(semAcento(marca))));
  const nome = (linhas.sort((a, b) => b.replace(/[^a-zà-ú ]/gi, "").length - a.replace(/[^a-zà-ú ]/gi, "").length)[0] || "").replace(/[^\p{L}\d &'-]/gu, "").trim();
  return { marca, codigo, nome: nome ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase() : "" };
}

// ---------------------------------------------------------------------
// CADASTRO POR FOTO (uma, várias ou foto em grupo) — com IA quando configurada
// ---------------------------------------------------------------------
const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
let BASE = null;
async function baseEsmaltes() { if (!BASE) BASE = await q(sb.from("ad_esmaltes_base").select("*").order("marca").order("nome")); return BASE; }
// Procura o esmalte no catálogo do salão (para somar no estoque) e na lista de cores conhecidas
function procura(it, meus, base) {
  const m = norm(it.marca), n = norm(it.nome), c = norm(it.codigo);
  const igual = (p) => (n && norm(p.nome) === n && (!m || !p.marca || norm(p.marca) === m)) || (c && m && norm(p.codigo) === c && norm(p.marca) === m);
  return { meu: n || c ? meus.find(igual) : null, conhecido: n ? base.find(igual) : null };
}
async function iaIdentifica(canvas, grupo) {
  if (st.iaSemChave) return null;
  try {
    const imagem = paraCanvas(canvas, grupo ? 1400 : 900).toDataURL("image/jpeg", 0.82);
    const { data, error } = await sb.functions.invoke("ad-ia-esmalte", { body: { imagem, grupo } });
    if (error) return null;
    if (data?.erro === "sem_chave") { st.iaSemChave = true; return null; }
    return data?.esmaltes || null;
  } catch { return null; }
}

function cadastroPorFoto() {
  abreFolha(cabFolha("Cadastrar esmaltes por foto", st.iaSemChave ? "O app detecta a cor sozinho. Marca e nome você confere ou escolhe da lista." : "Fotografe e o app reconhece marca, nome e cor sozinho. Se o esmalte já existe no salão, só soma no estoque.") + `
    <div class="pilha">
      <label class="btn prim cheio" style="cursor:pointer">${IC.camera}Tirar foto agora<input type="file" accept="image/*" capture="environment" data-cam hidden></label>
      <label class="btn cheio" style="cursor:pointer">${IC.esmalte}Foto de vários esmaltes juntos<input type="file" accept="image/*" data-grupo hidden></label>
      <label class="btn cheio" style="cursor:pointer">${IC.galeria}Escolher fotos da galeria<input type="file" accept="image/*" multiple data-gal hidden></label>
    </div>
    <div class="cartao" style="margin-top:14px"><b>Dicas para a foto</b><ul class="pequeno" style="margin-top:6px;padding-left:18px;line-height:1.7"><li>Luz natural, sem flash</li><li>Rótulo virado para a câmera</li><li>Vários juntos: frascos em pé, um ao lado do outro</li></ul></div>`, (r) => {
    r.querySelector("[data-cam]").onchange = (e) => fotosSoltas([...e.target.files]);
    r.querySelector("[data-gal]").onchange = (e) => fotosSoltas([...e.target.files]);
    r.querySelector("[data-grupo]").onchange = (e) => e.target.files[0] && fotoEmGrupo(e.target.files[0]);
  });
}

function carregando(txt) {
  abreFolha(`<div style="text-align:center;padding:40px 10px"><div class="giro"></div><p style="margin-top:16px;font-weight:600" data-txt>${txt}</p></div>`);
  return (t) => { const el = document.querySelector("#folha [data-txt]"); if (el) el.textContent = t; };
}

async function fotosSoltas(arquivos) {
  if (!arquivos.length) return;
  const muda = carregando(`Analisando ${arquivos.length > 1 ? arquivos.length + " fotos" : "a foto"}…`);
  const itens = [];
  let i = 0;
  for (const f of arquivos.slice(0, 30)) {
    muda(`Reconhecendo ${++i} de ${Math.min(arquivos.length, 30)}…`);
    const img = await carregaImagem(f);
    const cv = paraCanvas(img, 900), cor = corDominante(cv);
    const ia = (await iaIdentifica(cv, false))?.[0];
    itens.push({ canvas: cv, cor: ia?.cor_hex || cor, tonalidade: ia?.tonalidade || tonalidadeDe(cor), marca: ia?.marca, nome: ia?.nome, codigo: ia?.codigo, linha: ia?.linha, acabamento: ia?.acabamento, ia: !!ia });
  }
  revisaItens(itens);
}

async function fotoEmGrupo(arquivo) {
  const img = await carregaImagem(arquivo);
  const W = img.naturalWidth, H = img.naturalHeight;
  if (!st.iaSemChave) {
    carregando("Procurando os esmaltes na foto…");
    const lista = await iaIdentifica(paraCanvas(img, 1400), true);
    const comCaixa = (lista || []).filter((e) => e.caixa && e.caixa[2] > 0.02 && e.caixa[3] > 0.02);
    if (comCaixa.length) {
      const itens = comCaixa.map((e) => {
        const [x, y, w, h] = e.caixa, lado = Math.max(w * W, h * H) * 1.08;
        const cx = (x + w / 2) * W, cy = (y + h / 2) * H;
        const sx = Math.max(0, Math.min(W - Math.min(lado, W), cx - lado / 2)), sy = Math.max(0, Math.min(H - Math.min(lado, H), cy - lado / 2));
        const cv = paraCanvas(img, 700, [sx, sy, Math.min(lado, W), Math.min(lado, H)]);
        const cor = e.cor_hex || corDominante(cv);
        return { canvas: cv, cor, tonalidade: e.tonalidade || tonalidadeDe(cor), marca: e.marca, nome: e.nome, codigo: e.codigo, linha: e.linha, acabamento: e.acabamento, ia: true };
      });
      toast(`${itens.length} esmalte${itens.length > 1 ? "s" : ""} encontrado${itens.length > 1 ? "s" : ""} na foto.`);
      return revisaItens(itens);
    }
    toast("Não consegui separar os frascos sozinho. Toque em cada um.", 1);
  }
  let tam = 0.28; const marcas = [];
  abreFolha(cabFolha("Toque em cada esmalte", "Toque no meio de cada frasco da foto. Cada toque vira uma ficha.") + `
    <div style="position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line2);touch-action:manipulation" data-area>
      <img src="${img.src}" style="width:100%;display:block" alt="">
      <div data-pontos style="position:absolute;inset:0"></div>
    </div>
    <label class="f">Tamanho do recorte</label><input type="range" min="12" max="50" value="28" data-tam style="width:100%">
    <div class="grade2" style="margin-top:12px"><button class="btn" data-desfaz>Desfazer</button><button class="btn prim" data-ok disabled>Pronto</button></div>`, (r) => {
    const area = r.querySelector("[data-area]"), pts = r.querySelector("[data-pontos]");
    const desenha = () => {
      const lado = tam * Math.min(W, H);
      pts.innerHTML = marcas.map((m, i) => `<span style="position:absolute;left:${((m.x - lado / 2) / W) * 100}%;top:${((m.y - lado / 2) / H) * 100}%;width:${(lado / W) * 100}%;height:${(lado / H) * 100}%;border:2px solid #DFC58E;border-radius:12px;display:grid;place-items:center"><b style="background:#DFC58E;color:#17140C;border-radius:99px;min-width:24px;height:24px;display:grid;place-items:center;font-size:13px">${i + 1}</b></span>`).join("");
      const ok = r.querySelector("[data-ok]"); ok.disabled = !marcas.length; ok.textContent = marcas.length ? `Pronto (${marcas.length})` : "Pronto";
    };
    area.onclick = (e) => { const b = area.getBoundingClientRect(); marcas.push({ x: ((e.clientX - b.left) / b.width) * W, y: ((e.clientY - b.top) / b.height) * H }); desenha(); };
    r.querySelector("[data-tam]").oninput = (e) => { tam = Number(e.target.value) / 100; desenha(); };
    r.querySelector("[data-desfaz]").onclick = () => { marcas.pop(); desenha(); };
    r.querySelector("[data-ok]").onclick = () => {
      const lado = tam * Math.min(W, H);
      revisaItens(marcas.map((m) => {
        const sx = Math.max(0, Math.min(W - lado, m.x - lado / 2)), sy = Math.max(0, Math.min(H - lado, m.y - lado / 2));
        const cv = paraCanvas(img, 700, [sx, sy, lado, lado]), cor = corDominante(cv);
        return { canvas: cv, cor, tonalidade: tonalidadeDe(cor) };
      }));
    };
  });
}

// Conferência: cada foto vira uma ficha; o que já existe no salão só soma no estoque
async function revisaItens(itens) {
  const [meus, base] = await Promise.all([q(sb.from("ad_produtos").select("*").eq("categoria", "Esmaltes")), baseEsmaltes()]);
  const opcoes = base.map((b) => `<option value="${esc(b.marca + " · " + b.nome)}">`).join("") + meus.map((p) => `<option value="${esc((p.marca || "") + " · " + p.nome)}">`).join("");
  const reconhecidos = itens.filter((it) => procura(it, meus, base).meu).length;
  abreFolha(cabFolha(`Conferir ${itens.length} esmalte${itens.length > 1 ? "s" : ""}`, (itens.some((i) => i.ia) ? "Reconhecido pela IA. " : "") + (reconhecidos ? `${reconhecidos} já existe${reconhecidos > 1 ? "m" : ""} no salão e só vai somar no estoque. ` : "") + "Confira e salve.") + `
    <div data-itens>${itens.map((it, i) => `<div class="cartao" data-i="${i}">
      <div class="linha" style="align-items:flex-start">
        <img src="${it.canvas.toDataURL("image/jpeg", .7)}" alt="" style="width:84px;height:84px;border-radius:14px;object-fit:cover;flex:none">
        <div class="cresce">
          <div data-selo></div>
          <div class="linha" style="gap:8px;margin-top:6px"><input type="color" data-hex value="${it.cor}" style="width:38px;height:38px;border:0;background:none;padding:0;flex:none"><select class="campo" data-tom style="padding:9px 36px 9px 10px">${TONS.map((t) => `<option ${t === it.tonalidade ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          ${it.ia ? "" : `<button type="button" class="link" data-ler style="margin-top:6px">🔍 Ler rótulo</button>`}
        </div>
        <button type="button" class="fechar" data-tira aria-label="Remover">✕</button>
      </div>
      <label class="f">Procurar na lista <span class="pequeno">(digite marca ou nome)</span></label><input class="campo" data-busca list="lista-esm" placeholder="Ex.: risqué carmim" autocomplete="off">
      <div class="grade2"><div><label class="f">Marca</label><input class="campo" data-marca list="marcas-esm2" value="${esc(it.marca || "")}"></div><div><label class="f">Código</label><input class="campo" data-cod value="${esc(it.codigo || "")}"></div></div>
      <label class="f">Nome da cor</label><input class="campo" data-nome placeholder="Ex.: Vermelho Paixão" value="${esc(it.nome || "")}">
      <div class="grade2"><div><label class="f">Acabamento</label><select class="campo" data-acab>${ACABS.map((a) => `<option ${a === (it.acabamento || "Cremoso") ? "selected" : ""}>${a}</option>`).join("")}</select></div><div><label class="f">Quantidade</label><input class="campo" data-q type="number" inputmode="numeric" min="0" value="1"></div></div>
    </div>`).join("")}</div>
    <datalist id="marcas-esm2">${MARCAS.map((m) => `<option value="${m}">`).join("")}</datalist>
    <datalist id="lista-esm">${opcoes}</datalist>
    <label class="interruptor"><span><b>Mostrar no site na hora</b><span class="pequeno" style="display:block">Desligado: ficam "em revisão" até você aprovar.</span></span><input type="checkbox" data-pub checked></label>
    <button class="btn prim cheio" data-salvar style="margin-top:8px">Salvar</button>`, (r) => {
    const atualizaSelo = (box) => {
      const g = (k) => box.querySelector(`[data-${k}]`).value.trim();
      const { meu } = procura({ marca: g("marca"), nome: g("nome"), codigo: g("cod") }, meus, base);
      box.dataset.meu = meu ? meu.id : "";
      box.querySelector("[data-selo]").innerHTML = meu ? `<span class="chip confirmado">Já tem no salão · ${qtd(meu.quantidade)} un → soma +${box.querySelector("[data-q]").value || 0}</span>` : `<span class="chip marcado">Esmalte novo</span>`;
    };
    r.querySelectorAll("[data-i]").forEach((box) => {
      atualizaSelo(box);
      ["marca", "nome", "cod", "q"].forEach((k) => box.querySelector(`[data-${k}]`).addEventListener("input", () => atualizaSelo(box)));
      box.querySelector("[data-busca]").addEventListener("change", (e) => {
        const [marca, ...resto] = e.target.value.split(" · "); const nome = resto.join(" · ");
        const b = base.find((x) => x.marca === marca && x.nome === nome) || meus.find((x) => (x.marca || "") === marca && x.nome === nome);
        if (!b) return;
        box.querySelector("[data-marca]").value = b.marca || ""; box.querySelector("[data-nome]").value = b.nome;
        if (b.codigo) box.querySelector("[data-cod]").value = b.codigo;
        if (b.tonalidade) box.querySelector("[data-tom]").value = b.tonalidade;
        if (b.acabamento) box.querySelector("[data-acab]").value = b.acabamento;
        e.target.value = ""; atualizaSelo(box);
      });
    });
    r.querySelectorAll("[data-tira]").forEach((b) => (b.onclick = () => b.closest("[data-i]").remove()));
    r.querySelectorAll("[data-hex]").forEach((inp) => (inp.onchange = () => (inp.closest("[data-i]").querySelector("[data-tom]").value = tonalidadeDe(inp.value))));
    r.querySelectorAll("[data-ler]").forEach((b) => (b.onclick = async () => {
      const box = b.closest("[data-i]"), it = itens[+box.dataset.i];
      b.textContent = "Lendo… (a primeira vez demora um pouco)"; b.disabled = true;
      try {
        const res = await leRotulo(it.canvas);
        if (res.marca && !box.querySelector("[data-marca]").value) box.querySelector("[data-marca]").value = res.marca;
        if (res.codigo && !box.querySelector("[data-cod]").value) box.querySelector("[data-cod]").value = res.codigo;
        if (res.nome && !box.querySelector("[data-nome]").value) box.querySelector("[data-nome]").value = res.nome;
        b.textContent = res.marca || res.nome || res.codigo ? "✓ Rótulo lido — confira" : "Não consegui ler. Procure na lista ou preencha.";
        atualizaSelo(box);
      } catch { b.textContent = "Não consegui ler. Procure na lista ou preencha."; }
    }));
    r.querySelector("[data-salvar]").onclick = async () => {
      const caixas = [...r.querySelectorAll("[data-i]")];
      if (!caixas.length) return fechaFolha();
      const pub = r.querySelector("[data-pub]").checked;
      const bt = r.querySelector("[data-salvar]"); bt.disabled = true;
      let novos = 0, somados = 0;
      for (const box of caixas) {
        const it = itens[+box.dataset.i], g = (k) => box.querySelector(`[data-${k}]`).value.trim();
        bt.textContent = `Salvando ${novos + somados + 1} de ${caixas.length}…`;
        const n = Number(g("q") || 0);
        try {
          if (box.dataset.meu) {
            const p = meus.find((x) => x.id === box.dataset.meu);
            if (n > 0) await q(sb.from("ad_movimentos").insert({ profissional_id: st.prof.id, produto_id: p.id, tipo: "compra", quantidade: n, motivo: "Reposição por foto" }));
            const upd = {}; if (!p.foto_url) upd.foto_url = await enviaFoto(it.canvas); if (pub && p.catalogo !== "publicado") upd.catalogo = "publicado";
            if (Object.keys(upd).length) await q(sb.from("ad_produtos").update(upd).eq("id", p.id));
            somados++; continue;
          }
          const foto = await enviaFoto(it.canvas);
          const nome = g("nome") || `${g("tom")} ${novos + 1}`;
          const novo = await q(sb.from("ad_produtos").insert({ profissional_id: st.prof.id, categoria: "Esmaltes", nome, marca: g("marca") || null, codigo: g("cod") || null, linha: it.linha || null,
            tonalidade: g("tom"), acabamento: g("acab"), cor_hex: g("hex"), foto_url: foto, quantidade: 0, minimo: 1, catalogo: pub ? "publicado" : "revisao" }).select().single());
          if (n > 0) await q(sb.from("ad_movimentos").insert({ profissional_id: st.prof.id, produto_id: novo.id, tipo: "compra", quantidade: n, motivo: "Cadastro por foto" }));
          if (g("marca") && g("nome")) await sb.from("ad_esmaltes_base").insert({ marca: g("marca"), nome: g("nome"), codigo: g("cod") || null, linha: it.linha || null, tonalidade: g("tom"), acabamento: g("acab"), cor_hex: g("hex"), cor_aprox: false, foto_url: foto, fonte: "salao" });
          novos++;
        } catch { /* segue para os próximos */ }
      }
      BASE = null;
      toast([novos ? `${novos} novo${novos > 1 ? "s" : ""}` : "", somados ? `${somados} somado${somados > 1 ? "s" : ""} ao estoque` : ""].filter(Boolean).join(" · ") + (pub && novos ? " · já no site" : "") + " 💅");
      festa(); fechaFolha(); st.estSeg = "esmaltes"; vaiPara("estoque");
    };
  });
}

// Lista de esmaltes do Brasil: marca "Tenho" nos que existem no salão
async function daLista() {
  const [meus, base] = await Promise.all([q(sb.from("ad_produtos").select("*").eq("categoria", "Esmaltes")), baseEsmaltes()]);
  const itens = [...meus.map((p) => ({ ...p, _meu: p })), ...base.filter((b) => !procura(b, meus, []).meu).map((b) => ({ ...b, _meu: null }))]
    .sort((a, b) => (a.marca || "~").localeCompare(b.marca || "~") || a.nome.localeCompare(b.nome));
  const marcas = [...new Set(itens.map((p) => p.marca || "Sem marca"))];
  let marca = "", soTenho = false, busca = "";
  const tem = (p) => p._meu && Number(p._meu.quantidade) > 0;
  abreFolha(cabFolha("Esmaltes do Brasil", "Marque os que você tem no salão. Os marcados aparecem no site; desmarcar deixa como indisponível.") + `
    <div class="busca">${IC.busca}<input class="campo" data-b placeholder="Buscar marca ou nome" autocomplete="off"></div>
    <div class="opcoes" data-marcas style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;margin-bottom:8px">${["", ...marcas].map((m) => `<button type="button" data-m="${esc(m)}" class="${m === "" ? "on" : ""}" style="flex:none">${esc(m || "Todas")}</button>`).join("")}</div>
    <label class="interruptor" style="margin-bottom:8px"><span>Mostrar só os que tenho</span><input type="checkbox" data-so></label>
    <p class="pequeno" data-conta style="margin:0 4px 8px"></p>
    <div class="lista" data-l></div>
    <div class="cartao" style="margin-top:12px"><b>Não achou um esmalte?</b><p class="pequeno" style="margin:2px 0 10px">Adicione aqui. Ele entra na lista para sempre.</p>
      <div class="grade2"><input class="campo" data-nm list="marcas-esm3" placeholder="Marca"><input class="campo" data-nn placeholder="Nome da cor"></div>
      <datalist id="marcas-esm3">${MARCAS.map((m) => `<option value="${m}">`).join("")}</datalist>
      <div class="grade2" style="margin-top:8px"><select class="campo" data-nt><option value="">Tonalidade</option>${TONS.map((t) => `<option>${t}</option>`).join("")}</select><button class="btn prim" data-novo>Adicionar e marcar</button></div>
      <p class="pequeno" style="margin-top:8px">Quer foto? Use "Por foto" na tela de esmaltes.</p></div>`, (r) => {
    const desenha = () => {
      const t = norm(busca).split(" ").filter(Boolean);
      const lista = itens.filter((p) => (!marca || (p.marca || "Sem marca") === marca) && (!soTenho || tem(p)) && t.every((w) => norm([p.marca, p.nome, p.codigo, p.linha, p.tonalidade].join(" ")).includes(w)));
      r.querySelector("[data-conta]").textContent = `${itens.filter(tem).length} marcados no salão · mostrando ${Math.min(lista.length, 200)} de ${lista.length}`;
      r.querySelector("[data-l]").innerHTML = lista.slice(0, 200).map((p) => { const i = itens.indexOf(p); return `<label class="item" style="cursor:pointer">${swatch(p._meu || p, 38)}<div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${esc(p.marca || "")}${p.linha ? " · " + esc(p.linha) : ""}${p.tonalidade ? " · " + esc(p.tonalidade) : ""}</div></div>
        ${tem(p) ? `<span class="qtd-mini"><button type="button" data-menos="${i}">−</button><b>${qtd(p._meu.quantidade)}</b><button type="button" data-mais="${i}">+</button></span>` : ""}
        <input type="checkbox" data-k="${i}" ${tem(p) ? "checked" : ""} style="width:24px;height:24px;accent-color:var(--acc);flex:none"></label>`; }).join("") || `<div class="vazio">Nada encontrado. Adicione abaixo.</div>`;
      r.querySelectorAll("[data-k]").forEach((c) => (c.onchange = () => marca1(itens[+c.dataset.k], c.checked ? "tenho" : "acabou")));
      r.querySelectorAll("[data-mais]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); marca1(itens[+b.dataset.mais], "mais"); }));
      r.querySelectorAll("[data-menos]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); marca1(itens[+b.dataset.menos], "menos"); }));
    };
    const marca1 = async (p, acao) => {
      try {
        if (!p._meu) {
          p._meu = await q(sb.from("ad_produtos").insert({ profissional_id: st.prof.id, categoria: "Esmaltes", nome: p.nome, marca: p.marca, codigo: p.codigo, linha: p.linha,
            tonalidade: p.tonalidade, acabamento: p.acabamento, cor_hex: p.cor_hex, foto_url: p.foto_url, quantidade: 0, minimo: 1, catalogo: "publicado" }).select().single());
        }
        const atual = Number(p._meu.quantidade);
        const nova = acao === "tenho" ? Math.max(1, atual) : acao === "acabou" ? 0 : acao === "mais" ? atual + 1 : Math.max(0, atual - 1);
        if (nova !== atual) await q(sb.from("ad_movimentos").insert({ profissional_id: st.prof.id, produto_id: p._meu.id, tipo: "ajuste", quantidade: nova, motivo: acao === "acabou" ? "Acabou" : "Lista de esmaltes" }));
        if (nova > 0 && p._meu.catalogo !== "publicado") { await q(sb.from("ad_produtos").update({ catalogo: "publicado" }).eq("id", p._meu.id)); p._meu.catalogo = "publicado"; }
        p._meu.quantidade = nova;
      } catch { /* erro já avisado */ }
      desenha(); if (st.aba === "estoque") telaEstoque();
    };
    r.querySelector("[data-b]").oninput = (e) => { busca = e.target.value; desenha(); };
    r.querySelector("[data-so]").onchange = (e) => { soTenho = e.target.checked; desenha(); };
    r.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { marca = b.dataset.m; r.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === b)); desenha(); }));
    r.querySelector("[data-novo]").onclick = async () => {
      const m = r.querySelector("[data-nm]").value.trim(), n = r.querySelector("[data-nn]").value.trim(), t = r.querySelector("[data-nt]").value || null;
      if (!m || !n) return toast("Escreva a marca e o nome.", 1);
      const ja = procura({ marca: m, nome: n }, itens.map((x) => x._meu || x), []).meu;
      if (ja) { const it = itens.find((x) => (x._meu || x) === ja); return marca1(it, "tenho").then(() => toast("Esse já estava na lista. Marcado!")); }
      const cor = t ? { Vermelhos: "#B3262E", Vinhos: "#5E1A2A", Rosas: "#E58FA8", Nudes: "#D8B49B", Marrons: "#6B4232", Brancos: "#F4F1EA", Pretos: "#141414", Cinzas: "#8C8C8C", Azuis: "#2F5FA8", Verdes: "#3D7A4E", Roxos: "#6B3F8F", Laranjas: "#E2733A", Amarelos: "#E8C547" }[t] || null : null;
      await sb.from("ad_esmaltes_base").insert({ marca: m, nome: n, tonalidade: t, cor_hex: cor, fonte: "salao" });
      const novo = { marca: m, nome: n, tonalidade: t, cor_hex: cor, _meu: null };
      itens.unshift(novo); BASE = null;
      r.querySelector("[data-nm]").value = ""; r.querySelector("[data-nn]").value = "";
      await marca1(novo, "tenho"); toast(`${n} adicionado e marcado.`);
    };
    desenha();
  });
}

// Conferir e publicar as cores em revisão
async function conferirCatalogo() {
  const lista = (await produtos()).filter((p) => p.categoria === "Esmaltes" && p.catalogo === "revisao");
  abreFolha(cabFolha("Conferir antes de publicar", "Marque as cores que podem aparecer no site.") + `
    <div class="lista">${lista.map((p) => `<label class="item" style="cursor:pointer">${swatch(p, 44)}<div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${esc(p.marca || "Sem marca")}${p.codigo ? " · " + esc(p.codigo) : ""} · ${esc(p.tonalidade || "")} · ${esc(p.acabamento || "")}</div></div><input type="checkbox" data-id="${p.id}" checked style="width:22px;height:22px;accent-color:var(--acc)"></label>`).join("")}</div>
    <button class="btn prim cheio" data-pub>Publicar no site</button>`, (r) => {
    r.querySelector("[data-pub]").onclick = async () => {
      const ids = [...r.querySelectorAll("[data-id]:checked")].map((c) => c.dataset.id);
      if (!ids.length) return toast("Nenhuma cor marcada.", 1);
      await q(sb.from("ad_produtos").update({ catalogo: "publicado" }).in("id", ids));
      toast(`${ids.length} cor${ids.length > 1 ? "es publicadas" : " publicada"} no site! ✨`); festa(); fechaFolha(); telaEstoque();
    };
  });
}

// Cores escolhidas pela cliente (usado no detalhe do agendamento)
function htmlCores(cores, atuais) {
  if (!cores || !cores.length) return "";
  const porId = Object.fromEntries((atuais || []).map((p) => [p.id, p]));
  return `<div class="cartao"><h2>Cores escolhidas</h2>${cores.map((c) => { const p = porId[c.id]; const acabou = p && Number(p.quantidade) <= 0;
    return `<div class="linha" style="padding:8px 0;border-top:1px solid var(--line)">${c.foto ? `<img src="${esc(c.foto)}" alt="" style="width:46px;height:46px;border-radius:12px;object-fit:cover">` : `<span style="width:46px;height:46px;border-radius:12px;background:${esc(c.cor || "#999")}"></span>`}
      <div class="cresce"><b>${esc(c.nome)}</b><div class="pequeno">${esc(c.papel || "")}${c.marca ? " · " + esc(c.marca) : ""}${c.codigo ? " · " + esc(c.codigo) : ""}</div></div>${acabou ? '<span class="chip cancelado">Acabou</span>' : ""}</div>`; }).join("")}
    ${cores.some((c) => porId[c.id] && Number(porId[c.id].quantidade) <= 0) ? `<p class="pequeno" style="color:var(--red);margin-top:8px">Uma cor acabou. Fale com a cliente e ofereça outra.</p>` : ""}</div>`;
}
