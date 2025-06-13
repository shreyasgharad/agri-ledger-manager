
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  phone: string;
  message: string;
  billId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone, message, billId }: WhatsAppMessage = await req.json();

    // TODO: Implement actual WhatsApp API integration
    // For now, we'll just log the message and return success
    console.log('WhatsApp Message Request:', {
      phone,
      message,
      billId,
      timestamp: new Date().toISOString()
    });

    // Placeholder for WhatsApp API call
    // const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL');
    // const whatsappToken = Deno.env.get('WHATSAPP_API_TOKEN');
    
    // Example API call structure:
    // const response = await fetch(`${whatsappApiUrl}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${whatsappToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: phone,
    //     type: 'text',
    //     messaging_product: 'whatsapp',
    //     text: { body: message }
    //   })
    // });

    // Log successful message (placeholder)
    await supabaseClient
      .from('whatsapp_logs')
      .insert([{
        phone,
        message,
        bill_id: billId,
        status: 'sent', // In production, this would be based on actual API response
        sent_at: new Date().toISOString()
      }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp message queued successfully',
        messageId: `msg_${Date.now()}` // Placeholder message ID
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('WhatsApp Function Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
