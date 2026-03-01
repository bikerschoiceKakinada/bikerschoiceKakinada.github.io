import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useInstagramFollowers() {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Fetch follower count from site_settings
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("instagram_followers")
          .limit(1)
          .maybeSingle();

        if (data?.instagram_followers) {
          const parsed = parseInt(data.instagram_followers.replace(/[^\d]/g, ""), 10);
          if (!isNaN(parsed) && parsed > 0) {
            setTargetCount(parsed);
          } else {
            setTargetCount(4800);
          }
        } else {
          setTargetCount(4800);
        }
      } catch {
        setTargetCount(4800);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  // Animate counter from 0 to target
  useEffect(() => {
    if (targetCount === 0) return;

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
  }, [targetCount]);

  return { count, targetCount, loading };
}
