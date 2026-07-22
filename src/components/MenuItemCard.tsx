import React, { useState } from "react";
import { MenuItem } from "../types";
import { Sparkles, Flame, Plus, ChevronRight, Ban } from "lucide-react";
import { motion } from "motion/react";

interface MenuItemCardProps {
  item: MenuItem;
  available: boolean;
  onAdd: (item: MenuItem, spice?: number) => void;
  onCustomize: (item: MenuItem) => void;
  onSelect: (item: MenuItem) => void;
  viewMode?: "columns" | "list";
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  available,
  onAdd,
  onCustomize,
  onSelect,
  viewMode = "columns",
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

  // Detect drink/beverage to ensure image is full and not cropped
  const catLower = item.category.toLowerCase();
  const nameLower = item.name.toLowerCase();
  const isDrink = 
    catLower.includes("beverage") || 
    catLower.includes("drink") || 
    catLower.includes("mocktail") || 
    nameLower.includes("coke") || 
    nameLower.includes("fanta") || 
    nameLower.includes("sprite") || 
    nameLower.includes("7up") || 
    nameLower.includes("drink") || 
    nameLower.includes("beverage") ||
    nameLower.includes("juice") || 
    nameLower.includes("energade") || 
    nameLower.includes("dragon") ||
    nameLower.includes("aquella") ||
    nameLower.includes("water");

