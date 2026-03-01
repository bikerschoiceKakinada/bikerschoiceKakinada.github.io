import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const DEFAULT_FOLLOWERS = 4800;

export function useInstagramFollowers() {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch follower count — try Netlify function first, then Supabase, then default
  useEffect(() => {
    const fetchCount = async () => {
      // Try Netlify function (fetches live from Instagram)
      try {
        const res = await fetch("/.netlify/functions/instagram-followers");
        if (res.ok) {
          const data = await res.json();
          if (data.count && data.count > 0) {
            setTargetCount(data.count);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[useInstagramFollowers] Function call failed:", err);
      }

      // Fall back to Supabase
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from("site_settings")
            .select("instagram_followers")
            .limit(1)
            .maybeSingle();

          if (!error && data?.instagram_followers) {
            const raw = String(data.instagram_followers);
            const parsed = parseInt(raw.replace(/[^\d]/g, ""), 10);
            if (!isNaN(parsed) && parsed > 0) {
              setTargetCount(parsed);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("[useInstagramFollowers] Supabase error:", err);
        }
      }

      // Default fallback
      setTargetCount(DEFAULT_FOLLOWERS);
      setLoading(false);
    };

    fetchCount();
  }, []);

  // Callback ref for IntersectionObserver — replays animation every time the element enters viewport
  const setRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // Reset counter to 0 and trigger animation
            setCount(0);
            startTimeRef.current = null;
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        },
        { threshold: 0.2 }
      );
      observerRef.current.observe(node);
    }
  }, []);

  // Animate counter from 0 → target every time element becomes visible
  useEffect(() => {
    if (!isVisible || targetCount === 0) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;

    const duration = 2000; // 2 seconds

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * targetCount));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(targetCount);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isVisible, targetCount]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { count, targetCount, loading, ref: setRef };
}
