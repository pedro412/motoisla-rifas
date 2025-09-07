import { useState, useEffect } from 'react';
import { Raffle, Ticket } from '@/lib/types';
import { useRealtimeTickets } from './useRealtimeTickets';

export function useRaffle() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [initialTickets, setInitialTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use real-time tickets hook
  const tickets = useRealtimeTickets(initialTickets);

  useEffect(() => {
    fetchRaffleData();
  }, []);

  const fetchRaffleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active raffle
      const raffleResponse = await fetch('/api/raffles');
      if (!raffleResponse.ok) {
        throw new Error('Failed to fetch raffle data');
      }
      const raffles = await raffleResponse.json();
      const activeRaffle = raffles[0]; // Get the first active raffle

      if (!activeRaffle) {
        throw new Error('No active raffle found');
      }

      setRaffle(activeRaffle);

      // Fetch tickets for this raffle using API route
      const ticketsResponse = await fetch(`/api/tickets?raffle_id=${activeRaffle.id}`);
      if (!ticketsResponse.ok) {
        throw new Error('Failed to fetch tickets data');
      }
      const ticketsData = await ticketsResponse.json();

      setInitialTickets(ticketsData || []);
    } catch (error) {
      console.error('Error fetching raffle data:', error);
      setError('Error al cargar los datos de la rifa');
    } finally {
      setLoading(false);
    }
  };

  const refreshTickets = async () => {
    try {
      if (!raffle?.id) return;
      
      const ticketsResponse = await fetch(`/api/tickets?raffle_id=${raffle.id}`);
      if (!ticketsResponse.ok) {
        throw new Error('Failed to refresh tickets data');
      }
      const ticketsData = await ticketsResponse.json();

      setInitialTickets(ticketsData || []);
    } catch (error) {
      console.error('Error refreshing tickets:', error);
    }
  };

  return {
    raffle,
    tickets,
    loading,
    error,
    refreshTickets,
    refetch: fetchRaffleData
  };
}
