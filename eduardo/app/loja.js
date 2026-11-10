// Eduardo Hair Gestão — LOJA: produtos que o salão vende (aparecem no site), estoque, pedidos e vendas no balcão
// Substitui o estoque de esmaltes do app da Nay. Usa as tabelas ad_loja e ad_pedidos.

IC.caixa = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/></svg>';
IC.camera = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';
IC.carrinho = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>';
IC.grafico = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
IC.engrenagem = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';
IC.esmalte = IC.caixa;
IC.tag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>';

const CATS_LOJA = ["Shampoo", "Condicionador", "Máscara", "Leave-in", "Óleo e sérum", "Finalizador", "Protetor térmico", "Tratamento", "Coloração", "Kit", "Acessórios", "Outros"];
const STATUS_PED = { novo: ["Novo", "marcado"], separado: ["Separado", "chegou"], entregue: ["Entregue", "confirmado"], cancelado: ["Cancelado", "cancelado"] };
const precoAtual = (p) => (p.preco_promo != null && p.preco_promo !== "" ? Number(p.preco_promo) : Number(p.preco));
const dispLoja = (p) => (Number(p.quantidade) <= 0 ? ["Esgotado", "cancelado"] : Number(p.quantidade) <= Number(p.minimo) ? ["Acabando", "marcado"] : ["Em estoque", "confirmado"]);
const fotoProd = (p, tam = 46) => p.foto_url
  ? `<img src="${esc(p.foto_url)}" alt="" loading="lazy" style="width:${tam}px;height:${tam}px;border-radius:14px;object-fit:cover;flex:none;border:1px solid var(--line2)">`
  : `<span style="width:${tam}px;height:${tam}px;border-radius:14px;flex:none;display:grid;place-items:center;background:var(--soft);color:var(--mute);border:1px solid var(--line2)">${IC.caixa}</span>`;
const placeholderProd = () => "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2A2433"/><path d="M38 22h24v10l6 8v38a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V40l6-8z" fill="#8A5DB8" opacity=".55"/><rect x="40" y="14" width="20" height="10" rx="3" fill="#5ED6C6" opacity=".7"/></svg>');

st.estSeg = st.estSeg || "produtos";
st.lojaBusca = ""; st.lojaCat = ""; st.pedFiltro = "abertos";

// ---------------------------------------------------------------------
// dados
// ---------------------------------------------------------------------
async function produtosLoja() { return q(sb.from("ad_loja").select("*").order("nome")); }
async function produtos() { return produtosLoja(); }
async function dadosLojaInicio() {
  const [produtos, pedidos] = await Promise.all([
    q(sb.from("ad_loja").select("id,nome,quantidade,minimo,no_site")),
    q(sb.from("ad_pedidos").select("id").eq("status", "novo")),
  ]);
  return { produtos, pedidos };
}
function resumoEstoque(d) {
  const lista = Array.isArray(d) ? d : d?.produtos || [];
  return { baixos: lista.filter((p) => Number(p.quantidade) <= Number(p.minimo)), vencendo: [], vencidos: [], revisao: [], pedidos: Array.isArray(d) ? [] : d?.pedidos || [] };
}
function htmlCores() { return ""; }

