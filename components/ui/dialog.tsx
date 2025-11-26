'use client';

import * as React from "react";

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open = false, onOpenChange }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { onClose: handleClose });
            }
            return child;
          })}
        </div>
      )}
    </>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function DialogContent({ children, onClose, className }: DialogContentProps) {
  return (
    <div className={`bg-background rounded-lg shadow-lg p-6 w-full max-w-lg ${className || ""}`}>
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-xl font-bold">{children}</h2>;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function DialogTrigger({ children, onClick }: DialogTriggerProps) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}
