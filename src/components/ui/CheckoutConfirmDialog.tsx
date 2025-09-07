'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, ShoppingCart, CreditCard, User, Phone, Mail } from 'lucide-react';
import { Raffle, CartItem } from '@/lib/types';
import { customerInfoSchema, type CustomerInfo } from '@/lib/validations';

interface CheckoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerInfo: { name: string; phone: string; email?: string }) => void;
  raffle: Raffle;
  cartItems: CartItem[];
  totalPrice: number;
}

export function CheckoutConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  raffle, 
  cartItems, 
  totalPrice 
}: CheckoutConfirmDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<CustomerInfo>({
    resolver: zodResolver(customerInfoSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      email: ''
    }
  });

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const ticketNumbers = cartItems.map(item => item.ticketNumber).sort((a, b) => a - b);

  const onSubmit = (data: CustomerInfo) => {
    onConfirm({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Confirmar Compra
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Raffle Info */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <h3 className="font-medium text-white mb-1">{raffle.title}</h3>
            <p className="text-sm text-slate-300">Precio por boleto: {formatCurrency(raffle.ticket_price)}</p>
          </div>

          {/* Selected Tickets */}
          <div>
            <h4 className="font-medium text-white mb-2">Boletos Seleccionados ({cartItems.length})</h4>
            <div className="bg-slate-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {ticketNumbers.map(number => (
                  <span 
                    key={number}
                    className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  >
                    #{number}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-white">Total:</span>
              <span className="text-green-400">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          {/* Customer Information Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <h4 className="font-medium text-white">Información del Cliente</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 flex items-center gap-1">
                <User className="h-4 w-4" />
                Nombre Completo *
              </Label>
              <Input
                id="name"
                {...register('name')}
                type="text"
                placeholder="Tu nombre completo"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Teléfono *
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                type="tel"
                placeholder="Tu número de teléfono"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email (opcional)
              </Label>
              <Input
                id="email"
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>
          </form>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              ⚠️ Al continuar, tus boletos serán reservados por 15 minutos para completar el pago.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={!isValid}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Continuar al Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
