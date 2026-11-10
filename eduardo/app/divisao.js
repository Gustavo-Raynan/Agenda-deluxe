// Eduardo Hair Gestão — DIVISÃO DO LUCRO (padrão 50/50)
// Metade do lucro fica no caixa do salão (para reinvestir) e metade é do Eduardo (dinheiro dele).
// Retiradas do Eduardo e reinvestimentos no salão são lançados como saídas com categoria própria e
// NÃO contam como despesa do salão (senão o lucro seria descontado duas vezes).

const CAT_RET = "Retirada do Eduardo";
const CAT_REINV = "Reinvestimento no salão";
const CATS_DIV = [CAT_RET, CAT_REINV];
const div = () => ({ pct: 50, inicio: "2026-11-01", ...(cfg().divisao || {}) });
const pctSalao = () => Number(div().pct);

// lucro real entre duas datas (mesma conta da tela Financeiro)
async function lucroEntre(ini, fim) {
  const [pags, ags, desp] = await Promise.all([
    pagsEntre(ini, fim), agsEntre(ini, fim),
    q(sb.from("ad_lancamentos").select("valor,categoria").eq("tipo", "saida").eq("pago", true).gte("data", ini).lt("data", fim)),
  ]);
  const usaCustoServ = st.servicos.some((x) => Number(x.custo_material) > 0);
  const recebido = pags.reduce((s, p) => s + Number(p.valor), 0);
  const taxas = pags.reduce((s, p) => s + Number(p.taxa || 0), 0);
  const materiais = usaCustoServ ? ags.filter((a) => a.status === "concluido").reduce((s, a) => s + custoServico(a), 0) : 0;
  const COMPRA = ["Compra de produtos", "Compra de materiais"];
  const oper = desp.filter((l) => !CATS_DIV.includes(l.categoria) && !(usaCustoServ && COMPRA.includes(l.categoria)));
  const despOper = oper.reduce((s, l) => s + Number(l.valor), 0);
  const ret = desp.filter((l) => l.categoria === CAT_RET).reduce((s, l) => s + Number(l.valor), 0);
  const reinv = desp.filter((l) => l.categoria === CAT_REINV).reduce((s, l) => s + Number(l.valor), 0);
  return { lucro: recebido - taxas - materiais - despOper, despOper, ret, reinv };
}
const mesesEntre = (ini, fim) => Math.max(1, Math.round((meioDia(fim) - meioDia(ini)) / (30.4 * 864e5)));

function linhaDivisaoInicio(lucroMes) {
  const p = pctSalao(), l = Math.max(lucroMes, 0);
  return `<div class="mes-nums" style="margin-top:10px">
    <div><small>Para o salão (${p}%)</small><b>${brl(l * p / 100)}</b></div>
    <div><small>Seu (${100 - p}%)</small><b class="ouro-t">${brl(l * (100 - p) / 100)}</b></div>
    <div><small>Divisão</small><b>${p}/${100 - p}</b></div></div>`;
}

