"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RaffleHeader } from "@/components/raffle/RaffleHeader";
import { TicketGrid } from "@/components/raffle/TicketGrid";
import { MobileCartDrawer } from "@/components/ui/mobile-cart-drawer";
import { FloatingCartButton } from "@/components/ui/floating-cart-button";
import { useRaffleContext } from "@/contexts/RaffleContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, CreditCard } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { state, actions } = useRaffleContext();
  const { raffle, tickets, cartItems, activeOrder, loading, error } = state;

  // Debug log to check activeOrder
  console.log("Active Order:", activeOrder);
  console.log("Active Order exists?", !!activeOrder);
  const router = useRouter();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [shouldShowMobileCart, setShouldShowMobileCart] = useState(false);
  const [isButtonLocked, setIsButtonLocked] = useState(false);

  // Cart item count for mobile cart visibility
  const itemCount = cartItems.length;

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
      actions.setActiveOrder(null);
      actions.refreshTickets(); // Refresh to show released tickets
    }
  };

  // Show mobile cart indicator when items are added, but don't auto-open
  useEffect(() => {
    if (itemCount > 0 && !shouldShowMobileCart) {
      setShouldShowMobileCart(true);
      // Don't auto-open the drawer - let user open it explicitly
    } else if (itemCount === 0) {
      setShouldShowMobileCart(false);
      setIsMobileCartOpen(false);
    }
  }, [itemCount, shouldShowMobileCart]);

  const handleProceedToCheckout = async (customerInfo: {
    name: string;
    phone: string;
    email?: string;
  }) => {
    if (activeOrder) {
      alert(
        "Tienes un pago pendiente. Debes pagar o cancelar tu orden antes de crear una nueva."
      );
      return;
    }
    if (itemCount > 0 && raffle) {
      setIsButtonLocked(true);
      try {
        // Create order first
        const orderData = {
          raffle_id: raffle.id,
          ticket_numbers: actions.getTicketNumbers(),
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

        const { order } = await response.json();

        // Navigate to checkout with orderId and customer info
        const params = new URLSearchParams({
          orderId: order.id,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          ...(customerInfo.email && { customerEmail: customerInfo.email }),
          ticketNumbers: actions.getTicketNumbers().join(","),
          totalAmount: actions.getTotalPrice().toString(),
          raffleName: raffle.title,
        });

        router.push(`/checkout?${params.toString()}`);

        // Clear cart after successful order creation
        actions.clearCart();
        actions.refreshTickets();
      } catch (error) {
        console.error("Error creating order:", error);
        alert("Error al crear la orden. Por favor intenta de nuevo.");
        setIsButtonLocked(false);
      }
    }
  };

  const handleRemoveFromCart = (ticketNumber: number) => {
    actions.removeFromCart(ticketNumber);
    actions.refreshTickets();
  };

  // Convert cart items to the format expected by MobileCartDrawer
  const cartItemsForDrawer = cartItems.map((item) => ({
    ticketNumber: item.ticketNumber,
    price: item.price,
  }));

  // Show loading state
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

  // Show error state (network/server errors)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center moto-card p-8 rounded-lg">
          <p className="text-red-400 text-xl mb-4">⚠️ Error: {error}</p>
          <p className="text-slate-400 mb-4">
            Hubo un problema al cargar los datos. Por favor intenta de nuevo.
          </p>
          <Button
            onClick={() => actions.refreshTickets()}
            className="bg-red-600 hover:bg-red-700"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Show no raffles state (when loading is complete but no raffles exist)
  if (!loading && !raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center moto-card p-8 rounded-lg">
          <p className="text-white text-xl mb-4">
            🏍️ No hay rifas activas en este momento
          </p>
          <p className="text-slate-400 mb-4">
            Vuelve pronto para participar en nuestras próximas rifas
          </p>
          <Button onClick={() => actions.refreshTickets()} variant="outline">
            Actualizar
          </Button>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-300 font-medium">
                    Tienes un pago pendiente
                  </p>
                  <p className="text-slate-400 text-sm">
                    Boletos {activeOrder.ticketNumbers.join(", ")} - $
                    {activeOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleContinuePayment}
                  variant="primary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Continuar Pago
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Raffle Info & Ticket Grid */}
          <div className="space-y-6">
            <RaffleHeader raffle={raffle!} />
            <TicketGrid
              raffle={raffle!}
              tickets={tickets}
              onTicketsChange={actions.refreshTickets}
              lockedTicketNumbers={activeOrder ? activeOrder.ticketNumbers : []}
            />
          </div>
        </div>

        {/* Cart Components - Shown on both desktop and mobile when items are selected */}
        {shouldShowMobileCart && (
          <div>
            {/* Floating Cart Button */}
            <FloatingCartButton
              itemCount={itemCount}
              totalAmount={actions.getTotalPrice()}
              onClick={() => setIsMobileCartOpen(true)}
            />

            {/* Cart Drawer */}
            <MobileCartDrawer
              isOpen={isMobileCartOpen}
              onOpenChange={setIsMobileCartOpen}
              cartItems={cartItemsForDrawer}
              onRemoveItem={handleRemoveFromCart}
              onProceedToCheckout={handleProceedToCheckout}
              raffleTitle={raffle?.title || ""}
              isButtonLocked={isButtonLocked || !!activeOrder}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              © {new Date().getFullYear()} MOTO ISLA. Todos los derechos reservados.
            </div>
            <div className="flex gap-6 text-sm">
              <a
                href="/privacy-policy"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Política de Privacidad
              </a>
              <span className="text-slate-400">Soporte (Próximamente)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
