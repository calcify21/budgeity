import { useEffect } from "react";

/**
 * Custom hook to scroll a container to the top when an error occurs.
 * @param error The error state to monitor.
 * @param scrollRef The ref of the scrollable container.
 */
export const useScrollToError = (
  error: any,
  scrollRef: React.RefObject<HTMLElement>,
) => {
  useEffect(() => {
    if (error && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error, scrollRef]);
};
