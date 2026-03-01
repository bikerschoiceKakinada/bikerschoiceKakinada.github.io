import { useInstagramFollowers } from "@/hooks/useInstagramFollowers";

const InstagramCounter = () => {
  const { count, loading } = useInstagramFollowers();

  if (loading) return null;

  const formatted = count.toLocaleString("en-IN");

  return (
    <span className="tabular-nums">{formatted}+</span>
  );
};

export default InstagramCounter;
