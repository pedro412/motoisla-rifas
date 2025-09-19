"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  MessageCircle,
  CreditCard,
  Building2,
} from "lucide-react";
import { useReservationTimer } from "@/hooks/useReservationTimer";
import { ReservationTimer } from "@/components/ui/ReservationTimer";
import { supabase } from "@/lib/supabase";
import { useOrder } from "@/hooks/useApi";
import { BANK_INFO } from "@/lib/env";
import { openWhatsApp, type WhatsAppMessageData } from "@/lib/whatsapp";

interface OrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  ticketNumbers: number[];
  totalAmount: number;
  raffleName: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState<boolean>(false);

  const orderId = searchParams.get("orderId");
  const { data: orderResponse, isLoading, error } = useOrder(orderId);

  const [serverRemainingTime, setServerRemainingTime] = useState<
    number | undefined
  >(undefined);
  const [hasServerData, setHasServerData] = useState(false);

  const reservationTimer = useReservationTimer({
    onTimeout: () => {
      // Timer is now only for psychological pressure - no actual timeout behavior
      console.log("Timer expired (display only - tickets remain reserved)");
      // Note: Tickets are NOT automatically released. Only manual admin action can release them.
    },
    duration: 15, // 15 minutes fallback
    initialTimeLeft: serverRemainingTime, // Pass server time when available
  });

  // Function to sync with server using React Query data
  const syncWithServer = useCallback(() => {
    if (orderResponse && orderId) {
      const { order, valid, expired, paid } = orderResponse;
      setHasServerData(true); // Mark that we have received server data

      // Check if order is paid
      if (
        paid ||
        (order &&
          typeof order === "object" &&
          "status" in order &&
          order.status === "paid")
      ) {
        if (!isPaymentConfirmed) {
          setIsPaymentConfirmed(true);
        }
        
        // Populate orderData from API response for paid orders
        if (!orderData && order && typeof order === "object" && "customerInfo" in order) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orderObj = order as any; // Type assertion for API response
          const customerInfo = orderObj.customerInfo as { name: string; phone: string; email?: string };
          const orderInfo = {
            orderId: orderObj.id,
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerEmail: customerInfo.email,
            ticketNumbers: orderObj.tickets.map((t: string) => parseInt(t)),
            totalAmount: orderObj.total,
            raffleName: "Moto Isla Raffle", // Default name since we don't have raffle info
          };
          setOrderData(orderInfo);
        }
        return;
      }

      if (
        valid &&
        !expired &&
        order &&
        typeof order === "object" &&
        "remainingSeconds" in order
      ) {
        const remainingSeconds = (order as { remainingSeconds: number })
          .remainingSeconds;
        if (remainingSeconds > 0) {
          const now = Date.now();
          // Only sync if it's been more than 5 seconds since last sync to avoid spam
          if (now - lastSyncTime > 5000) {
            setServerRemainingTime(remainingSeconds);
            setLastSyncTime(now);
          }
        } else {
          // Order expired
          alert("Tu reservación ha expirado.");
          localStorage.removeItem("currentOrder");
          router.push("/");
        }
      } else {
        // Order invalid or expired
        alert("Tu reservación ha expirado o es inválida.");
        localStorage.removeItem("currentOrder");
        router.push("/");
      }
    }
  }, [orderResponse, orderId, lastSyncTime, router, isPaymentConfirmed, orderData]);

  // Sync with server when order data changes
  useEffect(() => {
    if (orderResponse && !isLoading) {
      syncWithServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderResponse, isLoading]); // Intentionally excluding syncWithServer to prevent infinite loop

  // Sync with server every 30 seconds
  useEffect(() => {
    if (!orderData?.orderId) return;

    const interval = setInterval(() => {
      syncWithServer();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [orderData?.orderId, syncWithServer]);

  // Supabase realtime subscription for order changes
  useEffect(() => {
    if (!orderData?.orderId) return;

    const channel = supabase
      .channel("order-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderData.orderId}`,
        },
        (payload) => {
          console.log("📡 Realtime order update:", payload);

          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as { status: string; id: string };

            // Check if order was cancelled, expired, or paid
            if (
              updatedOrder.status === "cancelled" ||
              updatedOrder.status === "expired"
            ) {
              alert("Tu orden ha sido cancelada o ha expirado.");
              localStorage.removeItem("currentOrder");
              router.push("/");
            } else if (updatedOrder.status === "paid") {
              setIsPaymentConfirmed(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderData?.orderId, router]);

  useEffect(() => {
    const initializeOrder = () => {
      const customerName = searchParams.get("customerName");
      const customerPhone = searchParams.get("customerPhone");
      const customerEmail = searchParams.get("customerEmail");
      const ticketNumbers =
        searchParams.get("ticketNumbers")?.split(",").map(Number) || [];
      const totalAmount = parseFloat(searchParams.get("totalAmount") || "0");
      const raffleName = searchParams.get("raffleName") || "";

      if (
        orderId &&
        customerName &&
        customerPhone &&
        ticketNumbers.length > 0
      ) {
        const orderInfo: OrderData = {
          orderId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          ticketNumbers,
          totalAmount,
          raffleName,
        };

        setOrderData(orderInfo);
        localStorage.setItem("currentOrder", JSON.stringify(orderInfo));
      } else {
        // Load order data from localStorage on mount
        const savedOrder = localStorage.getItem("currentOrder");
        if (savedOrder) {
          try {
            const parsed = JSON.parse(savedOrder);
            setOrderData(parsed);
          } catch (error) {
            console.error("Error parsing saved order:", error);
            localStorage.removeItem("currentOrder");
          }
        }
      }
    };

    initializeOrder();
  }, [searchParams, orderId, router]);

  // Clear stale timer data when we get fresh server data
  useEffect(() => {
    if (orderResponse && hasServerData && serverRemainingTime !== undefined) {
      // Update localStorage with fresh server time to prevent stale data issues
      const endTime = Date.now() + serverRemainingTime * 1000;
      localStorage.setItem("reservationEndTime", endTime.toString());
    }
  }, [orderResponse, hasServerData, serverRemainingTime]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleWhatsAppContact = () => {
    if (orderData) {
      const whatsappData: WhatsAppMessageData = {
        customerName: orderData.customerName,
        orderId: orderData.orderId,
        ticketNumbers: orderData.ticketNumbers,
        totalAmount: orderData.totalAmount,
        raffleName: orderData.raffleName,
      };
      openWhatsApp(whatsappData);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando información de la orden...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Validando orden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-white mb-4">Error al validar la orden</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Regresar
          </Button>
          <h1 className="text-2xl font-bold text-white">
            {isPaymentConfirmed ? "Comprobante de Pago" : "Proceso de Pago"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Resumen de tu Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">
                  {orderData.raffleName}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Orden ID:</span>
                    <span className="text-white font-mono">
                      {orderData.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Cliente:</span>
                    <span className="text-white">{orderData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Teléfono:</span>
                    <span className="text-white">
                      {orderData.customerPhone}
                    </span>
                  </div>
                  {orderData.customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Email:</span>
                      <span className="text-white">
                        {orderData.customerEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Tickets */}
              <div>
                <h4 className="font-medium text-white mb-2">
                  Boletos Seleccionados ({orderData.ticketNumbers.length})
                </h4>
                <div className="bg-slate-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {orderData.ticketNumbers
                      .sort((a, b) => a - b)
                      .map((number) => (
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
                  <span className="text-white">Total a Pagar:</span>
                  <span className="text-green-400">
                    {formatCurrency(orderData.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              {isPaymentConfirmed ? (
                <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-green-300 text-lg font-semibold">
                      ¡Pago Confirmado!
                    </span>
                  </div>
                  <p className="text-green-200 text-sm">
                    Tu pago ha sido verificado y confirmado. Tus boletos están
                    asegurados.
                  </p>
                  <div className="mt-3 p-3 bg-green-800/30 rounded-lg">
                    <p className="text-green-100 text-sm font-medium">
                      📧 Guarda esta página como comprobante de tu compra
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-300 text-sm font-medium">
                      ⏰ Tiempo restante:
                    </span>
                  </div>
                  <ReservationTimer
                    timeLeft={reservationTimer.formatTime}
                    isActive={reservationTimer.isActive}
                    isExpired={reservationTimer.isExpired}
                  />
                  <p className="text-yellow-300 text-xs mt-2">
                    Tu reservación expirará automáticamente si no completas el
                    pago a tiempo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Instructions or Confirmation */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {isPaymentConfirmed ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Pago Completado
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    Instrucciones de Pago
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPaymentConfirmed ? (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-300 mb-2">
                      ¡Pago Confirmado Exitosamente!
                    </h3>
                    <p className="text-slate-300 mb-4">
                      Tu pago ha sido verificado y procesado correctamente.
                    </p>
                  </div>

                  <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-green-300 mb-2">
                      Detalles de la Transacción:
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Estado:</span>
                        <span className="text-green-400 font-medium">
                          PAGADO
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Fecha de confirmación:
                        </span>
                        <span className="text-white">
                          {new Date().toLocaleDateString("es-MX")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Boletos asegurados:
                        </span>
                        <span className="text-white">
                          {orderData.ticketNumbers.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      📱 <strong>Importante:</strong> Guarda esta página como
                      comprobante. Puedes tomar una captura de pantalla o
                      imprimir esta página para tus registros.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bank Transfer */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-green-400" />
                      <h3 className="font-medium text-white">
                        Transferencia Bancaria
                      </h3>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="text-slate-300 block mb-1">
                          Banco:
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 gap-2">
                          <span className="text-white flex-1">
                            {BANK_INFO.bankName}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(BANK_INFO.bankName, "bank")
                            }
                            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
                          >
                            {copiedField === "bank" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                                <span className="text-xs">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                <span className="text-xs">Copiar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1">
                          Número de Cuenta:
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 gap-2">
                          <span className="text-white font-mono flex-1">
                            {BANK_INFO.accountNumber}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                BANK_INFO.accountNumber,
                                "account"
                              )
                            }
                            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
                          >
                            {copiedField === "account" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                                <span className="text-xs">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                <span className="text-xs">Copiar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1">
                          CLABE:
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 gap-2">
                          <span className="text-white font-mono flex-1">
                            {BANK_INFO.clabe}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(BANK_INFO.clabe, "clabe")
                            }
                            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
                          >
                            {copiedField === "clabe" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                                <span className="text-xs">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                <span className="text-xs">Copiar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1">
                          Beneficiario:
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 gap-2">
                          <span className="text-white flex-1">
                            {BANK_INFO.accountHolder}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                BANK_INFO.accountHolder,
                                "beneficiary"
                              )
                            }
                            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
                          >
                            {copiedField === "beneficiary" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                                <span className="text-xs">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                <span className="text-xs">Copiar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1">
                          Concepto:
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 gap-2">
                          <span className="text-white font-mono flex-1">
                            Orden #{orderData.orderId}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                `Orden #${orderData.orderId}`,
                                "concept"
                              )
                            }
                            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
                          >
                            {copiedField === "concept" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                                <span className="text-xs">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                <span className="text-xs">Copiar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1">
                          Monto Exacto:
                        </label>
                        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 gap-2">
                          <span className="text-white font-bold text-lg text-green-400 flex-1">
                            {formatCurrency(orderData.totalAmount)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                orderData.totalAmount.toString(),
                                "amount"
                              )
                            }
                            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white"
                          >
                            {copiedField === "amount" ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                                <span className="text-xs">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                <span className="text-xs">Copiar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Contact */}
                  <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-400" />
                      Confirmar Pago por WhatsApp
                    </h3>
                    <p className="text-green-300 text-sm mb-3">
                      Una vez realizada la transferencia, haz clic aquí para
                      enviar tu comprobante por WhatsApp con los datos de tu
                      orden ya incluidos.
                    </p>
                    <Button
                      onClick={handleWhatsAppContact}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar Comprobante por WhatsApp
                    </Button>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                      📋 Instrucciones Paso a Paso
                    </h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="text-blue-200 font-medium text-sm">
                            Realiza la transferencia bancaria
                          </p>
                          <p className="text-blue-300 text-xs">
                            Usa los datos bancarios de arriba. El monto debe ser
                            exacto:{" "}
                            <span className="font-semibold">
                              {formatCurrency(orderData.totalAmount)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="text-blue-200 font-medium text-sm">
                            Incluye el concepto correcto
                          </p>
                          <p className="text-blue-300 text-xs">
                            En el concepto de la transferencia escribe tu
                            nombre.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <p className="text-green-200 font-medium text-sm">
                            Envía tu comprobante
                          </p>
                          <p className="text-green-300 text-xs">
                            Haz clic en el botón de WhatsApp de arriba para
                            enviar tu comprobante con los datos ya incluidos
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-yellow-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          ⏰
                        </div>
                        <div>
                          <p className="text-yellow-200 font-medium text-sm">
                            Tiempo límite
                          </p>
                          <p className="text-yellow-300 text-xs">
                            Tu reservación expira en el tiempo mostrado arriba.
                            Completa el pago antes de que expire.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Cargando página de checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
