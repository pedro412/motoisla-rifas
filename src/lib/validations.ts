import { z } from 'zod';

// Common validation schemas for reuse across the application

// Customer information schema
export const customerInfoSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  phone: z.string()
    .min(10, 'El teléfono debe tener 10 dígitos')
    .max(10, 'El teléfono debe tener exactamente 10 dígitos')
    .regex(/^\d{10}$/, 'El teléfono debe contener solo números (10 dígitos)'),
  email: z.string().email('Email inválido').optional().or(z.literal(''))
});

// Raffle creation schema
export const raffleSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().min(1, 'La descripción es requerida').max(1000, 'La descripción es muy larga'),
  ticket_price: z.number().min(1, 'El precio debe ser mayor a 0').max(10000, 'El precio es muy alto'),
  total_tickets: z.number().min(1, 'Debe haber al menos 1 boleto').max(10000, 'Máximo 10,000 boletos'),
  max_tickets_per_user: z.number().min(1, 'Debe permitir al menos 1 boleto por usuario').max(1000, 'Límite muy alto por usuario'),
  draw_date: z.string().min(1, 'La fecha del sorteo es requerida'),
  image_url: z.string().url('URL de imagen inválida').optional().or(z.literal(''))
}).refine((data) => {
  const drawDate = new Date(data.draw_date);
  const now = new Date();
  return drawDate > now;
}, {
  message: 'La fecha del sorteo debe ser en el futuro',
  path: ['draw_date']
}).refine((data) => {
  return data.max_tickets_per_user <= data.total_tickets;
}, {
  message: 'El límite por usuario no puede ser mayor al total de boletos',
  path: ['max_tickets_per_user']
});

// Login/Authentication schema
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(1, 'El asunto es requerido').max(200, 'El asunto es muy largo'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000, 'El mensaje es muy largo')
});

// Payment information schema
export const paymentSchema = z.object({
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  currency: z.string().default('MXN'),
  payment_method: z.enum(['transfer', 'card', 'cash'], {
    message: 'Método de pago inválido'
  })
});

// Type exports for TypeScript
export type CustomerInfo = z.infer<typeof customerInfoSchema>;
export type RaffleFormData = z.infer<typeof raffleSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
