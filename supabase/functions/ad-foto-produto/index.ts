// Busca fotos reais de um produto na internet (Bing Imagens) e devolve miniaturas.
// POST { q: "Truss Uso Obrigatório 260ml" }  →  { url, fotos: [{ url, titulo }] }
// Guarda o resultado em ad_foto_cache para o catálogo abrir rápido.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown) => new Response(JSON.stringify(d), { headers: { ...CORS, "Content-Type": "application/json" } });
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const chave = (s: string) => norm(s).replace(/\s+/g, " ").trim();
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function busca(q: string) {
  const r = await fetch("https://www.bing.com/images/async?q=" + encodeURIComponent(q) + "&first=0&count=20&mmasync=1&setlang=pt-br&cc=BR", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9" },
  });
  const html = await r.text();
  const itens: { t: string; turl: string }[] = [];
  for (const m of html.matchAll(/m="(\{[^"]+\})"/g)) {
    try { itens.push(JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"))); } catch { /* ignora */ }
  }
  const marca = norm(q.split(" ")[0]);
  const pal = norm(q).split(/\s+/).filter((w) => w.length > 3);
  return itens
    .map((o, j) => {
      const t = norm(o.t || "");
      const id = (o.turl || "").match(/id=([^&]+)/)?.[1];
      return { id, titulo: o.t, nota: (t.includes(marca) ? 5 : 0) + pal.filter((w) => t.includes(w)).length - j * 0.3 };
    })
    .filter((x) => x.id)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, 9)
    .map((x) => ({ url: `https://tse1.mm.bing.net/th?id=${x.id}&w=600&h=600&c=7&rs=1&p=0`, titulo: x.titulo }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const q = String(body.q || "").trim().slice(0, 140);
    if (q.length < 3) return json({ url: null, fotos: [] });
    const k = chave(q);
    if (!body.novas) {
      const { data } = await db.from("ad_foto_cache").select("url,fotos").eq("q", k).maybeSingle();
      if (data) return json(data);
    }
    const fotos = await busca(q);
    if (!fotos.length) return json({ url: null, fotos: [] });
    await db.from("ad_foto_cache").upsert({ q: k, url: fotos[0].url, fotos });
    return json({ url: fotos[0].url, fotos });
  } catch (e) {
    return json({ url: null, fotos: [], erro: String(e) });
  }
});
