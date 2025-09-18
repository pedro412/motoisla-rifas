"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy, Clock } from "lucide-react";
import { Raffle } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Image from "next/image";

interface RaffleHeaderProps {
  raffle: Raffle;
}

export function RaffleHeader({ raffle }: RaffleHeaderProps) {
  return (
    <Card className="overflow-hidden bg-slate-800/30 rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl text-white">
          <Trophy className="h-6 w-6 text-white" />
          {raffle.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Image */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          {raffle.image_url ? (
            <Image
              src={raffle.image_url}
              alt={raffle.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="bg-slate-800/50 rounded-lg h-full flex items-center justify-center">
              <div className="text-center">
                <Trophy className="h-20 w-20 mx-auto mb-4 text-slate-400 drop-shadow-lg" />
                <p className="text-lg font-semibold text-white mb-2">
                  🏍️ Imagen del producto
                </p>
                <p className="text-sm text-slate-400">(Próximamente)</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-white">
            🏆 Descripción del Premio
          </h3>
          <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
            {raffle.description}
          </p>
        </div>

        {/* Raffle Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl">
            <Calendar className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-300">🏁 Inicio</p>
              <p className="text-sm text-green-200">
                {formatDate(raffle.start_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl">
            <Clock className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">🏁 Termina</p>
              <p className="text-sm text-slate-400">
                {formatDate(raffle.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-300">
                💰 Precio por boleto
              </p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(raffle.ticket_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-slate-800/30 p-4 rounded-xl">
          <h4 className="font-semibold mb-2 text-white">
            📋 Términos y Condiciones
          </h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>
              🏁 El sorteo se realizará en vivo una vez vendidos todos los
              boletos
            </li>
            <li>⏰ Tienes 24 horas para enviar tu comprobante de pago</li>
            <li>📱 El ganador será contactado por WhatsApp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