async function cartaoDivisao({ lucro, rot, movDiv, per }) {
  const el = $("divisao"); if (!el) return;
  const d = div(), p = pctSalao(), amanha = somaDias(isoDia(), 1);
  const acum = await lucroEntre(d.inicio, amanha);
  if (!$("divisao")) return;
  const base = Math.max(lucro, 0);
  const parteSalao = base * p / 100, parteEdu = base * (100 - p) / 100;
  const baseAc = Math.max(acum.lucro, 0);
  const caixaSalao = baseAc * p / 100 - acum.reinv;
  const livreEdu = baseAc * (100 - p) / 100 - acum.ret;
  const reserva = Math.round(acum.despOper / mesesEntre(d.inicio, amanha)); // ~1 mês de despesas
  const podeReinvestir = Math.max(caixaSalao - reserva, 0);
  const pctBarra = (v, t) => (t > 0 ? Math.max(0, Math.min(100, Math.round((v / t) * 100))) : 0);
  let dica;
  if (acum.lucro <= 0) dica = `Ainda não sobrou lucro desde ${dataCurta(meioDia(d.inicio))}. Segure retiradas e compras grandes até o salão voltar a ter sobra.`;
  else if (caixaSalao <= 0) dica = `O salão já usou toda a parte dele. Evite novos reinvestimentos por enquanto.`;
  else if (reserva > 0 && caixaSalao < reserva) dica = `Guarde o caixa do salão até chegar a <b>${brl(reserva)}</b> (cerca de 1 mês de despesas) antes de reinvestir. Faltam <b>${brl(reserva - caixaSalao)}</b>.`;
  else dica = `Bom momento para reinvestir: dá para usar até <b>${brl(podeReinvestir || caixaSalao)}</b>${reserva ? ` e ainda manter ${brl(reserva)} de reserva` : ""}. Ideias: produtos para a loja, equipamentos, divulgação.`;
  el.innerHTML = `<div class="cartao">
      <div class="linha entre"><h2 style="margin:0">Divisão do lucro ${p}/${100 - p}</h2><button class="link" data-div-cfg>Ajustar ›</button></div>
      <p class="pequeno" style="margin:4px 0 10px">Lucro real ${rot}: <b>${brl(lucro)}</b>${lucro < 0 ? " (prejuízo, nada a dividir)" : ""}</p>
      <div class="grade2">
        <div class="cartao calmo" style="margin:0;padding:12px"><small class="pequeno">🏠 Salão · reinvestir (${p}%)</small><b style="display:block;font-size:20px;margin-top:2px">${brl(parteSalao)}</b></div>
        <div class="cartao calmo" style="margin:0;padding:12px"><small class="pequeno">💜 Eduardo · seu dinheiro (${100 - p}%)</small><b class="ouro-t" style="display:block;font-size:20px;margin-top:2px">${brl(parteEdu)}</b></div>
      </div>
      <div class="tit-linha" style="margin-top:14px"><h2 style="font-size:15px">Saldo desde ${dataCurta(meioDia(d.inicio))}</h2></div>
      <div style="margin-top:4px"><div class="linha entre"><span>Caixa do salão</span><b class="${caixaSalao < 0 ? "neg" : ""}">${brl(caixaSalao)}</b></div>
        <div class="pequeno">Parte do salão ${brl(baseAc * p / 100)} − reinvestido ${brl(acum.reinv)}</div>
        <div class="barra-h"><span style="width:${pctBarra(acum.reinv, baseAc * p / 100)}%"></span></div></div>
      <div style="margin-top:12px"><div class="linha entre"><span>Você ainda pode retirar</span><b class="${livreEdu < 0 ? "neg" : "ouro-t"}">${brl(livreEdu)}</b></div>
        <div class="pequeno">Sua parte ${brl(baseAc * (100 - p) / 100)} − já retirado ${brl(acum.ret)}</div>
        <div class="barra-h"><span style="width:${pctBarra(acum.ret, baseAc * (100 - p) / 100)}%"></span></div></div>
      ${livreEdu < 0 ? `<p class="pequeno" style="margin-top:8px;color:var(--red)">Você retirou ${brl(-livreEdu)} a mais que a sua parte. Esse valor saiu do caixa do salão.</p>` : ""}
      <div class="cartao calmo" style="margin:12px 0 0;padding:12px;font-size:14px">💡 ${dica}</div>
      <div class="grade2" style="margin-top:12px"><button class="btn prim" data-retirar>${IC.dinheiro}Retirei meu dinheiro</button><button class="btn" data-reinvestir>${IC.salao}Reinvesti no salão</button></div>
      ${movDiv.length ? `<div class="lista" style="margin-top:12px">${movDiv.map((l) => `<div class="item" style="cursor:default"><div class="ic">${l.categoria === CAT_RET ? IC.cliente : IC.salao}</div><div class="cresce"><b>${esc(l.descricao)}</b><div class="pequeno">${l.categoria === CAT_RET ? "Retirada" : "Reinvestimento"} · ${dataCurta(meioDia(l.data))}</div></div><b>${brl(l.valor)}</b><button class="link" data-del-div="${l.id}" aria-label="Apagar" style="margin-left:8px">✕</button></div>`).join("")}</div>` : ""}
    </div>`;
  el.querySelector("[data-div-cfg]").onclick = ajustaDivisao;
  el.querySelector("[data-retirar]").onclick = () => movimentoDivisao(CAT_RET, Math.max(livreEdu, 0));
  el.querySelector("[data-reinvestir]").onclick = () => movimentoDivisao(CAT_REINV, Math.max(caixaSalao, 0));
  el.querySelectorAll("[data-del-div]").forEach((b) => (b.onclick = async () => {
    if (!confirm("Apagar este lançamento?")) return;
    await q(sb.from("ad_lancamentos").delete().eq("id", b.dataset.delDiv)); toast("Apagado."); telaCaixa();
  }));
}