  // RENDER: LIST VIEW (1-Column horizontal row)
  if (viewMode === "list") {
    return (
      <div
        onClick={() => onSelect(item)}
        className={`relative bg-white rounded-2xl border-2 border-black overflow-hidden shadow-[3px_3px_8px_rgba(0,0,0,0.12)] hover:shadow-[6px_6px_16px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 transition-all duration-200 flex flex-row items-center justify-between p-2.5 sm:p-3.5 gap-3 cursor-pointer group ${
          !available ? "opacity-65" : ""
        }`}
        id={`menu-item-${item.id}`}
      >
        {/* Left image */}
        <div className={`relative w-24 sm:w-36 h-24 sm:h-32 shrink-0 rounded-xl overflow-hidden border border-black/15 ${
          isDrink ? "bg-gradient-to-b from-sky-50 via-white to-sky-100/50 p-1.5" : "bg-white"
        }`}>
          {item.isPopular && (
            <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 text-[8px] font-black uppercase text-black bg-gold rounded-full shadow border border-yellow-500 flex items-center gap-0.5">
              <Sparkles className="w-2 h-2 fill-black" /> Popular
            </span>
          )}

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
              className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                isDrink ? "object-contain p-1" : "object-cover"
              } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            />
          ) : (
            <div className={`w-full h-full ${catStyle.bg} flex flex-col items-center justify-center p-2 text-center`}>
              <span className={`text-[9px] font-black uppercase ${catStyle.text} line-clamp-2`}>
                {item.name}
              </span>
            </div>
          )}

          {!available && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-chicken-red text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* Middle text */}
        <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5 gap-1">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-tight line-clamp-1 group-hover:text-chicken-red transition-colors">
                {item.name}
              </h3>
              {item.spiceLevel !== undefined && item.spiceLevel > 0 && (
                <span className="text-[9px] font-black text-chicken-red bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                  {Array.from({ length: item.spiceLevel }).map((_, i) => "🌶️")}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {item.description || "Freshly prepared Krispy King delicious menu item."}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs sm:text-sm font-black text-black tracking-tight bg-gold px-2 py-0.5 rounded border border-black/15 shadow-sm">
              R{item.price.toFixed(2)}
            </span>
            {item.servingSize && (
              <span className="text-[9px] font-extrabold uppercase text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                {item.servingSize}
              </span>
            )}
          </div>
        </div>

        {/* Right button */}
        <div className="shrink-0 flex items-center pl-1">
          {available ? (
            item.isCombo || item.category === "Meals & Combos" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomize(item);
                }}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-black hover:bg-gray-950 text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-colors duration-150 flex items-center gap-1 shadow-sm active:scale-95"
              >
                Custom
                <ChevronRight className="w-3 h-3 text-gold" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item);
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black hover:bg-gray-950 text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-colors duration-150 flex items-center gap-1 shadow-sm active:scale-95"
              >
                Add +
              </button>
            )
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-400 text-[9px] font-black rounded uppercase border border-gray-200">
              Unavailable
            </span>
          )}
        </div>
      </div>
    );
  }

  // RENDER: COLUMNS / GRID VIEW (2-by-2 on mobile, responsive vertical cards)
  return (
    <div
      onClick={() => onSelect(item)}
      className={`relative bg-white rounded-2xl border-2 border-black overflow-hidden shadow-[3px_3px_10px_rgba(0,0,0,0.12)] hover:shadow-[6px_6px_18px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[360px] sm:h-[460px] cursor-pointer group ${
        !available ? "opacity-65" : ""
      }`}
      id={`menu-item-${item.id}`}
    >
      {/* Absolute Badges */}
      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        {item.isPopular && (
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[8px] sm:text-[9px] font-black uppercase text-black bg-gold rounded-full shadow border border-yellow-500 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 fill-black" /> Popular
          </span>
        )}
        {item.spiceLevel !== undefined && item.spiceLevel > 0 && (
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[8px] sm:text-[9px] font-black uppercase text-white bg-chicken-red rounded-full shadow border border-red-500 flex items-center gap-0.5">
            {Array.from({ length: item.spiceLevel }).map((_, i) => (
              <span key={i}>🌶️</span>
            ))}
            <span className="ml-0.5 hidden xs:inline">
              {item.spiceLevel === 1 && "Mild"}
              {item.spiceLevel === 2 && "Hot"}
              {item.spiceLevel === 3 && "Extra Hot"}
            </span>
          </span>
        )}
        {item.isBreakfast && (
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[8px] sm:text-[9px] font-black uppercase text-white bg-amber-600 rounded-full shadow border border-amber-700">
            🍳 Breakfast
          </span>
        )}
      </div>

      {/* Serving Size Overlay */}
      {item.servingSize && (
        <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[8px] sm:text-[9px] font-black uppercase text-gray-700 bg-gray-100/90 rounded-full border border-gray-300 pointer-events-none">
          {item.servingSize}
        </span>
      )}

      {/* Image Container */}
      <div className={`relative h-[210px] sm:h-[300px] w-full border-b border-gray-150 overflow-hidden shrink-0 ${
        isDrink ? "bg-gradient-to-b from-sky-50 via-white to-sky-100/60 p-2 sm:p-4" : "bg-white"
      }`}>
        {/* Shimmering Skeleton Loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-2xl animate-bounce">{catStyle.emoji}</span>
          </div>
        )}

        {/* Real Food / Drink Image */}
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
            className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
              isDrink ? "object-contain" : "object-cover"
            } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          /* Fallback category-colored placeholder */
          <div className={`w-full h-full ${catStyle.bg} flex flex-col items-center justify-center p-3 text-center`}>
            <span className="text-4xl sm:text-5xl mb-1 sm:mb-2 drop-shadow-sm filter group-hover:scale-110 transition-transform duration-300">
              {catStyle.emoji}
            </span>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${catStyle.text} line-clamp-2 max-w-[150px]`}>
              {item.name}
            </span>
          </div>
        )}

        {/* Sold out overlay */}
        {!available && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px] transition-all">
            <div className="bg-chicken-red border-2 border-gold text-white font-black uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-2xl transform -rotate-6 flex items-center gap-1 text-xs sm:text-sm">
              <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold shrink-0" />
              SOLD OUT
            </div>
          </div>
        )}
      </div>

      {/* Info Body (bottom area with gold background) */}
      <div className="p-2.5 sm:p-4 flex-grow flex flex-col justify-between overflow-hidden bg-gold">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-tight line-clamp-1 leading-snug group-hover:text-chicken-red transition-colors">
            {item.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-gray-700 line-clamp-2 h-6 sm:h-7 leading-tight">
            {item.description || "Succulent Krispy King premium poultry, freshly prepared."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1.5 sm:pt-2 shrink-0 border-t-2 border-black/15">
          <span className="text-xs sm:text-sm font-black text-black tracking-tight bg-black/10 px-1.5 py-0.5 sm:px-2 rounded border border-black/15">
            R{item.price.toFixed(2)}
          </span>

          {available ? (
            item.isCombo || item.category === "Meals & Combos" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomize(item);
                }}
                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-black hover:bg-gray-950 text-white text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors duration-150 flex items-center gap-0.5 shadow-sm active:scale-95"
              >
                Custom
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item);
                }}
                className="px-2 py-1 sm:px-3.5 sm:py-1.5 bg-black hover:bg-gray-950 text-white text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors duration-150 flex items-center gap-0.5 shadow-sm active:scale-95"
              >
                Add +
              </button>
            )
          ) : (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 text-gray-400 text-[8px] sm:text-[9px] font-black rounded-md uppercase tracking-wider border border-gray-200">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
