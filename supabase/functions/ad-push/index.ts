// Nay Nails Gestão — envia notificações push para os celulares cadastrados.
// Chamada pelo banco (gatilho com x-ad-segredo) ou pelo app (botão "testar", com login).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function segredo(chave: string) {
  const { data } = await admin.from("ad_segredos").select("valor").eq("chave", chave).maybeSingle();
  return data?.valor as string | undefined;
}

// Gera as chaves VAPID na primeira vez e guarda só no banco
async function chaves() {
  let pub = await segredo("vapid_publica"), prv = await segredo("vapid_privada");
  if (!pub || !prv) {
    const k = webpush.generateVAPIDKeys();
    await admin.from("ad_segredos").upsert([{ chave: "vapid_publica", valor: k.publicKey }, { chave: "vapid_privada", valor: k.privateKey }]);
    pub = k.publicKey; prv = k.privateKey;
  }
  webpush.setVapidDetails("mailto:contato@agenda-deluxe.pages.dev", pub, prv);
  return pub;
}

async function enviar(userId: string, aviso: { id?: string; tipo: string; titulo: string; corpo: string; agendamento_id?: string | null }) {
  await chaves();
  const { data: subs } = await admin.from("ad_push").select("*").eq("user_id", userId);
  let enviados = 0;
  for (const s of subs ?? []) {
    if (s.prefs && s.prefs[aviso.tipo] === false) continue;
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo: aviso.titulo, corpo: aviso.corpo, tipo: aviso.tipo, agendamento: aviso.agendamento_id ?? null, aviso: aviso.id ?? null }),
        { TTL: 60 * 60 * 6, urgency: "high" },
      );
      enviados++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from("ad_push").delete().eq("id", s.id); // celular desinscrito
      else console.error("push falhou", code, (e as Error).message);
    }
  }
  return enviados;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));

    // 1) Chamada do banco
    const seg = req.headers.get("x-ad-segredo");
    if (seg) {
      if (seg !== (await segredo("gatilho"))) return json({ erro: "não autorizado" }, 401);
      if (body.acao === "iniciar") return json({ publica: await chaves() });
      const { data: aviso } = await admin.from("ad_avisos").select("*").eq("id", body.aviso).maybeSingle();
      if (!aviso) return json({ erro: "aviso não encontrado" }, 404);
      return json({ enviados: await enviar(aviso.profissional_id, aviso) });
    }

    // 2) Chamada do app (com login)
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return json({ erro: "Faça login novamente." }, 401);
    if (body.acao === "chave") return json({ publica: await chaves() });
    if (body.acao === "teste") {
      const n = await enviar(user.id, { tipo: "teste", titulo: "Notificações ligadas 💗", corpo: "Você vai receber um aviso aqui sempre que uma cliente agendar, confirmar ou cancelar." });
      return json({ enviados: n });
    }
    return json({ erro: "ação inválida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ erro: (e as Error).message }, 500);
  }
});