// ---------------------------------------------------------------------
// TELA LOJA
// ---------------------------------------------------------------------
async function telaEstoque() {
  const seg = st.estSeg === "pedidos" || st.estSeg === "vendas" ? st.estSeg : "produtos";
  const iniMes = isoDia().slice(0, 8) + "01";
  const [lista, peds] = await Promise.all([
    produtosLoja(),
    q(sb.from("ad_pedidos").select("*").order("criado_em", { ascending: false }).limit(150)),
  ]);
  const abertos = peds.filter((p) => p.status === "novo" || p.status === "separado");
  const novos = peds.filter((p) => p.status === "novo");
  const vendMes = peds.filter((p) => p.status !== "cancelado" && p.criado_em >= inicioDia(iniMes));
  const totalMes = vendMes.reduce((s, p) => s + Number(p.total), 0);
  let corpo = "";

  if (seg === "produtos") {
    const b = st.lojaBusca.toLowerCase();
    const cats = [...new Set(lista.map((p) => p.categoria || "Outros"))].sort((x, y) => (CATS_LOJA.indexOf(x) + 1 || 99) - (CATS_LOJA.indexOf(y) + 1 || 99));
    const filt = lista.filter((p) => (!st.lojaCat || (p.categoria || "Outros") === st.lojaCat) && (!b || [p.nome, p.marca, p.categoria].join(" ").toLowerCase().includes(b)));
    corpo = `
      <div class="grade2" style="margin-bottom:12px"><button class="btn prim" data-novo-prod>${IC.mais}Novo produto</button><button class="btn" data-balcao>${IC.dinheiro}Venda no balcão</button></div>
      ${lista.length ? `<div class="busca">${IC.busca}<input class="campo" id="busca-loja" placeholder="Buscar produto ou marca" value="${esc(st.lojaBusca)}" autocomplete="off"></div>` : ""}
      ${cats.length > 1 ? `<div class="opcoes" style="margin-bottom:12px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">${["", ...cats].map((c) => `<button type="button" data-cat="${esc(c)}" class="${st.lojaCat === c ? "on" : ""}" style="flex:none">${esc(c || "Todos")}</button>`).join("")}</div>` : ""}
      ${lista.length ? `<p class="pequeno" style="margin:0 4px 10px">${lista.length} produto${lista.length !== 1 ? "s" : ""} · ${lista.filter((p) => p.no_site).length} no site · <button class="link" data-ver-site>ver a loja no site ›</button></p>` : ""}
      ${filt.length ? `<div class="grade-esm">${filt.map((p) => { const d = dispLoja(p); const promo = p.preco_promo != null; return `<button class="esm" data-p="${p.id}">
          <div class="esm-foto"><img src="${p.foto_url ? esc(p.foto_url) : placeholderProd()}" alt="" loading="lazy"><span class="chip ${p.no_site ? d[1] : "cancelado"}">${p.no_site ? d[0] : "Fora do site"}</span>${p.destaque ? `<span class="chip concluido" style="left:auto;right:6px">★</span>` : ""}</div>
          <b>${esc(p.nome)}</b><small>${esc(p.marca || p.categoria || "")}</small>
          <small><b style="font-size:14.5px;color:var(--ink)">${brl(precoAtual(p))}</b>${promo ? ` <s>${brl(p.preco)}</s>` : ""} · ${p.quantidade} un</small></button>`; }).join("")}</div>`
        : `<div class="vazio">${IC.caixa}<div>${lista.length ? "Nenhum produto encontrado." : "Cadastre os produtos que você vende (shampoo, máscara, óleo, finalizador…). Com foto e preço, eles aparecem no site e os clientes podem comprar."}</div></div>`}`;
  } else if (seg === "pedidos") {
    const F = { abertos: abertos, entregues: peds.filter((p) => p.status === "entregue"), cancelados: peds.filter((p) => p.status === "cancelado") };
    const mostra = F[st.pedFiltro] || abertos;
    corpo = `
      <div class="opcoes" style="margin-bottom:12px">${[["abertos", `Em aberto (${abertos.length})`], ["entregues", "Entregues"], ["cancelados", "Cancelados"]].map(([k, t]) => `<button type="button" data-pf="${k}" class="${st.pedFiltro === k ? "on" : ""}">${t}</button>`).join("")}</div>
      ${mostra.length ? `<div class="lista">${mostra.map(cartaoPedido).join("")}</div>`
        : `<div class="vazio">${IC.carrinho}<div>${st.pedFiltro === "abertos" ? "Nenhum pedido em aberto. Quando um cliente comprar pelo site, o pedido aparece aqui e você recebe um aviso no celular." : "Nada por aqui ainda."}</div></div>`}`;
  } else {
    const porProd = {};
    vendMes.forEach((p) => p.itens.forEach((it) => { const k = it.nome; porProd[k] = porProd[k] || { n: 0, v: 0 }; porProd[k].n += Number(it.qtd); porProd[k].v += Number(it.qtd) * Number(it.preco); }));
    const top = Object.entries(porProd).sort((a, b) => b[1].v - a[1].v).slice(0, 8);
    const custoMes = vendMes.reduce((s, p) => s + p.itens.reduce((t, it) => { const pr = lista.find((x) => x.id === it.id); return t + (pr?.custo ? Number(pr.custo) * Number(it.qtd) : 0); }, 0), 0);
    const valorEstoque = lista.reduce((s, p) => s + Math.max(Number(p.quantidade), 0) * precoAtual(p), 0);
    corpo = `
      <div class="cartao"><h2>Este mês</h2>
        <div class="linha entre" style="padding:6px 0"><span>Vendas</span><b>${vendMes.length}</b></div>
        <div class="linha entre" style="padding:6px 0"><span>Faturado com produtos</span><b>${brl(totalMes)}</b></div>
        ${custoMes ? `<div class="linha entre" style="padding:6px 0"><span>Lucro estimado</span><b>${brl(totalMes - custoMes)}</b></div>` : `<p class="pequeno" style="margin-top:4px">Preencha o "custo" dos produtos para ver o lucro.</p>`}
        <div class="linha entre" style="padding:6px 0"><span>Estoque (valor de venda)</span><b>${brl(valorEstoque)}</b></div>
      </div>
      ${top.length ? `<div class="cartao"><h2>Mais vendidos no mês</h2>${top.map(([n, x]) => `<div class="linha entre" style="padding:6px 0;gap:10px"><span class="cresce">${esc(n)} <span class="pequeno">· ${x.n} un</span></span><b>${brl(x.v)}</b></div>`).join("")}</div>` : `<div class="vazio">${IC.grafico}<div>As vendas do mês aparecem aqui.</div></div>`}`;
  }

  const r = tela(`
    <div class="resumo-val">
      <div><small>Pedidos novos</small><b class="${novos.length ? "neg" : ""}">${novos.length}</b></div>
      <div><small>Acabando</small><b>${lista.filter((p) => Number(p.quantidade) <= Number(p.minimo)).length}</b></div>
      <div><small>Vendido no mês</small><b>${brl(totalMes)}</b></div>
    </div>
    <div class="seg" id="seg-loja"><button data-s="produtos" class="${seg === "produtos" ? "on" : ""}">Produtos</button><button data-s="pedidos" class="${seg === "pedidos" ? "on" : ""}">Pedidos${novos.length ? ` (${novos.length})` : ""}</button><button data-s="vendas" class="${seg === "vendas" ? "on" : ""}">Vendas</button></div>
    ${corpo}`);
  r.querySelectorAll("#seg-loja [data-s]").forEach((b) => (b.onclick = () => { st.estSeg = b.dataset.s; telaEstoque(); }));
  r.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => fichaLoja(b.dataset.p)));
  r.querySelectorAll("[data-ped]").forEach((b) => (b.onclick = () => detalhePedido(b.dataset.ped)));
  r.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => { st.lojaCat = b.dataset.cat; telaEstoque(); }));
  r.querySelectorAll("[data-pf]").forEach((b) => (b.onclick = () => { st.pedFiltro = b.dataset.pf; telaEstoque(); }));
  r.querySelector("[data-novo-prod]")?.addEventListener("click", () => editaProdutoLoja(null));
  r.querySelector("[data-balcao]")?.addEventListener("click", () => novaVendaBalcao());
  r.querySelector("[data-ver-site]")?.addEventListener("click", () => window.open(SITE + "#loja", "_blank"));
  $("busca-loja")?.addEventListener("input", (e) => { st.lojaBusca = e.target.value; clearTimeout(st._tb); st._tb = setTimeout(async () => { await telaEstoque(); const i = $("busca-loja"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); });
}

function cartaoPedido(p) {
  const s = STATUS_PED[p.status] || ["", ""];
  const qtd = p.itens.reduce((t, it) => t + Number(it.qtd), 0);
  return `<button class="item" data-ped="${p.id}">
    <div class="ic">${IC.carrinho}</div>
    <div class="cresce"><b>${esc(p.cliente_nome)} <span class="pequeno">#${esc(p.codigo)}</span></b>
      <div class="pequeno">${qtd} ${qtd > 1 ? "itens" : "item"} · ${dataCurta(p.criado_em)} às ${hora(p.criado_em)}${p.origem === "balcao" ? " · balcão" : ""}</div></div>
    <div style="text-align:right;display:grid;gap:4px;justify-items:end"><b>${brl(p.total)}</b><span class="chip ${s[1]}">${s[0]}</span>${p.pago ? `<span class="chip pago">Pago</span>` : ""}</div></button>`;
}

// ---------------------------------------------------------------------
// FICHA DO PRODUTO
// ---------------------------------------------------------------------
async function fichaLoja(id) {
  const p = await q(sb.from("ad_loja").select("*").eq("id", id).single());
  const d = dispLoja(p);
  abreFolha(cabFolha(esc(p.nome), esc([p.marca, p.categoria].filter(Boolean).join(" · "))) + `
    <div class="cartao" style="padding:0;overflow:hidden"><img src="${p.foto_url ? esc(p.foto_url) : placeholderProd()}" alt="" style="width:100%;max-height:300px;object-fit:cover;display:block"></div>
    <div class="cartao">
      <div class="linha entre"><span>Preço no site</span><b style="font-size:20px">${brl(precoAtual(p))}${p.preco_promo != null ? ` <s class="pequeno">${brl(p.preco)}</s>` : ""}</b></div>
      <div class="linha entre" style="margin-top:6px"><span>Estoque</span><b>${p.quantidade} un <span class="chip ${d[1]}">${d[0]}</span></b></div>
      ${p.custo != null ? `<div class="linha entre" style="margin-top:6px"><span>Custo · lucro por unidade</span><b>${brl(p.custo)} · ${brl(precoAtual(p) - Number(p.custo))}</b></div>` : ""}
      <div class="linha entre" style="margin-top:6px"><span>No site</span><b>${p.no_site ? "Sim, aparece para os clientes" : "Não (escondido)"}</b></div>
      ${p.descricao ? `<p class="pequeno" style="margin-top:10px">${esc(p.descricao)}</p>` : ""}
    </div>
    <div class="grade2"><button class="btn prim" data-entrada>${IC.mais}Entrada</button><button class="btn" data-ajuste>Ajustar quantidade</button></div>
    <div class="grade2" style="margin-top:8px"><button class="btn" data-editar>Editar</button><button class="btn" data-site>${p.no_site ? "Tirar do site" : "Mostrar no site"}</button></div>
    <button class="btn cheio" data-zap style="margin-top:8px">${IC.zap}Divulgar no WhatsApp</button>`, (r) => {
    r.querySelector("[data-editar]").onclick = () => editaProdutoLoja(p);
    r.querySelector("[data-entrada]").onclick = () => ajustaQtd(p, "entrada");
    r.querySelector("[data-ajuste]").onclick = () => ajustaQtd(p, "ajuste");
    r.querySelector("[data-site]").onclick = async () => { await q(sb.from("ad_loja").update({ no_site: !p.no_site }).eq("id", p.id)); toast(p.no_site ? "Produto escondido do site." : "Produto aparece no site."); fichaLoja(p.id); if (st.aba === "estoque") telaEstoque(); };
    r.querySelector("[data-zap]").onclick = () => abreZap("https://wa.me/?text=" + encodeURIComponent(`✨ ${p.nome}${p.marca ? " · " + p.marca : ""} por ${brl(precoAtual(p))} no salão Eduardo Teccarelli Hair!\nCompre pelo site e retire no salão: ${SITE}#loja`));
  });
}

function ajustaQtd(p, modo) {
  abreFolha(cabFolha(modo === "entrada" ? "Entrada de estoque" : "Ajustar quantidade", esc(p.nome)) + `
    <div class="cartao">
      <p class="pequeno">Hoje: <b>${p.quantidade} un</b></p>
      <label class="f">${modo === "entrada" ? "Quantas unidades chegaram?" : "Quantidade certa agora"}</label>
      <input class="campo" data-n type="number" inputmode="numeric" min="0" step="1" value="${modo === "entrada" ? "" : p.quantidade}">
      ${modo === "entrada" ? `<label class="f">Quanto pagou no total? <small class="mudo">(opcional, entra nas despesas)</small></label><input class="campo" data-pago type="number" inputmode="decimal" min="0" step="0.01" placeholder="R$">` : ""}
    </div>
    <button class="btn prim cheio" data-ok>Salvar</button>`, (r) => {
    r.querySelector("[data-n]").focus();
    r.querySelector("[data-ok]").onclick = async () => {
      const n = Math.round(Number(r.querySelector("[data-n]").value || 0));
      if (n < 0 || (modo === "entrada" && n === 0)) return toast("Digite a quantidade.", 1);
      const nova = modo === "entrada" ? Number(p.quantidade) + n : n;
      await q(sb.from("ad_loja").update({ quantidade: nova }).eq("id", p.id));
      const pago = Number(r.querySelector("[data-pago]")?.value || 0);
      if (pago > 0) await q(sb.from("ad_lancamentos").insert({ profissional_id: st.prof.id, tipo: "saida", descricao: `Compra: ${p.nome} (${n} un)`.slice(0, 80), categoria: "Compra de produtos", valor: pago, data: isoDia() }));
      if (modo === "entrada" && !p.custo && n > 0 && pago > 0) await q(sb.from("ad_loja").update({ custo: Math.round((pago / n) * 100) / 100 }).eq("id", p.id));
      toast("Estoque atualizado: " + nova + " un."); fichaLoja(p.id); if (st.aba === "estoque") telaEstoque();
    };
  });
}
function registraCompra() {
  produtosLoja().then((lista) => {
    if (!lista.length) return editaProdutoLoja(null);
    abreFolha(cabFolha("Entrada de estoque", "Escolha o produto que chegou") + `<div class="lista">${lista.map((p) => `<button class="item" data-e="${p.id}">${fotoProd(p, 40)}<div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${p.quantidade} un</div></div><span class="seta">›</span></button>`).join("")}</div>`,
      (r) => r.querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => ajustaQtd(lista.find((x) => x.id === b.dataset.e), "entrada"))));
  });
}

