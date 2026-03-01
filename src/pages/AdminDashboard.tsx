import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Image, Truck, Settings, LayoutGrid } from "lucide-react";
import AdminSignatureWork from "@/components/admin/AdminSignatureWork";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminDelivery from "@/components/admin/AdminDelivery";
import AdminSettings from "@/components/admin/AdminSettings";
import { ADMIN_EMAIL, isCurrentUserAdmin, isNetworkLikeError } from "@/lib/adminAuth";

const tabs = [
  { id: "signature", label: "Signature Work", icon: Image },
  { id: "gallery", label: "Gallery", icon: LayoutGrid },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("signature");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const configured = isSupabaseConfigured() && supabase !== null;

  useEffect(() => {
    if (!configured) {
      toast.error("Supabase environment variables are missing or invalid.");
      navigate("/admin");
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        toast.error("Session check timed out. Please sign in again.");
        navigate("/admin");
      }
    }, 8000);

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase!.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          if (!cancelled) navigate("/admin");
          return;
        }

        if ((session.user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
          await supabase!.auth.signOut();
          if (!cancelled) navigate("/admin");
          return;
        }

        const isAdmin = await isCurrentUserAdmin(session.user.id);

        if (!isAdmin) {
          await supabase!.auth.signOut();
          if (!cancelled) navigate("/admin");
          return;
        }

        if (!cancelled) setLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error("[AdminDashboard] Auth check failed:", error);
        if (isNetworkLikeError(error)) {
          toast.error("Network issue while validating admin session. Please try again.");
        } else {
          toast.error("Could not verify admin session.");
        }
        navigate("/admin");
      } finally {
        if (!cancelled) clearTimeout(timer);
      }
    };

    checkAuth();

    // Listen for auth state changes (e.g. session expired, signed out in another tab)
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_OUT") {
          navigate("/admin");
        }
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [navigate, configured]);

  const handleLogout = async () => {
    try {
      await supabase!.auth.signOut();
      toast.success("Logged out");
    } catch (err) {
      console.error("[AdminDashboard] Logout error:", err);
      toast.error("Logout failed. Please try again.");
    }
    navigate("/admin");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-sm neon-glow-cyan">Admin Panel</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-hide border-b border-border">
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === "signature" && <AdminSignatureWork />}
        {activeTab === "gallery" && <AdminGallery />}
        {activeTab === "delivery" && <AdminDelivery />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
};

export default AdminDashboard;
