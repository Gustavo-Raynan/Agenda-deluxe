// Eduardo Hair Gestão — identifica produtos de cabelo/beleza numa foto com IA (Claude, visão).
// Usa o mesmo segredo ANTHROPIC_API_KEY da função ad-ia-esmalte. Sem ele, responde {erro:"sem_chave"}.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CATS = ["Shampoo", "Condicionador", "Máscara", "Leave-in", "Óleo e sérum", "Finalizador", "Protetor térmico", "Tratamento", "Coloração", "Kit", "Acessórios", "Outros"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.checar) return json({ tem_chave: !!Deno.env.get("ANTHROPIC_API_KEY") });

    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return json({ erro: "Faça login novamente." }, 401);
    const email = (user.email ?? "").toLowerCase();
    const [{ data: dono }, { data: eq }] = await Promise.all([
      admin.from("ad_profissionais").select("id").eq("id", user.id).maybeSingle(),
      admin.from("ad_equipe").select("profissional_id").eq("email", email).limit(1),
    ]);
    if (!dono && !(eq ?? []).length) return json({ erro: "sem acesso" }, 403);

    const chave = Deno.env.get("ANTHROPIC_API_KEY");
    if (!chave) return json({ erro: "sem_chave" });

    const img = String(body.imagem ?? "").replace(/^data:image\/\w+;base64,/, "");
    if (!img || img.length > 3_000_000) return json({ erro: "imagem inválida" }, 400);
    const grupo = !!body.grupo;

    const pedido = `Você é especialista em produtos de cabelo e beleza do mundo todo (profissionais e de varejo), por exemplo Kérastase, L'Oréal Professionnel, Wella, Redken, Schwarzkopf, Joico, Moroccanoil, Olaplex, Davines, Alfaparf, Keune, Truss, Braé, Lowell, Cadiveu, Inoar, Amend, Elseve, Pantene, Siàge, Salon Line, Lola, Widi Care e muitas outras.
${grupo ? "A foto pode ter VÁRIOS produtos. Liste cada produto visível (no máximo 20)." : "A foto mostra normalmente UM produto."}
Leia a embalagem: marca, linha, nome do produto, tipo (shampoo, máscara…) e tamanho (ml/g).
Regras: use a grafia que aparece na embalagem; se algo não estiver legível e você não tiver certeza, use null. Não invente.
"nome" deve ser o nome completo do produto sem a marca (ex.: "Absolut Repair Máscara"). "descricao" é 1 frase curta em português para o site, dizendo para que serve e para qual tipo de cabelo, baseada no que está escrito na embalagem (sem promessas exageradas).
Responda SOMENTE com JSON:
{"produtos":[{"marca":string|null,"linha":string|null,"nome":string|null,"categoria":uma de ${JSON.stringify(CATS)},"tamanho":string|null,"descricao":string|null,"confianca":0 a 1,"caixa":[x,y,largura,altura] em frações 0 a 1 da imagem envolvendo o produto}]}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-5-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: img } },
          { type: "text", text: pedido },
        ] }],
      }),
    });
    if (!r.ok) { console.error("anthropic", r.status, await r.text()); return json({ erro: "A IA não respondeu agora. Tente de novo." }, 502); }
    const out = await r.json();
    const texto = (out.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    const m = texto.match(/\{[\s\S]*\}/);
    const dados = m ? JSON.parse(m[0]) : { produtos: [] };
    const s = (v: unknown, n: number) => (v ? String(v).trim().slice(0, n) : null);
    const lista = (dados.produtos ?? []).slice(0, 20).map((p: Record<string, unknown>) => ({
      marca: s(p.marca, 60), linha: s(p.linha, 80), nome: s(p.nome, 120),
      categoria: CATS.includes(String(p.categoria)) ? p.categoria : "Outros",
      tamanho: s(p.tamanho, 30), descricao: s(p.descricao, 300),
      confianca: Number(p.confianca) || 0,
      caixa: Array.isArray(p.caixa) && p.caixa.length === 4 ? (p.caixa as number[]).map((n) => Math.min(1, Math.max(0, Number(n) || 0))) : null,
    }));
    return json({ produtos: lista });
  } catch (e) {
    console.error(e);
    return json({ erro: (e as Error).message }, 500);
  }
});
