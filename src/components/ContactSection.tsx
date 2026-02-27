import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Instagram, Facebook, MapPin, Clock, Star } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-8 neon-glow-red">
          Contact Us
        </h2>

        <div className="grid gap-3 mb-8">
          <a href="https://wa.me/918523876978" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
            <MessageCircle size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-heading font-semibold">+91 85238 76978</p>
            </div>
          </a>
          <a href="tel:+918523876978" className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
            <Phone size={20} className="text-secondary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Call</p>
              <p className="text-sm font-heading font-semibold">+91 85238 76978</p>
            </div>
          </a>
          <a href="mailto:bikerschoicekakinada390@gmail.com" className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
            <Mail size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-heading font-semibold">bikerschoicekakinada390@gmail.com</p>
            </div>
          </a>
          <div className="flex gap-3">
            <a href="https://www.instagram.com/bikers_choice_kakinada?igsh=MXN4NHd0bnRzY2p3dg==" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
              <Instagram size={18} className="text-primary" />
              <span className="text-sm font-heading">Instagram</span>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
              <Facebook size={18} className="text-primary" />
              <span className="text-sm font-heading">Facebook</span>
            </a>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 mb-4">
          <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-heading font-semibold mb-1">Business Hours</p>
            <p className="text-xs text-muted-foreground">Mon – Sat: 9 AM – 8 PM</p>
            <p className="text-xs text-secondary">Sunday: Closed</p>
          </div>
        </div>

        {/* Google Review */}
        <a
          href="https://maps.app.goo.gl/hsZwRRgjuvdUguUTA?g_st=aw"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 font-heading font-semibold py-3 px-4 rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors mb-6"
        >
          <Star size={16} /> Write a Review on Google
        </a>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3815.7!2d82.23!3d16.96!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDU3JzM2LjAiTiA4MsKwMTMnNDguMCJF!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="250"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Bikers Choice Kakinada Location"
          />
        </div>

        <a
          href="https://maps.app.goo.gl/hsZwRRgjuvdUguUTA?g_st=aw"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-primary text-sm font-heading mt-3 hover:underline"
        >
          <MapPin size={14} /> Get Directions
        </a>
      </motion.div>
    </section>
  );
};

export default ContactSection;
