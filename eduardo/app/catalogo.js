// Eduardo Hair Gestão — CATÁLOGO DE PRODUTOS (marcas do mundo todo) e CADASTRO POR FOTO
// 1) "Do catálogo": o Eduardo só marca os produtos que tem e coloca preço e quantidade.
// 2) "Por foto": tira foto da embalagem; a IA (se configurada) ou a leitura do rótulo no celular identifica
//    marca, nome, tipo e tamanho, procura no catálogo e já deixa tudo preenchido.
// Produtos novos identificados entram em ad_produtos_base e passam a fazer parte do catálogo.

let CATALOGO = null;
const normC = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();
const chaveProd = (marca, nome) => normC(marca) + "|" + normC(nome);
const APELIDOS = { "l oreal professionnel": ["loreal", "l oreal", "serie expert"], "schwarzkopf professional": ["schwarzkopf", "bonacure"], "wella professionals": ["wella"], "alfaparf milano": ["alfaparf"], "kerastase": ["kerastase", "kerastase paris"], "sebastian professional": ["sebastian"], "felps profissional": ["felps"], "itallian hairtech": ["itallian", "italian hairtech"], "garnier fructis": ["fructis"], "lola cosmetics": ["lola"], "widi care": ["widi"], "bumble and bumble": ["bumble"], "tresemme": ["tresemme"], "babyliss pro": ["babyliss"] };

function descPadrao(p) {
  const t = { Shampoo: "Shampoo", Condicionador: "Condicionador", "Máscara": "Máscara de tratamento", "Leave-in": "Leave-in (sem enxágue)", "Óleo e sérum": "Óleo/sérum finalizador", Finalizador: "Finalizador", "Protetor térmico": "Protetor térmico", Tratamento: "Tratamento capilar", "Coloração": "Coloração", Kit: "Kit", "Acessórios": "Acessório" }[p.categoria] || "Produto";
  return `${t} ${p.marca}${p.linha && !["Acessórios", "Coloração", "Kits", "Styling", "Treatment", "Bond Building"].includes(p.linha) ? ` da linha ${p.linha}` : ""}${p.tamanho ? `, ${p.tamanho}` : ""}.`;
}
async function catalogo() {
  if (CATALOGO) return CATALOGO;
  const [arq, extra, cache] = await Promise.all([
    fetch("catalogo.json").then((r) => r.json()).catch(() => ({ c: [], d: [] })),
    sb.from("ad_produtos_base").select("*").limit(3000).then((r) => r.data || []),
    sb.from("ad_foto_cache").select("q,url").limit(5000).then((r) => r.data || []),
  ]);
  const fotos = new Map(cache.map((x) => [x.q, x.url]));
  const lista = [];
  arq.d.forEach(([marca, linha, itens]) => itens.forEach(([n, c, t]) => lista.push({ marca, linha, nome: n[0] === "=" ? n.slice(1) : `${linha} ${n}`, categoria: arq.c[c], tamanho: t })));
  extra.forEach((p) => lista.push({ id: p.id, marca: p.marca, linha: p.linha, nome: p.nome, categoria: p.categoria, tamanho: p.tamanho, descricao: p.descricao, foto: p.foto_url, novo: true }));
  const vistos = new Set();
  CATALOGO = lista.filter((p) => { const k = chaveProd(p.marca, p.nome); if (vistos.has(k)) return false; vistos.add(k); return true; })
    .map((p) => ({ ...p, foto: p.foto || fotos.get(chaveFoto(textoFoto(p))) || null, k: chaveProd(p.marca, p.nome), busca: normC([p.marca, p.nome, p.categoria, p.tamanho].join(" ")) }));
  return CATALOGO;
}
async function contribuiCatalogo(p) {
  if (!p.marca || !p.nome) return;
  const k = chaveProd(p.marca, p.nome);
  if ((await catalogo()).some((x) => x.k === k)) return;
  const { error } = await sb.from("ad_produtos_base").insert({ marca: p.marca.slice(0, 60), linha: p.linha || null, nome: p.nome.slice(0, 120), categoria: p.categoria || null, tamanho: p.tamanho || null, descricao: p.descricao || null, origem: p.origem || "salao" });
  if (!error) CATALOGO.push({ ...p, k, busca: normC([p.marca, p.nome, p.categoria, p.tamanho].join(" ")), novo: true });
}

