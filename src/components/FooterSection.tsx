import { MessageCircle, Phone, Mail, Instagram, Facebook, MapPin } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const FooterSection = () => {
  return (
    <footer className="bg-card border-t border-border py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden border border-border mb-3">
          <img src={logo} alt="Bikers Choice Kakinada" className="w-full h-full object-cover" />
        </div>
        <h3 className="font-display font-bold text-sm mb-4">Bikers Choice Kakinada</h3>

        <div className="flex gap-4 mb-4">
          <a href="tel:+918523876978" className="text-muted-foreground hover:text-primary transition-colors"><Phone size={18} /></a>
          <a href="https://wa.me/918523876978" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><MessageCircle size={18} /></a>
          <a href="mailto:bikerschoicekakinada390@gmail.com" className="text-muted-foreground hover:text-primary transition-colors"><Mail size={18} /></a>
          <a href="https://www.instagram.com/bikers_choice_kakinada?igsh=MXN4NHd0bnRzY2p3dg==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={18} /></a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={18} /></a>
        </div>

        <a
          href="https://maps.app.goo.gl/hsZwRRgjuvdUguUTA?g_st=aw"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-6"
        >
          <MapPin size={12} /> Get Directions
        </a>

        <p className="text-xs text-muted-foreground">© 2026 Bikers Choice Kakinada</p>
      </div>
    </footer>
  );
};

export default FooterSection;
