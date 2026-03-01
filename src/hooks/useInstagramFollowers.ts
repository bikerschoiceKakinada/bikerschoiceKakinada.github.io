import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const DEFAULT_FOLLOWERS = 4800;
const POLL_INTERVAL_MS = 5 * 60 * 1000; // Re-check every 5 minutes

export function useInstagramFollowers() {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse the stored follower string into a number
  const parseFollowers = useCallback((raw: string | null | undefined): number => {
    if (!raw) return 0;
    const parsed = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  }, []);

  // Fetch follower count from Supabase
  const fetchFromSupabase = useCallback(async (): Promise<number> => {
    if (!isSupabaseConfigured() || !supabase) return 0;
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("instagram_followers")
        .limit(1)
        .maybeSingle();
      if (!error && data?.instagram_followers) {
        return parseFollowers(data.instagram_followers);
      }
    } catch (err) {
      console.error("[useInstagramFollowers] Supabase error:", err);
    }
    return 0;
  }, [parseFollowers]);

  // Fetch follower count — try Supabase first, then Netlify function, then default
  useEffect(() => {
    const fetchCount = async () => {
      // 1. Try Supabase first (admin-controlled or auto-updated value)
      const supabaseCount = await fetchFromSupabase();
      if (supabaseCount > 0) {
        setTargetCount(supabaseCount);
        setLoading(false);
        return;
      }

      // 2. Try Netlify function (fetches live from Instagram)
      try {
        const res = await fetch("/.netlify/functions/instagram-followers");
        if (res.ok) {
          const data = await res.json();
          if (data.count && data.count > 0 && data.source !== "default" && data.source !== "error") {
            setTargetCount(data.count);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[useInstagramFollowers] Function call failed:", err);
      }

      // 3. Default fallback
      setTargetCount(DEFAULT_FOLLOWERS);
      setLoading(false);
    };

    fetchCount();
  }, [fetchFromSupabase]);

  // Real-time subscription — listen for changes to site_settings in Supabase
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel("instagram-followers-live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          const newFollowers = payload.new?.instagram_followers;
          if (newFollowers) {
            const parsed = parseFollowers(newFollowers);
            if (parsed > 0 && parsed !== targetCount) {
              console.log(`[useInstagramFollowers] Live update: ${parsed}`);
              setTargetCount(parsed);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetCount, parseFollowers]);

  // Auto-polling — re-fetch from Supabase every 5 minutes for freshness
  useEffect(() => {
    pollTimerRef.current = setInterval(async () => {
      const freshCount = await fetchFromSupabase();
      if (freshCount > 0 && freshCount !== targetCount) {
        console.log(`[useInstagramFollowers] Poll update: ${freshCount}`);
        setTargetCount(freshCount);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [targetCount, fetchFromSupabase]);

  // Callback ref for IntersectionObserver — replays animation every time the element enters viewport
  const setRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
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

    const duration = 2000;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
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
