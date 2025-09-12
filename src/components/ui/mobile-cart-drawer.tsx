"use client";

import * as React from "react";
import { BottomDrawer } from "./bottom-drawer";
import { Button } from "./button";
import { Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  ticketNumber: number;
  price: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

interface MobileCartDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onRemoveItem: (ticketNumber: number) => void;
  onProceedToCheckout: (customerInfo: CustomerInfo) => void;
  isLoading?: boolean;
  raffleTitle?: string;
  isButtonLocked?: boolean;
}

export function MobileCartDrawer({
  isOpen,
  onOpenChange,
  cartItems,
  onRemoveItem,
  onProceedToCheckout,
  isLoading = false,
  raffleTitle,
  isButtonLocked = false,
}: MobileCartDrawerProps) {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
  const itemCount = cartItems.length;
  
  const [customerInfo, setCustomerInfo] = React.useState<CustomerInfo>({
    name: '',
    phone: '',
    email: ''
  });

  const formatTicketNumber = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  const isFormValid = customerInfo.name.trim().length >= 2 && customerInfo.phone.trim().length >= 10;

  const handleProceedToCheckout = () => {
    if (isFormValid && itemCount > 0) {
      onProceedToCheckout(customerInfo);
    }
  };

  return (
    <BottomDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Carrito (${itemCount})`}
      description={itemCount > 0 ? `${itemCount} boleto${itemCount > 1 ? 's' : ''} seleccionado${itemCount > 1 ? 's' : ''}` : "No hay boletos seleccionados"}
      showBadge={true}
      badgeCount={itemCount}
    >
      <div className="space-y-4">
        {/* Customer Information Form - Moved to top for better UX */}
        {itemCount > 0 && (
          <div className="space-y-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <h4 className="text-white font-semibold text-base">Completa tu Información</h4>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/70 text-white placeholder-gray-300 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              
              <input
                type="tel"
                placeholder="Teléfono *"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/70 text-white placeholder-gray-300 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              
              <input
                type="email"
                placeholder="Email (opcional)"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/70 text-white placeholder-gray-300 rounded-lg border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <p className="text-xs text-blue-300 flex items-center gap-1">
              <span className="text-red-400">*</span> Campos requeridos para continuar
            </p>
          </div>
        )}

        {/* Raffle Info */}
        {raffleTitle && (
          <div className="bg-slate-800/50 rounded-lg p-3">
            <h3 className="text-white font-medium text-sm mb-1">Rifa:</h3>
            <p className="text-gray-300 text-sm">{raffleTitle}</p>
          </div>
        )}

        {/* Cart Items */}
        {itemCount === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No has seleccionado ningún boleto</p>
            <p className="text-gray-500 text-xs mt-1">Toca los números arriba para agregar boletos</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <h4 className="text-slate-300 font-medium text-sm mb-2">Boletos Seleccionados:</h4>
            {cartItems.map((item) => (
              <div
                key={item.ticketNumber}
                className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-700 text-white text-sm font-bold px-3 py-1 rounded-md min-w-[50px] text-center">
                    {formatTicketNumber(item.ticketNumber)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Boleto #{formatTicketNumber(item.ticketNumber)}</p>
                    <p className="text-green-400 text-xs font-semibold">${item.price.toLocaleString()}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onRemoveItem(item.ticketNumber)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                  aria-label={`Eliminar boleto ${formatTicketNumber(item.ticketNumber)}`}
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Total and Actions */}
        {itemCount > 0 && (
          <div className="space-y-4 border-t border-slate-600/30 pt-4">
            {/* Total */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Total:</span>
                <span className="text-white text-xl font-bold">${totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-400 text-xs">{itemCount} boleto{itemCount > 1 ? 's' : ''}</span>
                <span className="text-green-400 text-xs">MXN</span>
              </div>
            </div>


            {/* Action Buttons - Fixed at bottom */}
            <div className="space-y-2 mt-6 pt-4 border-t border-slate-600/30 bg-slate-900/90 sticky bottom-0">
              <Button
                onClick={handleProceedToCheckout}
                disabled={isLoading || isButtonLocked || !isFormValid}
                className={cn(
                  "w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-base shadow-lg",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600",
                  "min-h-[52px] transition-all duration-200",
                  isFormValid && "ring-2 ring-red-500/20 hover:ring-red-500/40"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </div>
                ) : !isFormValid ? (
                  "Completa la información"
                ) : (
                  `Proceder al Pago - $${totalAmount.toLocaleString()}`
                )}
              </Button>
              
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full border-slate-600/30 text-slate-300 hover:bg-slate-800/50 py-2 min-h-[40px]"
              >
                Continuar Seleccionando
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomDrawer>
  );
}