// ---------------------------------------------------------------------
// CADASTRO / EDIÇÃO
// ---------------------------------------------------------------------
function editaProdutoLoja(p) {
  let fotoNova = null;
  const num = (v) => (v == null ? "" : String(Number(v)));
  abreFolha(cabFolha(p ? "Editar produto" : "Novo produto", p ? "" : "Com foto e preço ele aparece no site para os clientes comprarem.") + `
    <div class="cartao">
      <label class="foto-prod" style="display:block;cursor:pointer;border:1.5px dashed var(--line2);border-radius:18px;overflow:hidden;aspect-ratio:1;max-width:220px;margin:0 auto;position:relative;background:var(--soft)">
        <span data-prev style="position:absolute;inset:0;display:grid;place-items:center;color:var(--mute);text-align:center;font-size:13.5px">${p?.foto_url ? `<img src="${esc(p.foto_url)}" style="width:100%;height:100%;object-fit:cover">` : `<span>${IC.camera}<br>Toque para tirar<br>ou escolher a foto</span>`}</span>
        <input type="file" accept="image/*" data-foto hidden></label>
      <label class="f">Nome do produto</label><input class="campo" data-nome maxlength="80" value="${esc(p?.nome || "")}" placeholder="Ex.: Máscara de hidratação 250g">
      <div class="grade2"><div><label class="f">Marca</label><input class="campo" data-marca maxlength="60" value="${esc(p?.marca || "")}" placeholder="Ex.: Wella"></div>
        <div><label class="f">Categoria</label><input class="campo" data-cat list="cats-loja" maxlength="40" value="${esc(p?.categoria || "")}" placeholder="Ex.: Máscara"></div></div>
      <datalist id="cats-loja">${CATS_LOJA.map((c) => `<option value="${c}">`).join("")}</datalist>
      <label class="f">Descrição <small class="mudo">(aparece no site)</small></label><textarea class="campo" data-desc maxlength="300" placeholder="Para que serve, tamanho, tipo de cabelo…">${esc(p?.descricao || "")}</textarea>
      <div class="grade2"><div><label class="f">Preço de venda</label><input class="campo" data-preco type="number" inputmode="decimal" min="0" step="0.01" value="${num(p?.preco)}" placeholder="R$"></div>
        <div><label class="f">Promoção <small class="mudo">(opcional)</small></label><input class="campo" data-promo type="number" inputmode="decimal" min="0" step="0.01" value="${num(p?.preco_promo)}" placeholder="R$"></div></div>
      <div class="grade2"><div><label class="f">${p ? "Estoque" : "Quantidade que tem"}</label><input class="campo" data-q type="number" inputmode="numeric" min="0" step="1" value="${p ? p.quantidade : 1}" ${p ? "disabled" : ""}></div>
        <div><label class="f">Avisar quando tiver</label><input class="campo" data-min type="number" inputmode="numeric" min="0" step="1" value="${p ? p.minimo : 1}"></div></div>
      ${p ? `<p class="pequeno" style="margin-top:6px">Para mudar o estoque, use Entrada ou Ajustar quantidade na ficha.</p>` : ""}
      <label class="f">Custo por unidade <small class="mudo">(opcional, só você vê: calcula o lucro)</small></label><input class="campo" data-custo type="number" inputmode="decimal" min="0" step="0.01" value="${num(p?.custo)}" placeholder="R$">
      <label class="check" style="display:flex;gap:10px;align-items:center;margin-top:14px"><input type="checkbox" data-site ${!p || p.no_site ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--acc)"> Mostrar no site para venda</label>
      <label class="check" style="display:flex;gap:10px;align-items:center;margin-top:10px"><input type="checkbox" data-dest ${p?.destaque ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--acc)"> Destaque (aparece primeiro)</label>
    </div>
    <button class="btn prim cheio" data-salvar>Salvar</button>
    ${p ? `<button class="btn perigo cheio" data-excluir style="margin-top:10px">Excluir produto</button>` : ""}`, (r) => {
    r.querySelector("[data-foto]").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const img = await carregaImagem(f);
        const W = img.naturalWidth, H = img.naturalHeight, lado = Math.min(W, H);
        fotoNova = paraCanvas(img, 900, [(W - lado) / 2, (H - lado) / 2, lado, lado]);
        r.querySelector("[data-prev]").innerHTML = `<img src="${fotoNova.toDataURL("image/jpeg", .75)}" style="width:100%;height:100%;object-fit:cover">`;
      } catch { toast("Não consegui abrir essa foto. Tente outra.", 1); }
    };
    r.querySelector("[data-salvar]").onclick = async () => {
      const g = (k) => r.querySelector(`[data-${k}]`).value.trim();
      const d = { nome: g("nome"), marca: g("marca") || null, categoria: g("cat") || null, descricao: g("desc") || null,
        preco: Number(g("preco") || 0), preco_promo: g("promo") ? Number(g("promo")) : null, custo: g("custo") ? Number(g("custo")) : null,
        minimo: Math.max(0, Math.round(Number(g("min") || 0))), no_site: r.querySelector("[data-site]").checked, destaque: r.querySelector("[data-dest]").checked };
      if (!d.nome) return toast("Escreva o nome do produto.", 1);
      if (!d.preco) return toast("Coloque o preço de venda.", 1);
      if (d.preco_promo != null && d.preco_promo >= d.preco) return toast("O preço da promoção precisa ser menor que o preço normal.", 1);
      const bt = r.querySelector("[data-salvar]"); bt.disabled = true; bt.textContent = "Salvando…";
      try {
        if (fotoNova) d.foto_url = await enviaFoto(fotoNova);
        let id = p?.id;
        if (p) await q(sb.from("ad_loja").update(d).eq("id", p.id));
        else id = (await q(sb.from("ad_loja").insert({ ...d, profissional_id: st.prof.id, quantidade: Math.max(0, Math.round(Number(g("q") || 0))) }).select().single())).id;
        toast(d.no_site ? "Salvo! Já aparece no site." : "Salvo."); fichaLoja(id); if (st.aba === "estoque") telaEstoque();
      } catch { bt.disabled = false; bt.textContent = "Salvar"; }
    };
    r.querySelector("[data-excluir]")?.addEventListener("click", async () => {
      if (!confirm(`Excluir "${p.nome}"? Ele sai do site. Pedidos antigos continuam guardados.`)) return;
      await q(sb.from("ad_loja").delete().eq("id", p.id)); toast("Produto excluído."); fechaFolha(); if (st.aba === "estoque") telaEstoque();
    });
  });
}

