import { z } from 'zod';

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
}

// Enhanced validation schemas with sanitization
export const sanitizedCustomerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(sanitizeString),
  phone: z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .transform(sanitizePhone),
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .transform(sanitizeEmail)
    .optional(),
});

export const sanitizedRaffleSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .transform(sanitizeString),
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .transform(sanitizeString),
  image_url: z.string()
    .url('URL de imagen inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  start_date: z.string()
    .datetime('Fecha de inicio inválida'),
  end_date: z.string()
    .datetime('Fecha de fin inválida'),
  draw_date: z.string()
    .datetime('Fecha de sorteo inválida')
    .optional()
    .nullable(),
  ticket_price: z.number()
    .min(1, 'El precio debe ser mayor a 0')
    .max(10000, 'El precio no puede exceder $10,000'),
  total_tickets: z.number()
    .min(1, 'Debe haber al menos 1 boleto')
    .max(10000, 'No puede exceder 10,000 boletos'),
  max_tickets_per_user: z.number()
    .min(1, 'Debe permitir al menos 1 boleto por usuario')
    .max(100, 'No puede exceder 100 boletos por usuario')
    .default(20),
});

export const ticketOrderSchema = z.object({
  raffle_id: z.string().uuid('ID de rifa inválido'),
  ticket_numbers: z.array(z.number().int().min(0, 'Número de boleto inválido'))
    .min(1, 'Debe seleccionar al menos 1 boleto')
    .max(100, 'No puede seleccionar más de 100 boletos'),
  customer_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(sanitizeString),
  customer_phone: z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .transform(sanitizePhone),
  customer_email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .transform(sanitizeEmail)
    .optional(),
});

// IP validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
