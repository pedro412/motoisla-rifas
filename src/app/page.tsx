'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RaffleHeader } from '@/components/raffle/RaffleHeader';
import { TicketGrid } from '@/components/raffle/TicketGridSimple';
import { Cart } from '@/components/raffle/CartSimple';
import { useRaffle } from '@/hooks/useRaffle';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CreditCard } from 'lucide-react';

interface ActiveOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  ticketNumbers: number[];
  totalAmount: number;
  raffleName: string;
}

export default function Home() {
  const { raffle, tickets, loading, error, refreshTickets } = useRaffle();
  const cart = useCart(raffle?.id);
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  // Check for active order on mount
  useEffect(() => {
    const checkActiveOrder = async () => {
      const savedOrder = localStorage.getItem('currentOrder');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          
          // Validate order with server
          const response = await fetch(`/api/orders/${parsedOrder.orderId}`);
          
          if (response.ok) {
            const { order, valid, expired, paid } = await response.json();
            
            if (valid && !expired && !paid) {
              setActiveOrder(parsedOrder);
            } else {
              // Order expired, paid, or invalid - clean up
              localStorage.removeItem('currentOrder');
            }
          } else {
            // Order not found, cancelled, or expired - clean up
            localStorage.removeItem('currentOrder');
          }
        } catch (error) {
          console.error('Error checking active order:', error);
          localStorage.removeItem('currentOrder');
        }
      }
    };

    checkActiveOrder();
  }, []);

  const handleContinuePayment = () => {
    if (activeOrder) {
      const params = new URLSearchParams({
        orderId: activeOrder.orderId,
        customerName: activeOrder.customerName,
        customerPhone: activeOrder.customerPhone,
        ...(activeOrder.customerEmail && { customerEmail: activeOrder.customerEmail }),
        ticketNumbers: activeOrder.ticketNumbers.join(','),
        totalAmount: activeOrder.totalAmount.toString(),
        raffleName: activeOrder.raffleName
      });
      router.push(`/checkout?${params.toString()}`);
    }
  };

  const handleCancelOrder = async () => {
    if (activeOrder) {
      try {
        // Cancel the order on server
        await fetch(`/api/orders/${activeOrder.orderId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error canceling order:', error);
      }
      
      // Clean up locally
      localStorage.removeItem('currentOrder');
      setActiveOrder(null);
      refreshTickets(); // Refresh to show released tickets
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">Cargando rifa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Error: {error}</p>
          <p className="text-slate-300">
            Asegúrate de que tu archivo .env.local esté configurado correctamente
          </p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">No hay rifas activas en este momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏍️ Moto Isla Raffle
          </h1>
          <p className="text-slate-300">
            Rifas de productos motociclistas de las mejores marcas
          </p>
        </div>
        
        {/* Active Order Notification */}
        {activeOrder && (
          <Card className="mb-6 bg-amber-900/20 border-amber-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-amber-300 font-medium">
                      Tienes un pago pendiente
                    </p>
                    <p className="text-amber-200 text-sm">
                      Boletos {activeOrder.ticketNumbers.join(', ')} - ${activeOrder.totalAmount}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleContinuePayment}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Continuar Pago
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    variant="outline"
                    className="border-amber-600 text-amber-300 hover:bg-amber-900/30"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Raffle Info & Ticket Grid */}
          <div className="lg:col-span-3 space-y-6">
            <RaffleHeader raffle={raffle} />
            <TicketGrid 
              raffle={raffle}
              tickets={tickets} 
              cart={cart}
              onTicketsChange={refreshTickets}
            />
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Cart 
              raffle={raffle}
              cart={cart}
              onOrderComplete={refreshTickets}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
