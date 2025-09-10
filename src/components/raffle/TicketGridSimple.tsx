'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';
import { Raffle, Ticket } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TicketGridProps {
  raffle: Raffle;
  tickets: Ticket[];
  cart: {
    addTicket: (ticketNumber: number, price: number) => void;
    toggleTicket: (ticketNumber: number, price: number) => void;
    isTicketSelected: (ticketNumber: number) => boolean;
  };
}

export function TicketGrid({ raffle, tickets, cart }: TicketGridProps) {
  const [searchNumber, setSearchNumber] = useState('');

  // Create a full grid of tickets, filling in missing ones (starting from 0)
  const fullTickets = Array.from({ length: raffle.total_tickets }, (_, i) => {
    const number = i; // Start from 0 (000) to total_tickets - 1 (999 for 1000 tickets)
    const existingTicket = tickets.find(t => t.number === number);
    return existingTicket || {
      id: `temp-${number}`,
      raffle_id: raffle.id,
      number,
      status: 'free' as const,
      order_id: null,
      user_id: null,
      reserved_at: null,
      expires_at: null,
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  const handleTicketClick = (ticket: Ticket) => {
    if (ticket.status === 'free') {
      cart.toggleTicket(ticket.number, raffle.ticket_price);
    }
  };

  const handleRandomSelect = () => {
    const availableTickets = fullTickets.filter(t => t.status === 'free');
    if (availableTickets.length > 0) {
      const randomTicket = availableTickets[Math.floor(Math.random() * availableTickets.length)];
      cart.addTicket(randomTicket.number, raffle.ticket_price);
    }
  };

  const getTicketStatusColor = (ticket: Ticket) => {
    const isSelected = cart.isTicketSelected(ticket.number);
    
    if (isSelected) return 'bg-blue-500 text-white border-blue-600';
    
    switch (ticket.status) {
      case 'free':
        return 'bg-green-900/30 text-green-300 border-green-700 hover:bg-green-800/40 cursor-pointer';
      case 'reserved':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700 cursor-not-allowed';
      case 'paid':
        return 'bg-red-900/30 text-red-300 border-red-700 cursor-not-allowed';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredTickets = searchNumber 
    ? fullTickets.filter(t => t.number.toString().includes(searchNumber))
    : fullTickets;

  const stats = {
    free: fullTickets.filter(t => t.status === 'free').length,
    reserved: fullTickets.filter(t => t.status === 'reserved').length,
    paid: fullTickets.filter(t => t.status === 'paid').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Selecciona tus números</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomSelect}
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Aleatorio
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar número..."
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-900/30 border border-green-700 rounded"></div>
            <span className="text-slate-300">Disponibles: {stats.free}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-900/30 border border-yellow-700 rounded"></div>
            <span className="text-slate-300">Reservados: {stats.reserved}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-900/30 border border-red-700 rounded"></div>
            <span className="text-slate-300">Vendidos: {stats.paid}</span>
          </div>
        </div>

        {/* Ticket Grid */}
        <div className="grid grid-cols-10 gap-1 max-h-96 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              disabled={ticket.status !== 'free'}
              className={cn(
                'aspect-square text-xs font-medium border rounded transition-colors',
                getTicketStatusColor(ticket)
              )}
            >
              {ticket.number.toString().padStart(3, '0')}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
