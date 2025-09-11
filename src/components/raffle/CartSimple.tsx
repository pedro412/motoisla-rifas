"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, CreditCard } from "lucide-react";
import { CheckoutConfirmDialog } from "@/components/ui/CheckoutConfirmDialog";
import { Raffle } from "@/lib/types";
import { useRouter } from "next/navigation";

interface CartProps {
  raffle: Raffle;
  cart: {
    cartItems: Array<{
      id: string;
      ticketNumber: number;
      price: number;
      quantity: number;
    }>;
    removeTicket: (ticketNumber: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTicketNumbers: () => number[];
    submitOrder: (customerInfo: {
      name: string;
      phone?: string;
      email?: string;
    }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
    isSubmitting: boolean;
    itemCount: number;
  };
  onOrderComplete: () => void;
}

export function Cart({ raffle, cart, onOrderComplete }: CartProps) {
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const router = useRouter();

  const handleCheckoutConfirm = async (customerInfo: {
    name: string;
    phone: string;
    email?: string;
  }) => {
    try {
      console.log("Submitting order with customer info:", customerInfo);
      const result = await cart.submitOrder(customerInfo);
      console.log("Order submission result:", result);

      if (result && result.success && result.orderId) {
        // Redirect to checkout page with order data
        const params = new URLSearchParams({
          orderId: result.orderId,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          ...(customerInfo.email && { customerEmail: customerInfo.email }),
          ticketNumbers: cart.getTicketNumbers().join(","),
          totalAmount: cart.getTotalPrice().toString(),
          raffleName: raffle.title,
        });

        console.log("Redirecting to checkout with params:", params.toString());
        router.push(`/checkout?${params.toString()}`);

        // Clear cart and notify parent
        onOrderComplete();
      } else {
        console.error("Order submission failed:", result);
        alert(result?.error || "Error al procesar la orden");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(
        `Error al procesar la orden: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setShowCheckoutDialog(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <>
      <Card className="overflow-hidden bg-slate-800/30 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="h-5 w-5 text-white" />
            🛒 Carrito ({cart.itemCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cart Items */}
          {cart.cartItems.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cart.cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 moto-card moto-border rounded"
                >
                  <span className="text-sm text-white">
                    🎫 Boleto #{item.ticketNumber.toString().padStart(3, "0")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-400">
                      {formatCurrency(item.price)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cart.removeTicket(item.ticketNumber)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50 text-slate-400" />
              <p>🏍️ Tu carrito está vacío</p>
              <p className="text-sm">Selecciona números para comenzar</p>
            </div>
          )}

          {/* Total */}
          {cart.cartItems.length > 0 && (
            <div className="border-t moto-border pt-4">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span className="text-white">💰 Total:</span>
                <span className="text-green-400 text-xl font-bold">
                  {formatCurrency(cart.getTotalPrice())}
                </span>
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <Button
            onClick={() => setShowCheckoutDialog(true)}
            disabled={cart.cartItems.length === 0}
            variant="primary"
            className="w-full font-semibold"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            🏁 Proceder al Checkout
          </Button>

          {/* Instructions */}
          <div className="moto-card moto-border p-3 rounded-lg text-sm">
            <h4 className="font-medium mb-2 text-white">🏍️ Siguiente paso</h4>
            <p className="text-slate-400">
              Selecciona tus boletos y procede al checkout para completar tu
              información y realizar el pago.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Confirmation Dialog */}
      <CheckoutConfirmDialog
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        onConfirm={handleCheckoutConfirm}
        raffle={raffle}
        cartItems={cart.cartItems}
        totalPrice={cart.getTotalPrice()}
      />
    </>
  );
}
