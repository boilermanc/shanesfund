import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface FocusTrapProps {
  children: React.ReactNode;
  onClose?: () => void;
  /** Skip auto-focusing the first element on mount (e.g. when an input already has autoFocus) */
  autoFocusFirst?: boolean;
}

const FocusTrap: React.FC<FocusTrapProps> = ({ children, onClose, autoFocusFirst = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    if (autoFocusFirst) {
      // Small delay to allow animations / DOM to settle
      const timer = setTimeout(() => {
        if (!containerRef.current) return;
        const first = containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (first) {
          first.focus();
        } else {
          containerRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocusFirst]);

  // Restore focus on unmount
  useEffect(() => {
    const prev = previousFocusRef.current;
    return () => {
      if (prev && typeof prev.focus === 'function') {
        // Use setTimeout so the element is still in the DOM after exit animations
        setTimeout(() => prev.focus(), 0);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable: HTMLElement[] = Array.from(
        container.querySelectorAll(FOCUSABLE_SELECTOR)
      ).filter((el): el is HTMLElement => (el as HTMLElement).offsetParent !== null);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !container.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div ref={containerRef} tabIndex={-1} style={{ display: 'contents' }}>
      {children}
    </div>
  );
};

export default FocusTrap;
