import React, { useState } from "react";
import { MenuItem } from "../types";
import { X, Sparkles, ShoppingBag, Flame, ChevronRight, Check } from "lucide-react";
import { motion } from "motion/react";

interface ItemDetailsModalProps {
  item: MenuItem | null;
  available: boolean;
  onClose: () => void;
  onAdd: (item: MenuItem, spiceOver?: number, sauceOver?: string) => void;
  onCustomize: (item: MenuItem) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  available,
  onClose,
  onAdd,
  onCustomize,
}) => {
  const [selectedSpice, setSelectedSpice] = useState<number>(() => {
    return item?.spiceLevel || 0;
  });
  const [selectedSauce, setSelectedSauce] = useState<string>("No Sauce");
  const [imageError, setImageError] = useState(false);

  if (!item) return null;

  const handleAction = () => {
    if (item.isCombo || item.category === "Meals & Combos") {
      onCustomize(item);
    } else {
      onAdd(item, selectedSpice, selectedSauce);
    }
    onClose();
  };

  const getCategoryColor = (cat: string) => {
    const lowercaseCat = cat.toLowerCase();
    if (lowercaseCat.includes("grilled")) return { bg: "bg-amber-100", text: "text-amber-800", emoji: "" };
    if (lowercaseCat.includes("fried chicken") || lowercaseCat.includes("tenders") || lowercaseCat.includes("wings")) {
      return { bg: "bg-red-50", text: "text-red-700", emoji: "" };
    }
    if (lowercaseCat.includes("burger")) return { bg: "bg-yellow-50", text: "text-yellow-800", emoji: "" };
    if (lowercaseCat.includes("twista")) return { bg: "bg-emerald-50", text: "text-emerald-700", emoji: "" };
    if (lowercaseCat.includes("beverage") || lowercaseCat.includes("drink")) return { bg: "bg-sky-50", text: "text-sky-700", emoji: "" };
    if (lowercaseCat.includes("mocktail")) return { bg: "bg-purple-50", text: "text-purple-700", emoji: "" };
    if (lowercaseCat.includes("breakfast")) return { bg: "bg-amber-50", text: "text-amber-700", emoji: "" };
    if (lowercaseCat.includes("kiddies")) return { bg: "bg-indigo-50", text: "text-indigo-700", emoji: "" };
    return { bg: "bg-gray-100", text: "text-gray-700", emoji: "" };
  };

  const catStyle = getCategoryColor(item.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-gold/20 flex flex-col max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Hero Image (Top) */}
        <div className="relative h-96 sm:h-[420px] w-full bg-white border-b overflow-hidden shrink-0">
          {!imageError ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={() => {
                setImageError(true);
              }}
            />
          ) : (
            <div className={`w-full h-full ${catStyle.bg} flex flex-col items-center justify-center p-6 text-center pb-24`}>
              <span className="text-6xl mb-2 drop-shadow-sm">
                {catStyle.emoji}
              </span>
              <span className={`text-xs font-black uppercase tracking-wider ${catStyle.text}`}>
                {item.category}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent h-32 flex items-end p-6">
            <div>
              <span className="text-[10px] font-black uppercase text-gold bg-black/60 px-2 py-0.5 rounded border border-gold/30">
                {item.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                {item.name}
              </h2>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {item.isPopular && (
              <span className="px-3 py-1 text-xs font-black uppercase text-black bg-gold rounded-full shadow border border-yellow-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-black" /> Popular Choice
              </span>
            )}
            {item.isBreakfast && (
              <span className="px-3 py-1 text-xs font-black uppercase text-white bg-amber-600 rounded-full shadow border border-amber-700">
                🍳 Breakfast Special
              </span>
            )}
          </div>
        </div>

        {/* Details Body (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Item Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {item.description || "Freshly cooked to order using the finest South African ingredients, blended with our secret spices for the ultimate golden crispiness and intense flavor."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {item.servingSize && (
              <div className="bg-gray-50 border border-gray-150 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Serving Size</span>
                <span className="text-sm font-black text-black uppercase mt-0.5">{item.servingSize}</span>
              </div>
            )}
            <div className="bg-gray-50 border border-gray-150 p-3 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Availability</span>
              <span className={`text-sm font-black uppercase mt-0.5 ${available ? "text-success-green" : "text-chicken-red"}`}>
                {available ? "In Stock ✅" : "Sold Out ❌"}
              </span>
            </div>
          </div>

          {/* Spice level adjustment (if item is not a meal combo and has optional spice level) */}
          {available && !item.isCombo && item.category !== "Meals & Combos" && !(item.category.toLowerCase().includes("fried") || item.name.toLowerCase().includes("fried")) && item.spiceLevel !== undefined && item.spiceLevel > 0 && (
            <div className="space-y-3 bg-red-50/50 border border-red-100 p-4 rounded-xl">
              <label className="block text-xs font-black uppercase text-chicken-red tracking-wider flex items-center gap-1">
                <Flame className="w-4 h-4 fill-chicken-red text-chicken-red" />
                Select Your Desired Heat Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Lemon & Herb", "Mild 🌶️", "Hot 🌶️🌶️", "Extra Hot 🌶️🌶️🌶️"].map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSpice(idx)}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-center border transition-all duration-150 ${
                      selectedSpice === idx
                        ? "bg-chicken-red text-white border-chicken-red shadow"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sauce selection (for all food items: i.e., category is not Beverages or Mocktails) */}
          {available && !item.isCombo && item.category !== "Beverages" && item.category !== "Mocktails" && (
            <div className="space-y-3 bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
              <label className="block text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1 font-semibold">
                Select Your Sauce Option (comes on the side)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "No Sauce", value: "No Sauce" },
                  { label: "BBQ", value: "BBQ Sauce (on the side)" },
                  { label: "Reaper 🌶️", value: "Carolina Reaper Sauce (on the side)" }
                ].map((sauceItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSauce(sauceItem.value)}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-center border transition-all duration-150 ${
                      selectedSauce === sauceItem.value
                        ? "bg-amber-500 text-white border-amber-500 shadow"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {sauceItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Price</span>
            <span className="text-2xl font-black text-chicken-red">
              R{item.price.toFixed(2)}
            </span>
          </div>

          {available ? (
            <button
              onClick={handleAction}
              className="px-6 py-3.5 bg-chicken-red hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              {item.isCombo || item.category === "Meals & Combos" ? (
                <>
                  Customize Combo Meal
                  <ChevronRight className="w-4 h-4 text-gold" />
                </>
              ) : (
                <>
                  Add to Cart
                  <ShoppingBag className="w-4 h-4 text-gold" />
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="px-6 py-3.5 bg-gray-200 text-gray-400 font-black uppercase text-xs tracking-widest rounded-xl cursor-not-allowed"
            >
              Sold Out
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
