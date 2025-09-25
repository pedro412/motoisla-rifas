import { ENV, BANK_INFO } from './env';

export interface WhatsAppMessageData {
  customerName: string;
  customerPhone?: string;
  orderId: string;
  ticketNumbers: number[];
  totalAmount: number;
  raffleName: string;
}

export function generateWhatsAppMessage(data: WhatsAppMessageData): string {
  const ticketList = data.ticketNumbers
    .sort((a, b) => a - b)
    .map(num => num.toString().padStart(3, '0'))
    .join(', ');

  const message = `🏍️ *${data.raffleName}*

👋 Hola, soy *${data.customerName}*

📋 *Detalles de mi orden:*
• ID: ${data.orderId}
• Boletos: ${ticketList}
• Total: $${data.totalAmount.toLocaleString()} MXN

💰 Ya realicé la transferencia bancaria y adjunto mi comprobante de pago.

¿Podrían confirmar mi pago por favor?

¡Gracias! 🙏`;

  return message;
}

export function createWhatsAppURL(phoneNumber: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

export function openWhatsApp(data: WhatsAppMessageData): void {
  const message = generateWhatsAppMessage(data);
  const url = createWhatsAppURL(ENV.WHATSAPP_NUMBER, message);
  window.open(url, '_blank');
}

// Follow-up message template for customers who need help with bank payment
export function generateFollowUpMessage(data: WhatsAppMessageData): string {
  const ticketList = data.ticketNumbers
    .sort((a, b) => a - b)
    .map(num => num.toString().padStart(3, '0'))
    .join(', ');

  const message = `🏍️ *${data.raffleName}*

👋 Hola ${data.customerName},

Veo que tienes una orden pendiente de pago:

📋 *Detalles de tu orden:*
• ID: ${data.orderId}
• Boletos: ${ticketList}
• Total: $${data.totalAmount.toLocaleString()} MXN

💰 *Datos bancarios para transferencia:*
• Banco: ${BANK_INFO.bankName}
• Titular: ${BANK_INFO.accountHolder}
• Cuenta: ${BANK_INFO.accountNumber}
• CLABE: ${BANK_INFO.clabe}

📱 *Pasos para completar tu pago:*
1. Realiza la transferencia bancaria por $${data.totalAmount.toLocaleString()} MXN
2. Toma captura de pantalla del comprobante
3. Envíamelo por este chat para confirmar tu pago

¿Necesitas ayuda con algún paso? ¡Estoy aquí para apoyarte! 🙋‍♂️

*Nota:* Tus boletos están reservados temporalmente. Una vez confirmado el pago, quedarán asegurados definitivamente.

¡Gracias por participar! 🏁`;

  return message;
}

// Payment confirmation message template
export function generatePaymentConfirmationMessage(data: WhatsAppMessageData): string {
  const ticketList = data.ticketNumbers
    .sort((a, b) => a - b)
    .map(num => num.toString().padStart(3, '0'))
    .join(', ');

  const orderUrl = `${window.location.origin}/checkout?orderId=${data.orderId}`;

  const message = `🏍️ *${data.raffleName}*

🎉 ¡PAGO CONFIRMADO! 🎉

👋 Hola ${data.customerName},

✅ Tu pago ha sido procesado exitosamente.

📋 *Detalles de tu orden:*
• ID: ${data.orderId}
• Boletos: ${ticketList}
• Total pagado: $${data.totalAmount.toLocaleString()} MXN
• Estado: ✅ PAGADO

🎫 *Tus boletos están oficialmente reservados*

🔗 *Enlace a tu orden:*
${orderUrl}

📱 Guarda este enlace para consultar tu orden en cualquier momento.

🏁 ¡Mucha suerte en el sorteo!

¡Gracias por participar en ${data.raffleName}! 🙏`;

  return message;
}

// Helper functions to send messages to customers
export function sendFollowUpMessage(data: WhatsAppMessageData): void {
  const message = generateFollowUpMessage(data);
  const url = createWhatsAppURL(data.customerPhone || ENV.WHATSAPP_NUMBER, message);
  window.open(url, '_blank');
}

export function sendPaymentConfirmationMessage(data: WhatsAppMessageData): void {
  const message = generatePaymentConfirmationMessage(data);
  const url = createWhatsAppURL(data.customerPhone || ENV.WHATSAPP_NUMBER, message);
  window.open(url, '_blank');
}
