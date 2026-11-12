// Eduardo Hair Gestão — FIADO: cliente leva agora e paga depois; o app lembra no dia de cobrar
"use strict";

const fiadosAbertos = () => q(sb.from("ad_fiados").select("*").is("pago_em", null).order("cobrar_em"));
const diasAte = (iso) => Math.round((meioDia(iso) - meioDia(isoDia())) / 864e5);
const quandoCobrar = (iso) => {
  const d = diasAte(iso);
  if (d === 0) return { txt: "Cobrar hoje", cor: "var(--acc)" };
  if (d < 0) return { txt: `Atrasado ${-d} dia${d < -1 ? "s" : ""}`, cor: "var(--alerta)" };
  if (d === 1) return { txt: "Cobrar amanhã", cor: "" };
  return { txt: `Cobrar em ${dataCurta(meioDia(iso).toISOString())}`, cor: "" };
};
const proxDia5 = () => { const h = isoDia(); const [y, m] = h.split("-").map(Number); const d = new Date(Date.UTC(y, m, 5)); return d.toISOString().slice(0, 10); };

// ---------------------------------------------------------------------
// lançar um fiado (de um atendimento, de uma cliente ou avulso)
// ---------------------------------------------------------------------
async function novoFiado({ a, cliente, valor, descricao } = {}) {
  const clientes = a || cliente ? [] : await q(sb.from("ad_clientes").select("id,nome,whatsapp,fiado_ok,bloqueado").order("nome"));
  let cli = cliente || (a ? { id: a.cliente_id, nome: a.cliente_nome, whatsapp: a.cliente_whatsapp } : null);
  let pago = 0;
  if (a) pago = (await q(sb.from("ad_pagamentos").select("valor").eq("agendamento_id", a.id))).reduce((s, p) => s + Number(p.valor), 0);
  const sugestao = valor ?? (a ? Math.max(Number(a.preco) - pago, 0) : "");
  const atalhos = [["7 dias", somaDias(isoDia(), 7)], ["15 dias", somaDias(isoDia(), 15)], ["30 dias", somaDias(isoDia(), 30)], ["Dia 5", proxDia5()]];
  const preferidas = clientes.filter((c) => c.fiado_ok);
  abreFolha(cabFolha("🤝 Fiado · paga depois", a ? `${esc(a.cliente_nome)} · ${esc(a.servico_nome)}` : "A cliente leva agora e paga depois. O app te avisa no dia de cobrar.") + `
    <div class="cartao">
      ${a || cliente ? `<p style="margin:0 0 4px"><b>${esc(cli.nome)}</b></p>` : `
        <label class="f">Cliente</label>
        ${preferidas.length ? `<div class="opcoes" data-pref style="margin-bottom:8px">${preferidas.map((c) => `<button type="button" data-pid="${c.id}">${esc(primeiroNome(c.nome))}</button>`).join("")}</div>` : ""}
        <input class="campo" data-cli list="fiado-clis" placeholder="Digite o nome" autocomplete="off">
        <datalist id="fiado-clis">${clientes.map((c) => `<option value="${esc(c.nome)}">`).join("")}</datalist>
        <label class="f">WhatsApp</label><input class="campo" data-zap inputmode="tel" placeholder="(31) 99999-9999">`}
      <label class="f">Valor (R$)</label>
      <input class="campo" data-valor type="number" inputmode="decimal" step="0.01" min="0" value="${sugestao || ""}" style="font-size:22px;font-weight:600">
      <label class="f">O que foi</label>
      <input class="campo" data-desc placeholder="Ex.: escova, shampoo" value="${esc(descricao || a?.servico_nome || "")}">
      <label class="f">Quando cobrar</label>
      <div class="opcoes" data-atalhos>${atalhos.map(([t, d], i) => `<button type="button" data-d="${d}" class="${i === 1 ? "on" : ""}">${t}</button>`).join("")}</div>
      <input class="campo" type="date" data-quando min="${isoDia()}" value="${atalhos[1][1]}" style="margin-top:8px">
      <p class="pequeno" style="margin-top:8px">🔔 Nesse dia, às 9h, chega um aviso no seu celular para cobrar. Se não pagar, o app lembra de novo a cada 3 dias.</p>
    </div>
    <button class="btn ouro cheio" data-salvar>Salvar fiado</button>`, (r) => {
    const $r = (x) => r.querySelector(x);
    const poeCli = (c) => { cli = c; $r("[data-cli]").value = c.nome; $r("[data-zap]").value = fmtTel(c.whatsapp); r.querySelectorAll("[data-pid]").forEach((b) => b.classList.toggle("on", b.dataset.pid === c.id)); };
    r.querySelectorAll("[data-pid]").forEach((b) => (b.onclick = () => poeCli(clientes.find((c) => c.id === b.dataset.pid))));
    $r("[data-cli]")?.addEventListener("input", (e) => { const c = clientes.find((x) => x.nome.toLowerCase() === e.target.value.trim().toLowerCase()); if (c) poeCli(c); else cli = null; });
    r.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => { $r("[data-quando]").value = b.dataset.d; r.querySelectorAll("[data-d]").forEach((x) => x.classList.toggle("on", x === b)); }));
    $r("[data-quando]").onchange = () => r.querySelectorAll("[data-d]").forEach((x) => x.classList.toggle("on", x.dataset.d === $r("[data-quando]").value));
    $r("[data-salvar]").onclick = async () => {
      const v = Number($r("[data-valor]").value), quando = $r("[data-quando]").value;
      const nome = cli?.nome || $r("[data-cli]")?.value.trim();
      const zap = cli?.whatsapp || ($r("[data-zap]")?.value || "").replace(/\D/g, "").replace(/^0+/, "") || null;
      if (!nome || nome.length < 2) return toast("Escolha a cliente.", 1);
      if (!(v > 0)) return toast("Informe o valor.", 1);
      if (!quando) return toast("Escolha o dia de cobrar.", 1);
      const { error } = await sb.from("ad_fiados").insert({
        profissional_id: st.prof.id, cliente_id: cli?.id || null, cliente_nome: nome, cliente_whatsapp: zap,
        valor: v, descricao: $r("[data-desc]").value.trim() || null, agendamento_id: a?.id || null, cobrar_em: quando,
      });
      if (error) return toast(erroMsg(error), 1);
      toast(`Fiado salvo. Te aviso dia ${dataCurta(meioDia(quando).toISOString())} 🔔`);
      if (a) detalheAg(a.id); else telaFiados();
      atualizaTela();
    };
  });
}