// ---------------------------------------------------------------------
// 1) ESCOLHER DO CATÁLOGO
// ---------------------------------------------------------------------
async function escolheDoCatalogo() {
  abreFolha(cabFolha("Catálogo de produtos", "Carregando…") + `<div class="vazio">${IC.caixa}<div>Abrindo o catálogo…</div></div>`);
  const [cat, meus] = await Promise.all([catalogo(), produtosLoja()]);
  const tenho = new Set(meus.map((p) => chaveProd(p.marca, p.nome)));
  const marcas = Object.entries(cat.reduce((o, p) => ((o[p.marca] = (o[p.marca] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1]).map(([m]) => m);
  const sel = new Map();
  const f = { busca: "", marca: "", cat: "", ver: 60 };
  abreFolha(cabFolha("Catálogo de produtos", `${cat.length} produtos de ${marcas.length} marcas. Marque os que você tem.`) + `
    <div class="busca" style="margin-bottom:8px">${IC.busca}<input class="campo" data-b placeholder="Buscar: marca, linha ou produto (ex.: truss, olaplex 3)" autocomplete="off"></div>
    <div class="opcoes" data-cats style="margin-bottom:8px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">${["", ...CATS_LOJA.filter((c) => cat.some((p) => p.categoria === c))].map((c) => `<button type="button" data-c="${esc(c)}" class="${c ? "" : "on"}" style="flex:none">${esc(c || "Todos")}</button>`).join("")}</div>
    <select class="campo" data-m style="margin-bottom:10px"><option value="">Todas as marcas</option>${marcas.map((m) => `<option>${esc(m)}</option>`).join("")}</select>
    <div data-lista></div>
    <p class="pequeno" style="text-align:center;margin:10px 0">Não achou? Cadastre <button class="link" data-foto>por foto</button> ou <button class="link" data-mao>à mão</button>.</p>
    <div style="position:sticky;bottom:0;padding:10px 0 4px;background:linear-gradient(transparent,var(--solido) 30%)"><button class="btn prim cheio" data-ok disabled>Marque os produtos que você tem</button></div>`, (r) => {
    const desenha = () => {
      const b = normC(f.busca), termos = b.split(" ").filter(Boolean);
      const lista = cat.filter((p) => (!f.marca || p.marca === f.marca) && (!f.cat || p.categoria === f.cat) && termos.every((t) => p.busca.includes(t)));
      const mostra = lista.slice(0, f.ver);
      r.querySelector("[data-lista]").innerHTML = mostra.length ? `<div class="lista">${mostra.map((p) => {
        const ja = tenho.has(p.k), on = sel.has(p.k);
        return `<label class="item" style="${ja ? "opacity:.55" : ""}"><img src="${p.foto ? esc(p.foto) : ilustraProduto(p)}" loading="lazy" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none">
          <div class="cresce"><b>${esc(p.nome)}</b><div class="pequeno">${esc(p.marca)} · ${esc(p.categoria || "")}${p.tamanho ? " · " + esc(p.tamanho) : ""}${ja ? " · <b>você já tem</b>" : ""}</div></div>
          <input type="checkbox" data-k="${esc(p.k)}" ${on || ja ? "checked" : ""} ${ja ? "disabled" : ""} style="width:24px;height:24px;flex:none;accent-color:var(--acc)"></label>`;
      }).join("")}</div>${lista.length > f.ver ? `<button class="btn cheio" data-mais style="margin-top:10px">Ver mais (${lista.length - f.ver})</button>` : ""}`
        : `<div class="vazio">${IC.busca}<div>Nenhum produto com essa busca. Cadastre por foto ou à mão.</div></div>`;
      r.querySelectorAll("[data-k]").forEach((c) => (c.onchange = () => { const p = cat.find((x) => x.k === c.dataset.k); c.checked ? sel.set(p.k, p) : sel.delete(p.k); atualiza(); }));
      r.querySelector("[data-mais]")?.addEventListener("click", () => { f.ver += 60; desenha(); });
    };
    const atualiza = () => { const bt = r.querySelector("[data-ok]"); bt.disabled = !sel.size; bt.textContent = sel.size ? `Adicionar ${sel.size} produto${sel.size > 1 ? "s" : ""} ›` : "Marque os produtos que você tem"; };
    let t; r.querySelector("[data-b]").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { f.busca = e.target.value; f.ver = 60; desenha(); }, 200); };
    r.querySelector("[data-m]").onchange = (e) => { f.marca = e.target.value; f.ver = 60; desenha(); };
    r.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { f.cat = b.dataset.c; f.ver = 60; r.querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x === b)); desenha(); }));
    r.querySelector("[data-foto]").onclick = cadastroPorFoto;
    r.querySelector("[data-mao]").onclick = () => editaProdutoLoja(null);
    r.querySelector("[data-ok]").onclick = () => revisaNovos([...sel.values()].map((p) => ({ ...p, descricao: p.descricao || descPadrao(p), base: true })));
    desenha();
  });
}

