"use client"
import { createContext, useContext, useState, ReactNode } from "react";

type ConfirmOptions = {
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleClose = (val: boolean) => {
    if (resolver) resolver(val);
    setOptions(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modal */}
      {options && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-lapis dark:bg-neutral-900 p-6 rounded-xl shadow-xl w-[320px] text-center">
            <p className="mb-6 text-lg text-tangerine font-bold">{options.message}</p>

            <div className="flex gap-8 justify-center">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-500 hover:cursor-pointer"
                onClick={() => handleClose(false)}
              >
                {options.cancelText ?? "Cancel"}
              </button>

              <button
                className="px-4 py-2 rounded bg-rosso text-white hover:bg-rosso-700 hover:cursor-pointer"
                onClick={() => handleClose(true)}
              >
                {options.confirmText ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
