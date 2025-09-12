import { ENV } from './env';

export interface WhatsAppMessageData {
  customerName: string;
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