// ---------------------------------------------------------------------
// REVISÃO: preço, quantidade e foto de cada produto antes de salvar
// ---------------------------------------------------------------------
function revisaNovos(itens) {
  itens.forEach((it) => { it.qtd = it.qtd ?? 1; });
  abreFolha(cabFolha(`Preço e quantidade`, `${itens.length} produto${itens.length > 1 ? "s" : ""}. Coloque o preço de venda: com preço ele já aparece no site.`) + `
    <div data-itens>${itens.map((it, i) => `<div class="cartao" data-i="${i}">
      <div class="linha" style="gap:12px;align-items:flex-start">
        <label style="cursor:pointer;flex:none;position:relative;width:76px;height:76px;border-radius:16px;overflow:hidden;border:1.5px dashed var(--line2);display:grid;place-items:center;background:var(--soft);color:var(--mute)" title="Foto">
          <span data-prev>${it.canvas ? `<img src="${it.canvas.toDataURL("image/jpeg", .7)}" style="width:76px;height:76px;object-fit:cover;display:block">` : it.foto ? `<img src="${esc(it.foto)}" style="width:76px;height:76px;object-fit:cover;display:block">` : `<span style="display:grid;place-items:center;gap:2px;font-size:11px"><span style="width:26px;height:26px;display:block">${IC.camera}</span>Foto</span>`}</span>
          <input type="file" accept="image/*" data-fot hidden></label>
        <div class="cresce" style="min-width:0">
          ${it.base ? `<b>${esc(it.nome)}</b><div class="pequeno">${esc(it.marca)} · ${esc(it.categoria || "")}${it.tamanho ? " · " + esc(it.tamanho) : ""}</div>`
            : `<input class="campo" data-nome value="${esc(it.nome || "")}" placeholder="Nome do produto" style="margin-bottom:6px">
               <div class="grade2"><input class="campo" data-marca value="${esc(it.marca || "")}" placeholder="Marca"><input class="campo" data-cat list="cats-loja2" value="${esc(it.categoria || "")}" placeholder="Tipo"></div>
               ${it.sugestoes?.length ? `<div class="pequeno" style="margin-top:6px">É algum destes? ${it.sugestoes.map((s, j) => `<button type="button" class="link" data-sug="${j}">${esc(s.marca)} ${esc(s.nome)}</button>`).join(" · ")}</div>` : ""}
               ${it.ia ? `<div class="pequeno" style="margin-top:4px">🤖 Identificado pela IA${it.confianca ? ` (${Math.round(it.confianca * 100)}% de certeza)` : ""}. Confira.</div>` : it.ocr ? `<div class="pequeno" style="margin-top:4px">📷 Lido do rótulo. Confira o nome.</div>` : ""}`}
        </div>
        <button class="link" data-tira aria-label="Tirar" style="font-size:18px">✕</button>
      </div>
      <div class="grade2" style="margin-top:8px">
        <div><label class="f" style="margin-top:4px">Preço de venda</label><input class="campo" data-preco type="number" inputmode="decimal" min="0" step="0.01" placeholder="R$" value="${it.preco ?? ""}"></div>
        <div><label class="f" style="margin-top:4px">Quantidade</label><input class="campo" data-qtd type="number" inputmode="numeric" min="0" step="1" value="${it.qtd}"></div>
      </div></div>`).join("")}</div>
    <datalist id="cats-loja2">${CATS_LOJA.map((c) => `<option value="${c}">`).join("")}</datalist>
    <button class="btn prim cheio" data-salvar>Salvar ${itens.length} produto${itens.length > 1 ? "s" : ""}</button>
    <p class="pequeno" style="text-align:center;margin-top:6px">Sem preço o produto fica guardado, mas fora do site até você colocar o preço.</p>`, (r) => {
    const lerCampos = () => r.querySelectorAll("[data-i]").forEach((el) => {
      const it = itens[el.dataset.i]; const v = (k) => el.querySelector(`[data-${k}]`)?.value.trim();
      if (!it.base) { it.nome = v("nome"); it.marca = v("marca"); it.categoria = v("cat"); }
      it.preco = v("preco") === "" ? null : Number(v("preco")); it.qtd = Math.max(0, Math.round(Number(v("qtd") || 0)));
    });
    r.querySelectorAll("[data-i]").forEach((el) => {
      const it = itens[el.dataset.i];
      el.querySelector("[data-fot]").onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        const img = await carregaImagem(f); const W = img.naturalWidth, H = img.naturalHeight, lado = Math.min(W, H);
        it.canvas = paraCanvas(img, 900, [(W - lado) / 2, (H - lado) / 2, lado, lado]);
        el.querySelector("[data-prev]").innerHTML = `<img src="${it.canvas.toDataURL("image/jpeg", .7)}" style="width:76px;height:76px;object-fit:cover;display:block">`;
      };
      el.querySelector("[data-tira]").onclick = () => { lerCampos(); itens.splice(Number(el.dataset.i), 1); itens.length ? revisaNovos(itens) : (fechaFolha(), telaEstoque()); };
      el.querySelectorAll("[data-sug]").forEach((b) => (b.onclick = () => { lerCampos(); const s = it.sugestoes[b.dataset.sug]; Object.assign(it, { nome: s.nome, marca: s.marca, linha: s.linha, categoria: s.categoria, tamanho: s.tamanho, descricao: s.descricao || descPadrao(s), sugestoes: [] }); revisaNovos(itens); }));
    });
    r.querySelector("[data-salvar]").onclick = async (e) => {
      lerCampos();
      if (itens.some((it) => !it.nome)) return toast("Falta o nome de algum produto.", 1);
      e.target.disabled = true;
      let ok = 0, semPreco = 0;
      for (const it of itens) {
        e.target.textContent = `Salvando ${ok + 1} de ${itens.length}…`;
        try {
          const foto = it.canvas ? await enviaFoto(it.canvas) : it.foto || (await fotoDaNet(textoFoto(it))).url || null;
          const d = { profissional_id: st.prof.id, nome: it.nome.slice(0, 80), marca: it.marca || null, categoria: it.categoria || null,
            descricao: (it.descricao || (it.marca ? descPadrao({ ...it, categoria: it.categoria }) : null))?.slice(0, 300) || null,
            preco: it.preco || 0, quantidade: it.qtd, minimo: 1, no_site: !!it.preco, foto_url: foto, base_id: it.id || null };
          await q(sb.from("ad_loja").insert(d));
          if (!it.base) contribuiCatalogo({ marca: it.marca, linha: it.linha, nome: it.nome, categoria: it.categoria, tamanho: it.tamanho, descricao: it.descricao, origem: it.ia ? "ia" : "salao" }).catch(() => {});
          ok++; if (!it.preco) semPreco++;
        } catch {}
      }
      toast(`${ok} produto${ok !== 1 ? "s" : ""} adicionado${ok !== 1 ? "s" : ""}!${semPreco ? ` ${semPreco} sem preço ficaram fora do site.` : " Já aparecem no site."}`);
      fechaFolha(); st.estSeg = "produtos"; if (st.aba === "estoque") telaEstoque(); else vaiPara("estoque");
    };
  });
}

