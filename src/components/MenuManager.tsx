import React, { useState, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  Flame, 
  Sparkles, 
  Image as ImageIcon,
  Check,
  RotateCcw,
  Upload
} from "lucide-react";
import { MenuItem } from "../types";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface MenuManagerProps {
  menuItems: MenuItem[];
  menuAvailability: Record<string, boolean>;
  toggleItemAvailability: (itemId: string, currentStatus: boolean) => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
  playBeep: (freq: number, type: "sine" | "square" | "sawtooth" | "triangle", duration: number) => void;
}

const CATEGORIES = [
  "Grilled Chicken",
  "Chicken Paella",
  "Fried Chicken",
  "Krispy Fried Tenders",
  "Krispy Fried Wings",
  "Karolina Reaper Wings",
  "Burgers",
  "Chicken Twista",
  "Family Meals",
  "Sides & Extras",
  "Beverages",
  "Mocktails",
  "Breakfast Menu",
  "Kiddies Meals"
];

// Curated beautiful food images for easy selection
const FOOD_IMAGE_TEMPLATES = [
  { label: "Quarter Grilled Chicken Combo", url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=500&q=80" },
  { label: "Signature Chicken Wings", url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=500&q=80" },
  { label: "Crispy Grilled Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80" },
  { label: "Spiced Golden Chips", url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80" },
  { label: "Kiddies Chicken Pops", url: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=500&q=80" },
  { label: "Soft Roll & Butter", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80" },
  { label: "Chilled Soda Can", url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80" }
];

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  menuAvailability,
  toggleItemAvailability,
  triggerToast,
  playBeep
}) => {
  // Modal / Form state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form Fields
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState(FOOD_IMAGE_TEMPLATES[0].url);
  const [formIsCombo, setFormIsCombo] = useState(false);
  const [formSpiceLevel, setFormSpiceLevel] = useState<number>(0);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formServingSize, setFormServingSize] = useState("");
  const [formIsKiddies, setFormIsKiddies] = useState(false);
  const [formIsBreakfast, setFormIsBreakfast] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileLoad = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Please select a valid image file", "error");
      return;
    }
    // Limit file size to 800KB to prevent Firestore document storage limits (1MB maximum per document)
    if (file.size > 800 * 1024) {
      triggerToast("Image file is too large! Please upload an image under 800KB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormImageUrl(event.target.result as string);
        playBeep(900, "sine", 0.08);
        triggerToast("Custom image loaded successfully!", "success");
      }
    };
    reader.onerror = () => {
      triggerToast("Failed to read image file", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFileLoad(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFileLoad(file);
    }
  };

  // Reset Form
  const resetForm = () => {
    setFormId("");
    setFormName("");
    setFormCategory(CATEGORIES[0]);
    setFormPrice("");
    setFormDescription("");
    setFormImageUrl(FOOD_IMAGE_TEMPLATES[0].url);
    setFormIsCombo(false);
    setFormSpiceLevel(0);
    setFormIsPopular(false);
    setFormServingSize("");
    setFormIsKiddies(false);
    setFormIsBreakfast(false);
    setEditingItemId(null);
    setIsEditing(false);
  };

  // Trigger form for a new item
  const handleAddNewTrigger = () => {
    resetForm();
    // Pre-populate with a random nice id
    const randId = "m-" + Math.random().toString(36).substr(2, 6);
    setFormId(randId);
    setIsEditing(true);
    playBeep(800, "sine", 0.05);
  };

  // Trigger form to edit an existing item
  const handleEditTrigger = (item: MenuItem) => {
    setFormId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormDescription(item.description || "");
    setFormImageUrl(item.imageUrl || FOOD_IMAGE_TEMPLATES[0].url);
    setFormIsCombo(!!item.isCombo);
    setFormSpiceLevel(item.spiceLevel || 0);
    setFormIsPopular(!!item.isPopular);
    setFormServingSize(item.servingSize || "");
    setFormIsKiddies(!!item.isKiddies);
    setFormIsBreakfast(!!item.isBreakfast);
    setEditingItemId(item.id);
    setIsEditing(true);
    playBeep(800, "sine", 0.05);
  };

  // Save / Update Menu Item in Firestore
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim() || !formPrice) {
      triggerToast("Missing required item fields", "error");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      triggerToast("Please enter a valid positive price", "error");
      return;
    }

    try {
      const sanitizedId = formId.replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase();
      const updatedItem: any = {
        id: sanitizedId,
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        description: formDescription.trim(),
        imageUrl: formImageUrl,
        isCombo: formIsCombo,
        spiceLevel: Number(formSpiceLevel),
        isPopular: formIsPopular,
        isAvailable: menuAvailability[sanitizedId] !== false,
        isKiddies: formIsKiddies,
        isBreakfast: formIsBreakfast,
        servingSize: formServingSize.trim()
      };

      await setDoc(doc(db, "menu_items", sanitizedId), updatedItem);
      
      playBeep(1000, "sine", 0.1);
      triggerToast(
        editingItemId 
          ? `"${formName}" updated successfully in the cloud database!` 
          : `"${formName}" created & synced to cloud database!`, 
        "success"
      );
      resetForm();
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to write database: ${err.message}`, "error");
    }
  };

  // Delete Menu Item from Firestore
  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${name}" from the menu?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "menu_items", itemId));
      playBeep(440, "sawtooth", 0.1);
      triggerToast(`Deleted "${name}" successfully.`, "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Delete failed: ${err.message}`, "error");
    }
  };

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((item) => {
    if (categoryFilter === "All") return true;
    return item.category === categoryFilter;
  });

  return (
    <div className="space-y-6 text-white bg-zinc-950 p-6 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden">
      {/* Immersive Glass glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Title & Action Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold animate-pulse" />
            <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20 font-black tracking-widest uppercase">
              INTERACTIVE MENU BUILDER
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            MENU REGISTRY & SPECIALS
          </h2>
          <p className="text-xs text-gray-400">
            Create, edit, delete regular items, and instantly flag special combo deals or discounts.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleAddNewTrigger}
            className="px-4 py-2.5 bg-chicken-red hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-[0_4px_15px_rgba(186,12,47,0.3)] hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Add New Menu Item
          </button>
        )}
      </div>

      {/* EDITING / CREATING FORM MODAL VIEW (Inline Glass Panel) */}
      {isEditing && (
        <form onSubmit={handleSaveItem} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 animate-fadeIn relative z-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-black text-gold uppercase tracking-widest flex items-center gap-1.5">
              <span>{editingItemId ? "⚡ EDIT ITEM PROFILE" : "🚀 ADD FRESH MENU ITEM"}</span>
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Field: ID */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Unique ID (Alphanumeric)</label>
              <input
                type="text"
                disabled={!!editingItemId}
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="e.g. fm-wings-combo"
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-white font-mono font-bold uppercase disabled:opacity-50"
                required
              />
            </div>

            {/* Field: Name */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Product Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. 10 Wings Combo Deal"
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-white font-bold"
                required
              />
            </div>

            {/* Field: Price */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Price in Rands (ZAR)</label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g. 149.90"
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-white font-mono font-bold"
                required
              />
            </div>

            {/* Field: Category */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Menu Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-gray-200 font-bold"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Field: Serving Size */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Serving Size (Optional)</label>
              <input
                type="text"
                value={formServingSize}
                onChange={(e) => setFormServingSize(e.target.value)}
                placeholder="e.g. 10 Wings + Large Chips"
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-white"
              />
            </div>

            {/* Field: Spice Level */}
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Max Basting Spice Option</label>
              <select
                value={formSpiceLevel}
                onChange={(e) => setFormSpiceLevel(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-gray-200"
              >
                <option value={0}>None / Mild Only (0)</option>
                <option value={1}>Mild (1)</option>
                <option value={2}>Hot chili (2)</option>
                <option value={3}>Extra hot dynamite (3)</option>
              </select>
            </div>

            {/* Field: Description */}
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Item Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe this delicious fast-food item for hungry online patrons..."
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-white text-xs"
              />
            </div>

            {/* Image Selection Block */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
              {/* Image Preview */}
              <div className="md:col-span-3 flex flex-col items-center justify-center bg-black/40 rounded-xl border border-white/10 p-2 text-center">
                <span className="text-[8px] font-black uppercase text-gray-400 mb-2">IMAGE PREVIEW</span>
                {formImageUrl ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                    <img src={formImageUrl} alt="Product preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl("")}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 p-1 rounded-full text-red-400 transition"
                      title="Clear image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                    <span className="text-[8px] font-bold">NO IMAGE</span>
                  </div>
                )}
              </div>

              {/* URL & Upload selection */}
              <div className="md:col-span-9 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Image Web URL Link</label>
                    <input
                      type="text"
                      value={formImageUrl.startsWith("data:") ? "" : formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Paste any http/https web link..."
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-white font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5">Or Upload Local Image</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-gray-200 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold" />
                      <span>Select Image File</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUploadChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <span className="block text-[8px] text-gray-500 text-center mt-1">Accepts JPG, PNG, WEBP (Max 800KB)</span>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition flex flex-col items-center justify-center ${
                    isDragOver 
                      ? "border-gold bg-gold/5 text-gold animate-pulse" 
                      : "border-white/10 bg-black/20 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <Upload className="w-5 h-5 mb-1 opacity-60" />
                  <span className="text-[10px] font-bold uppercase">Drag & Drop Image file here</span>
                  <span className="text-[8px] opacity-60">or drop directly on this panel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Image Curated Palettes */}
          <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/5">
            <span className="block text-[8px] font-black uppercase text-gray-400">
              ⚡ Curated HD Image Presets (Click to choose instantly):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FOOD_IMAGE_TEMPLATES.map((img, idx) => {
                const isSelected = formImageUrl === img.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormImageUrl(img.url);
                      playBeep(750, "sine", 0.03);
                    }}
                    className={`px-2 py-1 rounded text-[8.5px] uppercase font-black transition flex items-center gap-1 border ${
                      isSelected 
                        ? "bg-gold text-black border-gold shadow" 
                        : "bg-zinc-900 hover:bg-zinc-800 text-gray-300 border-white/10"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />} {img.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Toggle Attributes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5 text-xs font-bold uppercase">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsCombo}
                onChange={(e) => setFormIsCombo(e.target.checked)}
                className="rounded text-gold border-white/20 focus:ring-0 w-4 h-4 bg-black"
              />
              <span>Combo Option Included?</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsPopular}
                onChange={(e) => setFormIsPopular(e.target.checked)}
                className="rounded text-gold border-white/20 focus:ring-0 w-4 h-4 bg-black"
              />
              <span className="text-gold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Special Deal/Popular?
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsKiddies}
                onChange={(e) => setFormIsKiddies(e.target.checked)}
                className="rounded text-gold border-white/20 focus:ring-0 w-4 h-4 bg-black"
              />
              <span>Kiddies Serving?</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsBreakfast}
                onChange={(e) => setFormIsBreakfast(e.target.checked)}
                className="rounded text-gold border-white/20 focus:ring-0 w-4 h-4 bg-black"
              />
              <span>Breakfast (6am-11am)?</span>
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 bg-zinc-900 border border-white/10 hover:bg-zinc-850 rounded-xl text-xs font-black uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gold hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" /> Save to Database
            </button>
          </div>
        </form>
      )}

      {/* FILTER BUTTONS & MENU REGISTRY LIST */}
      <div className="space-y-4 relative z-10">
        
        {/* Category Filters */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-[10px] text-gray-400 font-black uppercase">Current Registry Index</span>
          
          <div className="flex gap-1 overflow-x-auto max-w-lg">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  playBeep(650, "sine", 0.02);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all duration-300 ${
                  categoryFilter === cat 
                    ? "bg-gold text-black border border-gold" 
                    : "bg-zinc-900 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Card Grid of Items with Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-1">
          {filteredMenuItems.map((item) => {
            const isAvail = menuAvailability[item.id] !== false;
            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl border transition duration-300 flex justify-between gap-4 relative group ${
                  isAvail 
                    ? "bg-zinc-900/40 border-white/10 hover:border-white/20" 
                    : "bg-red-950/20 border-red-900/30 text-gray-350"
                }`}
              >
                <div className="flex gap-3">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0 relative">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    
                    {item.isPopular && (
                      <span className="absolute top-1 left-1 bg-gold text-black text-[8px] font-black px-1 rounded shadow flex items-center gap-0.5 uppercase tracking-tight scale-90">
                        Deal
                      </span>
                    )}

                    {item.spiceLevel && item.spiceLevel > 0 ? (
                      <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded flex items-center gap-0.5 uppercase scale-90">
                        <Flame className="w-2 h-2" /> {item.spiceLevel}
                      </span>
                    ) : null}
                  </div>

                  {/* Info details */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-white leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold leading-none mt-0.5">
                        {item.category} {item.servingSize ? `• ${item.servingSize}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono font-black text-gold text-xs">
                        R {item.price.toFixed(2)}
                      </span>
                      
                      {item.isBreakfast && (
                        <span className="text-[8px] font-black bg-amber-600/30 text-amber-300 px-1 py-0.5 rounded uppercase">
                          Breakfast
                        </span>
                      )}
                      
                      {item.isKiddies && (
                        <span className="text-[8px] font-black bg-blue-600/30 text-blue-300 px-1 py-0.5 rounded uppercase">
                          Kids
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations column */}
                <div className="flex flex-col justify-between items-end shrink-0">
                  {/* Availability toggle */}
                  <button
                    onClick={() => toggleItemAvailability(item.id, isAvail)}
                    className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1 border ${
                      isAvail 
                        ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/25" 
                        : "bg-red-500/10 text-chicken-red border-red-500/20 hover:bg-red-500/25 animate-pulse"
                    }`}
                  >
                    <span>{isAvail ? "✅ AVAILABLE" : "❌ SOLD OUT"}</span>
                  </button>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditTrigger(item)}
                      className="p-1.5 bg-white/5 hover:bg-zinc-800 rounded-lg text-gray-300 hover:text-gold transition border border-white/5"
                      title="Edit this item profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1.5 bg-white/5 hover:bg-red-950/40 rounded-lg text-gray-400 hover:text-red-400 transition border border-white/5"
                      title="Void and delete item from menu database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMenuItems.length === 0 && (
            <div className="col-span-2 text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-2">
              <p className="text-xs text-gray-400 uppercase font-bold">No registered items in this category</p>
              <button
                onClick={handleAddNewTrigger}
                className="px-3.5 py-1.5 bg-gold hover:bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition"
              >
                Create First Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
