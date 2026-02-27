import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const adminEmail = 'bikerschoicekakinada390@gmail.com';
    const adminPassword = 'pavan390';

    // Check if admin user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = existingUsers?.users?.find(u => u.email === adminEmail);

    if (adminUser) {
      // Check if role exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', adminUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: adminUser.id,
          role: 'admin',
        });
      }

      return new Response(JSON.stringify({ message: 'Admin already exists', user_id: adminUser.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (createError) throw createError;

    // Assign admin role
    await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'admin',
    });

    return new Response(JSON.stringify({ message: 'Admin created', user_id: newUser.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
