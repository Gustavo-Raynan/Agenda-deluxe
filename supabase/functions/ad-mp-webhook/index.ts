// Agenda Deluxe — recebe avisos do Mercado Pago sobre assinaturas.
// Público (verify_jwt = false): nunca confia no conteúdo do aviso; sempre
// consulta o Mercado Pago com o token para saber o status real.
// Se MP_WEBHOOK_SECRET estiver configurado, também confere a assinatura x-signature.
import { createClient } from "npm:@supabase/supabase-js@2";

const MP = "https://api.mercadopago.com";

async function mp(path: string) {
  const r = await fetch(MP + path, { headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` } });
  if (!r.ok) throw new Error(`MP ${r.status} em ${path}`);
  return r.json();
}

async function assinaturaValida(req: Request, dataId: string) {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) return true;
  const sig = req.headers.get("x-signature") ?? "";
  const reqId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${reqId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const tipo: string = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
    const dataId: string = String(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
    if (!dataId) return new Response("ok");
    if (!(await assinaturaValida(req, dataId))) return new Response("assinatura inválida", { status: 401 });

    let preId = "";
    if (tipo.includes("authorized_payment")) preId = (await mp(`/authorized_payments/${dataId}`)).preapproval_id;
    else if (tipo.includes("preapproval")) preId = dataId;
    else return new Response("ignorado");

    const pre = await mp(`/preapproval/${preId}`);
    if (!pre.external_reference) return new Response("sem referência");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("ad_profissionais")
      .update({ assinatura_id: pre.id, assinatura_status: pre.status, assinatura_atualizada: new Date().toISOString() })
      .eq("id", pre.external_reference);
    return new Response("ok");
  } catch (e) {
    console.error(e);
    // 500 faz o Mercado Pago tentar de novo mais tarde
    return new Response("erro", { status: 500 });
  }
});
