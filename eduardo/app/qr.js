// Gerador de QR Code (modo byte, correção M) — baseado no algoritmo de referência de Project Nayuki (MIT).
// Usado para o QR Code Pix com valor. Retorna uma matriz de booleanos.
const QR = (() => {
  const ECC_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
  const BLOCOS_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
  const FORMATO_M = 0; // bits de nível de correção: M = 00
  const modulosBrutos = (v) => {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  };
  const dadosCodewords = (v) => Math.floor(modulosBrutos(v) / 8) - ECC_M[v] * BLOCOS_M[v];
  // Reed-Solomon em GF(256)
  const mult = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; };
  const divisor = (grau) => { const r = new Array(grau).fill(0); r[grau - 1] = 1; let raiz = 1; for (let i = 0; i < grau; i++) { for (let j = 0; j < r.length; j++) { r[j] = mult(r[j], raiz); if (j + 1 < r.length) r[j] ^= r[j + 1]; } raiz = mult(raiz, 0x02); } return r; };
  const resto = (dados, div) => { const r = div.map(() => 0); for (const b of dados) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => (r[i] ^= mult(c, f))); } return r; };

  function gera(texto) {
    const bytes = Array.from(new TextEncoder().encode(texto));
    let v = 1;
    for (; v <= 40; v++) { const bitsCont = v <= 9 ? 8 : 16; if (4 + bitsCont + bytes.length * 8 <= dadosCodewords(v) * 8) break; }
    if (v > 40) throw new Error("Texto grande demais para QR");
    const bits = [];
    const add = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    add(4, 4); add(bytes.length, v <= 9 ? 8 : 16); bytes.forEach((b) => add(b, 8));
    const cap = dadosCodewords(v) * 8;
    add(0, Math.min(4, cap - bits.length)); add(0, (8 - (bits.length % 8)) % 8);
    for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) add(p, 8);
    const dados = []; for (let i = 0; i < bits.length; i += 8) dados.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    // blocos + correção, intercalados
    const nb = BLOCOS_M[v], ecl = ECC_M[v], brutos = Math.floor(modulosBrutos(v) / 8), curtos = nb - (brutos % nb), tamCurto = Math.floor(brutos / nb);
    const div = divisor(ecl), blocos = [];
    for (let i = 0, k = 0; i < nb; i++) { const d = dados.slice(k, k + tamCurto - ecl + (i < curtos ? 0 : 1)); k += d.length; const e = resto(d, div); if (i < curtos) d.push(0); blocos.push(d.concat(e)); }
    const final = [];
    for (let i = 0; i < blocos[0].length; i++) blocos.forEach((b, j) => { if (i !== tamCurto - ecl || j >= curtos) final.push(b[i]); });
    // matriz
    const N = v * 4 + 17, m = Array.from({ length: N }, () => new Array(N).fill(false)), fn = Array.from({ length: N }, () => new Array(N).fill(false));
    const set = (x, y, c) => { m[y][x] = c; fn[y][x] = true; };
    for (let i = 0; i < N; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (x, y) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if (xx >= 0 && xx < N && yy >= 0 && yy < N) set(xx, yy, d !== 2 && d !== 4); } };
    finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
    if (v >= 2) {
      const n = Math.floor(v / 7) + 2, passo = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, pos = [6];
      for (let p = N - 7; pos.length < n; p -= passo) pos.splice(1, 0, p);
      pos.forEach((a, i) => pos.forEach((b, j) => { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    }
    const formato = (mask) => {
      const dado = (FORMATO_M << 3) | mask; let r = dado; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((dado << 10) | r) ^ 0x5412, bit = (i) => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(N - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, N - 15 + i, bit(i));
      set(8, N - 8, true);
    };
    formato(0);
    if (v >= 7) {
      let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const c = ((b >>> i) & 1) !== 0, a = N - 11 + (i % 3), bb = Math.floor(i / 3); set(a, bb, c); set(bb, a, c); }
    }
    // dados em zigue-zague
    let i = 0;
    for (let dir = N - 1; dir >= 1; dir -= 2) {
      if (dir === 6) dir = 5;
      for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) {
        const x = dir - j, sobe = ((dir + 1) & 2) === 0, y = sobe ? N - 1 - vert : vert;
        if (!fn[y][x] && i < final.length * 8) { m[y][x] = ((final[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0, (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
    const aplica = (k) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x]; };
    const penal = () => { // regras 1 e 2 (suficiente para escolher uma boa máscara)
      let p = 0;
      for (let y = 0; y < N; y++) { let run = 1; for (let x = 1; x < N; x++) { if (m[y][x] === m[y][x - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let x = 0; x < N; x++) { let run = 1; for (let y = 1; y < N; y++) { if (m[y][x] === m[y - 1][x]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
      return p;
    };
    let melhor = 0, menor = Infinity;
    for (let k = 0; k < 8; k++) { aplica(k); formato(k); const p = penal(); if (p < menor) { menor = p; melhor = k; } aplica(k); }
    aplica(melhor); formato(melhor);
    return m;
  }
  function svg(texto, { cor = "#000", fundo = "#fff", margem = 3 } = {}) {
    const m = gera(texto), N = m.length, T = N + margem * 2;
    let d = "";
    m.forEach((lin, y) => lin.forEach((c, x) => { if (c) d += `M${x + margem},${y + margem}h1v1h-1z`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" shape-rendering="crispEdges"><rect width="${T}" height="${T}" fill="${fundo}"/><path d="${d}" fill="${cor}"/></svg>`;
  }
  return { gera, svg };
})();

// ---------------------------------------------------------------------
// PIX "copia e cola" (BR Code) com valor
// ---------------------------------------------------------------------
const PIX = (() => {
  const tlv = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const crc16 = (s) => { let c = 0xffff; for (const b of new TextEncoder().encode(s)) { c ^= b << 8; for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; } return c.toString(16).toUpperCase().padStart(4, "0"); };
  const limpa = (t, n) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 .\-]/g, " ").replace(/\s+/g, " ").toUpperCase().trim().slice(0, n).trim();
  function codigo({ chave, nome, cidade, valor, txid, mensagem }) {
    const conta = tlv("00", "br.gov.bcb.pix") + tlv("01", chave) + (mensagem ? tlv("02", limpa(mensagem, 40)) : "");
    let p = tlv("00", "01") + tlv("26", conta) + tlv("52", "0000") + tlv("53", "986") +
      (valor ? tlv("54", Number(valor).toFixed(2)) : "") + tlv("58", "BR") + tlv("59", limpa(nome, 25) || "SALAO") + tlv("60", limpa(cidade, 15) || "BRASIL") +
      tlv("62", tlv("05", (String(txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25)) || "***")) + "6304";
    return p + crc16(p);
  }
  return { codigo, crc16 };
})();
