// Nay Nails Gestão — identifica esmaltes numa foto com IA (Claude, visão).
// Precisa do segredo ANTHROPIC_API_KEY nas Edge Functions do Supabase. Sem ele, responde {erro:"sem_chave"}.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const TONS = ["Vermelhos", "Vinhos", "Rosas", "Nudes", "Marrons", "Brancos", "Pretos", "Cinzas", "Azuis", "Verdes", "Roxos", "Laranjas", "Amarelos", "Glitter", "Metalizados", "Perolados", "Translúcidos", "Outros"];
const ACABS = ["Cremoso", "Brilhante", "Fosco", "Glitter", "Metálico", "Perolado", "Cintilante"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
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

    const body = await req.json().catch(() => ({}));
    const img = String(body.imagem ?? "").replace(/^data:image\/\w+;base64,/, "");
    if (!img || img.length > 2_500_000) return json({ erro: "imagem inválida" }, 400);
    const grupo = !!body.grupo;

    const { data: base } = await admin.from("ad_esmaltes_base").select("marca,nome").limit(400);
    const conhecidos = (base ?? []).map((b) => `${b.marca} ${b.nome}`).join("; ");

    const pedido = `Você é especialista em esmaltes vendidos no Brasil (Risqué, Colorama, Impala, Dailus, Vult, Ana Hickmann, Avon, O.P.I, Essie, Bella Brazil, Anita, Mohda e outras).
${grupo ? "A foto pode ter VÁRIOS frascos de esmalte. Liste cada frasco visível." : "A foto mostra normalmente UM frasco de esmalte."}
Leia o rótulo (marca, nome da cor, código) e observe a cor do esmalte dentro do vidro.
Só informe marca, nome e código se estiverem legíveis no rótulo ou se você tiver certeza; caso contrário use null. Não invente nomes.
Esmaltes já conhecidos pelo salão (use a grafia exata se for um deles): ${conhecidos || "nenhum"}.
Responda SOMENTE com JSON no formato:
{"esmaltes":[{"marca":string|null,"nome":string|null,"codigo":string|null,"linha":string|null,"tonalidade":uma de ${JSON.stringify(TONS)},"acabamento":um de ${JSON.stringify(ACABS)},"cor_hex":"#RRGGBB","confianca":0 a 1,"caixa":[x,y,largura,altura] em frações de 0 a 1 da imagem, envolvendo o frasco}]}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-5-5",
        max_tokens: 1500,
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
    const dados = m ? JSON.parse(m[0]) : { esmaltes: [] };
    const lista = (dados.esmaltes ?? []).slice(0, 30).map((e: Record<string, unknown>) => ({
      marca: e.marca || null, nome: e.nome || null, codigo: e.codigo ? String(e.codigo) : null, linha: e.linha || null,
      tonalidade: TONS.includes(String(e.tonalidade)) ? e.tonalidade : null,
      acabamento: ACABS.includes(String(e.acabamento)) ? e.acabamento : null,
      cor_hex: /^#[0-9a-f]{6}$/i.test(String(e.cor_hex)) ? e.cor_hex : null,
      confianca: Number(e.confianca) || 0,
      caixa: Array.isArray(e.caixa) && e.caixa.length === 4 ? (e.caixa as number[]).map((n) => Math.min(1, Math.max(0, Number(n) || 0))) : null,
    }));
    return json({ esmaltes: lista });
  } catch (e) {
    console.error(e);
    return json({ erro: (e as Error).message }, 500);
  }
});
