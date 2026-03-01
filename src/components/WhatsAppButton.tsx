import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  imageUrl: string;
  className?: string;
}

const WhatsAppButton = ({ imageUrl, className = "" }: WhatsAppButtonProps) => {
  const message = encodeURIComponent(`I want this item: ${imageUrl}`);
  const whatsappUrl = `https://wa.me/918523876978?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-heading font-semibold py-2 px-4 rounded-full text-xs hover:scale-105 transition-transform ${className}`}
    >
      <MessageCircle size={14} /> WhatsApp Order
    </a>
  );
};

export default WhatsAppButton;
