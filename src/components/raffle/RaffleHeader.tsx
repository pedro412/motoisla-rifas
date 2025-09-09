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
    <Card className="overflow-hidden moto-card moto-border moto-racing-stripe">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl text-white">
          <Trophy className="h-6 w-6 moto-text-primary" />
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
            <div className="moto-card moto-border bg-gradient-to-br from-black/95 to-black/70 h-full flex items-center justify-center">
              <div className="text-center moto-pulse-glow">
                <Trophy className="h-20 w-20 mx-auto mb-4 moto-text-primary drop-shadow-lg" />
                <p className="text-lg font-semibold text-white mb-2">
                  🏍️ Imagen del producto
                </p>
                <p className="text-sm moto-text-secondary">(Próximamente)</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-white">
            🏆 Descripción del Premio
          </h3>
          <p className="moto-text-secondary leading-relaxed">
            {raffle.description}
          </p>
        </div>

        {/* Raffle Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 moto-card moto-border rounded-lg">
            <Calendar className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-300">🏁 Inicio</p>
              <p className="text-sm text-green-200">
                {formatDate(raffle.start_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 moto-card moto-border rounded-lg">
            <Clock className="h-5 w-5 moto-text-primary" />
            <div>
              <p className="text-sm font-medium moto-text-primary">
                🏁 Termina
              </p>
              <p className="text-sm moto-text-secondary">
                {formatDate(raffle.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 moto-card moto-border rounded-lg moto-red-glow">
            <Trophy className="h-5 w-5 moto-text-primary" />
            <div>
              <p className="text-sm font-medium moto-text-primary">
                💰 Precio por boleto
              </p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(raffle.ticket_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="moto-card moto-border p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">
            📋 Términos y Condiciones
          </h4>
          <ul className="text-sm moto-text-secondary space-y-1">
            <li>
              🏁 El sorteo se realizará en vivo una vez vendidos todos los
              boletos
            </li>
            <li>⏰ Tienes 24 horas para enviar tu comprobante de pago</li>
            <li>📱 El ganador será contactado por WhatsApp</li>
            <li>🚚 Envío gratuito en toda la República Mexicana</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
