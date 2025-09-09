'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, createWhatsAppMessage, generateWhatsAppUrl } from "@/lib/utils";
import { ShoppingCart, Trash2, MessageCircle, CreditCard } from "lucide-react";
import { CartItem } from "@/lib/types";

interface CartProps {
  items?: CartItem[];
  onRemoveItem?: (ticketId: string) => void;
  onCheckout?: () => void;
}

// Mock cart data for now
const mockCartItems: CartItem[] = [
  { id: "ticket-7", ticketNumber: 7, price: 50, quantity: 1 },
  { id: "ticket-77", ticketNumber: 77, price: 50, quantity: 1 },
  { id: "ticket-123", ticketNumber: 123, price: 50, quantity: 1 },
];

export function Cart({ items = mockCartItems, onRemoveItem, onCheckout }: CartProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const ticketNumbers = items.map(item => item.ticketNumber);

  const handleRemoveItem = (ticketId: string) => {
    if (onRemoveItem) {
      onRemoveItem(ticketId);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // Generate order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create WhatsApp message
      const whatsappMessage = createWhatsAppMessage({
        raffleName: "Casco AGV Pista GP RR - Edición Limitada",
        ticketNumbers,
        totalAmount: total,
        orderId,
        bankInfo: {
          bankName: "BBVA",
          accountHolder: "Moto Isla",
          accountNumber: "1234567890",
          clabe: "0123456789012345678"
        }
      });
      
      // WhatsApp number (from env or default)
      const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "521234567890";
      const whatsappUrl = generateWhatsAppUrl(whatsappNumber, whatsappMessage);
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Here you would typically:
      // 1. Create order in Supabase
      // 2. Reserve tickets
      // 3. Set expiration timer
      
      if (onCheckout) {
        onCheckout();
      }
      
    } catch (error) {
      console.error('Error during checkout:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const bankInfo = {
    bankName: "BBVA Bancomer",
    accountHolder: "Moto Isla S.A. de C.V.",
    accountNumber: "0123456789",
    clabe: "012345678901234567"
  };

  return (
    <div className="space-y-4">
      {/* Cart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({items.length})
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay boletos seleccionados</p>
              <p className="text-sm">Selecciona boletos del grid</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-200">Boleto #{item.ticketNumber}</span>
                      <div className="text-sm text-slate-400">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-200">Información de contacto</h4>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={isProcessing || !customerInfo.name.trim()}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  "Procesando..."
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Generar Orden
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Instrucciones de Pago
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-300 mb-2">Datos Bancarios</h4>
              <div className="space-y-1 text-sm text-blue-200">
                <p><strong>Banco:</strong> {bankInfo.bankName}</p>
                <p><strong>Titular:</strong> {bankInfo.accountHolder}</p>
                <p><strong>Cuenta:</strong> {bankInfo.accountNumber}</p>
                <p><strong>CLABE:</strong> {bankInfo.clabe}</p>
              </div>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-800 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-300 mb-2">⏰ Importante</h4>
              <ul className="text-sm text-yellow-200 space-y-1">
                <li>• Tienes 24 horas para realizar el pago</li>
                <li>• Envía tu comprobante por WhatsApp</li>
                <li>• Tus boletos se reservarán automáticamente</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
