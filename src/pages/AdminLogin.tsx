import { useState, useEffect, type FormEvent } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ADMIN_EMAIL,
  ensureAdminSeededInBackground,
  isCurrentUserAdmin,
  isNetworkLikeError,
} from "@/lib/adminAuth";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const configured = isSupabaseConfigured() && supabase !== null;

  // Auto-redirect if already authenticated as admin
  useEffect(() => {
    if (!configured) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setChecking(false);
    }, 5000);

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase!.auth.getSession();

        if (session && (session.user.email ?? "").toLowerCase() === ADMIN_EMAIL) {
          const isAdmin = await isCurrentUserAdmin(session.user.id);
          if (isAdmin && !cancelled) {
            navigate("/admin/dashboard", { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error("[AdminLogin] Session check failed:", err);
        // Ignore errors — just show the login form
      } finally {
        if (!cancelled) {
          clearTimeout(timer);
          setChecking(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate, configured]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!configured || !supabase) {
      toast.error("Supabase environment variables are missing or invalid.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) return;

    if (normalizedEmail !== ADMIN_EMAIL) {
      toast.error("Only the configured admin email can access this dashboard.");
      return;
    }

    setLoading(true);
    try {
      // Fire-and-forget: seed the admin in background — never blocks login
      ensureAdminSeededInBackground();

      // 1. Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: normalizedPassword,
      });
      if (signInError) throw signInError;

      // 2. Verify logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error("Unable to verify admin session");

      if ((user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        toast.error("Access denied. Admin only.");
        return;
      }

      // 3. Check admin role
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

      console.error("[AdminLogin] Login error:", err);

      if (normalizedMessage.includes("supabase environment variables")) {
        toast.error("Supabase environment variables are missing or invalid.");
      } else if (isNetworkLikeError(err)) {
        toast.error("Network issue while reaching backend. Refresh and try again.");
      } else if (normalizedMessage.includes("invalid login credentials")) {
        toast.error("Invalid email or password. Please check your credentials.");
      } else if (normalizedMessage.includes("email not confirmed")) {
        toast.error("Email not confirmed. Please check your Supabase dashboard.");
      } else if (normalizedMessage.includes("user not found")) {
        toast.error("Admin account not found. The seed-admin edge function may need to be deployed.");
      } else if (normalizedMessage.includes("timed out")) {
        toast.error("Request took too long. Please check your internet connection and try again.");
      } else {
        toast.error(message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show clear error when Supabase is not configured
  if (!configured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border border-destructive rounded-xl p-6 space-y-3 text-center">
          <h1 className="font-display text-lg text-destructive">Configuration Error</h1>
          <p className="text-sm text-muted-foreground">
            Supabase environment variables are missing or invalid.<br />
            Please set <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in your Netlify site settings.
          </p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Checking session...
      </div>
    );
  }

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