// ---------------------------------------------------------------------
// lista de fiados
// ---------------------------------------------------------------------
async function telaFiados() {
  const [abertos, pagos] = await Promise.all([
    fiadosAbertos(),
    q(sb.from("ad_fiados").select("*").not("pago_em", "is", null).order("pago_em", { ascending: false }).limit(15)),
  ]);
  const total = abertos.reduce((s, f) => s + Number(f.valor), 0);
  const vencidos = abertos.filter((f) => diasAte(f.cobrar_em) <= 0);
  const linha = (f, pago) => {
    const qd = quandoCobrar(f.cobrar_em);
    return `<button class="item" data-f="${f.id}"><div class="ic" style="${pago ? "background:var(--ok2);color:var(--ok)" : ""}">${pago ? "✓" : "🤝"}</div><div class="cresce"><b>${esc(f.cliente_nome)}</b><div class="pequeno">${esc(f.descricao || "")}${f.descricao ? " · " : ""}${pago ? `pago em ${dataCurta(f.pago_em)}` : `<span style="color:${qd.cor};font-weight:${qd.cor ? 700 : 400}">${qd.txt}</span>`}</div></div><b style="${pago ? "color:var(--ok)" : ""}">${brl(f.valor)}</b></button>`;
  };
  abreFolha(cabFolha("🤝 Fiado", "Quem levou agora e vai pagar depois") + `
    <div class="grade2">
      <div class="cartao" style="margin:0"><small class="pequeno">A receber</small><b style="display:block;font-size:22px">${brl(total)}</b><small class="pequeno">${abertos.length} fiado${abertos.length !== 1 ? "s" : ""}</small></div>
      <div class="cartao" style="margin:0"><small class="pequeno">Para cobrar já</small><b style="display:block;font-size:22px;color:${vencidos.length ? "var(--alerta)" : "inherit"}">${brl(vencidos.reduce((s, f) => s + Number(f.valor), 0))}</b><small class="pequeno">${vencidos.length} pessoa${vencidos.length !== 1 ? "s" : ""}</small></div>
    </div>
    <button class="btn ouro cheio" data-novo style="margin-top:12px">${IC.mais}Novo fiado</button>
    <div class="tit-linha"><h2>Em aberto</h2></div>
    ${abertos.length ? `<div class="lista">${abertos.map((f) => linha(f)).join("")}</div>` : `<div class="vazio">🤝<div>Ninguém devendo. Para lançar, toque em "Novo fiado" ou, ao registrar um pagamento, em "Vai pagar depois".</div></div>`}
    ${pagos.length ? `<div class="tit-linha"><h2>Pagos recentemente</h2></div><div class="lista">${pagos.map((f) => linha(f, true)).join("")}</div>` : ""}`, (r) => {
    r.querySelector("[data-novo]").onclick = () => novoFiado();
    r.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => fichaFiado([...abertos, ...pagos].find((f) => f.id === b.dataset.f))));
  });
}

