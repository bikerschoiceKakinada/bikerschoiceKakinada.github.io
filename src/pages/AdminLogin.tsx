import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ADMIN_EMAIL,
  ensureAdminSeeded,
  isCurrentUserAdmin,
  isNetworkLikeError,
  withNetworkRetry,
} from "@/lib/adminAuth";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) return;

    if (normalizedEmail !== ADMIN_EMAIL) {
      toast.error("Only the configured admin email can access this dashboard.");
      return;
    }

    setLoading(true);
    try {
      await ensureAdminSeeded();

      await withNetworkRetry(async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: normalizedPassword,
        });

        if (error) throw error;
      }, 3, 700);

      const {
        data: { user },
        error: userError,
      } = await withNetworkRetry(() => supabase.auth.getUser(), 2, 500);

      if (userError || !user) throw userError ?? new Error("Unable to verify admin session");

      if ((user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        toast.error("Access denied. Admin only.");
        return;
      }

      const isAdmin = await isCurrentUserAdmin(user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Access denied. Admin role missing.");
        return;
      }

      toast.success("Welcome, Admin!");
      navigate("/admin/dashboard");
    } catch (err: any) {
      const message = String(err?.message || "");
      const normalizedMessage = message.toLowerCase();

      if (isNetworkLikeError(err)) {
        toast.error("Network issue while reaching backend. Refresh and try again.");
      } else if (normalizedMessage.includes("invalid login credentials")) {
        toast.error("Invalid email or password.");
      } else {
        toast.error(message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-card border border-border rounded-xl p-6 space-y-4">
        <h1 className="font-display text-lg text-center neon-glow-cyan">Admin Login</h1>
        <p className="text-xs text-center text-muted-foreground">Only {ADMIN_EMAIL} can sign in.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-heading font-bold py-3 rounded-full text-sm hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;

