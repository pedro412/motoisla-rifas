import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Raffle, AdminSettings } from '@/lib/types';
import { RaffleFormData } from '@/lib/validations';

// API Functions
const api = {
  // Raffles
  async getRaffles(): Promise<Raffle[]> {
    const response = await fetch('/api/admin/raffles');
    if (!response.ok) {
      throw new Error('Failed to fetch raffles');
    }
    const data = await response.json();
    return data.raffles || [];
  },

  async createRaffle(data: RaffleFormData): Promise<Raffle> {
    const drawDate = data.draw_date ? new Date(data.draw_date) : null;
    const now = new Date();
    const endDate = drawDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now if no draw date
    
    const response = await fetch('/api/admin/raffles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        image_url: data.image_url || null,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        ticket_price: data.ticket_price,
        total_tickets: data.total_tickets,
        max_tickets_per_user: data.max_tickets_per_user,
        draw_date: drawDate ? drawDate.toISOString() : null
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create raffle');
    }

    return response.json();
  },

  async updateRaffle(raffleId: string, data: RaffleFormData): Promise<Raffle> {
    const drawDate = data.draw_date ? new Date(data.draw_date) : null;
    const now = new Date();
    const endDate = drawDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const response = await fetch(`/api/admin/raffles/${raffleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        image_url: data.image_url || null,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        ticket_price: data.ticket_price,
        total_tickets: data.total_tickets,
        max_tickets_per_user: data.max_tickets_per_user,
        draw_date: drawDate ? drawDate.toISOString() : null
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update raffle');
    }

    return response.json();
  },

  async getRaffle(raffleId: string): Promise<Raffle> {
    const response = await fetch(`/api/admin/raffles/${raffleId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch raffle');
    }
    const data = await response.json();
    return data.raffle;
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
  async getOrder(orderId: string): Promise<{ order: unknown; valid: boolean; expired: boolean; paid?: boolean }> {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      // Handle different error cases
      if (response.status === 404) {
        return { order: null, valid: false, expired: false };
      }
      if (response.status === 410) {
        // Order expired or cancelled
        const errorData = await response.json().catch(() => ({}));
        return { 
          order: null, 
          valid: false, 
          expired: errorData.expired || errorData.cancelled || true 
        };
      }
      // Other errors
      return { order: null, valid: false, expired: false };
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

export function useRaffle(raffleId: string | null) {
  return useQuery({
    queryKey: queryKeys.raffle(raffleId!),
    queryFn: () => api.getRaffle(raffleId!),
    enabled: !!raffleId,
  });
}

export function useUpdateRaffle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ raffleId, data }: { raffleId: string; data: RaffleFormData }) => 
      api.updateRaffle(raffleId, data),
    onSuccess: () => {
      // Invalidate and refetch raffles list
      queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
    },
  });
}

// Orders
export const useOrder = (orderId: string | null) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderId ? api.getOrder(orderId) : Promise.resolve(null),
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

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
      return api.getAvailableTickets(raffleId!);
    },
    enabled: !!raffleId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
  });
}

// Settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      return data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<AdminSettings>) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      return data.order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
