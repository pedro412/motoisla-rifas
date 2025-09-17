"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  onRandomSelect?: (count: number) => void;
  availableTickets?: number;
  className?: string;
}

export function TicketCounter({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  onRandomSelect,
  availableTickets = 0,
  className,
}: TicketCounterProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(value + 1, max, availableTickets);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - 1, min);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    const numValue = parseInt(inputVal);
    if (
      !isNaN(numValue) &&
      numValue >= min &&
      numValue <= max &&
      numValue <= availableTickets
    ) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (
      isNaN(numValue) ||
      numValue < min ||
      numValue > max ||
      numValue > availableTickets
    ) {
      setInputValue(value.toString());
    }
  };

  const handleRandomSelect = () => {
    if (onRandomSelect && value > 0) {
      onRandomSelect(value);
    }
  };

  const canIncrement = value < max && value < availableTickets && !disabled;
  const canDecrement = value > min && !disabled;
  const canRandomSelect =
    onRandomSelect && value > 0 && availableTickets >= value && !disabled;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center border border-slate-600 rounded-lg bg-slate-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDecrement}
          disabled={!canDecrement}
          className="h-10 w-10 p-0 hover:bg-slate-700 disabled:opacity-50"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="w-16 h-10 text-center bg-transparent border-none text-slate-200 focus:outline-none disabled:opacity-50"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleIncrement}
          disabled={!canIncrement}
          className="h-10 w-10 p-0 hover:bg-slate-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {onRandomSelect && (
        <Button
          size="sm"
          onClick={handleRandomSelect}
          disabled={!canRandomSelect}
          className="flex items-center gap-2 h-10 bg-red-600 hover:bg-red-700 border-red-600 text-white disabled:bg-slate-600 disabled:border-slate-600 disabled:text-slate-400 disabled:hover:bg-slate-600"
        >
          <Shuffle className="h-4 w-4" />
          Boletos de la suerte
        </Button>
      )}

      <div className="text-sm text-slate-400">
        <span>Máx: {Math.min(max, availableTickets)}</span>
      </div>
    </div>
  );
}
