import { NextRequest, NextResponse } from 'next/server';

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
};

interface SendMessageRequest {
  phone: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { phone, message } = body;

    // Validate required fields
    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    // Check WhatsApp API credentials
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
      return NextResponse.json({ 
        error: 'WhatsApp API not configured' 
      }, { status: 400 });
    }

    // Format phone number for WhatsApp API
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('52')) {
      formattedPhone = '52' + formattedPhone;
    }

    // Send WhatsApp message
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const whatsappPayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    };

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappPayload)
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error('WhatsApp API error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to send WhatsApp message',
        details: errorData
      }, { status: 500 });
    }

    const whatsappResult = await whatsappResponse.json();
    const messageId = whatsappResult.messages?.[0]?.id;

    // Store outgoing message in database
    try {
      // Find or create conversation
      let conversationId;
      
      const existingConvResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversations?customer_phone=eq.${phone}&select=id`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );

      if (existingConvResponse.ok) {
        const existingConv = await existingConvResponse.json();
        if (existingConv.length > 0) {
          conversationId = existingConv[0].id;
        } else {
          // Create new conversation
          const newConvResponse = await fetch(`${supabaseConfig.url}/rest/v1/conversations`, {
            method: 'POST',
            headers: supabaseConfig.headers,
            body: JSON.stringify({
              customer_phone: phone,
              customer_name: 'Cliente'
            })
          });
          
          if (newConvResponse.ok) {
            const newConv = await newConvResponse.json();
            conversationId = newConv[0]?.id;
          }
        }
      }

      // Store the outgoing message
      if (conversationId && messageId) {
        const messageData = {
          conversation_id: conversationId,
          whatsapp_message_id: messageId,
          direction: 'outgoing',
          message_type: 'text',
          content: message,
          status: 'sent',
          timestamp: new Date().toISOString()
        };

        await fetch(`${supabaseConfig.url}/rest/v1/messages`, {
          method: 'POST',
          headers: supabaseConfig.headers,
          body: JSON.stringify(messageData)
        });
      }
    } catch (dbError) {
      console.error('Error storing outgoing message:', dbError);
      // Don't fail the API call if database storage fails
    }

    return NextResponse.json({ 
      success: true,
      messageId,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error in send-message API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
