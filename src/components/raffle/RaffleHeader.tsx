'use client';

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, Trophy } from 'lucide-react';
import { Raffle } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RaffleHeaderProps {
  raffle: Raffle;
}

export function RaffleHeader({ raffle }: RaffleHeaderProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trophy className="h-6 w-6 text-yellow-500" />
          {raffle.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Product Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Trophy className="h-16 w-16 mx-auto mb-2 opacity-50" />
              <p>Imagen del producto</p>
              <p className="text-sm">(Próximamente)</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-slate-200">Descripción del Premio</h3>
          <p className="text-slate-300 leading-relaxed">
            {raffle.description}
          </p>
        </div>

        {/* Raffle Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-800 rounded-lg">
            <Calendar className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-300">Inicio</p>
              <p className="text-sm text-green-200">
                {formatDate(raffle.start_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800 rounded-lg">
            <Clock className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300">Termina</p>
              <p className="text-sm text-red-200">
                {formatDate(raffle.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
            <Trophy className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-300">Precio por boleto</p>
              <p className="text-lg font-bold text-blue-200">
                {formatCurrency(raffle.ticket_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-slate-200">Términos y Condiciones</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• El sorteo se realizará en vivo una vez vendidos todos los boletos</li>
            <li>• Tienes 24 horas para enviar tu comprobante de pago</li>
            <li>• El ganador será contactado por WhatsApp</li>
            <li>• Envío gratuito en toda la República Mexicana</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