function movimentoDivisao(cat, sugestao) {
  const ret = cat === CAT_RET;
  abreFolha(cabFolha(ret ? "Retirada do seu dinheiro" : "Reinvestimento no salão", ret ? `Você ainda pode retirar ${brl(sugestao)}` : `Caixa do salão disponível: ${brl(sugestao)}`) + `
    <div class="cartao">
      <label class="f" style="margin-top:0">Valor</label><input class="campo" data-v type="number" inputmode="decimal" min="0" step="0.01" value="${sugestao > 0 ? sugestao.toFixed(2) : ""}" placeholder="R$">
      <label class="f">${ret ? "Descrição" : "Em que investiu?"}</label><input class="campo" data-d maxlength="80" placeholder="${ret ? "Ex.: pró-labore de novembro" : "Ex.: secador novo, produtos para a loja, divulgação"}">
      <label class="f">Data</label><input class="campo" data-dt type="date" value="${isoDia()}">
      <p class="pequeno" style="margin-top:8px">${ret ? "Não entra como despesa do salão: sai da sua parte do lucro." : "Não entra como despesa comum: sai da parte do salão no lucro."}</p>
    </div>
    <button class="btn prim cheio" data-ok>Salvar</button>`, (r) => {
    r.querySelector("[data-ok]").onclick = async (e) => {
      const valor = Number(r.querySelector("[data-v]").value || 0);
      if (!(valor > 0)) return toast("Digite o valor.", 1);
      e.target.disabled = true;
      try {
        await q(sb.from("ad_lancamentos").insert({ profissional_id: st.prof.id, tipo: "saida", categoria: cat, descricao: (r.querySelector("[data-d]").value.trim() || cat).slice(0, 80), valor, data: r.querySelector("[data-dt]").value || isoDia(), pago: true }));
        toast(ret ? "Retirada registrada." : "Reinvestimento registrado."); fechaFolha(); if (st.aba === "caixa") telaCaixa();
      } catch { e.target.disabled = false; }
    };
  });
}

function ajustaDivisao() {
  const d = div();
  const OP = [[50, "50/50"], [60, "60/40"], [70, "70/30"], [40, "40/60"], [30, "30/70"]];
  abreFolha(cabFolha("Divisão do lucro", "Quanto do lucro fica no salão e quanto é seu") + `
    <div class="cartao"><label class="f" style="margin-top:0">Salão / Você</label>
      <div class="opcoes">${OP.map(([v, t]) => `<button type="button" data-p="${v}" class="${Number(d.pct) === v ? "on" : ""}">${t}</button>`).join("")}</div>
      <p class="pequeno" style="margin-top:8px">O primeiro número é o salão (reinvestir, reserva). O segundo é o seu dinheiro.</p>
      <label class="f">Contar o saldo a partir de</label><input class="campo" data-ini type="date" value="${d.inicio}">
      <p class="pequeno" style="margin-top:6px">Use a data em que começou a separar o dinheiro assim.</p></div>
    <button class="btn prim cheio" data-ok>Salvar</button>`, (r) => {
    let pct = Number(d.pct);
    r.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { pct = Number(b.dataset.p); r.querySelectorAll("[data-p]").forEach((x) => x.classList.toggle("on", x === b)); }));
    r.querySelector("[data-ok]").onclick = async () => {
      await salvaCfg({ divisao: { pct, inicio: r.querySelector("[data-ini]").value || d.inicio } });
      toast("Divisão salva."); fechaFolha(); if (st.aba === "caixa") telaCaixa(); else if (st.aba === "inicio") telaInicio();
    };
  });
}
