"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RaffleHeader } from "@/components/raffle/RaffleHeader";
import { TicketGrid } from "@/components/raffle/TicketGrid";
import { Cart } from "@/components/raffle/CartSimple";
import { MobileCartDrawer } from "@/components/ui/mobile-cart-drawer";
import { FloatingCartButton } from "@/components/ui/floating-cart-button";
import { useRaffle } from "@/hooks/useRaffle";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CreditCard } from "lucide-react";
import Image from "next/image";

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
  const cart = useCart(raffle?.id, raffle?.max_tickets_per_user || 20);
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [shouldShowMobileCart, setShouldShowMobileCart] = useState(false);

  // Check for active order on mount
  useEffect(() => {
    const checkActiveOrder = async () => {
      const savedOrder = localStorage.getItem("currentOrder");
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);

          // Validate order with server
          const response = await fetch(`/api/orders/${parsedOrder.orderId}`);

          if (response.ok) {
            const { valid, expired, paid } = await response.json();

            if (valid && !expired && !paid) {
              setActiveOrder(parsedOrder);
            } else {
              // Order expired, paid, or invalid - clean up
              localStorage.removeItem("currentOrder");
            }
          } else {
            // Order not found, cancelled, or expired - clean up
            localStorage.removeItem("currentOrder");
          }
        } catch (error) {
          console.error("Error checking active order:", error);
          localStorage.removeItem("currentOrder");
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
        ...(activeOrder.customerEmail && {
          customerEmail: activeOrder.customerEmail,
        }),
        ticketNumbers: activeOrder.ticketNumbers.join(","),
        totalAmount: activeOrder.totalAmount.toString(),
        raffleName: activeOrder.raffleName,
      });
      router.push(`/checkout?${params.toString()}`);
    }
  };

  const handleCancelOrder = async () => {
    if (activeOrder) {
      try {
        // Cancel the order on server
        await fetch(`/api/orders/${activeOrder.orderId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error canceling order:", error);
      }

      // Clean up locally
      localStorage.removeItem("currentOrder");
      setActiveOrder(null);
      refreshTickets(); // Refresh to show released tickets
    }
  };

  // Show mobile cart indicator when items are added, but don't auto-open
  useEffect(() => {
    if (cart.itemCount > 0 && !shouldShowMobileCart) {
      setShouldShowMobileCart(true);
      // Don't auto-open the drawer - let user open it explicitly
    } else if (cart.itemCount === 0) {
      setShouldShowMobileCart(false);
      setIsMobileCartOpen(false);
    }
  }, [cart.itemCount, shouldShowMobileCart]);

  const handleProceedToCheckout = async (customerInfo: {
    name: string;
    phone: string;
    email?: string;
  }) => {
    if (cart.itemCount > 0 && raffle) {
      try {
        // Create order first
        const orderData = {
          raffle_id: raffle.id,
          ticket_numbers: cart.getTicketNumbers(),
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email,
        };

        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create order");
        }

        const { order, whatsappSent, messageId } = await response.json();

        // Log WhatsApp status
        if (whatsappSent) {
          console.log('WhatsApp message sent successfully:', messageId);
        } else {
          console.warn('WhatsApp message was not sent');
        }

        // Navigate to checkout with orderId and customer info
        const params = new URLSearchParams({
          orderId: order.id,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          ...(customerInfo.email && { customerEmail: customerInfo.email }),
          ticketNumbers: cart.getTicketNumbers().join(","),
          totalAmount: cart.getTotalPrice().toString(),
          raffleName: raffle.title,
        });

        router.push(`/checkout?${params.toString()}`);

        // Clear cart after successful order creation
        cart.clearCart();
        refreshTickets();
      } catch (error) {
        console.error("Error creating order:", error);
        alert("Error al crear la orden. Por favor intenta de nuevo.");
      }
    }
  };

  const handleRemoveFromCart = (ticketNumber: number) => {
    cart.removeTicket(ticketNumber);
    refreshTickets();
  };

  // Convert cart items to the format expected by MobileCartDrawer
  const cartItems = cart.cartItems.map((item) => ({
    ticketNumber: item.ticketNumber,
    price: item.price,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mb-4 moto-red-glow"></div>
          <p className="text-white text-xl">🏍️ Cargando rifa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center moto-card p-8 rounded-lg">
          <p className="text-red-400 text-xl mb-4">⚠️ Error: {error}</p>
          <p className="text-slate-400">
            Asegúrate de que tu archivo .env.local esté configurado
            correctamente
          </p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center moto-card p-8 rounded-lg">
          <p className="text-white text-xl">
            🏍️ No hay rifas activas en este momento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/images/motisla.png"
              alt="Moto Isla Logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>
          <p className="text-slate-400 text-lg">
            Rifas de productos motociclistas de las mejores marcas
          </p>
        </div>

        {/* Active Order Notification */}
        {activeOrder && (
          <Card className="mb-6 bg-slate-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-300 font-medium">
                    Tienes un pago pendiente
                  </p>
                  <p className="text-slate-400 text-sm">
                    Boletos {activeOrder.ticketNumbers.join(", ")} - $
                    {activeOrder.totalAmount}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleContinuePayment}
                  variant="primary"
                  size="sm"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Continuar Pago
                </Button>
                <Button onClick={handleCancelOrder} variant="outline" size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
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

          {/* Desktop Cart Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <Cart
              raffle={raffle}
              cart={cart}
              onOrderComplete={refreshTickets}
            />
          </div>
        </div>

        {/* Mobile Cart Components - Only shown on mobile when items are selected */}
        {shouldShowMobileCart && (
          <div className="lg:hidden">
            {/* Floating Cart Button */}
            <FloatingCartButton
              itemCount={cart.itemCount}
              totalAmount={cart.getTotalPrice()}
              onClick={() => setIsMobileCartOpen(true)}
            />

            {/* Mobile Cart Drawer */}
            <MobileCartDrawer
              isOpen={isMobileCartOpen}
              onOpenChange={setIsMobileCartOpen}
              cartItems={cartItems}
              onRemoveItem={handleRemoveFromCart}
              onProceedToCheckout={handleProceedToCheckout}
              raffleTitle={raffle.title}
            />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              © 2024 MOTO ISLA. Todos los derechos reservados.
            </div>
            <div className="flex gap-6 text-sm">
              <a 
                href="/privacy-policy" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Política de Privacidad
              </a>
              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Soporte WhatsApp
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