// ---------------------------------------------------------------------
// 2) CADASTRO POR FOTO
// ---------------------------------------------------------------------
async function cadastroPorFoto() {
  if (st.iaSemChave === undefined) { try { const { data } = await sb.functions.invoke("ad-ia-produto", { body: { checar: true } }); st.iaSemChave = !data?.tem_chave; } catch { st.iaSemChave = true; } }
  abreFolha(cabFolha("Cadastrar por foto", "Fotografe a embalagem com o nome bem visível") + `
    <div class="cartao">
      <label class="btn prim cheio" style="cursor:pointer">${IC.camera}Tirar foto agora<input type="file" accept="image/*" capture="environment" data-cam hidden></label>
      <label class="btn cheio" style="cursor:pointer;margin-top:8px">${IC.caixa}Escolher fotos da galeria<input type="file" accept="image/*" multiple data-gal hidden></label>
      <label class="check" style="display:flex;gap:10px;align-items:center;margin-top:14px"><input type="checkbox" data-grupo style="width:22px;height:22px;accent-color:var(--acc)"> Tem vários produtos na mesma foto</label>
      <p class="pequeno" style="margin-top:10px">Pode escolher várias fotos de uma vez (uma por produto). ${st.iaSemChave ? "O app lê o texto do rótulo e procura no catálogo." : "A IA lê a embalagem e preenche marca, nome, tipo e tamanho."} Você só confere e coloca o preço.</p>
    </div>`, (r) => {
    const vai = (e) => { const fs = [...e.target.files]; if (fs.length) processaFotos(fs, r.querySelector("[data-grupo]").checked); };
    r.querySelector("[data-cam]").onchange = vai; r.querySelector("[data-gal]").onchange = vai;
  });
}
function carregandoFoto(txt) { abreFolha(`<div class="vazio" style="padding:50px 16px"><div class="giro" style="width:42px;height:42px;margin:0 auto 14px;border-radius:50%;border:3px solid var(--line2);border-top-color:var(--acc);animation:gira .8s linear infinite"></div><b>${txt}</b><div class="pequeno" style="margin-top:6px">Pode levar alguns segundos.</div></div><style>@keyframes gira{to{transform:rotate(360deg)}}</style>`); }

