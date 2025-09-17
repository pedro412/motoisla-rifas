"use client";

import * as React from "react";
import { ShoppingCartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingCartButtonProps {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
  className?: string;
}

export function FloatingCartButton({
  itemCount,
  totalAmount,
  onClick,
  className,
}: FloatingCartButtonProps) {
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
        "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white",
        "px-6 py-3 rounded-xl shadow-lg hover:shadow-xl",
        "flex items-center gap-3",
        "transition-all duration-200 ease-out",
        "border-0",
        "backdrop-blur-sm",
        className
      )}
    >
      <div className="relative">
        <ShoppingCartIcon className="h-5 w-5" />
        <span className="absolute -top-2 -right-2 bg-white text-slate-800 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      </div>

      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold">
          {itemCount} boleto{itemCount > 1 ? "s" : ""}
        </span>
        <span className="text-xs opacity-90">
          ${totalAmount.toLocaleString()}
        </span>
      </div>

      <div className="text-xs opacity-75">Pagar ahora</div>
    </button>
  );
}
