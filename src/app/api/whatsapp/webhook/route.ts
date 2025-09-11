import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Supabase configuration
const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
};

// WhatsApp webhook verification token - should match what you set in Meta Business
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';

// GET method for webhook verification (required by Meta)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse query parameters
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('Webhook verification attempt:', { mode, token, challenge });

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('Webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.error('Webhook verification failed - token mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    console.error('Webhook verification failed - missing parameters');
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}

// POST method for receiving webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Verify webhook signature (recommended for security)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && process.env.WHATSAPP_APP_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');
      
      const signatureHash = signature.replace('sha256=', '');
      
      if (signatureHash !== expectedSignature) {
        console.error('Webhook signature verification failed');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Process webhook events
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle message status updates
            if (value.statuses) {
              value.statuses.forEach((status: any) => {
                handleMessageStatus(status);
              });
            }
            
            // Handle incoming messages
            if (value.messages) {
              value.messages.forEach((message: any) => {
                handleIncomingMessage(message, value.contacts?.[0], value.metadata);
              });
            }
          }
        });
      });
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Store incoming message in database
async function storeIncomingMessage(message: any, contact: any) {
  try {
    const customerPhone = message.from;
    const customerName = contact?.profile?.name || 'Cliente';
    
    // First, ensure conversation exists
    const conversationResponse = await fetch(`${supabaseConfig.url}/rest/v1/conversations`, {
      method: 'POST',
      headers: supabaseConfig.headers,
      body: JSON.stringify({
        customer_phone: customerPhone,
        customer_name: customerName
      })
    });

    let conversationId;
    if (conversationResponse.status === 409) {
      // Conversation already exists, get it
      const existingConvResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversations?customer_phone=eq.${customerPhone}&select=id`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      const existingConv = await existingConvResponse.json();
      conversationId = existingConv[0]?.id;
    } else {
      const newConv = await conversationResponse.json();
      conversationId = newConv[0]?.id;
    }

    if (!conversationId) {
      throw new Error('Failed to create or find conversation');
    }

    // Store the message
    const messageData = {
      conversation_id: conversationId,
      whatsapp_message_id: message.id,
      direction: 'incoming',
      message_type: message.type,
      content: message.text?.body || null,
      media_url: message.image?.id || message.document?.id || null,
      media_id: message.image?.id || message.document?.id || null,
      filename: message.document?.filename || null,
      mime_type: message.image?.mime_type || message.document?.mime_type || null,
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
    };

    const messageResponse = await fetch(`${supabaseConfig.url}/rest/v1/messages`, {
      method: 'POST',
      headers: supabaseConfig.headers,
      body: JSON.stringify(messageData)
    });

    if (!messageResponse.ok) {
      throw new Error(`Failed to store message: ${messageResponse.statusText}`);
    }

    console.log(`Stored incoming message from ${customerName} (${customerPhone})`);
  } catch (error) {
    console.error('Error storing incoming message:', error);
  }
}

// Handle message status updates (sent, delivered, read, failed)
function handleMessageStatus(status: any) {
  console.log('Message status update:', {
    messageId: status.id,
    status: status.status,
    timestamp: status.timestamp,
    recipientId: status.recipient_id,
    errors: status.errors
  });

  // TODO: Update order status in database based on message delivery
  // For example, mark order as "message_sent" when status is "sent"
  // or "message_delivered" when status is "delivered"
  
  switch (status.status) {
    case 'sent':
      console.log(`Message ${status.id} was sent successfully`);
      break;
    case 'delivered':
      console.log(`Message ${status.id} was delivered`);
      break;
    case 'read':
      console.log(`Message ${status.id} was read by recipient`);
      break;
    case 'failed':
      console.error(`Message ${status.id} failed to send:`, status.errors);
      break;
    default:
      console.log(`Unknown status ${status.status} for message ${status.id}`);
  }
}

// Handle incoming messages from customers
async function handleIncomingMessage(message: any, contact: any, metadata: any) {
  console.log('Incoming message:', {
    messageId: message.id,
    from: message.from,
    timestamp: message.timestamp,
    type: message.type,
    contact: contact,
    businessPhoneNumberId: metadata?.phone_number_id
  });

  try {
    // Store message in database
    await storeIncomingMessage(message, contact);
    
    // Handle different message types
    switch (message.type) {
      case 'text':
        await handleTextMessage(message, contact);
        break;
      case 'image':
        await handleImageMessage(message, contact);
        break;
      case 'document':
        await handleDocumentMessage(message, contact);
        break;
      default:
        console.log(`Received ${message.type} message from ${contact?.profile?.name || message.from}`);
    }
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

// Handle text messages (could be payment confirmations, questions, etc.)
function handleTextMessage(message: any, contact: any) {
  const text = message.text?.body?.toLowerCase() || '';
  const customerPhone = message.from;
  const customerName = contact?.profile?.name || 'Cliente';

  console.log(`Text message from ${customerName} (${customerPhone}): ${message.text?.body}`);

  // TODO: Implement auto-responses or ticket matching logic
  // For example:
  // - If message contains order ID, link it to the order
  // - If message says "pago realizado" or similar, mark as payment notification
  // - Auto-respond with helpful information
}

// Handle image messages (likely payment receipts)
function handleImageMessage(message: any, contact: any) {
  const customerPhone = message.from;
  const customerName = contact?.profile?.name || 'Cliente';
  const imageId = message.image?.id;
  const caption = message.image?.caption;

  console.log(`Image received from ${customerName} (${customerPhone}):`, {
    imageId,
    caption,
    mimeType: message.image?.mime_type
  });

  // TODO: Download and process payment receipt images
  // - Download image using Media API
  // - Store in database linked to customer phone
  // - Notify admin of new payment receipt
  // - Auto-respond to confirm receipt
}

// Handle document messages (PDFs, etc.)
function handleDocumentMessage(message: any, contact: any) {
  const customerPhone = message.from;
  const customerName = contact?.profile?.name || 'Cliente';
  const documentId = message.document?.id;
  const filename = message.document?.filename;

  console.log(`Document received from ${customerName} (${customerPhone}):`, {
    documentId,
    filename,
    mimeType: message.document?.mime_type
  });

  // TODO: Handle document attachments (payment receipts, etc.)
}
