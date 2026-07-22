import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  ShoppingBag, 
  QrCode, 
  ArrowLeft, 
  UtensilsCrossed, 
  Flame, 
  AlertCircle
} from 'lucide-react';

interface NotFoundScreenProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  playBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({
  currentPath,
  onNavigate,
  playBeep
}) => {
  const handleNav = (targetPath: string) => {
    if (playBeep) playBeep(700, "sine", 0.05);
    onNavigate(targetPath);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto my-8 p-6 sm:p-10 bg-black text-white rounded-3xl border-2 border-gold shadow-2xl text-center space-y-8 relative overflow-hidden"
    >
      {/* Background glow accents */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-chicken-red/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gold/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main 404 Visual Icon */}
      <div className="relative inline-block">
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-chicken-red to-red-900 rounded-3xl border-2 border-gold/60 flex items-center justify-center mx-auto shadow-xl shadow-red-900/40 relative transform hover:scale-105 transition-transform duration-300">
          <UtensilsCrossed className="w-12 h-12 sm:w-14 sm:h-14 text-gold animate-pulse" />
          <div className="absolute -top-2 -right-2 bg-gold text-black text-[10px] font-black px-2 py-0.5 rounded-full border border-black flex items-center gap-1 shadow">
            <Flame className="w-3 h-3 fill-current text-chicken-red" />
            <span>404</span>
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-black uppercase tracking-widest">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Page Not Found</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
          Item Missing From The Menu!
        </h1>

        <p className="text-sm sm:text-base text-gray-300 max-w-lg mx-auto font-medium leading-relaxed">
          The requested path <span className="font-mono text-gold bg-zinc-900 px-2 py-0.5 rounded border border-gold/20 font-bold">{currentPath}</span> was not found on our remote ordering server. It may have been moved or removed.
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleNav('/')}
          className="py-3.5 px-5 bg-gold hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-yellow-500/10 border border-black"
        >
          <Home className="w-4 h-4" />
          <span>Return To Main Menu</span>
        </button>

        <button
          onClick={() => handleNav('/passes')}
          className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-gold hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all border border-gold/40"
        >
          <QrCode className="w-4 h-4" />
          <span>View Collection Passes</span>
        </button>

        <button
          onClick={() => handleNav('/cart')}
          className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all border border-zinc-800"
        >
          <ShoppingBag className="w-4 h-4 text-chicken-red" />
          <span>Review Shopping Cart</span>
        </button>

        <button
          onClick={() => {
            if (playBeep) playBeep(500, "sine", 0.05);
            window.history.back();
          }}
          className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-gray-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back Previous Page</span>
        </button>
      </div>

      {/* Quick Jump Suggestions */}
      <div className="pt-4 border-t border-zinc-800 text-xs text-gray-400 space-y-2">
        <p className="font-bold uppercase tracking-wider text-[10px] text-gold">Popular Quick Links</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { label: "🔥 Combos & Meals", path: "/" },
            { label: "🔒 Staff Portal", path: "/staff" },
            { label: "🛒 View Cart", path: "/cart" }
          ].map((link, idx) => (
            <button
              key={idx}
              onClick={() => handleNav(link.path)}
              className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-gray-300 hover:text-white rounded-xl text-[11px] font-bold border border-zinc-800 transition"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
