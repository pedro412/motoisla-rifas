// Environment variable utilities with fallbacks
export const ENV = {
  // Bank Information
  BANK_NAME: process.env.NEXT_PUBLIC_BANK_NAME || 'BBVA Bancomer',
  BANK_ACCOUNT_HOLDER: process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER || 'Moto Isla Raffle',
  BANK_ACCOUNT_NUMBER: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '0123456789',
  BANK_CLABE: process.env.NEXT_PUBLIC_BANK_CLABE || '012345678901234567',
  
  
  // Site Information
  SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'Moto Isla Raffle',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3001',
  
  // WhatsApp
  WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5215544537711',
  
  // Supabase (server-side only)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Admin
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-minimum-32-characters',
  
  // Security
  CSRF_SECRET: process.env.CSRF_SECRET || 'your-csrf-secret-key-minimum-32-characters',
} as const;

// Bank info object for easy access
export const BANK_INFO = {
  bankName: ENV.BANK_NAME,
  accountHolder: ENV.BANK_ACCOUNT_HOLDER,
  accountNumber: ENV.BANK_ACCOUNT_NUMBER,
  clabe: ENV.BANK_CLABE,
} as const;

// Validation function to check if critical env vars are set
export function validateEnvironment() {
  const missing: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing.join(', '));
    return false;
  }
  
  return true;
}
