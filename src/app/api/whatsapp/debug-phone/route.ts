import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    // Test different phone formats
    const formats = {
      original: phone,
      digitsOnly: phone.replace(/\D/g, ''),
      with52: phone.replace(/\D/g, '').startsWith('52') ? phone.replace(/\D/g, '') : '52' + phone.replace(/\D/g, ''),
      withPlus52: '+52' + phone.replace(/\D/g, '').replace(/^52/, ''),
      international: '+' + phone.replace(/\D/g, '').replace(/^52/, '52')
    };

    // Check WhatsApp API credentials
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
      return NextResponse.json({ 
        error: 'WhatsApp API credentials not configured',
        formats 
      });
    }

    // Test API call with different formats
    const testResults = [];
    
    for (const [formatName, formattedPhone] of Object.entries(formats)) {
      try {
        const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        
        const whatsappPayload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: `🧪 Test message - Format: ${formatName} (${formattedPhone})`
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

        const responseData = await whatsappResponse.json();
        
        testResults.push({
          format: formatName,
          phone: formattedPhone,
          success: whatsappResponse.ok,
          status: whatsappResponse.status,
          response: responseData
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        testResults.push({
          format: formatName,
          phone: formattedPhone,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      originalPhone: phone,
      formats,
      testResults,
      recommendation: "Check which format works and if any messages are received"
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
