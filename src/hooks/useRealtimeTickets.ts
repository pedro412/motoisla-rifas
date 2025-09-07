import { useEffect, useState } from 'react';
import { Ticket } from '@/lib/types';

export function useRealtimeTickets(initialTickets: Ticket[] = []) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  useEffect(() => {
    // Set initial tickets
    setTickets(initialTickets);

    // Skip real-time subscriptions when using placeholder Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return;
    }

    // Real-time functionality would be implemented here when connected to real Supabase
    // For now, just use polling as fallback
    const interval = setInterval(async () => {
      // Refresh tickets periodically when not using real-time
      // This will be handled by the parent component's refresh function
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [initialTickets]);

  return tickets;
}
