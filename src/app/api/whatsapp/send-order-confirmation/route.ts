import { NextRequest, NextResponse } from 'next/server';

interface OrderDetails {
  orderId: string;
  customerName: string;
  customerPhone: string;
  ticketNumbers: string[];
  totalAmount: number;
  raffleName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderDetails = await request.json();
    const { orderId, customerName, customerPhone, ticketNumbers, totalAmount, raffleName } = body;

    // Validate required fields
    if (!orderId || !customerName || !customerPhone || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0 || !totalAmount || !raffleName) {
      console.error('Validation failed:', { 
        orderId: !!orderId, 
        customerName: !!customerName, 
        customerPhone: !!customerPhone, 
        ticketNumbers: Array.isArray(ticketNumbers) ? ticketNumbers.length : 'not array',
        totalAmount: !!totalAmount, 
        raffleName: !!raffleName 
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if WhatsApp API credentials are configured
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
      console.warn('WhatsApp API credentials not configured, skipping message send');
      return NextResponse.json({ 
        success: false,
        error: 'WhatsApp API not configured'
      }, { status: 400 });
    }

    // Format phone number (ensure it starts with 52 for WhatsApp API)
    let formattedPhone = customerPhone.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('52')) {
      // Already has country code
    } else if (formattedPhone.length === 10) {
      formattedPhone = '52' + formattedPhone;
    } else if (!formattedPhone.startsWith('52')) {
      formattedPhone = '52' + formattedPhone;
    }

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount);
    };

    // Create WhatsApp message
    const message = `🏍️ *MOTO ISLA - Confirmación de Orden*

¡Hola ${customerName}! 👋

Tu orden ha sido registrada exitosamente:

📋 *Detalles de la Orden:*
• ID: ${orderId}
• Rifa: ${raffleName}
• Boletos: ${ticketNumbers.join(', ')}
• Total: ${formatCurrency(totalAmount)}

💰 *Instrucciones de Pago:*
Para completar tu participación, realiza el pago y envía tu comprobante por este chat.

⏰ Tienes 24 horas para enviar tu comprobante de pago.

¿Tienes alguna pregunta? ¡Estoy aquí para ayudarte! 🤝

¡Mucha suerte! 🍀`;

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
        details: errorData
      }, { status: 500 });
    }

    const whatsappResult = await whatsappResponse.json();
    console.log('WhatsApp message sent successfully:', whatsappResult);

    return NextResponse.json({ 
      success: true,
      messageId: whatsappResult.messages?.[0]?.id,
      message: 'WhatsApp message sent successfully',
      formattedPhone
    });

  } catch (error) {
    console.error('Error in WhatsApp send-order-confirmation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
