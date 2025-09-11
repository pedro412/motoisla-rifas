import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Check if WhatsApp API credentials are configured
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
      return NextResponse.json({ 
        success: false,
        error: 'WhatsApp API credentials not configured'
      }, { status: 400 });
    }

    // Format phone number (remove + and ensure it starts with 52)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('52')) {
      // Already has country code
    } else if (formattedPhone.length === 10) {
      formattedPhone = '52' + formattedPhone;
    } else if (!formattedPhone.startsWith('52')) {
      formattedPhone = '52' + formattedPhone;
    }

    const message = `🏍️ Hello World from MOTO ISLA! 👋

This is a test message to verify WhatsApp API integration is working correctly.

✅ API Token: Configured
✅ Phone Number ID: Configured
✅ Message Delivery: Testing...

If you receive this message, the integration is working perfectly! 🎉`;

    // Send WhatsApp message using Meta WhatsApp Business API
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const whatsappPayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    };

    console.log('Sending WhatsApp test message to:', formattedPhone);
    console.log('Using Phone Number ID:', phoneNumberId);

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
        success: false,
        error: 'Failed to send WhatsApp message',
        details: errorData,
        formattedPhone
      }, { status: 500 });
    }

    const whatsappResult = await whatsappResponse.json();
    console.log('WhatsApp test message sent successfully:', whatsappResult);

    return NextResponse.json({ 
      success: true,
      messageId: whatsappResult.messages?.[0]?.id,
      message: 'Test WhatsApp message sent successfully',
      formattedPhone,
      originalPhone: phoneNumber
    });

  } catch (error) {
    console.error('Error in WhatsApp test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
