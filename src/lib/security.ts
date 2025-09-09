import { z } from 'zod';

// Input sanitization utilities
export class SecurityUtils {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    return email
      .trim()
      .toLowerCase()
      .substring(0, 254); // RFC 5321 limit
  }

  /**
   * Sanitize phone number (Mexican format)
   */
  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Limit to 10 digits for Mexican numbers
    return digits.substring(0, 10);
  }

  /**
   * Validate and sanitize numeric input
   */
  static sanitizeNumber(input: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    const num = Number(input);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, Math.floor(num)));
  }

  /**
   * Validate array of ticket numbers
   */
  static sanitizeTicketNumbers(tickets: unknown): number[] {
    if (!Array.isArray(tickets)) return [];
    
    return tickets
      .map(ticket => this.sanitizeNumber(ticket, 1, 500))
      .filter(ticket => ticket > 0)
      .slice(0, 20); // Limit to 20 tickets max
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Rate limit key generation (safe for Redis/storage)
   */
  static generateRateLimitKey(ip: string, endpoint: string): string {
    return `rate_limit:${ip.replace(/[^0-9a-f:.]/gi, '')}:${endpoint.replace(/[^a-z0-9]/gi, '_')}`;
  }
}

// Zod schemas for API validation
export const CreateOrderSchema = z.object({
  raffle_id: z.string().uuid('Invalid raffle ID format'),
  ticket_numbers: z.array(z.number().int().min(1).max(500)).min(1).max(20),
  customer_name: z.string().min(2).max(100).transform(SecurityUtils.sanitizeString),
  customer_phone: z.string().optional().transform(val => val ? SecurityUtils.sanitizePhone(val) : undefined),
  customer_email: z.string().email().optional().transform(val => val ? SecurityUtils.sanitizeEmail(val) : undefined),
});

export const CreateRaffleSchema = z.object({
  title: z.string().min(5).max(200).transform(SecurityUtils.sanitizeString),
  description: z.string().min(10).max(2000).transform(SecurityUtils.sanitizeString),
  image_url: z.string().url().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  ticket_price: z.number().min(1).max(10000),
  total_tickets: z.number().int().min(10).max(500),
  max_tickets_per_user: z.number().int().min(1).max(50),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
  proof_url: z.string().url().optional(),
});

export const AdminAuthSchema = z.object({
  password: z.string().min(1).max(100),
});

export const BulkTicketUpdateSchema = z.object({
  ticket_ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['free', 'reserved', 'paid']),
});

// Middleware helper for request validation
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (data: unknown): Promise<{ success: true; data: T } | { success: false; error: string }> => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return { success: false, error: `Validation error: ${errorMessage}` };
      }
      return { success: false, error: 'Invalid input data' };
    }
  };
}
