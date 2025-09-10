'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Dice6, AlertCircle, CheckCircle } from 'lucide-react';
import { Raffle } from '@/lib/types';

interface DrawWinnerProps {
  raffle: Raffle;
  onWinnerDrawn: () => void;
}

interface DrawResult {
  success: boolean;
  message: string;
  winningTicket?: {
    number: number;
    status: string;
    sold: boolean;
  };
  winnerInfo?: {
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
  };
  lotteryNumber?: string;
  last3Digits?: string;
  error?: string;
}

export function DrawWinner({ raffle, onWinnerDrawn }: DrawWinnerProps) {
  const [lotteryNumber, setLotteryNumber] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);

  const handleDrawWinner = async () => {
    if (!lotteryNumber.trim()) {
      alert('Por favor ingresa el número de la lotería nacional');
      return;
    }

    if (lotteryNumber.length < 3) {
      alert('El número debe tener al menos 3 dígitos');
      return;
    }

    setIsDrawing(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/raffles/${raffle.id}/draw-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotteryNumber: lotteryNumber.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success && data.winningTicket?.sold) {
          onWinnerDrawn();
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al determinar el ganador',
          error: data.error
        });
      }
    } catch (error) {
      console.error('Error drawing winner:', error);
      setResult({
        success: false,
        message: 'Error de conexión',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsDrawing(false);
    }
  };

  const formatTicketNumber = (number: number) => {
    return number.toString().padStart(3, '0');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Sorteo de Ganador - Lotería Nacional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Instrucciones</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ingresa el número completo de la Lotería Nacional Mexicana</li>
            <li>• Se tomarán los últimos 3 dígitos para determinar el ganador</li>
            <li>• Los boletos van del 000 al 999</li>
            <li>• El sorteo se realiza cada martes</li>
          </ul>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="lottery-number" className="block text-sm font-medium mb-2">
              Número de la Lotería Nacional
            </label>
            <Input
              id="lottery-number"
              type="text"
              placeholder="Ej: 12345 (se usarán los últimos 3 dígitos: 345)"
              value={lotteryNumber}
              onChange={(e) => setLotteryNumber(e.target.value)}
              disabled={isDrawing || raffle.status === 'completed'}
              className="text-lg font-mono"
            />
            {lotteryNumber && lotteryNumber.length >= 3 && (
              <p className="text-sm text-gray-600 mt-1">
                Últimos 3 dígitos: <strong>{lotteryNumber.slice(-3)}</strong> → Boleto ganador: <strong>{formatTicketNumber(parseInt(lotteryNumber.slice(-3), 10))}</strong>
              </p>
            )}
          </div>

          <Button
            onClick={handleDrawWinner}
            disabled={isDrawing || !lotteryNumber.trim() || raffle.status === 'completed'}
            className="w-full"
            size="lg"
          >
            {isDrawing ? (
              <>
                <Dice6 className="h-4 w-4 mr-2 animate-spin" />
                Determinando ganador...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Determinar Ganador
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? result.winningTicket?.sold 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                result.winningTicket?.sold ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                <h4 className={`font-semibold ${
                  result.success 
                    ? result.winningTicket?.sold 
                      ? 'text-green-800' 
                      : 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {result.success ? (
                    result.winningTicket?.sold ? '🎉 ¡Ganador Encontrado!' : '⚠️ Boleto No Vendido'
                  ) : '❌ Error'}
                </h4>
                
                <p className={`text-sm mt-1 ${
                  result.success 
                    ? result.winningTicket?.sold 
                      ? 'text-green-700' 
                      : 'text-yellow-700'
                    : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.lotteryNumber && result.last3Digits && (
                  <div className="mt-3 text-sm">
                    <p><strong>Número de lotería:</strong> {result.lotteryNumber}</p>
                    <p><strong>Últimos 3 dígitos:</strong> {result.last3Digits}</p>
                    {result.winningTicket && (
                      <p><strong>Boleto ganador:</strong> {formatTicketNumber(result.winningTicket.number)}</p>
                    )}
                  </div>
                )}

                {result.winnerInfo && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h5 className="font-semibold text-gray-800 mb-2">👤 Información del Ganador</h5>
                    <div className="text-sm space-y-1">
                      <p><strong>Nombre:</strong> {result.winnerInfo.customer_name}</p>
                      {result.winnerInfo.customer_phone && (
                        <p><strong>Teléfono:</strong> {result.winnerInfo.customer_phone}</p>
                      )}
                      {result.winnerInfo.customer_email && (
                        <p><strong>Email:</strong> {result.winnerInfo.customer_email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Info */}
        {raffle.status === 'completed' && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              ✅ Esta rifa ya ha sido completada y tiene un ganador determinado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
