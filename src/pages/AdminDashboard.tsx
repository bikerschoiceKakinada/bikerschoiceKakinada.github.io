import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Image, Truck, Settings, LayoutGrid } from "lucide-react";
import AdminSignatureWork from "@/components/admin/AdminSignatureWork";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminDelivery from "@/components/admin/AdminDelivery";
import AdminSettings from "@/components/admin/AdminSettings";

const ADMIN_EMAIL = "bikerschoicekakinada390@gmail.com";

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/admin");
          return;
        }

        if ((session.user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
          await supabase.auth.signOut();
          navigate("/admin");
          return;
        }

        const { data: isAdmin, error } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });

        if (error || !isAdmin) {
          await supabase.auth.signOut();
          navigate("/admin");
          return;
        }

        setLoading(false);
      } catch {
        toast.error("Could not verify admin session.");
        navigate("/admin");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/admin");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-sm neon-glow-cyan">Admin Panel</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Tab nav */}
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

      {/* Content */}
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