async function iaProduto(canvas, grupo) {
  if (st.iaSemChave) return null;
  try {
    const imagem = paraCanvas(canvas, grupo ? 1500 : 1000).toDataURL("image/jpeg", 0.82);
    const { data, error } = await sb.functions.invoke("ad-ia-produto", { body: { imagem, grupo } });
    if (error) return null;
    if (data?.erro === "sem_chave") { st.iaSemChave = true; return null; }
    return data?.produtos || null;
  } catch { return null; }
}
let leitorRotulo = null;
async function textoDoRotulo(canvas) {
  try {
    if (!window.Tesseract) await new Promise((ok, erro) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; s.onload = ok; s.onerror = erro; document.head.appendChild(s); });
    if (!leitorRotulo) leitorRotulo = await Tesseract.createWorker(["por", "eng"]);
    const { data } = await leitorRotulo.recognize(paraCanvas(canvas, 1400));
    return data.text || "";
  } catch { return ""; }
}
// procura no catálogo pelo texto lido (marca + palavras do nome + tipo)
const TIPOS = { Shampoo: ["shampoo", "champu", "bain", "wash", "lavante"], Condicionador: ["condicionador", "conditioner", "rinse", "fondant", "lait"], "Máscara": ["mascara", "mask", "masque", "masquintense", "tratamento intensivo"], "Leave-in": ["leave in", "leave", "sem enxague"], "Óleo e sérum": ["oleo", "oil", "huile", "serum", "elixir"], Finalizador: ["finalizador", "creme para pentear", "ativador", "gel", "spray", "mousse", "pomada"], "Protetor térmico": ["termico", "thermique", "thermal", "heat"], "Coloração": ["coloracao", "tintura", "color", "oxidante", "descolorante"] };
function procuraNoCatalogo(texto, cat, dica = {}) {
  const t = " " + normC(texto + " " + [dica.marca, dica.nome, dica.linha].filter(Boolean).join(" ")) + " ";
  const marcas = [...new Set(cat.map((p) => p.marca))];
  const temMarca = (m) => { const n = normC(m); return t.includes(" " + n + " ") || (n.length > 4 && t.includes(n)) || (APELIDOS[n] || []).some((a) => t.includes(" " + a)); };
  const achadas = marcas.filter(temMarca);
  const tipo = Object.entries(TIPOS).find(([, ws]) => ws.some((w) => t.includes(" " + w)))?.[0] || dica.categoria;
  const pontos = (p) => {
    const pal = normC(p.linha && p.nome.startsWith(p.linha) ? p.nome : p.nome).split(" ").filter((w) => w.length >= 3);
    let s = pal.filter((w) => t.includes(" " + w + " ") || t.includes(" " + w)).length / Math.max(pal.length, 1) * 10;
    if (achadas.includes(p.marca)) s += 6;
    if (tipo && p.categoria === tipo) s += 3;
    if (p.tamanho && t.includes(normC(p.tamanho).replace(" ", ""))) s += 1;
    return s;
  };
  const base = achadas.length ? cat.filter((p) => achadas.includes(p.marca)) : cat;
  const ord = base.map((p) => [p, pontos(p)]).sort((a, b) => b[1] - a[1]).filter(([, s]) => s >= (achadas.length ? 7 : 6));
  const tam = (t.match(/(\d{2,4}) ?(ml|g|kg|l)\b/) || []).slice(1).join("");
  return { melhor: ord[0]?.[0] || null, sugestoes: ord.slice(0, 4).map(([p]) => p), marca: achadas[0] || null, tipo, tamanho: tam || null };
}
async function processaFotos(arquivos, grupo) {
  const cat = await catalogo(), itens = [];
  for (let i = 0; i < arquivos.length; i++) {
    carregandoFoto(arquivos.length > 1 ? `Lendo foto ${i + 1} de ${arquivos.length}…` : "Identificando o produto…");
    let img; try { img = await carregaImagem(arquivos[i]); } catch { continue; }
    const cv = paraCanvas(img, 1600);
    const W = img.naturalWidth, H = img.naturalHeight, lado = Math.min(W, H);
    const fotoQuadrada = paraCanvas(img, 900, [(W - lado) / 2, (H - lado) / 2, lado, lado]);
    const ia = await iaProduto(cv, grupo);
    if (ia && ia.length) {
      ia.forEach((p) => {
        let foto = fotoQuadrada;
        if (grupo && p.caixa) { const [x, y, w, h] = p.caixa, l = Math.max(w * W, h * H) * 1.08, cx = (x + w / 2) * W, cy = (y + h / 2) * H; foto = paraCanvas(img, 900, [Math.max(0, cx - l / 2), Math.max(0, cy - l / 2), Math.min(l, W), Math.min(l, H)]); }
        const m = procuraNoCatalogo("", cat, p);
        const conhecido = m.melhor && p.marca && normC(m.melhor.marca) === normC(p.marca) ? m.melhor : null;
        itens.push(conhecido
          ? { ...conhecido, descricao: p.descricao || conhecido.descricao || descPadrao(conhecido), ia: true, confianca: p.confianca, canvas: foto, sugestoes: m.sugestoes.filter((x) => x !== conhecido).slice(0, 3) }
          : { marca: p.marca, linha: p.linha, nome: p.nome, categoria: p.categoria, tamanho: p.tamanho, descricao: p.descricao, ia: true, confianca: p.confianca, canvas: foto, sugestoes: m.sugestoes.slice(0, 3) });
      });
      continue;
    }
    // sem IA: lê o texto do rótulo no próprio celular
    const texto = await textoDoRotulo(cv);
    const m = procuraNoCatalogo(texto, cat);
    if (m.melhor) itens.push({ ...m.melhor, descricao: m.melhor.descricao || descPadrao(m.melhor), ocr: true, canvas: fotoQuadrada, sugestoes: m.sugestoes.slice(1) });
    else {
      const linhas = texto.split(/\n/).map((x) => x.trim()).filter((x) => /[a-zà-ú]{3,}/i.test(x) && x.length <= 40);
      const nome = (linhas.sort((a, b) => b.replace(/[^a-zà-ú ]/gi, "").length - a.replace(/[^a-zà-ú ]/gi, "").length)[0] || "").replace(/[^\p{L}\d &'+-]/gu, "").trim();
      itens.push({ marca: m.marca, nome: nome ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase() : "", categoria: m.tipo, tamanho: m.tamanho, ocr: true, canvas: fotoQuadrada, sugestoes: m.sugestoes });
    }
  }
  if (!itens.length) { toast("Não consegui ler as fotos. Tente de novo com mais luz.", 1); return cadastroPorFoto(); }
  revisaNovos(itens);
}
