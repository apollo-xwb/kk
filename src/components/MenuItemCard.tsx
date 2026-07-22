import React, { useState } from "react";
import { MenuItem } from "../types";
import { Sparkles, Flame, Plus, ChevronRight, Ban } from "lucide-react";
import { motion } from "motion/react";

interface MenuItemCardProps {
  item: MenuItem;
  available: boolean;
  onAdd: (item: MenuItem) => void;
  onCustomize: (item: MenuItem) => void;
  onSelect: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  available,
  onAdd,
  onCustomize,
  onSelect,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fallback category color mapping
  const getCategoryColor = (cat: string) => {
    const lowercaseCat = cat.toLowerCase();
    if (lowercaseCat.includes("grilled")) {
      return { bg: "bg-amber-100", text: "text-amber-800", emoji: "" };
    }
    if (lowercaseCat.includes("fried chicken") || lowercaseCat.includes("tenders") || lowercaseCat.includes("wings")) {
      return { bg: "bg-red-50", text: "text-red-700", emoji: "" };
    }
    if (lowercaseCat.includes("burger")) {
      return { bg: "bg-yellow-50", text: "text-yellow-800", emoji: "" };
    }
    if (lowercaseCat.includes("meal") || lowercaseCat.includes("combo") || lowercaseCat.includes("family")) {
      return { bg: "bg-rose-50", text: "text-rose-700", emoji: "" };
    }
    if (lowercaseCat.includes("twista")) {
      return { bg: "bg-emerald-50", text: "text-emerald-700", emoji: "" };
    }
    if (lowercaseCat.includes("beverage") || lowercaseCat.includes("drink")) {
      return { bg: "bg-sky-50", text: "text-sky-700", emoji: "" };
    }
    if (lowercaseCat.includes("mocktail")) {
      return { bg: "bg-purple-50", text: "text-purple-700", emoji: "" };
    }
    if (lowercaseCat.includes("breakfast")) {
      return { bg: "bg-amber-50", text: "text-amber-700", emoji: "" };
    }
    if (lowercaseCat.includes("kiddies")) {
      return { bg: "bg-indigo-50", text: "text-indigo-700", emoji: "" };
    }
    return { bg: "bg-gray-100", text: "text-gray-700", emoji: "" };
  };

  const catStyle = getCategoryColor(item.category);

  return (
    <div
      onClick={() => onSelect(item)}
      className={`relative bg-white rounded-2xl border-2 border-black overflow-hidden shadow-[4px_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[8px_8px_20px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[475px] cursor-pointer group ${
        !available ? "opacity-65" : ""
      }`}
      id={`menu-item-${item.id}`}
    >
      {/* Absolute Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        {item.isPopular && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-black bg-gold rounded-full shadow border border-yellow-500 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 fill-black" /> Popular
          </span>
        )}
        {item.spiceLevel !== undefined && item.spiceLevel > 0 && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-white bg-chicken-red rounded-full shadow border border-red-500 flex items-center gap-0.5">
            {Array.from({ length: item.spiceLevel }).map((_, i) => (
              <span key={i}>🌶️</span>
            ))}
            <span className="ml-0.5">
              {item.spiceLevel === 1 && "Mild"}
              {item.spiceLevel === 2 && "Hot"}
              {item.spiceLevel === 3 && "Extra Hot"}
            </span>
          </span>
        )}
        {item.isBreakfast && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-white bg-amber-600 rounded-full shadow border border-amber-700">
            🍳 Breakfast
          </span>
        )}
      </div>

      {/* Serving Size Overlay */}
      {item.servingSize && (
        <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 text-[9px] font-black uppercase text-gray-700 bg-gray-100/90 rounded-full border border-gray-300 pointer-events-none">
          {item.servingSize}
        </span>
      )}

      {/* Image Container (top 60%) */}
      <div className="relative h-[315px] w-full bg-white border-b border-gray-150 overflow-hidden shrink-0">
        {/* Shimmering Skeleton Loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-2xl animate-bounce">{catStyle.emoji}</span>
          </div>
        )}

        {/* Real Food Image */}
        {!imageError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          /* Fallback category-colored placeholder */
          <div className={`w-full h-full ${catStyle.bg} flex flex-col items-center justify-center p-4 text-center`}>
            <span className="text-5xl mb-2 drop-shadow-sm filter group-hover:scale-110 transition-transform duration-300">
              {catStyle.emoji}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${catStyle.text} line-clamp-2 max-w-[150px]`}>
              {item.name}
            </span>
          </div>
        )}

        {/* Sold out overlay */}
        {!available && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px] transition-all">
            <div className="bg-chicken-red border-2 border-gold text-white font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl transform -rotate-6 flex items-center gap-1 text-sm">
              <Ban className="w-4 h-4 text-gold shrink-0" />
              SOLD OUT
            </div>
          </div>
        )}
      </div>

      {/* Info Body (bottom 40%) */}
      <div className="p-4 flex-grow flex flex-col justify-between overflow-hidden bg-gold">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-black uppercase tracking-tight line-clamp-1 leading-snug group-hover:text-chicken-red transition-colors">
            {item.name}
          </h3>
          <p className="text-[11px] text-gray-500 line-clamp-2 h-7 leading-normal">
            {item.description || "Succulent Krispy King premium poultry, freshly prepared."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 shrink-0 border-t-2 border-black/15">
          <span className="text-sm font-black text-black tracking-tight bg-black/10 px-2 py-0.5 rounded border border-black/15">
            R{item.price.toFixed(2)}
          </span>

          {available ? (
            item.isCombo || item.category === "Meals & Combos" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomize(item);
                }}
                className="px-3 py-1.5 bg-black hover:bg-gray-950 text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors duration-250 flex items-center gap-1 shadow-sm hover:shadow"
              >
                Customize
                <ChevronRight className="w-3 h-3 text-gold" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item);
                }}
                className="px-3.5 py-1.5 bg-black hover:bg-gray-950 text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors duration-250 flex items-center gap-1 shadow-sm hover:shadow"
              >
                Add +
              </button>
            )
          ) : (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-400 text-[9px] font-black rounded-md uppercase tracking-wider border border-gray-200">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
