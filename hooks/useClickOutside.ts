import { useEffect, useCallback } from "react";

/**
 * Standard hook for detecting clicks outside of a specific element.
 * @param refs - The React ref(s) of the container(s) to monitor. Clicks inside ANY of these will NOT trigger the handler.
 * @param handler - The callback function to fire when a click occurs outside.
 * @param active - Optional boolean to enable/disable the listener.
 */
export function useClickOutside(
  refs: React.RefObject<HTMLElement> | React.RefObject<HTMLElement>[],
  handler: () => void,
  active: boolean = true
) {
  const listener = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const refArray = Array.isArray(refs) ? refs : [refs];
      
      // Do nothing if clicking any of the provided refs or their children
      const isInside = refArray.some(ref => {
        return ref.current && ref.current.contains(event.target as Node);
      });

      if (isInside) return;
      
      handler();
    },
    [refs, handler]
  );

  useEffect(() => {
    if (!active) return;

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [active, listener]);
}
