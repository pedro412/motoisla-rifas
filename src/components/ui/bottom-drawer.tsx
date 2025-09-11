"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronUpIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  showBadge?: boolean;
  badgeCount?: number;
}

export function BottomDrawer({
  isOpen,
  onOpenChange,
  children,
  trigger,
  title,
  description,
  showBadge = false,
  badgeCount = 0,
}: BottomDrawerProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

        <Dialog.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-slate-900/95",
            "backdrop-filter backdrop-blur-xl",
            "transition-all duration-300 ease-out",
            "flex flex-col",
            isExpanded ? "h-[90vh] max-h-[90vh]" : "h-auto max-h-[50vh]"
          )}
        >
          {/* Collapsed Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCartIcon className="h-6 w-6 text-red-400" />
                {showBadge && badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <div>
                <Dialog.Title className="text-white font-semibold text-lg">
                  {title || "Carrito"}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-gray-300 text-sm">
                    {description}
                  </Dialog.Description>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ChevronUpIcon
                className={cn(
                  "h-5 w-5 text-red-400 transition-transform duration-200",
                  isExpanded ? "rotate-180" : "rotate-0"
                )}
              />
              <Dialog.Close asChild>
                <button className="p-1 text-gray-400 hover:text-white transition-colors">
                  <XIcon className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Expanded Content */}
          <div
            className={cn(
              "flex-1 transition-all duration-300 ease-out",
              "overflow-y-auto overscroll-contain",
              isExpanded ? "opacity-100" : "opacity-0 max-h-0"
            )}
          >
            <div className="p-4 pt-0 pb-6">{children}</div>
          </div>

          {/* Quick Actions Bar (always visible when collapsed) */}
          {!isExpanded && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Toca para ver detalles</span>
                <ChevronUpIcon className="h-4 w-4" />
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
