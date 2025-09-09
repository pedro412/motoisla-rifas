'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TicketCounter } from '@/components/ui/ticket-counter';
import { Progress } from '@/components/ui/progress';
import { Shuffle, Grid, TrendingUp } from 'lucide-react';
import { Raffle, Ticket } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CartItem {
  id: string;
  ticketNumber: number;
  price: number;
  quantity: number;
}

interface Cart {
  cartItems: CartItem[];
  toggleTicket: (ticketNumber: number, price: number) => void;
  addTicket: (ticketNumber: number, price: number) => void;
  removeTicket: (ticketNumber: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTicketNumbers: () => number[];
  itemCount: number;
}

interface TicketGridProps {
  raffle: Raffle;
  tickets: Ticket[];
  cart: Cart;
  onTicketsChange: () => void;
}

type TicketStatus = 'free' | 'reserved' | 'paid';


export function TicketGrid({ raffle, tickets, cart, onTicketsChange }: TicketGridProps) {
  const [searchNumber, setSearchNumber] = useState('');
  const [ticketCount, setTicketCount] = useState(1);

  const handleTicketClick = (ticket: Ticket) => {
    if (ticket.status === 'free' && cart.toggleTicket) {
      cart.toggleTicket(ticket.number, raffle.ticket_price);
      onTicketsChange();
    }
  };

  const handleRandomSelect = (count: number) => {
    const availableTickets = tickets.filter(t => t.status === 'free');
    const selectedTickets = cart.getTicketNumbers();
    const unselectedAvailable = availableTickets.filter(t => !selectedTickets.includes(t.number));
    
    if (unselectedAvailable.length === 0) return;
    
    // Calculate how many tickets we can actually select
    const currentCount = cart.itemCount;
    const maxAllowed = Math.min(
      raffle.max_tickets_per_user,
      count,
      unselectedAvailable.length
    );
    const canSelect = Math.min(maxAllowed, raffle.max_tickets_per_user - currentCount);
    
    if (canSelect <= 0) return;
    
    // Randomly select tickets
    const shuffled = [...unselectedAvailable].sort(() => Math.random() - 0.5);
    const toSelect = shuffled.slice(0, canSelect);
    
    toSelect.forEach(ticket => {
      cart.addTicket(ticket.number, raffle.ticket_price);
    });
    
    onTicketsChange();
  };

  const handleSingleRandomSelect = () => {
    handleRandomSelect(1);
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

  const selectedTicketNumbers = cart.cartItems.map((item) => item.ticketNumber) || [];

  const salesProgress = ((stats.reserved + stats.sold) / stats.total) * 100;

  return (
    <Card className="moto-card moto-border">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Grid className="h-5 w-5 moto-text-primary" />
              Selecciona tus Boletos
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSingleRandomSelect}
                className="flex items-center gap-2 moto-border hover:moto-red-glow"
              >
                <Shuffle className="h-4 w-4" />
                Aleatorio
              </Button>
            </div>
          </div>

          {/* Sales Progress */}
          <div className="moto-card moto-border p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 moto-text-primary" />
                Progreso de Ventas
              </h3>
              <span className="text-sm moto-text-secondary">
                {Math.round(salesProgress)}% vendido
              </span>
            </div>
            <Progress 
              value={salesProgress} 
              className="h-3 moto-border bg-black/40"
            />
            <div className="flex justify-between text-xs moto-text-secondary mt-2">
              <span>{stats.reserved + stats.sold} vendidos</span>
              <span>{stats.total} total</span>
            </div>
          </div>
          
          {/* Ticket Counter Section */}
          <div className="flex flex-col gap-3 p-4 moto-card moto-border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Selección Rápida</h3>
              <span className="text-xs moto-text-secondary">
                Seleccionados: {cart.itemCount} / {raffle.max_tickets_per_user}
              </span>
            </div>
            
            <TicketCounter
              value={ticketCount}
              onChange={setTicketCount}
              max={raffle.max_tickets_per_user - cart.itemCount}
              availableTickets={stats.available}
              onRandomSelect={handleRandomSelect}
              disabled={cart.itemCount >= raffle.max_tickets_per_user}
            />
            
            {cart.itemCount >= raffle.max_tickets_per_user && (
              <p className="text-xs text-yellow-400">
                Has alcanzado el límite máximo de {raffle.max_tickets_per_user} boletos por usuario
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 moto-card moto-border rounded-lg">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm moto-text-secondary">Total</div>
          </div>
          <div className="text-center p-3 moto-card moto-border bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-300">{stats.available}</div>
            <div className="text-sm text-green-400">Disponibles</div>
          </div>
          <div className="text-center p-3 moto-card moto-border bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-300">{stats.reserved}</div>
            <div className="text-sm text-yellow-400">Reservados</div>
          </div>
          <div className="text-center p-3 moto-card moto-border bg-red-900/20 rounded-lg">
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
            className="w-full px-3 py-2 moto-card moto-border text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:moto-red-glow"
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