function msgCobranca(f) {
  const p = typeof pixCfg === "function" ? pixCfg() : { chave: "" };
  const d = diasAte(f.cobrar_em);
  return `Oi, ${primeiroNome(f.cliente_nome)}! Tudo bem? 💜\n\nPassando para lembrar do valor de *${brl(f.valor)}*${f.descricao ? ` (${f.descricao})` : ""} que ficou combinado para ${d === 0 ? "hoje" : d > 0 ? dataCurta(meioDia(f.cobrar_em).toISOString()) : `o dia ${dataCurta(meioDia(f.cobrar_em).toISOString())}`}.` +
    (p.chave ? `\n\nPode fazer pelo Pix:\n*${p.chave}*${p.nome ? `\n(${p.nome})` : ""}` : "") + `\n\nObrigado! ✨\n${st.prof.nome || ""}`;
}

function fichaFiado(f) {
  const qd = quandoCobrar(f.cobrar_em);
  abreFolha(cabFolha(esc(f.cliente_nome), f.pago_em ? `<span class="chip concluido">Pago</span>` : `<span class="chip" style="${qd.cor ? `color:${qd.cor}` : ""}">${qd.txt}</span>`) + `
    <div class="cartao"><dl class="info-ag">
      <dt>Valor</dt><dd><b>${brl(f.valor)}</b></dd>
      ${f.descricao ? `<dt>O que foi</dt><dd>${esc(f.descricao)}</dd>` : ""}
      <dt>Lançado em</dt><dd>${dataCurta(f.criado_em)}</dd>
      <dt>Cobrar em</dt><dd>${dataLonga(meioDia(f.cobrar_em).toISOString())}</dd>
      ${f.pago_em ? `<dt>Pago em</dt><dd>${dataCurta(f.pago_em)} · ${FORMAS[f.forma_pago] || ""}</dd>` : ""}
      ${f.cliente_whatsapp ? `<dt>WhatsApp</dt><dd>${fmtTel(f.cliente_whatsapp)}</dd>` : ""}
    </dl></div>
    <div class="pilha">${f.pago_em ? "" : `
      ${f.cliente_whatsapp ? `<button class="btn zap cheio" data-cobrar>${IC.zap}Cobrar no WhatsApp</button>` : ""}
      <button class="btn ouro cheio" data-recebi>✓ Recebi</button>
      <div class="grade2"><button class="btn claro" data-data>Mudar o dia</button><button class="btn claro" data-pix>Mostrar QR Pix</button></div>`}
    ${f.agendamento_id ? `<button class="btn claro cheio" data-ag>Ver atendimento</button>` : ""}</div>
    <button class="link" data-apagar style="display:block;margin:14px auto 0;color:var(--alerta)">Apagar este fiado</button>`, (r) => {
    r.querySelector("[data-cobrar]")?.addEventListener("click", () => abreZap(`https://wa.me/${zapNum(f.cliente_whatsapp)}?text=${encodeURIComponent(msgCobranca(f))}`));
    r.querySelector("[data-recebi]")?.addEventListener("click", () => recebeFiado(f));
    r.querySelector("[data-pix]")?.addEventListener("click", () => mostraPix({ valor: Number(f.valor), sub: `${esc(f.cliente_nome)} · fiado`, txid: "FIADO" + f.id.replace(/-/g, "").slice(0, 12), mensagem: f.descricao || "Fiado", zap: f.cliente_whatsapp, nomeCliente: f.cliente_nome, aoReceber: () => baixaFiado(f, "pix"), aoOutraForma: () => recebeFiado(f) }));
    r.querySelector("[data-ag]")?.addEventListener("click", () => detalheAg(f.agendamento_id));
    r.querySelector("[data-data]")?.addEventListener("click", async () => {
      const nova = prompt("Novo dia para cobrar (dd/mm):", dataCurta(meioDia(f.cobrar_em).toISOString()));
      if (!nova) return;
      const m = nova.match(/(\d{1,2})\D(\d{1,2})(?:\D(\d{2,4}))?/); if (!m) return toast("Use o formato dd/mm.", 1);
      const ano = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : isoDia().slice(0, 4);
      let iso = `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      if (!m[3] && iso < isoDia()) iso = `${+ano + 1}${iso.slice(4)}`;
      await q(sb.from("ad_fiados").update({ cobrar_em: iso, lembrado_em: null }).eq("id", f.id));
      toast("Dia de cobrar alterado."); fichaFiado({ ...f, cobrar_em: iso });
    });
    r.querySelector("[data-apagar]").onclick = async () => {
      if (!confirm(`Apagar o fiado de ${f.cliente_nome} (${brl(f.valor)})?${f.pago_em ? "\n\nO pagamento já registrado no caixa continua lá." : ""}`)) return;
      await q(sb.from("ad_fiados").delete().eq("id", f.id)); toast("Fiado apagado."); telaFiados(); atualizaTela();
    };
  });
}

function recebeFiado(f) {
  let forma = "pix";
  abreFolha(cabFolha("Recebi o fiado", `${esc(f.cliente_nome)} · ${brl(f.valor)}`) + `
    <div class="cartao"><label class="f">Como pagou</label>
      <div class="opcoes" data-formas>${Object.entries(FORMAS).map(([k, v]) => `<button type="button" data-fm="${k}" class="${k === forma ? "on" : ""}">${v}</button>`).join("")}</div></div>
    <button class="btn ouro cheio" data-ok>Confirmar pagamento</button>`, (r) => {
    r.querySelectorAll("[data-fm]").forEach((b) => (b.onclick = () => { forma = b.dataset.fm; r.querySelectorAll("[data-fm]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelector("[data-ok]").onclick = () => baixaFiado(f, forma);
  });
}

async function baixaFiado(f, forma) {
  const valor = Number(f.valor);
  await q(sb.from("ad_pagamentos").insert({ profissional_id: st.prof.id, agendamento_id: f.agendamento_id || null, cliente_id: f.cliente_id || null, valor, forma, taxa: Math.round(valor * taxaPct(forma)) / 100, observacao: "Fiado" + (f.descricao ? " · " + f.descricao : "") }));
  await q(sb.from("ad_fiados").update({ pago_em: new Date().toISOString(), forma_pago: forma }).eq("id", f.id));
  if (f.agendamento_id) {
    const a = (await q(sb.from("ad_agendamentos").select("id,preco").eq("id", f.agendamento_id)))[0];
    if (a) { const pago = (await q(sb.from("ad_pagamentos").select("valor").eq("agendamento_id", a.id))).reduce((s, p) => s + Number(p.valor), 0); if (pago >= Number(a.preco) - 0.009) await q(sb.from("ad_agendamentos").update({ pago: true }).eq("id", a.id)); }
  }
  toast(`Fiado de ${primeiroNome(f.cliente_nome)} recebido: ${brl(valor)} ✨`); festa?.();
  telaFiados(); atualizaTela();
}
