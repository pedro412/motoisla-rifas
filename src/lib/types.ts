// Database Types
export interface Database {
  public: {
    Tables: {
      raffles: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          start_date: string;
          end_date: string;
          ticket_price: number;
          total_tickets: number;
          max_tickets_per_user: number;
          winner_ticket_id: string | null;
          draw_date: string | null;
          status: 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_url?: string | null;
          start_date: string;
          end_date: string;
          ticket_price: number;
          total_tickets: number;
          max_tickets_per_user: number;
          winner_ticket_id?: string | null;
          draw_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string | null;
          start_date?: string;
          end_date?: string;
          ticket_price?: number;
          total_tickets?: number;
          max_tickets_per_user?: number;
          winner_ticket_id?: string | null;
          draw_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          raffle_id: string;
          number: number;
          status: 'free' | 'reserved' | 'paid';
          user_id: string | null;
          reserved_at: string | null;
          paid_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          raffle_id: string;
          number: number;
          status?: 'free' | 'reserved' | 'paid';
          user_id?: string | null;
          reserved_at?: string | null;
          paid_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          raffle_id?: string;
          number?: number;
          status?: 'free' | 'reserved' | 'paid';
          user_id?: string | null;
          reserved_at?: string | null;
          paid_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          tickets: string[];
          total_amount: number;
          status: 'pending' | 'paid' | 'cancelled';
          proof_url: string | null;
          payment_deadline: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          raffle_id: string;
          whatsapp_message_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tickets: string[];
          total_amount: number;
          status?: 'pending' | 'paid' | 'cancelled';
          proof_url?: string | null;
          payment_deadline: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          raffle_id: string;
          whatsapp_message_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tickets?: string[];
          total_amount?: number;
          status?: 'pending' | 'paid' | 'cancelled';
          proof_url?: string | null;
          payment_deadline?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          raffle_id?: string;
          whatsapp_message_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Application Types
export type Raffle = Database['public']['Tables']['raffles']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

export type TicketStatus = 'free' | 'reserved' | 'paid';
export type RaffleStatus = 'active' | 'completed' | 'cancelled';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';

// UI Types
export interface CartItem {
  id: string;
  ticketNumber: number;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  raffleId: string;
}


export interface BankInfo {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  clabe: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TicketGridData {
  tickets: Ticket[];
  raffle: Raffle;
}

// Form Types
export interface CreateRaffleForm {
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  totalTickets: number;
  maxTicketsPerUser: number;
}

export interface OrderForm {
  name: string;
  phone?: string;
  email?: string;
  selectedTickets: number[];
}

export interface AdminSettings {
  reservation_timeout: number;
  max_tickets_per_order: number;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_clabe: string;
  maintenance_mode: boolean;
  auto_cleanup_enabled: boolean;
}
