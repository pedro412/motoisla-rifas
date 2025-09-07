'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, CheckCircle, MessageCircle, CreditCard, Building2 } from 'lucide-react';
import { useReservationTimer } from '@/hooks/useReservationTimer';
import { ReservationTimer } from '@/components/ui/ReservationTimer';
import { createWhatsAppMessage } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface OrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  ticketNumbers: number[];
  totalAmount: number;
  raffleName: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [serverRemainingTime, setServerRemainingTime] = useState<number | undefined>(undefined);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const reservationTimer = useReservationTimer({
    onTimeout: () => {
      alert('Tu reservación ha expirado. Serás redirigido al inicio.');
      localStorage.removeItem('currentOrder');
      router.push('/');
    },
    duration: 15, // 15 minutes fallback
    initialTimeLeft: serverRemainingTime // Pass server time when available
  });

  // Function to sync with server
  const syncWithServer = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const { order, valid, expired } = await response.json();
        
        if (valid && !expired && order.remainingSeconds > 0) {
          const now = Date.now();
          // Only sync if it's been more than 30 seconds since last sync
          if (now - lastSyncTime > 30000) {
            console.log('🔄 Periodic sync - server time:', order.remainingSeconds, 'seconds');
            setServerRemainingTime(order.remainingSeconds);
            setLastSyncTime(now);
          }
        } else {
          // Order expired, clean up
          localStorage.removeItem('currentOrder');
          alert('Tu orden ha expirado. Serás redirigido al inicio.');
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  }, [lastSyncTime, router]);

  // The timer hook will automatically use serverRemainingTime when it changes

  // Periodic sync with server every 30 seconds
  useEffect(() => {
    if (!orderData?.orderId) return;

    const interval = setInterval(() => {
      syncWithServer(orderData.orderId);
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [orderData?.orderId, syncWithServer]);

  // Supabase realtime subscription for order changes
  useEffect(() => {
    if (!orderData?.orderId) return;

    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderData.orderId}`,
        },
        (payload) => {
          console.log('🔔 Realtime order update:', payload);
          const updatedOrder = payload.new as { status: string; id: string };
          
          if (updatedOrder.status === 'expired' || updatedOrder.status === 'cancelled') {
            localStorage.removeItem('currentOrder');
            alert('Tu orden ha sido cancelada o ha expirado. Serás redirigido al inicio.');
            router.push('/');
          } else if (updatedOrder.status === 'paid') {
            alert('¡Pago confirmado! Tu orden ha sido procesada exitosamente.');
            router.push('/');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderData?.orderId, router]);

  useEffect(() => {
    const initializeOrder = async () => {
      // First try to get order data from URL params
      const orderId = searchParams.get('orderId');
      const customerName = searchParams.get('customerName');
      const customerPhone = searchParams.get('customerPhone');
      const customerEmail = searchParams.get('customerEmail');
      const ticketNumbers = searchParams.get('ticketNumbers')?.split(',').map(Number) || [];
      const totalAmount = parseFloat(searchParams.get('totalAmount') || '0');
      const raffleName = searchParams.get('raffleName') || '';

      if (orderId && customerName && customerPhone && ticketNumbers.length > 0) {
        // Fresh order from URL params - validate with server to get real time
        const newOrderData = {
          orderId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          ticketNumbers,
          totalAmount,
          raffleName
        };
        
        // Save to localStorage
        localStorage.setItem('currentOrder', JSON.stringify(newOrderData));
        setOrderData(newOrderData);
        
        // Validate with server to get real remaining time
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          if (response.ok) {
            const { order, valid, expired } = await response.json();
            
            if (valid && !expired && order.remainingSeconds > 0) {
              console.log('⏰ Fresh order - using server remaining time:', order.remainingSeconds);
              setServerRemainingTime(order.remainingSeconds);
            } else {
              // Order expired or invalid, clean up
              localStorage.removeItem('currentOrder');
              alert('Tu orden ha expirado o es inválida. Serás redirigido al inicio.');
              router.push('/');
              return;
            }
          } else {
            // Fallback to 15 minutes if server validation fails
            console.log('⚠️ Server validation failed, using fallback timer');
            setServerRemainingTime(15 * 60); // 15 minutes in seconds
          }
        } catch (error) {
          console.error('Error validating fresh order:', error);
          // Fallback to 15 minutes if validation fails
          setServerRemainingTime(15 * 60); // 15 minutes in seconds
        }
        return;
      }

      // Try to recover from localStorage
      const savedOrder = localStorage.getItem('currentOrder');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          
          // Validate order with server
          const response = await fetch(`/api/orders/${parsedOrder.orderId}`);
          
          if (response.ok) {
            const { order, valid, expired } = await response.json();
            
            if (valid && !expired) {
              // Order is still valid, restore it
              setOrderData({
                orderId: parsedOrder.orderId,
                customerName: parsedOrder.customerName,
                customerPhone: parsedOrder.customerPhone,
                customerEmail: parsedOrder.customerEmail,
                ticketNumbers: parsedOrder.ticketNumbers,
                totalAmount: parsedOrder.totalAmount,
                raffleName: parsedOrder.raffleName
              });
              
              // Use server-provided remaining time
              console.log('📡 Server response:', { remainingSeconds: order.remainingSeconds, orderId: parsedOrder.orderId });
              if (order.remainingSeconds > 0) {
                console.log('⏰ Setting server remaining time:', order.remainingSeconds);
                setServerRemainingTime(order.remainingSeconds);
              } else {
                // Order expired, clean up
                console.log('⚠️ Order expired, redirecting');
                localStorage.removeItem('currentOrder');
                alert('Tu orden ha expirado. Serás redirigido al inicio.');
                router.push('/');
              }
              return;
            } else {
              // Order expired or invalid, clean up
              localStorage.removeItem('currentOrder');
            }
          } else {
            // Order not found, clean up
            localStorage.removeItem('currentOrder');
          }
        } catch (error) {
          console.error('Error parsing saved order:', error);
          localStorage.removeItem('currentOrder');
        }
      }

      // No valid order found, redirect
      router.push('/');
    };

    initializeOrder();
  }, [searchParams]); // Add searchParams as dependency

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleWhatsAppContact = () => {
    if (!orderData) return;

    const message = createWhatsAppMessage({
      raffleName: orderData.raffleName,
      ticketNumbers: orderData.ticketNumbers,
      totalAmount: orderData.totalAmount,
      orderId: orderData.orderId,
      bankInfo: {
        bankName: 'BBVA',
        accountHolder: 'Moto Isla',
        accountNumber: '1234567890',
        clabe: '012345678901234567'
      }
    });

    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  const bankInfo = {
    bankName: 'BBVA',
    accountHolder: 'Moto Isla',
    accountNumber: '1234567890',
    clabe: '012345678901234567'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-white">Checkout - Pago Pendiente</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reservation Timer */}
            <ReservationTimer
              timeLeft={reservationTimer.formatTime}
              isActive={reservationTimer.isActive}
              isExpired={reservationTimer.isExpired}
              ticketCount={orderData.ticketNumbers.length}
            />

            {/* Order Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Pedido:</span>
                    <p className="text-white font-mono">#{orderData.orderId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Cliente:</span>
                    <p className="text-white">{orderData.customerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Teléfono:</span>
                    <p className="text-white">{orderData.customerPhone}</p>
                  </div>
                  {orderData.customerEmail && (
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <p className="text-white">{orderData.customerEmail}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-white font-medium mb-2">Boletos Seleccionados ({orderData.ticketNumbers.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {orderData.ticketNumbers.map(number => (
                      <span 
                        key={number}
                        className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded"
                      >
                        #{number}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-white">Total a Pagar:</span>
                    <span className="text-green-400">{formatCurrency(orderData.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Datos para Transferencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <span className="text-slate-400 text-sm">Banco:</span>
                      <p className="text-white font-medium">{bankInfo.bankName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <span className="text-slate-400 text-sm">Titular:</span>
                      <p className="text-white font-medium">{bankInfo.accountHolder}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <span className="text-slate-400 text-sm">Número de Cuenta:</span>
                      <p className="text-white font-mono">{bankInfo.accountNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo.accountNumber, 'account')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedField === 'account' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <span className="text-slate-400 text-sm">CLABE:</span>
                      <p className="text-white font-mono">{bankInfo.clabe}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo.clabe, 'clabe')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedField === 'clabe' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* WhatsApp Contact */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                  Enviar Comprobante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-sm">
                  Una vez realizada la transferencia, envía tu comprobante por WhatsApp para confirmar el pago.
                </p>
                <Button
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar por WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Instrucciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-slate-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    Realiza la transferencia bancaria por el monto exacto
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    Toma captura de pantalla del comprobante
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    Envía el comprobante por WhatsApp
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                    Espera la confirmación (máximo 24h)
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
