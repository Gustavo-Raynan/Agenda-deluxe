// Agenda Deluxe — cria / cancela / sincroniza a assinatura no Mercado Pago.
// Chamada pelo painel com o login da profissional (verify_jwt = true).
import { createClient } from "npm:@supabase/supabase-js@2";

const MP = "https://api.mercadopago.com";
const PRECO = Number(Deno.env.get("AD_PRECO_MENSAL") ?? "20");
const APP_URL = Deno.env.get("AD_APP_URL") ?? "https://agenda-deluxe.pages.dev/";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function mp(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("MP_ACCESS_TOKEN");
  if (!token) throw new Error("Cobrança ainda não configurada (falta MP_ACCESS_TOKEN no Supabase).");
  const r = await fetch(MP + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.message || `Mercado Pago respondeu ${r.status}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return json({ erro: "Faça login novamente." }, 401);

    const { acao = "assinar", email } = await req.json().catch(() => ({}));
    const { data: prof } = await admin.from("ad_profissionais").select("*").eq("id", user.id).single();
    if (!prof) return json({ erro: "Perfil não encontrado." }, 404);

    const salva = async (pre: { id: string; status: string }) => {
      await admin.from("ad_profissionais").update({ assinatura_id: pre.id, assinatura_status: pre.status, assinatura_atualizada: new Date().toISOString() }).eq("id", user.id);
      return json({ status: pre.status, id: pre.id });
    };

    if (acao === "status") {
      if (!prof.assinatura_id) return json({ status: prof.assinatura_status });
      return salva(await mp(`/preapproval/${prof.assinatura_id}`));
    }

    if (acao === "cancelar") {
      if (!prof.assinatura_id) return json({ erro: "Você não tem assinatura ativa." }, 400);
      return salva(await mp(`/preapproval/${prof.assinatura_id}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) }));
    }

    // assinar
    if (prof.assinatura_status === "authorized") return json({ erro: "Sua assinatura já está ativa." }, 400);
    const fimTeste = new Date(new Date(prof.criado_em).getTime() + 14 * 864e5);
    const auto_recurring: Record<string, unknown> = { frequency: 1, frequency_type: "months", transaction_amount: PRECO, currency_id: "BRL" };
    // Se ainda está no teste grátis, a primeira cobrança só acontece quando o teste acabar
    if (fimTeste.getTime() - Date.now() > 36e5) auto_recurring.start_date = fimTeste.toISOString();

    const pre = await mp("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: "Agenda Deluxe — assinatura mensal",
        external_reference: user.id,
        payer_email: (email || user.email || "").trim(),
        back_url: APP_URL + "index.html?assinatura=retorno",
        auto_recurring,
        status: "pending",
      }),
    });
    await admin.from("ad_profissionais").update({ assinatura_id: pre.id, assinatura_status: pre.status, assinatura_atualizada: new Date().toISOString() }).eq("id", user.id);
    return json({ url: pre.init_point, id: pre.id });
  } catch (e) {
    return json({ erro: (e as Error).message }, 400);
  }
});
