import { useInstagramFollowers } from "@/hooks/useInstagramFollowers";

const InstagramCounter = () => {
  const { count, loading, ref } = useInstagramFollowers();

  if (loading) return null;

  const formatted = count.toLocaleString("en-IN");

  return (
    <span ref={ref} className="tabular-nums">{formatted}+</span>
  );
};

export default InstagramCounter;
