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
  Upload,
  FileSpreadsheet,
  Download,
  Sliders,
  Maximize2,
  Minimize2,
  Search
} from "lucide-react";
import { MenuItem, ComboOption, ComboChoice } from "../types";
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
  const [formComboOptions, setFormComboOptions] = useState<ComboOption[] | undefined>(undefined);

  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // --- BULK EDIT WORKSPACE STATES ---
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false);
  const [bulkGridRows, setBulkGridRows] = useState<MenuItem[]>([]);
  const [bulkActiveTab, setBulkActiveTab] = useState<"grid" | "io">("grid");
  const [gridSearchQuery, setGridSearchQuery] = useState<string>("");
  const [gridCategoryFilter, setGridCategoryFilter] = useState<string>("All");
  const [isGridFullScreen, setIsGridFullScreen] = useState<boolean>(false);

  // Keyboard shortcut listener to exit fullscreen on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isGridFullScreen) {
        setIsGridFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGridFullScreen]);

  // Filtered rows for grid workspace
  const filteredGridRows = React.useMemo(() => {
    let rows = bulkGridRows;
    if (gridCategoryFilter && gridCategoryFilter !== "All") {
      rows = rows.filter(r => r.category === gridCategoryFilter);
    }
    if (gridSearchQuery.trim()) {
      const q = gridSearchQuery.toLowerCase().trim();
      rows = rows.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.servingSize && r.servingSize.toLowerCase().includes(q)) ||
        (Array.isArray(r.comboOptions) && r.comboOptions.some(o => 
          o.name.toLowerCase().includes(q) || 
          o.choices.some(c => c.label.toLowerCase().includes(q))
        ))
      );
    }
    return rows;
  }, [bulkGridRows, gridCategoryFilter, gridSearchQuery]);

  // State for visual variation modal editor
  const [variationEditorState, setVariationEditorState] = useState<{
    rowIndex: number;
    rowId?: string;
    itemName: string;
    itemPrice: number;
    options: ComboOption[];
    activeMode: "visual" | "text" | "json";
    textInput: string;
  } | null>(null);

  const [pastedCSV, setPastedCSV] = useState<string>("");
  const [importPreviewItems, setImportPreviewItems] = useState<MenuItem[]>([]);
  const [importDiffs, setImportDiffs] = useState<Array<{
    item: MenuItem;
    original?: MenuItem;
    type: "create" | "update" | "unchanged";
    changes: string[];
  }>>([]);

  // --- VARIATION MODAL HELPER FUNCTIONS ---
  const openVariationModal = (rowIndex: number, item: MenuItem) => {
    let initialOpts: ComboOption[] = [];
    if (Array.isArray(item.comboOptions)) {
      initialOpts = JSON.parse(JSON.stringify(item.comboOptions));
    } else if (typeof item.comboOptions === "string") {
      try {
        initialOpts = JSON.parse(item.comboOptions);
      } catch (e) {
        initialOpts = [];
      }
    }

    const basePrice = typeof item.price === "number" ? item.price : parseFloat(item.price as any) || 0;

    // Sanitize choice labels and compute initial rawPrice strings for smooth typing
    const cleanOpts: ComboOption[] = initialOpts.map(opt => ({
      ...opt,
      choices: opt.choices.map((c: any) => {
        const cleanLabel = (c.label || "").replace(/\s*\(\s*\+?\s*R?\s*[0-9.]+\s*\)\s*$/gi, "").trim();
        const priceMod = typeof c.priceModifier === "number" ? c.priceModifier : parseFloat(c.priceModifier) || 0;
        const directVal = (priceMod > 0 && priceMod < basePrice)
          ? priceMod
          : (basePrice + priceMod);
        const rawPriceStr = directVal % 1 === 0 ? directVal.toString() : directVal.toFixed(2);
        return {
          label: cleanLabel || c.label,
          priceModifier: priceMod,
          rawPrice: rawPriceStr
        };
      })
    }));

    const textRep = cleanOpts.map(opt => {
      const choicesStr = opt.choices.map((c: any) => {
        const priceVal = parseFloat(c.rawPrice) || 0;
        return `${c.label} (R${priceVal.toFixed(2)})`;
      }).join(", ");
      return `${opt.name} | ${choicesStr}`;
    }).join("\n");

    setVariationEditorState({
      rowIndex,
      rowId: item.id,
      itemName: item.name,
      itemPrice: basePrice,
      options: cleanOpts,
      activeMode: "visual",
      textInput: textRep
    });
    playBeep(750, "sine", 0.04);
  };

  const handleAddGroupToModal = (groupName = "New Variation Group") => {
    if (!variationEditorState) return;
    const baseP = variationEditorState.itemPrice || 0;
    const updated = [...variationEditorState.options, {
      name: groupName,
      choices: [
        { label: "Standard / Default Option", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any
      ]
    }];
    setVariationEditorState({
      ...variationEditorState,
      options: updated
    });
  };

  const handleAddChoiceToModalGroup = (groupIndex: number) => {
    if (!variationEditorState) return;
    const updated = [...variationEditorState.options];
    const baseP = variationEditorState.itemPrice || 0;
    updated[groupIndex].choices.push({
      label: "New Choice",
      priceModifier: 0,
      rawPrice: baseP.toFixed(2)
    } as any);
    setVariationEditorState({
      ...variationEditorState,
      options: updated
    });
  };

  const handleUpdateGroupNameInModal = (groupIndex: number, name: string) => {
    if (!variationEditorState) return;
    const updated = [...variationEditorState.options];
    updated[groupIndex].name = name;
    setVariationEditorState({
      ...variationEditorState,
      options: updated
    });
  };

  const handleUpdateChoiceInModal = (groupIndex: number, choiceIndex: number, field: "label" | "priceModifier" | "rawPrice", value: any) => {
    if (!variationEditorState) return;
    const updated = [...variationEditorState.options];
    const basePrice = variationEditorState.itemPrice || 0;

    if (field === "rawPrice") {
      const rawStr = value.toString();
      const inputPrice = parseFloat(rawStr);
      let computedModifier = 0;

      if (!isNaN(inputPrice)) {
        if (inputPrice === 0) {
          computedModifier = 0;
        } else if (basePrice > 0 && inputPrice >= basePrice) {
          computedModifier = inputPrice - basePrice;
        } else {
          computedModifier = inputPrice;
        }
      }

      updated[groupIndex].choices[choiceIndex] = {
        ...updated[groupIndex].choices[choiceIndex],
        rawPrice: rawStr,
        priceModifier: Math.max(0, computedModifier)
      } as any;
    } else if (field === "priceModifier") {
      const inputPrice = parseFloat(value) || 0;
      let computedModifier = 0;
      if (inputPrice === 0) {
        computedModifier = 0;
      } else if (basePrice > 0 && inputPrice >= basePrice) {
        computedModifier = inputPrice - basePrice;
      } else {
        computedModifier = inputPrice;
      }

      const directVal = (computedModifier > 0 && computedModifier < basePrice)
        ? computedModifier
        : (basePrice + computedModifier);

      updated[groupIndex].choices[choiceIndex] = {
        ...updated[groupIndex].choices[choiceIndex],
        priceModifier: Math.max(0, computedModifier),
        rawPrice: directVal % 1 === 0 ? directVal.toString() : directVal.toFixed(2)
      } as any;
    } else {
      updated[groupIndex].choices[choiceIndex] = {
        ...updated[groupIndex].choices[choiceIndex],
        [field]: value
      };
    }

    setVariationEditorState({
      ...variationEditorState,
      options: updated
    });
  };

  const handleRemoveChoiceFromModal = (groupIndex: number, choiceIndex: number) => {
    if (!variationEditorState) return;
    const updated = [...variationEditorState.options];
    updated[groupIndex].choices.splice(choiceIndex, 1);
    setVariationEditorState({
      ...variationEditorState,
      options: updated
    });
  };

  const handleRemoveGroupFromModal = (groupIndex: number) => {
    if (!variationEditorState) return;
    const updated = [...variationEditorState.options];
    updated.splice(groupIndex, 1);
    setVariationEditorState({
      ...variationEditorState,
      options: updated
    });
  };

  const applyVariationPresetToModal = (presetType: "portion" | "sauce" | "chips" | "drinks") => {
    if (!variationEditorState) return;
    const baseP = variationEditorState.itemPrice || 0;
    let newGroup: ComboOption;
    if (presetType === "portion") {
      newGroup = {
        name: "Portion & Meal Option",
        choices: [
          { label: "Quarter Chicken", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Quarter Chicken + Chips", priceModifier: 15.00, rawPrice: (baseP + 15).toFixed(2) } as any,
          { label: "Half Chicken", priceModifier: 35.00, rawPrice: (baseP + 35).toFixed(2) } as any,
          { label: "Half Chicken + Chips", priceModifier: 55.00, rawPrice: (baseP + 55).toFixed(2) } as any,
          { label: "Full Chicken", priceModifier: 90.00, rawPrice: (baseP + 90).toFixed(2) } as any,
          { label: "Full Chicken + Chips", priceModifier: 135.00, rawPrice: (baseP + 135).toFixed(2) } as any,
          { label: "2 Full Chicken Family Pack", priceModifier: 155.00, rawPrice: (baseP + 155).toFixed(2) } as any
        ]
      };
    } else if (presetType === "sauce") {
      newGroup = {
        name: "Sauce Basting",
        choices: [
          { label: "Lemon & Herb", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Mild Peri-Peri", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Hot Peri-Peri", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Karolina Reaper (Extra Hot)", priceModifier: 5.00, rawPrice: "5.00" } as any
        ]
      };
    } else if (presetType === "chips") {
      newGroup = {
        name: "Chips / Meal Option",
        choices: [
          { label: "Without Chips", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "With Chips", priceModifier: 15.00, rawPrice: (baseP + 15).toFixed(2) } as any
        ]
      };
    } else {
      newGroup = {
        name: "Drink Choice",
        choices: [
          { label: "Coca Cola (330ml Can)", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Fanta Orange (330ml Can)", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Sprite (330ml Can)", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any,
          { label: "Still Water (500ml)", priceModifier: 0, rawPrice: baseP.toFixed(2) } as any
        ]
      };
    }

    const existingIdx = variationEditorState.options.findIndex(o => o.name.toLowerCase() === newGroup.name.toLowerCase());
    let updatedOptions = [...variationEditorState.options];
    if (existingIdx >= 0) {
      updatedOptions[existingIdx] = newGroup;
    } else {
      updatedOptions.push(newGroup);
    }

    setVariationEditorState({
      ...variationEditorState,
      options: updatedOptions
    });
    playBeep(900, "sine", 0.05);
    triggerToast(`Added "${newGroup.name}" preset!`, "info");
  };

  const parseTextInputToOptions = (text: string, basePrice = 0): ComboOption[] => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const result: ComboOption[] = [];

    for (const line of lines) {
      if (line.includes("|")) {
        const [groupNameRaw, choicesRaw] = line.split("|");
        const groupName = groupNameRaw.trim();
        const choicesList = choicesRaw.split(",").map(c => c.trim()).filter(Boolean);
        const choices: ComboChoice[] = choicesList.map(item => {
          const match = item.match(/^(.*?)(?:\(\s*(\+)?\s*R?\s*([0-9.]+)\s*\))?$/i);
          if (match) {
            const rawLabel = match[1].trim();
            const cleanLabel = rawLabel.replace(/\s*\(\s*\+?\s*R?\s*[0-9.]+\s*\)\s*$/gi, "").trim();
            const hasPlus = !!match[2];
            const parsedNum = match[3] ? parseFloat(match[3]) || 0 : 0;
            let priceModifier = 0;

            if (hasPlus) {
              priceModifier = parsedNum;
            } else if (parsedNum >= basePrice && basePrice > 0) {
              priceModifier = parsedNum - basePrice;
            } else {
              priceModifier = parsedNum;
            }

            return { label: cleanLabel || rawLabel, priceModifier: Math.max(0, priceModifier) };
          }
          return { label: item.replace(/\s*\(\s*\+?\s*R?\s*[0-9.]+\s*\)\s*$/gi, "").trim(), priceModifier: 0 };
        });
        if (groupName && choices.length > 0) {
          result.push({ name: groupName, choices });
        }
      }
    }
    return result;
  };

  const handleSaveVariationModal = async () => {
    if (!variationEditorState) return;

    let rawOptions = variationEditorState.options;

    if (variationEditorState.activeMode === "text") {
      rawOptions = parseTextInputToOptions(variationEditorState.textInput, variationEditorState.itemPrice);
    } else if (variationEditorState.activeMode === "json") {
      try {
        rawOptions = JSON.parse(variationEditorState.textInput);
      } catch (e) {
        triggerToast("Invalid JSON syntax. Please verify array structure.", "error");
        return;
      }
    }

    // Clean up temporary fields and ensure pristine choice labels and non-negative modifiers
    const finalOptions: ComboOption[] = rawOptions.map(opt => ({
      name: opt.name.trim(),
      choices: opt.choices.map((c: any) => {
        const cleanLabel = (c.label || "").replace(/\s*\(\s*\+?\s*R?\s*[0-9.]+\s*\)\s*$/gi, "").trim();
        let modifier = typeof c.priceModifier === "number" ? c.priceModifier : parseFloat(c.priceModifier) || 0;
        
        if (c.rawPrice !== undefined) {
          const inputPrice = parseFloat(c.rawPrice);
          const baseP = variationEditorState.itemPrice || 0;
          if (!isNaN(inputPrice)) {
            if (inputPrice === 0) {
              modifier = 0;
            } else if (baseP > 0 && inputPrice >= baseP) {
              modifier = inputPrice - baseP;
            } else {
              modifier = inputPrice;
            }
          }
        }

        return {
          label: cleanLabel || c.label.trim(),
          priceModifier: Math.max(0, modifier)
        };
      })
    }));

    if (variationEditorState.rowIndex === -1) {
      setFormComboOptions(finalOptions.length > 0 ? finalOptions : undefined);
      playBeep(1100, "sine", 0.08);
      triggerToast(`Variations applied to "${variationEditorState.itemName || "Item"}"! Remember to save item profile.`, "success");
    } else if (variationEditorState.rowId) {
      handleGridCellChange(
        variationEditorState.rowId, 
        "comboOptions", 
        finalOptions.length > 0 ? finalOptions : undefined
      );

      // Instantly sync to Firestore
      const targetId = variationEditorState.rowId;
      const targetItem = menuItems.find(m => m.id === targetId);
      if (targetItem) {
        try {
          await setDoc(doc(db, "menu_items", targetId), {
            ...targetItem,
            comboOptions: finalOptions
          });
          triggerToast(`Variations saved and synchronized to cloud for "${variationEditorState.itemName}"!`, "success");
        } catch (err) {
          console.error("Error saving variations to Firestore:", err);
        }
      }

      playBeep(1100, "sine", 0.08);
    } else {
      handleGridCellChange(
        variationEditorState.rowIndex, 
        "comboOptions", 
        finalOptions.length > 0 ? finalOptions : undefined
      );
      playBeep(1100, "sine", 0.08);
      triggerToast(`Variations applied to "${variationEditorState.itemName}" in grid!`, "success");
    }
    setVariationEditorState(null);
  };

  // --- BULK WORKSPACE HELPER FUNCTIONS ---
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = typeof val === "string" ? val : JSON.stringify(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const parseCSV = (text: string): any[] => {
    const lines: string[] = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i+1];
      
      if (char === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          i++;
        }
        lines.push(row.join("|__CELL__|"));
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row.join("|__CELL__|"));
    }
    
    if (lines.length === 0) return [];
    
    const headers = lines[0].split("|__CELL__|").map(h => h.trim().toLowerCase());
    const parsedData = [];
    
    for (let j = 1; j < lines.length; j++) {
      const values = lines[j].split("|__CELL__|");
      if (values.length < headers.length) continue;
      
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] ? values[idx].trim() : "";
      });
      parsedData.push(obj);
    }
    
    return parsedData;
  };

  const generateImportDiffs = (parsedItems: MenuItem[]) => {
    const diffs: Array<{
      item: MenuItem;
      original?: MenuItem;
      type: "create" | "update" | "unchanged";
      changes: string[];
    }> = [];

    parsedItems.forEach(item => {
      const original = menuItems.find(m => m.id === item.id);
      if (!original) {
        diffs.push({
          item,
          type: "create",
          changes: ["New item will be created in the database."]
        });
      } else {
        const changes: string[] = [];
        if (original.name !== item.name) {
          changes.push(`Name: "${original.name}" ➔ "${item.name}"`);
        }
        if (original.category !== item.category) {
          changes.push(`Category: "${original.category}" ➔ "${item.category}"`);
        }
        if (original.price !== item.price) {
          changes.push(`Price: R${original.price.toFixed(2)} ➔ R${item.price.toFixed(2)}`);
        }
        if ((original.servingSize || "") !== (item.servingSize || "")) {
          changes.push(`Serving Size: "${original.servingSize || "-"}" ➔ "${item.servingSize || "-"}"`);
        }
        if (original.spiceLevel !== item.spiceLevel) {
          changes.push(`Spice Level: ${original.spiceLevel || 0} ➔ ${item.spiceLevel || 0}`);
        }
        if (original.isAvailable !== item.isAvailable) {
          changes.push(`Available: ${original.isAvailable !== false ? "Yes" : "No"} ➔ ${item.isAvailable !== false ? "Yes" : "No"}`);
        }
        if (original.isPopular !== item.isPopular) {
          changes.push(`Popular/Special: ${original.isPopular ? "Yes" : "No"} ➔ ${item.isPopular ? "Yes" : "No"}`);
        }
        if (original.isBreakfast !== item.isBreakfast) {
          changes.push(`Breakfast Only: ${original.isBreakfast ? "Yes" : "No"} ➔ ${item.isBreakfast ? "Yes" : "No"}`);
        }
        if (original.isKiddies !== item.isKiddies) {
          changes.push(`Kiddies: ${original.isKiddies ? "Yes" : "No"} ➔ ${item.isKiddies ? "Yes" : "No"}`);
        }
        
        const origOptionsStr = JSON.stringify(original.comboOptions || []);
        const newOptionsStr = JSON.stringify(item.comboOptions || []);
        if (origOptionsStr !== newOptionsStr) {
          changes.push(`Variations/Combo Options updated.`);
        }

        if (changes.length > 0) {
          diffs.push({
            item,
            original,
            type: "update",
            changes
          });
        } else {
          diffs.push({
            item,
            original,
            type: "unchanged",
            changes: []
          });
        }
      }
    });

    setImportDiffs(diffs);
  };

  const handleOpenBulkEdit = () => {
    setIsBulkEditing(true);
    setBulkGridRows(JSON.parse(JSON.stringify(menuItems)));
    setBulkActiveTab("grid");
    setGridSearchQuery("");
    setGridCategoryFilter("All");
    setIsGridFullScreen(false);
    setPastedCSV("");
    setImportPreviewItems([]);
    setImportDiffs([]);
    playBeep(800, "sine", 0.05);
  };

  const handleCSVTextChange = (text: string) => {
    setPastedCSV(text);
    if (!text.trim()) {
      setImportPreviewItems([]);
      setImportDiffs([]);
      return;
    }
    try {
      const parsedRaw = parseCSV(text);
      if (parsedRaw.length === 0) {
        setImportPreviewItems([]);
        setImportDiffs([]);
        return;
      }
      
      const mapped: MenuItem[] = parsedRaw.map(row => {
        let comboOptionsParsed = undefined;
        const rawOptions = row.combooptions || row.combo_options || "";
        if (rawOptions) {
          try {
            comboOptionsParsed = JSON.parse(rawOptions);
          } catch (err) {
            console.warn("Could not parse combo options json", rawOptions);
          }
        }
        
        return {
          id: (row.id || "").trim().toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, ""),
          name: (row.name || "").trim(),
          category: (row.category || "").trim(),
          price: parseFloat(row.price) || 0,
          description: (row.description || "").trim(),
          servingSize: (row.servingsize || row.serving_size || "").trim(),
          spiceLevel: parseInt(row.spicelevel || row.spice_level) || 0,
          isAvailable: row.isavailable === "true" || row.isavailable === "1" || row.isavailable === "Y",
          isPopular: row.ispopular === "true" || row.ispopular === "1" || row.ispopular === "Y",
          isBreakfast: row.isbreakfast === "true" || row.isbreakfast === "1" || row.isbreakfast === "Y",
          isKiddies: row.iskiddies === "true" || row.iskiddies === "1" || row.iskiddies === "Y",
          imageUrl: row.imageurl || row.image_url || "https://via.placeholder.com/300x200/F5F5F5/333333?text=Product",
          comboOptions: comboOptionsParsed
        };
      }).filter(item => item.id !== "");

      setImportPreviewItems(mapped);
      generateImportDiffs(mapped);
    } catch (err: any) {
      console.error(err);
      triggerToast(`Error parsing CSV: ${err.message}`, "error");
    }
  };

  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleCSVTextChange(text);
        triggerToast("CSV File loaded successfully! Preview the updates below.", "success");
        playBeep(900, "sine", 0.05);
      }
    };
    reader.onerror = () => {
      triggerToast("Failed to read CSV file", "error");
    };
    reader.readAsText(file);
  };

  const handleConfirmCSVImport = async () => {
    const pendingChanges = importDiffs.filter(d => d.type !== "unchanged");
    if (pendingChanges.length === 0) {
      triggerToast("No pending modifications detected in the imported file.", "info");
      return;
    }

    if (!window.confirm(`Are you sure you want to mass-apply and sync these ${pendingChanges.length} menu updates to the cloud database?`)) {
      return;
    }

    try {
      let successCount = 0;
      for (const diff of pendingChanges) {
        await setDoc(doc(db, "menu_items", diff.item.id), diff.item);
        successCount++;
      }
      playBeep(1100, "sine", 0.15);
      triggerToast(`Successfully bulk-imported and synced ${successCount} items to the cloud menu!`, "success");
      setIsBulkEditing(false);
    } catch (err: any) {
      console.error(err);
      triggerToast(`Bulk write failed: ${err.message}`, "error");
    }
  };

  const handleGridCellChange = (target: number | string, field: keyof MenuItem, value: any) => {
    setBulkGridRows(prev => {
      if (typeof target === "number") {
        const updated = [...prev];
        if (updated[target]) {
          updated[target] = { ...updated[target], [field]: value };
        }
        return updated;
      } else {
        return prev.map(row => row.id === target ? { ...row, [field]: value } : row);
      }
    });
  };

  const handleSaveGridChanges = async () => {
    const modifiedRows = bulkGridRows.filter(row => {
      const original = menuItems.find(m => m.id === row.id);
      if (!original) return true;
      return (
        original.name !== row.name ||
        original.category !== row.category ||
        original.price !== row.price ||
        (original.servingSize || "") !== (row.servingSize || "") ||
        original.spiceLevel !== row.spiceLevel ||
        original.isBreakfast !== row.isBreakfast ||
        original.isKiddies !== row.isKiddies ||
        original.isPopular !== row.isPopular ||
        JSON.stringify(original.comboOptions || []) !== JSON.stringify(row.comboOptions || [])
      );
    });

    if (modifiedRows.length === 0) {
      triggerToast("No changes detected in the grid.", "info");
      return;
    }

    if (!window.confirm(`Are you sure you want to save and sync ${modifiedRows.length} changed items to the cloud database?`)) {
      return;
    }

    try {
      let writeCount = 0;
      for (const row of modifiedRows) {
        const numPrice = typeof row.price === "number" ? row.price : parseFloat(row.price);
        if (isNaN(numPrice) || numPrice < 0) {
          triggerToast(`Invalid price for item "${row.name}". Must be positive.`, "error");
          return;
        }
        const rowToSave = {
          ...row,
          price: numPrice
        };
        await setDoc(doc(db, "menu_items", rowToSave.id), rowToSave);
        writeCount++;
      }
      playBeep(1200, "sine", 0.15);
      triggerToast(`Successfully synchronized ${writeCount} bulk grid updates to the cloud database!`, "success");
      setIsBulkEditing(false);
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to bulk-save grid changes: ${err.message}`, "error");
    }
  };

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
    setFormComboOptions(undefined);
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
    setFormComboOptions(item.comboOptions || undefined);
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
        servingSize: formServingSize.trim(),
        comboOptions: formComboOptions
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
    <div className="w-full space-y-6 text-white bg-zinc-950 p-4 sm:p-6 md:p-8 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden">
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

        {!isEditing && !isBulkEditing && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenBulkEdit}
              className="px-4 py-2.5 bg-zinc-850 hover:bg-zinc-850 text-gold border border-gold/20 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition hover:scale-105"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-gold" /> Bulk Update / CSV
            </button>
            <button
              onClick={handleAddNewTrigger}
              className="px-4 py-2.5 bg-chicken-red hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-[0_4px_15px_rgba(186,12,47,0.3)] hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add New Menu Item
            </button>
          </div>
        )}
      </div>

      {/* EDITING / CREATING FORM MODAL VIEW (Inline Glass Panel) */}
      {isEditing && (
        <form onSubmit={handleSaveItem} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 animate-fadeIn relative z-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-black text-gold uppercase tracking-widest flex items-center gap-1.5">
              <span>{editingItemId ? "EDIT ITEM PROFILE" : "ADD FRESH MENU ITEM"}</span>
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

            {/* Field: Variations & Portion Sizes Trigger */}
            <div className="md:col-span-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-black uppercase text-gold tracking-wide">
                  Portion Sizes &amp; Variations (Direct Pricing)
                </span>
                <span className="block text-[11px] text-gray-300 font-medium mt-0.5">
                  {formComboOptions && formComboOptions.length > 0 
                    ? `Configured ${formComboOptions.length} variation groups (${formComboOptions.map(g => g.name).join(", ")})` 
                    : "Configure Quarter/Half/Full chicken portion sizes or custom side add-ons with direct version pricing."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openVariationModal(-1, {
                  id: formId || "new-item",
                  name: formName || "New Item",
                  price: parseFloat(formPrice) || 0,
                  category: formCategory,
                  comboOptions: formComboOptions,
                  description: formDescription,
                  imageUrl: formImageUrl,
                  spiceLevel: formSpiceLevel,
                  isAvailable: true
                })}
                className="px-4 py-2.5 bg-gold hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition border border-black shadow flex items-center gap-1.5 shrink-0"
              >
                <span>{formComboOptions && formComboOptions.length > 0 ? "Edit Variations" : "+ Add Variations"}</span>
              </button>
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
              Curated HD Image Presets (Click to choose instantly):
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

      {/* BULK EDITING PANEL */}
      {isBulkEditing && (
        <div className={
          isGridFullScreen
            ? "fixed inset-0 z-50 bg-zinc-950/98 p-4 md:p-6 flex flex-col h-screen w-screen overflow-hidden animate-fadeIn backdrop-blur-xl"
            : "bg-zinc-900 border border-gold/30 rounded-2xl p-4 sm:p-6 space-y-6 animate-fadeIn relative z-10 shadow-2xl w-full max-w-none"
        }>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-gold" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none flex items-center gap-2">
                  <span>⚡ BULK WORKSPACE &amp; MASS UPDATE</span>
                  {isGridFullScreen && (
                    <span className="bg-chicken-red text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500 uppercase tracking-widest animate-pulse">
                      Full Screen View
                    </span>
                  )}
                </h3>
                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 block">
                  Shopify &amp; WooCommerce inspired bulk pricing and catalog publisher
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsGridFullScreen(!isGridFullScreen);
                  playBeep(900, "sine", 0.05);
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-gold hover:text-black text-gold text-xs font-black uppercase rounded-xl border border-gold/30 flex items-center gap-1.5 transition"
                title={isGridFullScreen ? "Exit Full Screen" : "Maximize Grid Full Screen"}
              >
                {isGridFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isGridFullScreen ? "Exit Full Screen" : "Full Screen"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBulkEditing(false);
                  setIsGridFullScreen(false);
                  playBeep(600, "sine", 0.05);
                }}
                className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-2 border-b border-white/5 pb-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setBulkActiveTab("grid");
                playBeep(700, "sine", 0.02);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                bulkActiveTab === "grid"
                  ? "bg-gold text-black font-black"
                  : "bg-zinc-950 text-gray-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              📊 Interactive Spreadsheet Grid
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkActiveTab("io");
                playBeep(700, "sine", 0.02);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                bulkActiveTab === "io"
                  ? "bg-gold text-black font-black"
                  : "bg-zinc-950 text-gray-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              📥 Export &amp; Import CSV
            </button>
          </div>

          {/* Tab 1 Content: INTERACTIVE GRID */}
          {bulkActiveTab === "grid" && (
            <div className={`space-y-4 ${isGridFullScreen ? "flex-1 flex flex-col min-h-0 overflow-hidden" : ""}`}>
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-white/10 shrink-0">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={gridSearchQuery}
                    onChange={(e) => setGridSearchQuery(e.target.value)}
                    placeholder="Search grid items by name, ID, category, or variations..."
                    className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold font-medium"
                  />
                  {gridSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGridSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category:</span>
                  <select
                    value={gridCategoryFilter}
                    onChange={(e) => setGridCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    <option value="All">All Categories ({bulkGridRows.length})</option>
                    {CATEGORIES.map(cat => {
                      const count = bulkGridRows.filter(r => r.category === cat).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Count Badge & Fullscreen toggle */}
                <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end">
                  <span className="px-2.5 py-1 bg-gold/15 text-gold border border-gold/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    Showing {filteredGridRows.length} of {bulkGridRows.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGridFullScreen(!isGridFullScreen);
                      playBeep(900, "sine", 0.05);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition border ${
                      isGridFullScreen
                        ? "bg-chicken-red text-white border-red-500 shadow"
                        : "bg-zinc-800 text-gold hover:bg-gold hover:text-black border-gold/30"
                    }`}
                  >
                    {isGridFullScreen ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Exit Full Screen</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Full Screen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid Table Wrapper */}
              <div className={`overflow-auto border border-white/10 rounded-xl bg-zinc-950/40 ${
                isGridFullScreen ? "flex-1 min-h-0" : "max-h-[500px]"
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-zinc-950 text-gray-400 uppercase font-black tracking-wider text-[9px] border-b border-white/15 shadow-md">
                      <th className="p-3 whitespace-nowrap bg-zinc-950">ID (Locked)</th>
                      <th className="p-3 whitespace-nowrap bg-zinc-950">Name</th>
                      <th className="p-3 whitespace-nowrap w-44 bg-zinc-950">Category</th>
                      <th className="p-3 whitespace-nowrap w-24 bg-zinc-950">Price (R)</th>
                      <th className="p-3 whitespace-nowrap w-28 bg-zinc-950">Serving Size</th>
                      <th className="p-3 whitespace-nowrap w-32 bg-zinc-950">Spice Level</th>
                      <th className="p-3 whitespace-nowrap bg-zinc-950 text-center">Breakfast</th>
                      <th className="p-3 whitespace-nowrap bg-zinc-950 text-center">Kiddies</th>
                      <th className="p-3 whitespace-nowrap bg-zinc-950 text-center">Popular/Deal</th>
                      <th className="p-3 whitespace-nowrap w-72 bg-zinc-950">Variations &amp; Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredGridRows.length > 0 ? (
                      filteredGridRows.map((row) => {
                        const hasOptions = Array.isArray(row.comboOptions) && row.comboOptions.length > 0;
                        return (
                          <tr key={row.id} className="hover:bg-white/[0.04] transition">
                            <td className="p-2 font-mono font-bold text-gray-500 whitespace-nowrap">{row.id}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleGridCellChange(row.id, "name", e.target.value)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-gold"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.category}
                                onChange={(e) => handleGridCellChange(row.id, "category", e.target.value)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-gold"
                              >
                                {CATEGORIES.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={row.price}
                                onChange={(e) => handleGridCellChange(row.id, "price", e.target.value)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-gold text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.servingSize || ""}
                                onChange={(e) => handleGridCellChange(row.id, "servingSize", e.target.value)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-gold"
                                placeholder="e.g. 1pc / 330ml"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.spiceLevel !== undefined ? row.spiceLevel : 0}
                                onChange={(e) => handleGridCellChange(row.id, "spiceLevel", parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-gold"
                              >
                                <option value="0">None (0)</option>
                                <option value="1">Mild (1)</option>
                                <option value="2">Hot (2)</option>
                                <option value="3">Extra Hot (3)</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!row.isBreakfast}
                                onChange={(e) => handleGridCellChange(row.id, "isBreakfast", e.target.checked)}
                                className="rounded bg-black border-white/15 focus:ring-0 text-gold w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!row.isKiddies}
                                onChange={(e) => handleGridCellChange(row.id, "isKiddies", e.target.checked)}
                                className="rounded bg-black border-white/15 focus:ring-0 text-gold w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!row.isPopular}
                                onChange={(e) => handleGridCellChange(row.id, "isPopular", e.target.checked)}
                                className="rounded bg-black border-white/15 focus:ring-0 text-gold w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 min-w-[200px]">
                              <div className="flex items-center justify-between gap-1.5 bg-zinc-900/90 border border-white/10 p-1.5 rounded-lg">
                                <div className="flex items-center gap-1 overflow-hidden">
                                  {hasOptions ? (
                                    <>
                                      <span className="bg-gold/15 text-gold border border-gold/30 font-black px-1.5 py-0.5 rounded text-[8.5px] uppercase shrink-0">
                                        {(row.comboOptions as ComboOption[]).length} {(row.comboOptions as ComboOption[]).length === 1 ? "Group" : "Groups"}
                                      </span>
                                      <span className="text-[10px] text-gray-300 font-medium truncate max-w-[90px]" title={(row.comboOptions as ComboOption[]).map(o => o.name).join(", ")}>
                                        {(row.comboOptions as ComboOption[]).map(o => o.name).join(", ")}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-500 italic text-[10px] px-1">None set</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openVariationModal(-1, row)}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-gold hover:text-black text-gold rounded font-black text-[9px] uppercase tracking-wider shrink-0 transition flex items-center gap-1 border border-gold/20"
                                  title="Open visual variations editor"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>{hasOptions ? "Edit" : "+ Add"}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="w-8 h-8 text-gray-600" />
                            <p className="text-sm font-bold text-gray-300">No menu items match your search filter</p>
                            <p className="text-xs text-gray-500">Try searching for a different term or clear search query.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setGridSearchQuery("");
                                setGridCategoryFilter("All");
                              }}
                              className="mt-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-gold text-xs font-bold rounded-lg border border-gold/30"
                            >
                              Clear Search &amp; Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grid actions */}
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 shrink-0">
                <div className="text-[11px] text-gray-400 font-medium hidden sm:block">
                  💡 Press <kbd className="px-1.5 py-0.5 bg-zinc-800 text-gray-200 border border-white/10 rounded text-[10px] font-mono">Save &amp; Sync Grid</kbd> to persist all row updates to cloud Firestore.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkEditing(false);
                      setIsGridFullScreen(false);
                      playBeep(600, "sine", 0.05);
                    }}
                    className="px-4 py-2.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-xl text-xs font-black uppercase text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGridChanges}
                    className="px-5 py-2.5 bg-gold hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-4 h-4" /> Save &amp; Sync Grid to Cloud
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 Content: CSV IMPORT / EXPORT */}
          {bulkActiveTab === "io" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Column */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <span>📥 Export Catalog</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Download the entire current active menu database into a standardized, Excel-ready CSV spreadsheet format.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ["id", "name", "category", "price", "description", "servingSize", "spiceLevel", "isAvailable", "isPopular", "isBreakfast", "isKiddies", "comboOptions"];
                      const csvContent = [
                        headers.join(","),
                        ...menuItems.map(item => [
                          escapeCSV(item.id),
                          escapeCSV(item.name),
                          escapeCSV(item.category),
                          escapeCSV(item.price),
                          escapeCSV(item.description || ""),
                          escapeCSV(item.servingSize || ""),
                          escapeCSV(item.spiceLevel !== undefined ? item.spiceLevel : 0),
                          escapeCSV(item.isAvailable !== false),
                          escapeCSV(item.isPopular || false),
                          escapeCSV(item.isBreakfast || false),
                          escapeCSV(item.isKiddies || false),
                          escapeCSV(item.comboOptions ? JSON.stringify(item.comboOptions) : "")
                        ].join(","))
                      ].join("\n");

                      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `krispy_king_menu_export.csv`);
                      link.style.visibility = "hidden";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      triggerToast("CSV Download initiated successfully!", "success");
                      playBeep(1000, "sine", 0.08);
                    }}
                    className="w-full py-2.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4 text-gold" /> Download CSV Spreadsheet
                  </button>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-gray-400 uppercase">Or Copy Raw CSV Text Directly:</label>
                    <textarea
                      readOnly
                      onClick={(e) => {
                        (e.target as HTMLTextAreaElement).select();
                        navigator.clipboard.writeText((e.target as HTMLTextAreaElement).value);
                        triggerToast("CSV text copied to clipboard!", "success");
                        playBeep(900, "sine", 0.04);
                      }}
                      value={[
                        ["id", "name", "category", "price", "description", "servingSize", "spiceLevel", "isAvailable", "isPopular", "isBreakfast", "isKiddies", "comboOptions"].join(","),
                        ...menuItems.map(item => [
                          escapeCSV(item.id),
                          escapeCSV(item.name),
                          escapeCSV(item.category),
                          escapeCSV(item.price),
                          escapeCSV(item.description || ""),
                          escapeCSV(item.servingSize || ""),
                          escapeCSV(item.spiceLevel !== undefined ? item.spiceLevel : 0),
                          escapeCSV(item.isAvailable !== false),
                          escapeCSV(item.isPopular || false),
                          escapeCSV(item.isBreakfast || false),
                          escapeCSV(item.isKiddies || false),
                          escapeCSV(item.comboOptions ? JSON.stringify(item.comboOptions) : "")
                        ].join(","))
                      ].join("\n")}
                      className="w-full h-32 p-2.5 bg-black rounded-lg border border-white/5 font-mono text-[9px] text-gray-500 cursor-pointer focus:outline-none text-wrap-none whitespace-pre"
                    />
                    <span className="text-[8px] text-gray-500 block uppercase font-bold text-center">Click inside text box to highlight and copy</span>
                  </div>
                </div>

                {/* Import Column */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <span>📤 Import Catalog (Re-upload)</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Upload your modified CSV file or paste the raw text here. The catalog publisher will validate the rows and display a list of modified fields before updating.
                  </p>

                  <div className="flex flex-col gap-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase">Upload CSV File:</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileUpload}
                      className="text-xs text-gold file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-zinc-900 file:text-gold hover:file:bg-zinc-800 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-gray-400 uppercase">Or Paste Edited CSV Text:</label>
                    <textarea
                      value={pastedCSV}
                      onChange={(e) => handleCSVTextChange(e.target.value)}
                      placeholder="id,name,category,price,description,servingSize,spiceLevel,isAvailable,isPopular,isBreakfast,isKiddies,comboOptions"
                      className="w-full h-32 p-2.5 bg-black rounded-lg border border-white/10 font-mono text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Diff Preview Panel */}
              {importPreviewItems.length > 0 && (
                <div className="bg-zinc-950 p-5 rounded-xl border border-gold/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-gold rounded-full animate-ping shrink-0" />
                      <span>📊 Live Review: {importPreviewItems.length} parsed items</span>
                    </h4>
                    
                    <span className="text-[9px] bg-gold/15 text-gold px-2.5 py-0.5 rounded-full border border-gold/25 font-black uppercase">
                      Changes Ready
                    </span>
                  </div>

                  {/* Diff list scroll */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {importDiffs.map((diff, i) => {
                      if (diff.type === "unchanged") return null;
                      return (
                        <div key={i} className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          diff.type === "create" 
                            ? "bg-green-950/20 border-green-500/20 text-green-300" 
                            : "bg-amber-950/20 border-amber-500/20 text-amber-300"
                        }`}>
                          <div className="space-y-1">
                            <span className="font-mono text-[10px] uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded mr-2 border border-white/5 font-black">
                              {diff.type.toUpperCase()}
                            </span>
                            <strong className="text-white font-black uppercase text-[11px]">{diff.item.name || "Untitled Product"}</strong>
                            <span className="text-[10px] text-gray-400 ml-2 font-mono">({diff.item.id})</span>
                            
                            <ul className="list-disc pl-5 text-[10.5px] mt-1 space-y-0.5 text-gray-300 font-medium">
                              {diff.changes.map((c, cIdx) => (
                                <li key={cIdx}>{c}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="font-mono font-bold text-gold text-right whitespace-nowrap shrink-0 text-xs">
                            R {diff.item.price.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}

                    {importDiffs.filter(d => d.type !== "unchanged").length === 0 && (
                      <p className="text-center py-6 text-xs text-gray-500 uppercase font-black">
                        No modified fields detected! All spreadsheet rows match existing database values perfectly.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end border-t border-white/10 pt-4">
                    <button
                      type="button"
                      disabled={importDiffs.filter(d => d.type !== "unchanged").length === 0}
                      onClick={handleConfirmCSVImport}
                      className="px-6 py-3 bg-gold hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition duration-300"
                    >
                      CONFIRM &amp; APPLY ALL CHANGES TO DATABASE
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FILTER BUTTONS & MENU REGISTRY LIST */}
      {!isBulkEditing && (
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
                        referrerPolicy="no-referrer"
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
      )}

      {/* VISUAL VARIATION EDITOR MODAL OVERLAY */}
      {variationEditorState && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-950 border border-gold/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
            {/* Header */}
            <div className="p-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    VARIATIONS & OPTIONS EDITOR
                  </h3>
                  <span className="text-[10px] text-gold font-bold uppercase">
                    Item: {variationEditorState.itemName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVariationEditorState(null)}
                className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-4 py-2 bg-black border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setVariationEditorState({ ...variationEditorState, activeMode: "visual" })}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    variationEditorState.activeMode === "visual"
                      ? "bg-gold text-black font-black"
                      : "bg-zinc-900 text-gray-400 hover:text-white"
                  }`}
                >
                  🎨 Visual Builder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const basePrice = variationEditorState.itemPrice || 0;
                    const textRep = variationEditorState.options.map(opt => {
                      const choicesStr = opt.choices.map(c => {
                        const directVal = (c.priceModifier && c.priceModifier < basePrice)
                          ? c.priceModifier
                          : (basePrice + (c.priceModifier || 0));
                        return `${c.label} (R${directVal.toFixed(2)})`;
                      }).join(", ");
                      return `${opt.name} | ${choicesStr}`;
                    }).join("\n");
                    setVariationEditorState({ ...variationEditorState, activeMode: "text", textInput: textRep });
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    variationEditorState.activeMode === "text"
                      ? "bg-gold text-black font-black"
                      : "bg-zinc-900 text-gray-400 hover:text-white"
                  }`}
                >
                  📝 Fast Pipe Text Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVariationEditorState({
                      ...variationEditorState,
                      activeMode: "json",
                      textInput: JSON.stringify(variationEditorState.options, null, 2)
                    });
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    variationEditorState.activeMode === "json"
                      ? "bg-gold text-black font-black"
                      : "bg-zinc-900 text-gray-400 hover:text-white"
                  }`}
                >
                  {`{ } Raw JSON`}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-gold/10 text-gold px-2 py-0.5 rounded border border-gold/20 font-mono font-bold uppercase">
                  Base Price: R{(variationEditorState.itemPrice || 0).toFixed(2)}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">
                  {variationEditorState.options.length} {variationEditorState.options.length === 1 ? "Group" : "Groups"}
                </span>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Info banner explaining direct pricing */}
              <div className="bg-gold/10 border border-gold/30 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-gold uppercase block">
                    💡 DIRECT VERSION PRICING
                  </span>
                  <p className="text-[11px] text-gray-300">
                    Enter the total price directly for each version (e.g. <span className="font-bold text-white">R34.90</span> for Quarter, <span className="font-bold text-white">R69.90</span> for Half, <span className="font-bold text-white">R124.90</span> for Full, or <span className="font-bold text-white">R19.90</span> for add-on chips). No mental math required!
                  </p>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] font-black text-gold uppercase block">
                  1-Click Fast Presets (Click to Add / Replace):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyVariationPresetToModal("portion")}
                    className="px-2.5 py-1 bg-black hover:bg-zinc-800 border border-gold/30 text-gold rounded-lg text-[9.5px] font-black uppercase tracking-wider transition flex items-center gap-1"
                  >
                    + Portion Sizes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVariationPresetToModal("chips")}
                    className="px-2.5 py-1 bg-black hover:bg-zinc-800 border border-gold/30 text-gold rounded-lg text-[9.5px] font-black uppercase tracking-wider transition flex items-center gap-1"
                  >
                    + Chips / Sides
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVariationPresetToModal("sauce")}
                    className="px-2.5 py-1 bg-black hover:bg-zinc-800 border border-gold/30 text-gold rounded-lg text-[9.5px] font-black uppercase tracking-wider transition flex items-center gap-1"
                  >
                    🌶️ + Sauce Basting
                  </button>
                  <button
                    type="button"
                    onClick={() => applyVariationPresetToModal("drinks")}
                    className="px-2.5 py-1 bg-black hover:bg-zinc-800 border border-gold/30 text-gold rounded-lg text-[9.5px] font-black uppercase tracking-wider transition flex items-center gap-1"
                  >
                    + Soft Drinks
                  </button>
                </div>
              </div>

              {/* MODE 1: VISUAL BUILDER */}
              {variationEditorState.activeMode === "visual" && (
                <div className="space-y-4">
                  {variationEditorState.options.map((opt, gIdx) => (
                    <div key={gIdx} className="bg-zinc-900 border border-white/10 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="bg-gold text-black font-black text-[9px] px-1.5 py-0.5 rounded uppercase shrink-0">
                            Group #{gIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => handleUpdateGroupNameInModal(gIdx, e.target.value)}
                            placeholder="Group Title (e.g. Portion Size, Drink Choice)"
                            className="w-full max-w-xs px-2.5 py-1 bg-black border border-white/10 rounded text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGroupFromModal(gIdx)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded transition"
                          title="Remove Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Choices Table */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 text-[9px] font-black text-gray-400 uppercase tracking-wider px-1">
                          <span className="col-span-6">Choice / Option Label</span>
                          <span className="col-span-5">Version Total Price (R)</span>
                          <span className="col-span-1 text-center">Action</span>
                        </div>

                        {opt.choices.map((choice: any, cIdx) => {
                          const baseP = variationEditorState.itemPrice || 0;
                          const priceMod = typeof choice.priceModifier === "number" ? choice.priceModifier : parseFloat(choice.priceModifier) || 0;
                          const directVal = (priceMod > 0 && priceMod < baseP)
                            ? priceMod
                            : (baseP + priceMod);
                          const displayVal = choice.rawPrice !== undefined ? choice.rawPrice : (directVal % 1 === 0 ? directVal.toString() : directVal.toFixed(2));

                          return (
                            <div key={cIdx} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  value={choice.label}
                                  onChange={(e) => handleUpdateChoiceInModal(gIdx, cIdx, "label", e.target.value)}
                                  placeholder="e.g. Quarter Chicken (250g)"
                                  className="w-full px-2 py-1 bg-black border border-white/10 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                              </div>
                              <div className="col-span-5 flex items-center gap-1.5">
                                <span className="text-gold font-mono text-xs font-bold">R</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={displayVal}
                                  onChange={(e) => handleUpdateChoiceInModal(gIdx, cIdx, "rawPrice", e.target.value)}
                                  placeholder="0.00"
                                  className="w-28 px-2 py-1 bg-black border border-white/10 rounded text-xs font-mono font-bold text-gold focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                                {priceMod === 0 ? (
                                  <span className="text-[8.5px] text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                                    Base
                                  </span>
                                ) : priceMod >= baseP ? (
                                  <span className="text-[8.5px] text-gold font-mono font-bold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20 shrink-0">
                                    +R{priceMod.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-[8.5px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                    Add-on
                                  </span>
                                )}
                              </div>
                              <div className="col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChoiceFromModal(gIdx, cIdx)}
                                  className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleAddChoiceToModalGroup(gIdx)}
                          className="mt-1 px-3 py-1 bg-black hover:bg-zinc-800 text-gray-300 hover:text-white rounded border border-white/5 text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-gold" /> Add Choice
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddGroupToModal("New Variation Group")}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-dashed border-gold/30 hover:border-gold text-gold rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add New Variation Group
                  </button>
                </div>
              )}

              {/* MODE 2: FAST PIPE TEXT MODE */}
              {variationEditorState.activeMode === "text" && (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs text-gray-300 space-y-1">
                    <p className="font-bold text-gold">📝 Fast Pipe Text Format:</p>
                    <p className="text-[11px] text-gray-400">
                      Format: <code className="text-white font-mono bg-black px-1.5 py-0.5 rounded">Group Name | Choice 1 (Version Price), Choice 2 (Version Price)</code>
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      Portion Size | Quarter Chicken (R34.90), Half Chicken (R69.90), Full Chicken (R124.90)
                    </p>
                  </div>

                  <textarea
                    value={variationEditorState.textInput}
                    onChange={(e) => setVariationEditorState({ ...variationEditorState, textInput: e.target.value })}
                    rows={8}
                    className="w-full p-3 bg-black border border-white/10 rounded-xl font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="Portion Size | Quarter Chicken (R34.90), Half Chicken (R69.90), Full Chicken (R124.90)&#10;Side Option | Without Chips (R0.00), With Regular Chips (R19.90)"
                  />
                </div>
              )}

              {/* MODE 3: RAW JSON */}
              {variationEditorState.activeMode === "json" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-400">
                    Advanced Raw JSON Array Editor:
                  </p>
                  <textarea
                    value={variationEditorState.textInput}
                    onChange={(e) => setVariationEditorState({ ...variationEditorState, textInput: e.target.value })}
                    rows={10}
                    className="w-full p-3 bg-black border border-white/10 rounded-xl font-mono text-xs text-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-900 border-t border-white/10 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setVariationEditorState(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariationModal}
                className="px-5 py-2.5 bg-gold hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow font-black"
              >
                <Check className="w-4 h-4" /> Apply Variations To Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
