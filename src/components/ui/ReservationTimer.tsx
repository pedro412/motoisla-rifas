'use client';

import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ReservationTimerProps {
  timeLeft: string | null;
  isActive: boolean;
  isExpired?: boolean;
  ticketCount?: number;
}

export function ReservationTimer({ timeLeft, isActive, isExpired, ticketCount }: ReservationTimerProps) {
  if (!isActive && !isExpired) return null;

  const getTimerColor = () => {
    if (isExpired) return 'text-red-400 border-red-600 bg-red-900/20';
    if (timeLeft && timeLeft.startsWith('0:') && parseInt(timeLeft.split(':')[1]) < 30) {
      return 'text-orange-400 border-orange-600 bg-orange-900/20';
    }
    return 'text-blue-400 border-blue-600 bg-blue-900/20';
  };

  const getIcon = () => {
    if (isExpired) return <AlertTriangle className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };

  const getMessage = () => {
    if (isExpired) {
      return 'Tu reservación ha expirado. Los boletos han sido liberados.';
    }
    if (ticketCount) {
      return `Tienes ${ticketCount} boleto${ticketCount > 1 ? 's' : ''} reservado${ticketCount > 1 ? 's' : ''}`;
    }
    return 'Reservación activa';
  };

  return (
    <Card className={`border-2 ${getTimerColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div className="flex-1">
            <p className="font-medium">{getMessage()}</p>
            {!isExpired && timeLeft && (
              <p className="text-sm opacity-80">
                Tiempo restante: <span className="font-mono font-bold">{timeLeft}</span>
              </p>
            )}
          </div>
        </div>
        {!isExpired && (
          <div className="mt-3 text-xs opacity-70">
            Completa tu compra antes de que expire la reservación
          </div>
        )}
      </CardContent>
    </Card>
  );
}
