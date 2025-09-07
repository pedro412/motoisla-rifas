import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RaffleFormData } from '@/lib/validations';
import { Raffle } from '@/lib/types';

// API Functions
const api = {
  // Raffles
  async getRaffles(): Promise<Raffle[]> {
    const response = await fetch('/api/admin/raffles');
    if (!response.ok) {
      throw new Error('Failed to fetch raffles');
    }
    return response.json();
  },

  async createRaffle(data: RaffleFormData): Promise<Raffle> {
    const drawDate = data.draw_date ? new Date(data.draw_date) : null;
    
    const response = await fetch('/api/admin/raffles-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        draw_date: drawDate ? drawDate.toISOString() : null
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create raffle');
    }

    return response.json();
  },

  async deleteRaffle(raffleId: string): Promise<void> {
    const response = await fetch(`/api/admin/raffles/${raffleId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete raffle');
    }
  },

  // Orders
  async getOrder(orderId: string): Promise<{ order: unknown; valid: boolean; expired: boolean }> {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    return response.json();
  },

  async createOrder(data: {
    raffleId: string;
    ticketNumbers: number[];
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    totalAmount: number;
  }): Promise<{ orderId: string; expiresAt: string }> {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    return response.json();
  },

  // Tickets
  async getAvailableTickets(raffleId: string): Promise<number[]> {
    const response = await fetch(`/api/raffles/${raffleId}/tickets`);
    if (!response.ok) {
      throw new Error('Failed to fetch available tickets');
    }
    const data = await response.json();
    return data.availableTickets || [];
  },
};

// Query Keys
export const queryKeys = {
  raffles: ['raffles'] as const,
  raffle: (id: string) => ['raffles', id] as const,
  order: (id: string) => ['orders', id] as const,
  tickets: (raffleId: string) => ['tickets', raffleId] as const,
};

// Custom Hooks

// Raffles
export function useRaffles() {
  return useQuery({
    queryKey: queryKeys.raffles,
    queryFn: api.getRaffles,
  });
}

export function useCreateRaffle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createRaffle,
    onSuccess: () => {
      // Invalidate and refetch raffles list
      queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
    },
  });
}

export function useDeleteRaffle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteRaffle,
    onSuccess: () => {
      // Invalidate and refetch raffles list
      queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
    },
  });
}

// Orders
export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: queryKeys.order(orderId || ''),
    queryFn: () => api.getOrder(orderId!),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: api.createOrder,
  });
}

// Tickets
export function useAvailableTickets(raffleId: string | null) {
  return useQuery({
    queryKey: ['tickets', raffleId],
    queryFn: async () => {
      // Trigger cleanup before fetching tickets
      try {
        await fetch('/api/cleanup', { method: 'POST' });
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
      return api.getAvailableTickets(raffleId!);
    },
    enabled: !!raffleId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute to release expired tickets
  });
}
