
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" }
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return reply({ error: "Authentication required" }, 401);

    const admin = createClient(url, service);
    const payload = await req.json();

    if (payload.action === "create_booking") {
      const { data: profile } = await admin
        .from("profiles").select("role,city").eq("id", user.id).single();

      if (!profile || profile.role !== "customer")
        return reply({ error: "Only customer accounts can create requests." }, 403);

      const pickup = String(payload.pickup || "").trim();
      const destination = String(payload.destination || "").trim();

      if (!pickup || !destination)
        return reply({ error: "Pickup and destination are required." }, 400);

      const { data, error } = await admin.from("bookings").insert({
        customer_id: user.id,
        pickup,
        destination,
        cargo_type: String(payload.cargo_type || "Parcels"),
        city: String(profile.city || payload.city || "").trim(),
        status: "requested"
      }).select().single();

      if (error) return reply({ error: error.message }, 400);
      return reply({ message: "Your dispatch request has been submitted.", booking: data });
    }

    if (payload.action === "review_provider") {
      if (user.email?.toLowerCase() !== "ddispatha@gmail.com")
        return reply({ error: "Admin access required." }, 403);

      const providerId = String(payload.provider_id || "");
      const status = payload.status === "verified" ? "verified" : "rejected";

      const { error } = await admin.from("profiles")
        .update({ verification_status: status })
        .eq("id", providerId).eq("role", "provider");

      if (error) return reply({ error: error.message }, 400);

      if (status === "verified") {
        const { data: p } = await admin.from("profiles")
          .select("id,full_name,city,provider_type")
          .eq("id", providerId).single();

        if (p) await admin.from("provider_marketplace_cards").upsert({
          user_id: p.id,
          display_name: p.full_name,
          city: p.city,
          provider_type: p.provider_type,
          verification_status: "verified"
        });
      } else {
        await admin.from("provider_marketplace_cards")
          .delete().eq("user_id", providerId);
      }

      return reply({ message: `Provider ${status}.` });
    }

    if (payload.action === "update_booking") {
      const bookingId = String(payload.booking_id || "");
      const status = String(payload.status || "");

      const { data: profile } = await admin.from("profiles")
        .select("role,city,verification_status").eq("id", user.id).single();

      const { data: booking } = await admin.from("bookings")
        .select("*").eq("id", bookingId).single();

      if (!profile || !booking)
        return reply({ error: "Booking or profile not found." }, 404);

      const isAdmin = user.email?.toLowerCase() === "ddispatha@gmail.com";
      const isProvider =
        profile.role === "provider" &&
        profile.verification_status === "verified" &&
        String(profile.city).toLowerCase().trim() ===
        String(booking.city).toLowerCase().trim();

      if (!isAdmin && !(isProvider && ["accepted", "in_progress", "completed"].includes(status)))
        return reply({ error: "Not permitted." }, 403);

      if (!["accepted", "in_progress", "completed"].includes(status))
        return reply({ error: "Invalid booking status." }, 400);

      const { error } = await admin.from("bookings").update({
        status,
        provider_id: isProvider ? user.id : booking.provider_id
      }).eq("id", bookingId);

      if (error) return reply({ error: error.message }, 400);
      return reply({ message: "Booking updated." });
    }

    return reply({ error: "Unknown action." }, 400);
  } catch (e) {
    return reply({
      error: e instanceof Error ? e.message : "Unexpected server error."
    }, 500);
  }
});
