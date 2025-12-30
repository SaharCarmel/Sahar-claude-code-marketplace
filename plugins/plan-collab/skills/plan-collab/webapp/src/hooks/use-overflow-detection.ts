import { useEffect, useState, useRef, RefObject } from "react";

/**
 * Hook to detect when an element's content overflows its container horizontally.
 * Uses ResizeObserver to re-check on size changes.
 *
 * @returns [ref, isOverflowing] - Ref to attach to element, boolean indicating overflow
 *
 * @example
 * const [containerRef, isOverflowing] = useOverflowDetection<HTMLDivElement>();
 * // Attach containerRef to your element, check isOverflowing for overflow state
 */
export function useOverflowDetection<T extends HTMLElement>(): [
  RefObject<T | null>,
  boolean
] {
  const ref = useRef<T | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkOverflow = () => {
      // Check if content width exceeds visible width
      const hasOverflow = element.scrollWidth > element.clientWidth;
      setIsOverflowing(hasOverflow);
    };

    // Initial check
    checkOverflow();

    // Re-check on resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    resizeObserver.observe(element);

    // Also check on window resize for responsive changes
    window.addEventListener("resize", checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  return [ref, isOverflowing];
}
