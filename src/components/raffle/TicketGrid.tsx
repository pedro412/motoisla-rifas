'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Shuffle, Grid, List } from 'lucide-react';
import { Raffle, Ticket } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TicketGridProps {
  raffle: Raffle;
  tickets: Ticket[];
  cart: any;
  onTicketsChange: () => void;
}

type TicketStatus = 'free' | 'reserved' | 'paid';

// Mock data generator
const generateMockTickets = (): Ticket[] => {
  return Array.from({ length: 100 }, (_, i) => ({
    id: `ticket-${i + 1}`,
    raffle_id: 'mock-raffle-1',
    number: i + 1,
    status: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'reserved' : 'paid') : 'free',
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

export function TicketGrid({ raffle, tickets, cart, onTicketsChange }: TicketGridProps) {
  const [searchNumber, setSearchNumber] = useState('');

  const handleTicketClick = (ticket: Ticket) => {
    if (ticket.status === 'free' && cart?.toggleTicket) {
      cart.toggleTicket(ticket.number, raffle.ticket_price);
      onTicketsChange();
    }
  };

  const handleRandomSelect = () => {
    const availableTickets = tickets.filter(t => t.status === 'free');
    if (availableTickets.length > 0 && cart?.toggleTicket) {
      const randomTicket = availableTickets[Math.floor(Math.random() * availableTickets.length)];
      cart.toggleTicket(randomTicket.number, raffle.ticket_price);
      onTicketsChange();
    }
  };

  const getTicketStatusColor = (status: TicketStatus, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-500 text-white border-blue-600';
    
    switch (status) {
      case 'free':
        return 'bg-green-900/30 text-green-300 border-green-700 hover:bg-green-800/40 cursor-pointer';
      case 'reserved':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700 cursor-not-allowed';
      case 'paid':
        return 'bg-red-900/30 text-red-300 border-red-700 cursor-not-allowed';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  const filteredTickets = searchNumber 
    ? tickets.filter(t => t.number.toString().includes(searchNumber))
    : tickets;

  const stats = {
    total: tickets.length,
    available: tickets.filter(t => t.status === 'free').length,
    reserved: tickets.filter(t => t.status === 'reserved').length,
    sold: tickets.filter(t => t.status === 'paid').length,
  };

  const selectedTicketNumbers = cart?.cartItems?.map((item: any) => item.ticketNumber) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Selecciona tus Boletos
          </CardTitle>
          
          <div className="flex items-center gap-2">
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-slate-200">{stats.total}</div>
            <div className="text-sm text-slate-400">Total</div>
          </div>
          <div className="text-center p-3 bg-green-900/30 border border-green-800 rounded-lg">
            <div className="text-2xl font-bold text-green-300">{stats.available}</div>
            <div className="text-sm text-green-400">Disponibles</div>
          </div>
          <div className="text-center p-3 bg-yellow-900/30 border border-yellow-800 rounded-lg">
            <div className="text-2xl font-bold text-yellow-300">{stats.reserved}</div>
            <div className="text-sm text-yellow-400">Reservados</div>
          </div>
          <div className="text-center p-3 bg-red-900/30 border border-red-800 rounded-lg">
            <div className="text-2xl font-bold text-red-300">{stats.sold}</div>
            <div className="text-sm text-red-400">Vendidos</div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar número de boleto..."
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-900/50 border border-green-700 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-900/50 border border-yellow-700 rounded"></div>
            <span>Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-900/50 border border-red-700 rounded"></div>
            <span>Vendido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
            <span>Seleccionado</span>
          </div>
        </div>

        {/* Ticket Grid */}
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1 max-h-96 overflow-y-auto">
          {filteredTickets.map((ticket) => {
            const isSelected = selectedTicketNumbers.includes(ticket.number);
            return (
              <button
                key={ticket.id}
                onClick={() => handleTicketClick(ticket)}
                disabled={ticket.status !== 'free'}
                className={cn(
                  "aspect-square text-xs font-medium border rounded transition-colors",
                  getTicketStatusColor(ticket.status, isSelected)
                )}
                title={`Boleto #${ticket.number} - ${ticket.status === 'free' ? 'Disponible' : ticket.status === 'reserved' ? 'Reservado' : 'Vendido'}`}
              >
                {ticket.number}
              </button>
            );
          })}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No se encontraron boletos con ese número
          </div>
        )}
      </CardContent>
    </Card>
  );
}
