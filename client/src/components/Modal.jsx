import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Bottom sheet on phones, centred dialog from sm up. Escape and backdrop click close it
// unless `locked` (e.g. while an upload is in flight).
const Modal = ({ title, onClose, locked = false, children, width = "max-w-lg" }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !locked && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("input, select, textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [locked, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#050a1c]/70 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !locked && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-in flex max-h-[92dvh] w-full ${width} flex-col rounded-t-xl border border-line bg-surface shadow-2xl sm:rounded-xl`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Close" className="icon-btn -mr-2 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
