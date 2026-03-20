import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

/**
 * Small "3 dots" dropdown for AG-Grid action cells.
 * items: [{ label, onClick, disabled?, icon?, tone? }]
 */
export default function ThreeDotsMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null); // wrapper around the button
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const visibleItems = useMemo(() => {
    return (items || []).filter((it) => it && !it.hidden);
  }, [items]);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e) => {
      const t = e.target;
      const inButton = !!rootRef.current?.contains(t);
      const inMenu = !!menuRef.current?.contains(t);
      if (!inButton && !inMenu) setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const openAtButton = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    const menuWidth = 180;
    const padding = 8;
    // Approximate menu height so we can decide to open up/down.
    const estimatedRowHeight = 40;
    const estimatedMenuHeight = Math.min(
      280,
      Math.max(80, visibleItems.length * estimatedRowHeight + 16)
    );
    const left = Math.max(
      padding,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - padding)
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If not enough space below, open upward.
    let top;
    if (spaceBelow < estimatedMenuHeight && spaceAbove > estimatedMenuHeight) {
      top = rect.top - estimatedMenuHeight - 6;
    } else {
      top = rect.bottom + 6;
    }

    top = Math.max(padding, Math.min(top, window.innerHeight - estimatedMenuHeight - padding));

    setMenuPos({ top, left });
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative flex justify-center">
      <button
        type="button"
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openAtButton();
        }}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer"
        aria-label="Actions"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Actions"
            className="bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: 180,
              zIndex: 999999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleItems.map((item, idx) => {
              const isDisabled = !!item.disabled;
              const tone =
                item.tone === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : item.tone === "success"
                    ? "text-green-600 hover:bg-green-50"
                    : item.tone === "info"
                      ? "text-blue-600 hover:bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50";

              return (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDisabled) return;
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${tone} ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

