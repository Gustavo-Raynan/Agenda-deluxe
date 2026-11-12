// Eduardo Hair Gestão — PIX NA HORA: QR Code com o valor certo, válido por 5 minutos
// Abre sozinho ao registrar o pagamento de um atendimento (e nos pedidos da loja).
// A chave e o nome do recebedor vêm de st.prof.chave_pix e cfg().pix (Mais › Pix do salão).

const PIX_MIN = 5;
const pixCfg = () => ({ chave: st.prof.chave_pix || "", nome: "", cidade: "", ...(cfg().pix || {}) });
const temPix = () => !!pixCfg().chave;
let pixTimer = null;

// opções: valor, titulo, sub, txid, mensagem, zap (WhatsApp do cliente), nomeCliente, aoReceber(), aoOutraForma()
function mostraPix(o) {
  clearInterval(pixTimer);
  const p = pixCfg();
  if (!p.chave) { toast("Cadastre a chave Pix do salão primeiro.", 1); return configuraPix(() => mostraPix(o)); }
  const txid = (o.txid || "EDU" + Date.now().toString(36)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 25);
  const codigo = PIX.codigo({ chave: p.chave, nome: p.nome, cidade: p.cidade, valor: o.valor, txid, mensagem: o.mensagem });
  const fim = Date.now() + PIX_MIN * 60000;
  abreFolha(cabFolha("Pagar com Pix", o.sub || "") + `
    <div class="cartao pix-cx">
      <div class="pix-valor">${brl(o.valor)}</div>
      <div class="pix-qr" data-qr>${QR.svg(codigo, { cor: "#1A1424", fundo: "#FFFFFF", margem: 2 })}<div class="pix-exp hide" data-exp><b>Pix expirado</b><button class="btn prim mini" data-novo>Gerar de novo</button></div></div>
      <div class="pix-tempo"><span data-relogio>${PIX_MIN}:00</span><div class="pix-barra"><i data-barra></i></div></div>
      <p class="pequeno" style="text-align:center;margin-top:6px">Peça para o cliente abrir o app do banco e escanear.<br>Recebedor: <b>${esc(p.nome || st.prof.nome)}</b></p>
    </div>
    <div class="grade2"><button class="btn" data-copiar>${IC.link}Copiar Pix</button><button class="btn" data-zap>${IC.zap}Mandar no WhatsApp</button></div>
    <button class="btn prim cheio" data-recebi style="margin-top:10px">✓ Recebi o Pix</button>
    ${o.aoOutraForma ? `<button class="btn claro cheio" data-outra style="margin-top:8px">Pagou de outro jeito</button>` : ""}
    ${o.aoFiado ? `<button class="btn claro cheio" data-fiadopix style="margin-top:8px">🤝 Vai pagar depois (fiado)</button>` : ""}`, (r) => {
    const tick = () => {
      const s = Math.max(0, Math.round((fim - Date.now()) / 1000));
      if (!r.isConnected || !$("folha").classList.contains("on")) return clearInterval(pixTimer);
      r.querySelector("[data-relogio]").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      r.querySelector("[data-barra]").style.width = (s / (PIX_MIN * 60)) * 100 + "%";
      if (s <= 60) r.querySelector(".pix-tempo").classList.add("acabando");
      if (s === 0) { clearInterval(pixTimer); r.querySelector("[data-exp]").classList.remove("hide"); r.querySelector("[data-qr] svg").style.filter = "blur(6px)"; }
    };
    pixTimer = setInterval(tick, 1000); tick();
    r.querySelector("[data-novo]").onclick = () => mostraPix(o);
    r.querySelector("[data-copiar]").onclick = () => copiar(codigo, "Pix copia e cola copiado.");
    r.querySelector("[data-zap]").onclick = () => {
      const txt = `Olá${o.nomeCliente ? ", " + primeiroNome(o.nomeCliente) : ""}! Segue o Pix de *${brl(o.valor)}* (Eduardo Teccarelli Hair).\n\nCopie o código abaixo e cole no app do seu banco, em *Pix › Copia e Cola*:\n\n${codigo}`;
      abreZap(o.zap ? `https://wa.me/${zapNum(o.zap)}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt)}`);
    };
    r.querySelector("[data-recebi]").onclick = async (e) => { e.target.disabled = true; clearInterval(pixTimer); try { await o.aoReceber(); } catch { e.target.disabled = false; } };
    r.querySelector("[data-outra]")?.addEventListener("click", () => { clearInterval(pixTimer); o.aoOutraForma(); });
    r.querySelector("[data-fiadopix]")?.addEventListener("click", () => { clearInterval(pixTimer); o.aoFiado(); });
  });
}

function configuraPix(depois) {
  const p = pixCfg();
  abreFolha(cabFolha("Pix do salão", "Usado para gerar o QR Code com o valor de cada atendimento") + `
    <div class="cartao">
      <label class="f" style="margin-top:0">Chave Pix</label><input class="campo" data-chave value="${esc(p.chave)}" placeholder="CPF, celular, e-mail ou chave aleatória" autocapitalize="off" autocorrect="off" spellcheck="false">
      <label class="f">Nome do recebedor <small class="mudo">(como aparece no banco)</small></label><input class="campo" data-nome maxlength="25" value="${esc(p.nome)}">
      <label class="f">Cidade <small class="mudo">(a do cadastro no banco)</small></label><input class="campo" data-cidade maxlength="15" value="${esc(p.cidade)}">
      <p class="pequeno" style="margin-top:8px">Dica: copie esses dados do QR Code que o seu banco gera. O dinheiro cai direto na conta dessa chave.</p>
    </div>
    <button class="btn prim cheio" data-ok>Salvar</button>`, (r) => {
    r.querySelector("[data-ok]").onclick = async () => {
      let chave = r.querySelector("[data-chave]").value.trim();
      const so = chave.replace(/\D/g, "");
      if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(chave)) chave = so;                       // CPF
      else if (/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(chave)) chave = "+55" + so;          // celular
      if (!chave) return toast("Digite a chave Pix.", 1);
      st.prof = await q(sb.from("ad_profissionais").update({ chave_pix: chave.slice(0, 120) }).eq("id", st.prof.id).select().single());
      await salvaCfg({ pix: { nome: r.querySelector("[data-nome]").value.trim(), cidade: r.querySelector("[data-cidade]").value.trim() } });
      toast("Pix do salão salvo."); depois ? depois() : fechaFolha();
    };
  });
}
