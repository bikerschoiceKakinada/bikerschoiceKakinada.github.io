import { RefObject, useEffect } from "react";

type UseAutoScrollCarouselOptions = {
  speed?: number;
  pauseAfterInteractionMs?: number;
  enabled?: boolean;
};

export const useAutoScrollCarousel = <T extends HTMLElement>(
  containerRef: RefObject<T>,
  { speed = 0.45, pauseAfterInteractionMs = 2200, enabled = true }: UseAutoScrollCarouselOptions = {},
) => {
  useEffect(() => {
    if (!enabled) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const container = containerRef.current;
    if (!container) return;

    let paused = false;
    let lastFrameTime = performance.now();
    let frameId = 0;
    let resumeTimeout: number | undefined;

    const clearResumeTimeout = () => {
      if (resumeTimeout) {
        window.clearTimeout(resumeTimeout);
      }
      resumeTimeout = undefined;
    };

    const pauseTemporarily = () => {
      paused = true;
      clearResumeTimeout();
      resumeTimeout = window.setTimeout(() => {
        paused = false;
      }, pauseAfterInteractionMs);
    };

    const tick = (now: number) => {
      const node = containerRef.current;
      const delta = now - lastFrameTime;
      lastFrameTime = now;

      if (node && !paused && !document.hidden) {
        const maxScroll = node.scrollWidth - node.clientWidth;

        if (maxScroll > 1) {
          const nextScroll = node.scrollLeft + speed * (delta / 16.67);
          node.scrollLeft = nextScroll >= maxScroll ? 0 : nextScroll;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    const interactionEvents: (keyof HTMLElementEventMap)[] = [
      "pointerdown",
      "touchstart",
      "wheel",
      "mouseenter",
      "focusin",
      "pointerup",
      "touchend",
      "mouseleave",
      "focusout",
    ];

    interactionEvents.forEach((eventName) => {
      container.addEventListener(eventName, pauseTemporarily, { passive: true });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      clearResumeTimeout();
      interactionEvents.forEach((eventName) => {
        container.removeEventListener(eventName, pauseTemporarily);
      });
    };
  }, [containerRef, enabled, pauseAfterInteractionMs, speed]);
};