// ---------------------------------------------------------------------
// PEDIDOS
// ---------------------------------------------------------------------
function msgPedido(p, tipo) {
  const n = primeiroNome(p.cliente_nome);
  const itens = p.itens.map((it) => `• ${it.qtd}x ${it.nome} — ${brl(it.qtd * it.preco)}`).join("\n");
  const end = st.prof.endereco ? `\n📍 ${st.prof.endereco}` : "";
  return ({
    recebido: `Olá, ${n}! ✨ Recebi seu pedido #${p.codigo}:\n\n${itens}\n\n*Total: ${brl(p.total)}*\n\nVou separar e te aviso quando estiver pronto para retirar no salão.${end}`,
    pronto: `Oi, ${n}! 🛍️ Seu pedido #${p.codigo} já está separado e pronto para retirar no salão.\n\n*Total: ${brl(p.total)}* (pagamento no Pix, dinheiro ou cartão).${end}\n\nTe espero! Eduardo Teccarelli Hair`,
    obrigado: `Obrigado pela compra, ${n}! 💜 Qualquer dúvida sobre como usar os produtos, é só me chamar. Eduardo Teccarelli Hair`,
  })[tipo];
}
async function detalhePedido(id) {
  const p = await q(sb.from("ad_pedidos").select("*").eq("id", id).single());
  const s = STATUS_PED[p.status];
  const zap = (t) => `https://wa.me/${zapNum(p.cliente_whatsapp)}?text=${encodeURIComponent(msgPedido(p, t))}`;
  abreFolha(cabFolha(`Pedido #${esc(p.codigo)}`, `${dataLonga(p.criado_em)} às ${hora(p.criado_em)}${p.origem === "balcao" ? " · venda no balcão" : " · pelo site"}`) + `
    <div class="cartao">
      <div class="linha entre"><div><b style="font-size:17px">${esc(p.cliente_nome)}</b><div class="pequeno">${fmtTel(p.cliente_whatsapp)}</div></div><div style="display:grid;gap:4px;justify-items:end"><span class="chip ${s[1]}">${s[0]}</span>${p.pago ? `<span class="chip pago">Pago${p.forma ? " · " + FORMAS[p.forma] : ""}</span>` : `<span class="chip marcado">A receber</span>`}</div></div>
      ${p.observacao ? `<p class="pequeno" style="margin-top:8px">📝 ${esc(p.observacao)}</p>` : ""}
    </div>
    <div class="cartao">${p.itens.map((it) => `<div class="linha" style="gap:10px;padding:7px 0;border-top:1px solid var(--line)">${fotoProd({ foto_url: it.foto }, 44)}<div class="cresce"><b>${esc(it.nome)}</b><div class="pequeno">${it.qtd} × ${brl(it.preco)}${it.marca ? " · " + esc(it.marca) : ""}</div></div><b>${brl(it.qtd * it.preco)}</b></div>`).join("")}
      <div class="linha entre" style="padding-top:10px;border-top:1px solid var(--line2);margin-top:4px"><b>Total</b><b style="font-size:19px">${brl(p.total)}</b></div></div>
    ${p.status !== "cancelado" ? `
      <div class="grade2">
        ${p.status === "novo" ? `<button class="btn prim" data-st="separado">Separado ✓</button>` : `<button class="btn" data-st="novo">Voltar para novo</button>`}
        ${p.status !== "entregue" ? `<button class="btn ${p.status === "separado" ? "prim" : ""}" data-st="entregue">Entregue ✓</button>` : `<button class="btn" data-st="separado">Não entregue</button>`}
      </div>
      ${!p.pago ? `<button class="btn prim cheio" data-pagar style="margin-top:8px">${IC.dinheiro}Registrar pagamento</button>` : ""}
      <div class="tit-linha" style="margin-top:14px"><h2>Mensagens prontas</h2></div>
      <div class="lista">
        <a class="item" target="_blank" rel="noopener" href="${zap("recebido")}"><div class="ic">${IC.zap}</div><div class="cresce"><b>Recebi seu pedido</b><div class="pequeno">Confirma os itens e o total</div></div><span class="seta">›</span></a>
        <a class="item" target="_blank" rel="noopener" href="${zap("pronto")}"><div class="ic">${IC.zap}</div><div class="cresce"><b>Pronto para retirar</b><div class="pequeno">Avisa que já está separado</div></div><span class="seta">›</span></a>
        <a class="item" target="_blank" rel="noopener" href="${zap("obrigado")}"><div class="ic">${IC.zap}</div><div class="cresce"><b>Obrigado pela compra</b><div class="pequeno">Depois de entregar</div></div><span class="seta">›</span></a>
      </div>
      <button class="btn perigo cheio" data-cancelar style="margin-top:12px">Cancelar pedido</button>
      <p class="pequeno" style="text-align:center;margin-top:6px">Ao cancelar, os produtos voltam para o estoque.</p>`
    : `<button class="btn cheio" data-st="novo">Reabrir pedido</button><p class="pequeno" style="text-align:center;margin-top:6px">Ao reabrir, os produtos saem do estoque de novo.</p>`}`, (r) => {
    r.querySelectorAll("[data-st]").forEach((b) => (b.onclick = async () => {
      await q(sb.from("ad_pedidos").update({ status: b.dataset.st }).eq("id", p.id));
      toast(STATUS_PED[b.dataset.st][0] + "."); detalhePedido(p.id); if (st.aba === "estoque") telaEstoque();
      if (b.dataset.st === "separado" && p.origem === "site" && confirm("Avisar o cliente no WhatsApp que está pronto para retirar?")) abreZap(zap("pronto"));
    }));
    r.querySelector("[data-pagar]")?.addEventListener("click", () => pagaPedido(p));
    r.querySelector("[data-cancelar]")?.addEventListener("click", async () => {
      if (!confirm(`Cancelar o pedido #${p.codigo}? Os produtos voltam para o estoque.`)) return;
      await q(sb.from("ad_pedidos").update({ status: "cancelado" }).eq("id", p.id));
      toast("Pedido cancelado."); detalhePedido(p.id); if (st.aba === "estoque") telaEstoque();
    });
  });
}
function pagaPedido(p) {
  abreFolha(cabFolha("Registrar pagamento", `Pedido #${esc(p.codigo)} · ${brl(p.total)}`) + `
    <div class="cartao"><label class="f" style="margin-top:0">Como pagou?</label>
      <div class="opcoes" data-formas>${Object.entries(FORMAS).map(([k, t], i) => `<button type="button" data-f="${k}" class="${i === 0 ? "on" : ""}">${t}</button>`).join("")}</div>
      <label class="check" style="display:flex;gap:10px;align-items:center;margin-top:14px"><input type="checkbox" data-entregue ${p.status !== "entregue" ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--acc)"> Marcar como entregue também</label>
    </div>
    <button class="btn prim cheio" data-ok>Confirmar ${brl(p.total)}</button>`, (r) => {
    let forma = "pix";
    r.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { forma = b.dataset.f; r.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelector("[data-ok]").onclick = async (e) => {
      e.target.disabled = true;
      try {
        const valor = Number(p.total);
        if (valor > 0) await q(sb.from("ad_pagamentos").insert({ profissional_id: st.prof.id, pedido_id: p.id, cliente_id: p.cliente_id, valor, forma, taxa: Math.round(valor * taxaPct(forma)) / 100, observacao: `Loja · pedido #${p.codigo}` }));
        const upd = { pago: true, forma }; if (r.querySelector("[data-entregue]").checked) upd.status = "entregue";
        await q(sb.from("ad_pedidos").update(upd).eq("id", p.id));
        toast("Pagamento registrado no financeiro."); detalhePedido(p.id); if (st.aba === "estoque") telaEstoque();
        if (typeof festa === "function") festa();
      } catch { e.target.disabled = false; }
    };
  });
}

// venda direto no balcão (sem passar pelo site)
async function novaVendaBalcao() {
  const lista = (await produtosLoja()).filter((p) => p.quantidade > 0);
  if (!lista.length) { toast("Cadastre produtos com estoque primeiro.", 1); return editaProdutoLoja(null); }
  const cart = {};
  abreFolha(cabFolha("Venda no balcão", "Escolha os produtos e as quantidades") + `
    <div class="lista" data-itens>${lista.map((p) => `<div class="item" style="cursor:default">${fotoProd(p, 42)}<div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${brl(precoAtual(p))} · ${p.quantidade} em estoque</div></div>
      <div class="linha" style="gap:6px"><button class="btn mini" data-menos="${p.id}">−</button><b data-n="${p.id}" style="min-width:18px;text-align:center">0</b><button class="btn mini" data-mais="${p.id}">+</button></div></div>`).join("")}</div>
    <div class="cartao"><label class="f" style="margin-top:0">Cliente <small class="mudo">(opcional)</small></label><input class="campo" data-cli placeholder="Nome">
      <label class="f">WhatsApp <small class="mudo">(opcional)</small></label><input class="campo" data-zap type="tel" inputmode="tel" placeholder="(31) 99999-9999">
      <label class="f">Como pagou?</label><div class="opcoes">${Object.entries(FORMAS).map(([k, t], i) => `<button type="button" data-f="${k}" class="${i === 0 ? "on" : ""}">${t}</button>`).join("")}</div></div>
    <button class="btn prim cheio" data-ok>Registrar venda · <span data-tot>R$ 0,00</span></button>`, (r) => {
    let forma = "pix";
    const tot = () => lista.reduce((s, p) => s + (cart[p.id] || 0) * precoAtual(p), 0);
    const atualiza = () => { lista.forEach((p) => (r.querySelector(`[data-n="${p.id}"]`).textContent = cart[p.id] || 0)); r.querySelector("[data-tot]").textContent = brl(tot()); };
    r.querySelectorAll("[data-mais]").forEach((b) => (b.onclick = () => { const p = lista.find((x) => x.id === b.dataset.mais); cart[p.id] = Math.min((cart[p.id] || 0) + 1, p.quantidade); atualiza(); }));
    r.querySelectorAll("[data-menos]").forEach((b) => (b.onclick = () => { cart[b.dataset.menos] = Math.max((cart[b.dataset.menos] || 0) - 1, 0); atualiza(); }));
    r.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { forma = b.dataset.f; r.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelector("[data-ok]").onclick = async (e) => {
      const itens = lista.filter((p) => cart[p.id] > 0).map((p) => ({ id: p.id, nome: p.nome, marca: p.marca, preco: precoAtual(p), qtd: cart[p.id], foto: p.foto_url }));
      if (!itens.length) return toast("Escolha pelo menos um produto.", 1);
      const total = itens.reduce((s, it) => s + it.preco * it.qtd, 0);
      let zap = r.querySelector("[data-zap]").value.replace(/\D/g, "");
      if (zap.length < 10) zap = String(st.prof.whatsapp || "0000000000").replace(/\D/g, "");
      const nome = r.querySelector("[data-cli]").value.trim() || "Cliente no balcão";
      e.target.disabled = true;
      try {
        const ped = await q(sb.from("ad_pedidos").insert({ profissional_id: st.prof.id, cliente_nome: nome.slice(0, 80), cliente_whatsapp: zap.slice(-13), itens, total, status: "entregue", pago: true, forma, origem: "balcao" }).select().single());
        for (const it of itens) { const p = lista.find((x) => x.id === it.id); await q(sb.from("ad_loja").update({ quantidade: Number(p.quantidade) - it.qtd }).eq("id", p.id)); }
        if (total > 0) await q(sb.from("ad_pagamentos").insert({ profissional_id: st.prof.id, pedido_id: ped.id, valor: total, forma, taxa: Math.round(total * taxaPct(forma)) / 100, observacao: `Loja · balcão #${ped.codigo}` }));
        toast("Venda registrada: " + brl(total)); if (typeof festa === "function") festa();
        fechaFolha(); if (st.aba === "estoque") telaEstoque();
      } catch { e.target.disabled = false; }
    };
  });
}

// aviso na hora quando chega pedido novo (com o app aberto)
let canalLoja = null;
function vigiaPedidos() {
  if (canalLoja || !st.prof) return;
  canalLoja = sb.channel("edu-loja").on("postgres_changes", { event: "INSERT", schema: "public", table: "ad_pedidos", filter: `profissional_id=eq.${st.prof.id}` }, (m) => {
    if (m.new.origem !== "site") return;
    toast(`🛍️ Novo pedido de ${m.new.cliente_nome}: ${brl(m.new.total)}`);
    if (st.aba === "estoque" || st.aba === "inicio") atualizaTela();
  }).subscribe();
}
setInterval(() => { if (st.prof && !canalLoja) vigiaPedidos(); }, 3000);

// ---------------------------------------------------------------------
// FOTOS: carregar, reduzir e enviar (também usado nas fotos de clientes)
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
async function enviaFoto(canvas) {
  const blob = await new Promise((ok) => canvas.toBlob(ok, "image/webp", 0.82));
  const nome = `${st.prof.id}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from("ad-fotos").upload(nome, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) { toast("Não foi possível enviar a foto: " + error.message, 1); throw error; }
  return sb.storage.from("ad-fotos").getPublicUrl(nome).data.publicUrl;
}
