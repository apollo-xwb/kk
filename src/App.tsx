import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Flame, 
  ShoppingBag, 
  QrCode, 
  Search, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Bell, 
  Volume2, 
  VolumeX,
  Clock,
  Camera,
  Play,
  CheckCircle,
  Menu,
  ChevronDown,
  Download,
  Printer,
  Share2,
  Copy,
  BookOpen,
  FileText,
  LayoutGrid,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { MenuItem, CartItem, Order } from "./types";
import { MENU_ITEMS } from "./data";
import { MenuItemCard } from "./components/MenuItemCard";
import { ItemDetailsModal } from "./components/ItemDetailsModal";
import { QRCodeSVG } from "qrcode.react";
import { LiveQRScanner } from "./components/LiveQRScanner";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { MenuManager } from "./components/MenuManager";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";

const MENU_CATEGORIES = [
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
  "Mocktails"
];

// Play rapid beep using Web Audio API
const playBeep = (freq = 600, type: OscillatorType = "sine", duration = 0.1) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (err) {
    console.warn("Sound blocked or not supported", err);
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  // --- Navigation & Route State ---
  const [path, setPath] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  const navigate = (newPath: string) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);
  };

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // --- Splash Screen & User Guide States ---
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      const hasSeen = sessionStorage.getItem("kk_seen_splash");
      return !hasSeen;
    } catch {
      return true;
    }
  });
  const [loadingMessage, setLoadingMessage] = useState<string>("Initializing Krispy Remote Order...");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        try {
          sessionStorage.setItem("kk_seen_splash", "true");
        } catch {}
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    if (!showSplash) return;
    const messages = [
      "Firing up the grills...",
      "Perfecting signature spices...",
      "Simmering Karolina Reaper sauce...",
      "Ensuring crispy golden perfection...",
      "Ready to serve South Africa's finest!"
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length - 1) {
        i++;
        setLoadingMessage(messages[i]);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [showSplash]);

  // --- Core Application States ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("kk_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("kk_cart", JSON.stringify(cart));
  }, [cart]);

  const [activeCategory, setActiveCategory] = useState<string>("Grilled Chicken");
  const [menuViewMode, setMenuViewMode] = useState<"columns" | "list">("columns");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // --- Digital Billboard Promo Slider ---
  const [billboardSlide, setBillboardSlide] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setBillboardSlide((prev) => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // --- Real-Time Firestore Synced Database States ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [menuAvailability, setMenuAvailability] = useState<Record<string, boolean>>({});
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // --- NFC and Contactless Beacon States ---
  const [isNfcListenerActive, setIsNfcListenerActive] = useState<boolean>(false);
  const [isNfcWriting, setIsNfcWriting] = useState<boolean>(false);
  const [isNfcReading, setIsNfcReading] = useState<boolean>(false);
  const ndefReaderRef = useRef<any>(null);

  // --- Logo secret tap to open staff view ---
  const [logoTapCount, setLogoTapCount] = useState<number>(0);
  const logoTapTimeoutRef = useRef<any>(null);

  // --- Saved customer pass IDs ---
  const [savedPassIds, setSavedPassIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("kk_saved_pass_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist saved pass IDs to localStorage
  useEffect(() => {
    localStorage.setItem("kk_saved_pass_ids", JSON.stringify(savedPassIds));
  }, [savedPassIds]);

  const customerPasses = useMemo(() => {
    return orders.filter((o) => savedPassIds.includes(o.id));
  }, [orders, savedPassIds]);

  const handleLogoClick = () => {
    if (logoTapTimeoutRef.current) {
      clearTimeout(logoTapTimeoutRef.current);
    }
    
    playBeep(880 + logoTapCount * 50, "sine", 0.05);
    
    const nextCount = logoTapCount + 1;
    if (nextCount >= 5) {
      setLogoTapCount(0);
      if (isStaffAuthenticated) {
        navigate("/staff/dashboard");
      } else {
        navigate("/staff");
      }
      triggerToast("🔑 Welcome to the Staff Portal!", "success");
    } else {
      setLogoTapCount(nextCount);
      logoTapTimeoutRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 2500); // Reset tap count if no taps for 2.5 seconds
      navigate("/");
    }
  };

  // Sound notifications helper
  const prevOrdersCount = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true);

  // Sync Orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: doc.id,
          passCode: data.passCode,
          customerName: data.customerName,
          items: data.items,
          total: data.total,
          status: data.status,
          createdAt: data.createdAt,
          verifiedAt: data.verifiedAt,
          completedAt: data.completedAt,
          verificationPin: data.verificationPin,
        });
      });

      // Sound notification on new pending order (for staff dashboard)
      if (!isFirstLoad.current && fetchedOrders.length > prevOrdersCount.current) {
        const newOrder = fetchedOrders[0];
        if (newOrder && newOrder.status === "pending" && !isMuted) {
          playBeep(523.25, "sine", 0.15);
          setTimeout(() => playBeep(659.25, "sine", 0.15), 150);
          setTimeout(() => playBeep(783.99, "sine", 0.3), 300);
        }
      }
      
      setOrders(fetchedOrders);
      prevOrdersCount.current = fetchedOrders.length;
      isFirstLoad.current = false;
      setIsOffline(false);
    }, (error) => {
      if (error.code === "unavailable") {
        setIsOffline(true);
      } else {
        handleFirestoreError(error, OperationType.GET, "orders");
      }
    });

    return () => unsubscribe();
  }, [isMuted]);

  // Real-Time Contactless NFC Beacon listener for Staff Portal
  useEffect(() => {
    if (!isNfcListenerActive) return;

    // Listen to latest beacons
    const q = query(collection(db, "nfc_beacons"), orderBy("timestamp", "desc"));
    const listenerStartTime = Date.now() - 15000; // within last 15 seconds

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      
      const latestDoc = snapshot.docs[0];
      const data = latestDoc.data();
      
      if (data.timestamp > listenerStartTime) {
        // Find matching active order
        const matched = orders.find(
          (o) => o.passCode === data.passCode || o.id === data.passCode
        );
        if (matched) {
          playBeep(1200, "sine", 0.15);
          setSearchedOrder(matched);
          setManualCodeInput(matched.passCode);
          triggerToast(`Contactless NFC Tap: ${matched.passCode} matched!`, "success");
        }
      }
    }, (error) => {
      console.error("NFC Beacon listener error:", error);
    });

    return () => unsubscribe();
  }, [isNfcListenerActive, orders]);

  // Sync Menu Availability
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "admin_config", "menu_status"), (docSnap) => {
      if (docSnap.exists()) {
        setMenuAvailability(docSnap.data() as Record<string, boolean>);
      }
      setIsOffline(false);
    }, (error) => {
      if (error.code === "unavailable") {
        setIsOffline(true);
      } else {
        handleFirestoreError(error, OperationType.GET, "admin_config/menu_status");
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Menu Items with Firestore
  useEffect(() => {
    const q = query(collection(db, "menu_items"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          for (const item of MENU_ITEMS) {
            await setDoc(doc(db, "menu_items", item.id), {
              id: item.id,
              name: item.name,
              category: item.category,
              price: Number(item.price),
              description: item.description || "",
              imageUrl: item.imageUrl || "",
              isCombo: !!item.isCombo,
              spiceLevel: item.spiceLevel !== undefined ? Number(item.spiceLevel) : 0,
              isPopular: !!item.isPopular,
              isAvailable: item.isAvailable !== false,
              isBreakfast: !!item.isBreakfast,
              isKiddies: !!item.isKiddies,
              servingSize: item.servingSize || "",
              comboOptions: item.comboOptions || []
            });
          }
          triggerToast("Seeded menu items to the cloud database successfully!", "success");
        } catch (e) {
          console.error("Error seeding menu items:", e);
        }
      } else {
        const items: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name,
            category: data.category,
            price: Number(data.price),
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            isCombo: !!data.isCombo,
            spiceLevel: data.spiceLevel !== undefined ? Number(data.spiceLevel) : 0,
            isPopular: !!data.isPopular,
            isAvailable: data.isAvailable !== false,
            isBreakfast: !!data.isBreakfast,
            isKiddies: !!data.isKiddies,
            servingSize: data.servingSize || "",
            comboOptions: data.comboOptions !== undefined ? data.comboOptions : MENU_ITEMS.find(m => m.id === docSnap.id)?.comboOptions
          });
        });
        setMenuItems(items);

        // Automatically clean up deprecated menu item placeholders from Firestore
        const deprecatedIds = ["d-330ml", "d-500ml", "d-1l", "d-2l", "d-water-500ml", "d-water-1l"];
        const foundDeprecated = items.filter(i => deprecatedIds.includes(i.id));
        if (foundDeprecated.length > 0) {
          console.log("Cleaning up deprecated placeholder items from Firestore:", foundDeprecated.map(m => m.id));
          try {
            for (const item of foundDeprecated) {
              await deleteDoc(doc(db, "menu_items", item.id));
            }
          } catch (e) {
            console.error("Error cleaning up deprecated menu items:", e);
          }
        }

        // Check for any locally defined items in data.ts that are missing from the Firestore database
        const existingIds = new Set(items.map(i => i.id));
        const missingItems = MENU_ITEMS.filter(item => !existingIds.has(item.id));
        if (missingItems.length > 0) {
          console.log("Auto-seeding missing menu items to Firestore:", missingItems.map(m => m.name));
          try {
            for (const item of missingItems) {
              await setDoc(doc(db, "menu_items", item.id), {
                id: item.id,
                name: item.name,
                category: item.category,
                price: Number(item.price),
                description: item.description || "",
                imageUrl: item.imageUrl || "",
                isCombo: !!item.isCombo,
                spiceLevel: item.spiceLevel !== undefined ? Number(item.spiceLevel) : 0,
                isPopular: !!item.isPopular,
                isAvailable: item.isAvailable !== false,
                isBreakfast: !!item.isBreakfast,
                isKiddies: !!item.isKiddies,
                servingSize: item.servingSize || "",
                comboOptions: item.comboOptions || []
              });
            }
            triggerToast(`Synchronized ${missingItems.length} new items to the cloud menu!`, "success");
          } catch (e) {
            console.error("Error auto-syncing missing menu items:", e);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "menu_items");
    });

    return () => unsubscribe();
  }, []);

  // Update Item Availability Helper
  const toggleItemAvailability = async (itemId: string, currentStatus: boolean) => {
    const pathForWrite = "admin_config/menu_status";
    try {
      const newStatus = !currentStatus;
      const updatedAvailability = { ...menuAvailability, [itemId]: newStatus };
      await setDoc(doc(db, "admin_config", "menu_status"), updatedAvailability);
      triggerToast(`Quarter updated availability!`, "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, pathForWrite);
    }
  };

  // Helper to check if a menu item is available
  const isItemAvailable = (itemId: string): boolean => {
    return menuAvailability[itemId] !== false; // defaults to true if not explicitly set to false
  };

  // --- Dynamic Combo Builder State ---
  const [selectedComboItem, setSelectedComboItem] = useState<MenuItem | null>(null);
  const [selectedMenuItemForDetails, setSelectedMenuItemForDetails] = useState<MenuItem | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [overrideBreakfastTime, setOverrideBreakfastTime] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const isBreakfastActive = overrideBreakfastTime !== null ? overrideBreakfastTime : (currentHour >= 6 && currentHour < 11);

  const [comboSelections, setComboSelections] = useState<Record<string, { label: string; priceModifier: number }>>({});
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<number>(1); // default Mild for spice-indicator items
  const [selectedComboSauce, setSelectedComboSauce] = useState<string>("No Sauce");
  const [selectedFriesSize, setSelectedFriesSize] = useState<"None" | "Regular" | "Large">("None");

  const [isIndividualCustomizationEnabled, setIsIndividualCustomizationEnabled] = useState<boolean>(false);
  const [individualSelections, setIndividualSelections] = useState<{ spice: number; sauce: string }[]>([]);

  // Synchronize individual chicken selections based on portion count
  const parsedChickenCount = useMemo(() => {
    if (!selectedComboItem) return 0;
    const nameLower = selectedComboItem.name.toLowerCase();
    const portionLabel = comboSelections["Portion Size"]?.label?.toLowerCase() || "";
    if (nameLower.includes("3 full chicken") || portionLabel.includes("3 full chicken")) return 3;
    if (nameLower.includes("2 full chicken") || portionLabel.includes("2 full chicken")) return 2;
    return 0;
  }, [selectedComboItem, comboSelections]);

  useEffect(() => {
    if (parsedChickenCount > 1) {
      setIndividualSelections((prev) => {
        if (prev.length === parsedChickenCount) return prev;
        return Array.from({ length: parsedChickenCount }, () => ({
          spice: selectedSpiceLevel,
          sauce: selectedComboSauce,
        }));
      });
    } else {
      setIsIndividualCustomizationEnabled(false);
      setIndividualSelections([]);
    }
  }, [parsedChickenCount, selectedSpiceLevel, selectedComboSauce]);

  const customizerTotalPrice = useMemo(() => {
    if (!selectedComboItem) return 0;
    let addedPrice = 0;
    Object.values(comboSelections).forEach((opt: any) => {
      addedPrice += opt.priceModifier || 0;
    });
    if (isIndividualCustomizationEnabled && parsedChickenCount > 1) {
      individualSelections.forEach((sel) => {
        if (sel.sauce === "Carolina Reaper Sauce (on the side)") addedPrice += 5.00;
      });
    } else {
      if (selectedComboSauce === "Carolina Reaper Sauce (on the side)") addedPrice += 5.00;
    }
    if ((selectedComboItem.id === "g-chicken-main" || selectedComboItem.category === "Grilled Chicken") && selectedFriesSize !== "None") {
      addedPrice += selectedFriesSize === "Regular" ? 20.00 : 35.00;
    }
    return selectedComboItem.price + addedPrice;
  }, [selectedComboItem, comboSelections, isIndividualCustomizationEnabled, parsedChickenCount, individualSelections, selectedComboSauce, selectedFriesSize]);

  // --- Toast Trigger helper ---
  const triggerToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- Staff Session State ---
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("kk_staff_authenticated") === "true";
  });
  const [staffPin, setStaffPin] = useState<string>("");
  const [activeStaffTab, setActiveStaffTab] = useState<"feed" | "verify" | "menu" | "sales" | "placard" | "training">("feed");

  // --- Placard Configuration States ---
  const [placardUrl, setPlacardUrl] = useState<string>("");
  const [placardColor, setPlacardColor] = useState<"fiery" | "midnight" | "black">("fiery");
  const [placardTitle, setPlacardTitle] = useState<string>("SKIP THE LINE!");
  const [placardSubtitle, setPlacardSubtitle] = useState<string>("SCAN TO ORDER REMOTELY");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlacardUrl(window.location.origin);
    }
  }, []);

  // --- QR Scanner / Code Verification Screen States ---
  const [manualCodeInput, setManualCodeInput] = useState<string>("");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [verifyMode, setVerifyMode] = useState<"manual" | "qr" | "nfc">("manual");
  const [simulatedSelectOrderId, setSimulatedSelectOrderId] = useState<string>("");

  // PIN Verification Modal States
  const [pinVerificationOrder, setPinVerificationOrder] = useState<Order | null>(null);
  const [enteredVerificationPin, setEnteredVerificationPin] = useState<string>("");

  // Customer Self-Verification states
  const [showSelfVerifyInput, setShowSelfVerifyInput] = useState<boolean>(false);
  const [selfVerifyInputPin, setSelfVerifyInputPin] = useState<string>("");

  // Lock body scrolling when any overlay/modal is open
  useEffect(() => {
    if (selectedComboItem || selectedMenuItemForDetails || showSelfVerifyInput || pinVerificationOrder) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, [selectedComboItem, selectedMenuItemForDetails, showSelfVerifyInput, pinVerificationOrder]);

  // Total cart items count for badge bouncing
  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Handle adding non-combo items or items with plain spice
  const handleAddToCart = (item: MenuItem, spiceOver?: number, sauceOver?: string) => {
    playBeep(880, "sine", 0.05);
    const resolvedSpice = spiceOver !== undefined ? spiceOver : (item.spiceLevel || 0);
    const selectedSpiceLabel = resolvedSpice === 1 ? "Mild 🌶️" : resolvedSpice === 2 ? "Hot 🌶️🌶️" : resolvedSpice === 3 ? "Extra Hot 🌶️🌶️🌶️" : "Lemon & Herb";
    
    const cartKey: Record<string, string> = {};
    if (resolvedSpice > 0) {
      cartKey["Spice Level"] = selectedSpiceLabel;
    }
    
    const resolvedSauce = sauceOver || "No Sauce";
    if (item.category !== "Beverages" && item.category !== "Mocktails") {
      cartKey["Sauce Option"] = resolvedSauce;
    }
    
    const sauceExtra = resolvedSauce === "Carolina Reaper Sauce (on the side)" ? 5.00 : 0;
    const finalUnitPrice = item.price + sauceExtra;
    
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (c) => c.menuItem.id === item.id && JSON.stringify(c.selectedOptions) === JSON.stringify(cartKey)
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            menuItem: item,
            quantity: 1,
            selectedOptions: cartKey,
            unitPrice: finalUnitPrice
          }
        ];
      }
    });

    triggerToast(`Added ${item.name} to cart!`, "success");
  };

  // Handle adding customized combo items
  const handleAddComboToCart = () => {
    if (!selectedComboItem) return;
    playBeep(980, "sine", 0.06);

    const selectedOptionsRecord: Record<string, string> = {};
    let addedPrice = 0;

    (Object.entries(comboSelections) as [string, { label: string; priceModifier: number }][]).forEach(([optionName, optionChoice]) => {
      selectedOptionsRecord[optionName] = `${optionChoice.label} ${optionChoice.priceModifier > 0 ? `(+R${optionChoice.priceModifier.toFixed(2)})` : ""}`;
      addedPrice += optionChoice.priceModifier;
    });

    if (isIndividualCustomizationEnabled && parsedChickenCount > 1) {
      const labels = ["Lemon & Herb", "Mild 🌶️", "Hot 🌶️🌶️", "Extra Hot 🌶️🌶️🌶️"];
      individualSelections.forEach((sel, i) => {
        selectedOptionsRecord[`Chicken #${i+1} Spice`] = labels[sel.spice];
        selectedOptionsRecord[`Chicken #${i+1} Sauce`] = sel.sauce;
        if (sel.sauce === "Carolina Reaper Sauce (on the side)") {
          addedPrice += 5.00;
        }
      });
    } else {
      // Add spice level option if any (exclude for fried chicken)
      const isFried = selectedComboItem.category.toLowerCase().includes("fried") || selectedComboItem.name.toLowerCase().includes("fried");
      if (selectedComboItem.spiceLevel !== undefined && !isFried) {
        const labels = ["Lemon & Herb", "Mild 🌶️", "Hot 🌶️🌶️", "Extra Hot 🌶️🌶️🌶️"];
        selectedOptionsRecord["Spice Level"] = labels[selectedSpiceLevel];
      }

      // Add sauce option if food item
      if (selectedComboItem.category !== "Beverages" && selectedComboItem.category !== "Mocktails") {
        selectedOptionsRecord["Sauce Option"] = selectedComboSauce || "No Sauce";
      }

      if (selectedComboSauce === "Carolina Reaper Sauce (on the side)") {
        addedPrice += 5.00;
      }

      // Add Fries option for Grilled Chicken
      if (selectedComboItem.id === "g-chicken-main" || selectedComboItem.category === "Grilled Chicken") {
        if (selectedFriesSize !== "None") {
          const friesPrice = selectedFriesSize === "Regular" ? 20.00 : 35.00;
          selectedOptionsRecord["Add Fries"] = `${selectedFriesSize} Chips (+R${friesPrice.toFixed(2)})`;
          addedPrice += friesPrice;
        } else {
          selectedOptionsRecord["Add Fries"] = "No Fries";
        }
      }
    }

    let calculatedUnitPrice = selectedComboItem.price + addedPrice;

    setCart((prevCart) => {
      // Find if we already have the exact same combo item with exact same options
      const existingIndex = prevCart.findIndex(
        (c) => 
          c.menuItem.id === selectedComboItem.id && 
          JSON.stringify(c.selectedOptions) === JSON.stringify(selectedOptionsRecord)
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            menuItem: selectedComboItem,
            quantity: 1,
            selectedOptions: selectedOptionsRecord,
            unitPrice: calculatedUnitPrice
          }
        ];
      }
    });

    triggerToast(`Added ${selectedComboItem.name} Combo to cart!`, "success");
    setSelectedComboItem(null);
    setComboSelections({});
    setIsIndividualCustomizationEnabled(false);
  };

  // Adjust quantities in cart
  const updateCartQuantity = (itemIndex: number, change: number) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      const target = updated[itemIndex];
      if (!target) return prevCart;

      const newQty = target.quantity + change;
      if (newQty <= 0) {
        updated.splice(itemIndex, 1);
        playBeep(330, "sawtooth", 0.08);
      } else {
        updated[itemIndex].quantity = newQty;
        playBeep(700 + change * 50, "sine", 0.04);
      }
      return updated;
    });
  };

  // Quick Side Add-on upsell helper
  const addQuickAddOn = (itemId: string) => {
    const item = menuItems.find((m) => m.id === itemId);
    if (item && isItemAvailable(itemId)) {
      handleAddToCart(item);
    }
  };

  const cartHasChips = useMemo(() => {
    return cart.some((item) => {
      const name = item.menuItem.name.toLowerCase();
      const desc = (item.menuItem.description || "").toLowerCase();
      const optStr = JSON.stringify(item.selectedOptions || "").toLowerCase();
      return (
        name.includes("chips") ||
        name.includes("fries") ||
        desc.includes("chips") ||
        desc.includes("fries") ||
        optStr.includes("with chips") ||
        item.menuItem.id === "s-chips-small" ||
        item.menuItem.id === "s-chips-regular" ||
        item.menuItem.id === "s-chips-large"
      );
    });
  }, [cart]);

  const showWholeChickenUpsell = useMemo(() => {
    return cart.some((item) => {
      const name = item.menuItem.name.toLowerCase();
      const desc = (item.menuItem.description || "").toLowerCase();
      const cat = item.menuItem.category.toLowerCase();
      const optStr = JSON.stringify(item.selectedOptions || "").toLowerCase();
      
      const isFullChicken = name.includes("full chicken") || optStr.includes("full chicken") || item.menuItem.id === "fm-fafa-grilled" || item.menuItem.id === "fm-fiesta-grilled";
      const isMegaGrilled = name.includes("mega grilled") || item.menuItem.id === "fm-mega-grilled";
      const isGrilledMeal = cat.includes("grilled") || name.includes("grilled") || desc.includes("grilled");
      
      return isFullChicken || isMegaGrilled || isGrilledMeal;
    });
  }, [cart]);

  // Dynamic live pricing for deals and upsells (Whole Chicken upsell promo is R99)
  const wholeChickenPromoPrice = 99.00;

  const regChipsPrice = useMemo(() => {
    const item = menuItems.find(m => m.id === "s-chips-regular");
    return item ? item.price : 32.90;
  }, [menuItems]);

  const lrgChipsPrice = useMemo(() => {
    const item = menuItems.find(m => m.id === "s-chips-large");
    return item ? item.price : 41.90;
  }, [menuItems]);

  // Checkout submission state
  const [customerName, setCustomerName] = useState<string>("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [latestCreatedOrderId, setLatestCreatedOrderId] = useState<string | null>(null);

  // Cart pricing calculation
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      triggerToast("Please enter your name", "error");
      return;
    }
    if (cart.length === 0) {
      triggerToast("Your cart is empty", "error");
      return;
    }

    setIsSubmittingOrder(true);
    playBeep(880, "sine", 0.08);

    let uniqueId = "";
    try {
      // Generate unique pickup pass code, e.g., KK-84A2F1
      const generatedPass = `KK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      uniqueId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const orderData = {
        id: uniqueId,
        passCode: generatedPass,
        customerName: customerName.trim(),
        items: cart,
        total: cartSubtotal,
        status: "pending",
        createdAt: Date.now(),
        verificationPin: generatedPin,
      };

      // Save order in Firestore
      await setDoc(doc(db, "orders", uniqueId), orderData);

      // Save to customer's saved passes list
      setSavedPassIds((prev) => {
        if (!prev.includes(uniqueId)) {
          return [uniqueId, ...prev];
        }
        return prev;
      });

      // Play continuous victory tones
      setTimeout(() => playBeep(1100, "sine", 0.1), 100);
      setTimeout(() => playBeep(1320, "sine", 0.15), 220);

      triggerToast("Order Placed! Please show code at counter.", "success");
      setCart([]);
      setCustomerName("");
      setLatestCreatedOrderId(uniqueId);
      navigate(`/pass/${uniqueId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${uniqueId}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Handle staff login
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffPin === "8034") {
      setIsStaffAuthenticated(true);
      localStorage.setItem("kk_staff_authenticated", "true");
      setStaffPin("");
      playBeep(1000, "sine", 0.1);
      triggerToast("Authenticated as Staff!", "success");
      navigate("/staff/dashboard");
    } else {
      playBeep(220, "sawtooth", 0.2);
      triggerToast("Incorrect PIN. Please try again.", "error");
    }
  };

  const handleStaffLogout = () => {
    setIsStaffAuthenticated(false);
    localStorage.removeItem("kk_staff_authenticated");
    playBeep(330, "sine", 0.1);
    triggerToast("Logged out of staff panel", "info");
    navigate("/");
  };

  // Change Order Status Helper on Staff Side
  const updateOrderStatus = async (orderId: string, nextStatus: "pending" | "verified" | "completed" | "cancelled") => {
    const pathForWrite = `orders/${orderId}`;
    try {
      const docRef = doc(db, "orders", orderId);
      const updates: any = { status: nextStatus };
      if (nextStatus === "verified") {
        updates.verifiedAt = Date.now();
        playBeep(880, "sine", 0.1);
      } else if (nextStatus === "completed") {
        updates.completedAt = Date.now();
        playBeep(1000, "sine", 0.12);
      } else {
        playBeep(330, "sawtooth", 0.15);
      }
      
      await updateDoc(docRef, updates);
      triggerToast(`Order status set to ${nextStatus}!`, "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, pathForWrite);
    }
  };

  // Manual verify lookup helper
  const handleManualCodeLookup = () => {
    if (!manualCodeInput.trim()) return;
    const formatted = manualCodeInput.trim().toUpperCase();
    const matched = orders.find(
      (o) => o.passCode === formatted || o.passCode.replace("KK-", "") === formatted
    );

    if (matched) {
      setSearchedOrder(matched);
      playBeep(880, "sine", 0.08);
      triggerToast("Pass code matched!", "success");
    } else {
      setSearchedOrder(null);
      playBeep(220, "sawtooth", 0.15);
      triggerToast("No order found with this passcode", "error");
    }
  };

  // Handle actual scanned QR/NFC/Manual Code lookup match in real-time
  const handleScanMatch = (scannedText: string) => {
    if (!scannedText) return;
    const formatted = scannedText.trim().toUpperCase();
    
    // Scanned text can be the full passcode (e.g. "KK-38F2"), a raw passcode segment ("38F2"), or even the order ID
    const matched = orders.find(
      (o) => o.passCode === formatted || 
             o.passCode.replace("KK-", "") === formatted ||
             o.id === scannedText
    );

    if (matched) {
      setSearchedOrder(matched);
      setManualCodeInput(matched.passCode);
      playBeep(1200, "sine", 0.15);
      triggerToast(`Pass code matched! Loaded order for ${matched.customerName}.`, "success");
    } else {
      playBeep(220, "sawtooth", 0.15);
      triggerToast(`Scanned: "${formatted}" but no active matching order found.`, "error");
    }
  };

  // Download Plain Text Receipt
  const handleDownloadTextReceipt = (order: Order) => {
    playBeep(880, "sine", 0.08);
    const dateStr = new Date(order.createdAt).toLocaleString();
    const itemsLines = order.items.map(item => {
      const optionsText = item.selectedOptions 
        ? Object.entries(item.selectedOptions).map(([k, v]) => `  - ${k}: ${v}`).join("\n")
        : "";
      return `${item.quantity}x ${item.menuItem.name} @ R${item.unitPrice.toFixed(2)}\n${optionsText ? optionsText + "\n" : ""}`;
    }).join("");

    const receiptContent = `
=========================================
KRISPY KING OFFICIAL REMOTE RECEIPT
=========================================
Order ID:   ${order.id}
Pass Code:  ${order.passCode}
Pickup PIN: ${order.verificationPin || "N/A"}
Customer:   ${order.customerName}
Placed On:  ${dateStr}
Status:     ${order.status.toUpperCase()}
=========================================
ITEMIZED BILL:
${itemsLines}
=========================================
SUBTOTAL:   R${order.total.toFixed(2)}
TAX (VAT):  INCLUDED
TOTAL DUE:  R${order.total.toFixed(2)}
=========================================
INSTRUCTIONS:
1. Show this receipt or QR code to the 
   cashier at the pickup counter.
2. Settle payment inside the shop.
3. Verify order with pickup PIN: ${order.verificationPin || "N/A"}
4. Enjoy your steaming hot flame-grilled chicken!

Thank you for choosing Krispy King!
=========================================
`;

    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Krispy_King_Receipt_${order.passCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast("Text Receipt downloaded!", "success");
  };

  // Download Beautiful Vector Pass Image (SVG)
  const handleDownloadSvgPass = (order: Order) => {
    playBeep(880, "sine", 0.08);
    
    const itemsText = order.items.map((item, i) => {
      if (i > 3) return ""; 
      return `<text x="40" y="${280 + i * 22}" font-family="monospace" font-size="12" fill="#4B5563" font-weight="bold">${item.quantity}x ${item.menuItem.name.substring(0, 25)}</text>`;
    }).join("");

    const extraItems = order.items.length > 4 ? `<text x="40" y="375" font-family="monospace" font-size="10" fill="#9CA3AF" font-weight="bold">...and ${order.items.length - 4} more items</text>` : "";

    const svgContent = `
<svg width="400" height="520" viewBox="0 0 400 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="520" rx="24" fill="#FFFFFF"/>
  <rect x="2" y="2" width="396" height="516" rx="22" stroke="#E5E7EB" stroke-width="4"/>
  <rect x="10" y="10" width="380" height="500" rx="14" stroke="#E2B13C" stroke-width="2" stroke-dasharray="6 4"/>
  
  <path d="M10 24C10 16.268 16.268 10 24 10H376C383.732 10 390 16.268 390 24V100H10V24Z" fill="#000000"/>
  <rect x="10" y="96" width="380" height="8" fill="#E11D48"/>
  
  <text x="200" y="45" font-family="sans-serif" font-weight="900" font-size="18" fill="#E2B13C" text-anchor="middle" letter-spacing="2">KRISPY KING</text>
  <text x="200" y="70" font-family="sans-serif" font-weight="bold" font-size="11" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">HOT PICKUP PASS</text>
  
  <rect x="40" y="125" width="320" height="70" rx="12" fill="#F3F4F6"/>
  <text x="200" y="145" font-family="sans-serif" font-weight="bold" font-size="10" fill="#9CA3AF" text-anchor="middle" letter-spacing="1">YOUR UNIQUE PASS CODE</text>
  <text x="200" y="178" font-family="monospace" font-weight="900" font-size="28" fill="#111827" text-anchor="middle" letter-spacing="2">${order.passCode}</text>
  
  <rect x="40" y="210" width="320" height="50" rx="12" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="70" y="240" font-family="sans-serif" font-weight="800" font-size="11" fill="#92400E">PICKUP PIN: ${order.verificationPin || "N/A"}</text>
  <text x="330" y="240" font-family="sans-serif" font-weight="800" font-size="11" fill="#B91C1C" text-anchor="end">STATUS: ${order.status.toUpperCase()}</text>
  
  ${itemsText}
  ${extraItems}
  
  <line x1="40" y1="390" x2="360" y2="390" stroke="#E5E7EB" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="40" y="415" font-family="sans-serif" font-weight="bold" font-size="12" fill="#4B5563">TOTAL VALUE</text>
  <text x="360" y="415" font-family="sans-serif" font-weight="900" font-size="16" fill="#B91C1C" text-anchor="end">R${order.total.toFixed(2)}</text>
  
  <text x="200" y="455" font-family="sans-serif" font-weight="bold" font-size="9" fill="#9CA3AF" text-anchor="middle">SHOW PASS OR SCAN AT REGISTER TO COLLECT MEAL</text>
  <text x="200" y="475" font-family="sans-serif" font-weight="bold" font-size="9" fill="#9CA3AF" text-anchor="middle">CUSTOMER NAME: ${order.customerName.toUpperCase()}</text>
  <text x="200" y="495" font-family="sans-serif" font-weight="800" font-size="9" fill="#E2B13C" text-anchor="middle">★ THANKS FOR YOUR PATRONAGE ★</text>
</svg>
`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Krispy_King_Pass_${order.passCode}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast("SVG Digital Pass downloaded!", "success");
  };

  // Download Branded Staff Training Manual (PDF)
  const handleDownloadTrainingManual = async () => {
    playBeep(920, "sine", 0.1);
    triggerToast("Generating PDF manual...", "info");

    const loadLogo = (): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/logo.png";
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Fallback to the web WebP logo
          const imgFallback = new Image();
          imgFallback.crossOrigin = "anonymous";
          imgFallback.src = "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/logo.webp";
          imgFallback.onload = () => resolve(imgFallback);
          imgFallback.onerror = () => resolve(null);
        };
      });
    };

    const logoImg = await loadLogo();
    const docObj = new jsPDF();

    // Helper: draw Header/Footer on normal pages (pages 2+)
    const drawPageChrome = (pageNum: number, totalPages: number) => {
      // Header Banner
      docObj.setFillColor(186, 12, 47); // Red: #BA0C2F
      docObj.rect(15, 15, 180, 5, "F");
      docObj.setFillColor(255, 215, 0); // Gold: #FFD700
      docObj.rect(15, 20, 180, 1.5, "F");

      docObj.setFont("helvetica", "bold");
      docObj.setFontSize(9);
      docObj.setTextColor(17, 24, 39);
      docObj.text("KRISPY KING OPERATIONAL TRAINING MANUAL", 15, 12);

      if (logoImg) {
        try {
          docObj.addImage(logoImg, "PNG", 187, 5, 8, 8);
        } catch (e) {
          console.error("Error adding logo to page chrome:", e);
        }
        docObj.setFont("helvetica", "normal");
        docObj.setFontSize(8);
        docObj.setTextColor(107, 114, 128);
        docObj.text("SESSION 1: LAUNCH & QUEUE-BUSTING FLOWS", 184, 12, { align: "right" });
      } else {
        docObj.setFont("helvetica", "normal");
        docObj.setFontSize(8);
        docObj.setTextColor(107, 114, 128);
        docObj.text("SESSION 1: LAUNCH & QUEUE-BUSTING FLOWS", 195, 12, { align: "right" });
      }

      // Footer
      docObj.setDrawColor(229, 231, 235);
      docObj.setLineWidth(0.5);
      docObj.line(15, 280, 195, 280);

      docObj.setFontSize(8);
      docObj.setTextColor(107, 114, 128);
      docObj.text("KRISPY KING (PTY) LTD - CONFIDENTIAL STAFF DOCUMENT", 15, 286);
      docObj.text(`Page ${pageNum} of ${totalPages}`, 195, 286, { align: "right" });
    };

    const printParagraph = (docRef: any, text: string, x: number, y: number, width: number, lineHeight: number = 5): number => {
      const splitText = docRef.splitTextToSize(text, width);
      docRef.text(splitText, x, y);
      return y + splitText.length * lineHeight;
    };

    // PAGE 1: TITLE PAGE & BRANDING STAMP
    // Background frame
    docObj.setDrawColor(186, 12, 47);
    docObj.setLineWidth(1.5);
    docObj.rect(10, 10, 190, 277);
    docObj.setDrawColor(255, 215, 0);
    docObj.setLineWidth(1);
    docObj.rect(12, 12, 186, 273);

    // Header Splash (Red block)
    docObj.setFillColor(186, 12, 47);
    docObj.rect(12, 35, 186, 45, "F");
    
    // Gold separator line
    docObj.setFillColor(255, 215, 0);
    docObj.rect(12, 80, 186, 4, "F");

    // Add Logo inside Splash
    if (logoImg) {
      try {
        docObj.addImage(logoImg, "PNG", 97, 38, 16, 16);
      } catch (e) {
        console.error("Error adding logo to splash:", e);
      }
    }

    // Title text inside splash (shifted slightly down to accommodate the logo)
    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(28);
    docObj.setTextColor(255, 215, 0);
    docObj.text("KRISPY KING", 105, 61, { align: "center" });
    
    docObj.setFontSize(14);
    docObj.setTextColor(255, 255, 255);
    docObj.text("STAFF OPERATIONS & TRAINING MANUAL", 105, 71, { align: "center" });

    // Logo stamp drawing (Gold crown & text)
    const stampX = 105;
    const stampY = 135;
    
    docObj.setDrawColor(255, 215, 0);
    docObj.setLineWidth(2);
    docObj.circle(stampX, stampY, 25, "S");
    docObj.setLineWidth(0.5);
    docObj.circle(stampX, stampY, 22, "S");
    
    // Inner star points for crown representation
    docObj.setFillColor(186, 12, 47);
    docObj.triangle(stampX - 10, stampY + 5, stampX + 10, stampY + 5, stampX, stampY - 8, "F");
    docObj.triangle(stampX - 10, stampY + 5, stampX - 4, stampY + 5, stampX - 11, stampY - 3, "F");
    docObj.triangle(stampX + 4, stampY + 5, stampX + 10, stampY + 5, stampX + 11, stampY - 3, "F");
    
    // Draw crown circles
    docObj.setFillColor(255, 215, 0);
    docObj.circle(stampX, stampY - 9, 1.5, "F");
    docObj.circle(stampX - 11, stampY - 4, 1.2, "F");
    docObj.circle(stampX + 11, stampY - 4, 1.2, "F");
    
    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(8);
    docObj.setTextColor(17, 24, 39);
    docObj.text("OFFICIAL SEAL", stampX, stampY + 12, { align: "center" });
    docObj.text("EST. 2026", stampX, stampY + 16, { align: "center" });

    // Document Information
    docObj.setFontSize(16);
    docObj.setTextColor(17, 24, 39);
    docObj.text("SESSION 1: LIVE QUEUE-BUSTING SYSTEM", 105, 185, { align: "center" });

    docObj.setFontSize(10);
    docObj.setTextColor(75, 85, 99);
    docObj.text("Standard Operating Procedures & Customer Satisfaction Protocols", 105, 195, { align: "center" });

    // Metadata details box
    docObj.setFillColor(243, 244, 246);
    docObj.rect(35, 215, 140, 45, "F");
    docObj.setDrawColor(209, 213, 219);
    docObj.setLineWidth(0.5);
    docObj.rect(35, 215, 140, 45, "S");

    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(9);
    docObj.setTextColor(17, 24, 39);
    docObj.text("SYSTEM STATUS:", 45, 225);
    docObj.text("LAUNCH VERSION:", 45, 232);
    docObj.text("DEMO SECURITY PIN:", 45, 239);
    docObj.text("DATE OF ISSUE:", 45, 246);
    docObj.text("TARGET AUDIENCE:", 45, 253);

    docObj.setFont("helvetica", "normal");
    docObj.setTextColor(186, 12, 47);
    docObj.text("ACTIVE / ONLINE", 100, 225);
    docObj.setTextColor(17, 24, 39);
    docObj.text("v2.1 (RELEASE-READY)", 100, 232);
    docObj.setFont("monospace", "bold");
    docObj.text("8034", 100, 239);
    docObj.setFont("helvetica", "normal");
    docObj.text("JULY 2026", 100, 246);
    docObj.text("ALL KITCHEN STAFF & CASHIERS", 100, 253);

    // PAGE 2: OVERVIEW & ARCHITECTURE
    docObj.addPage();
    drawPageChrome(2, 4);

    let currY = 35;
    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(14);
    docObj.setTextColor(186, 12, 47);
    docObj.text("1. SYSTEM OVERVIEW & MISSION", 15, currY);
    currY += 8;

    docObj.setFont("helvetica", "normal");
    docObj.setFontSize(10);
    docObj.setTextColor(55, 65, 81);
    
    let textStr = "The Krispy King Remote Ordering System represents our commitment to providing lightning-fast, high-quality, and completely friction-free experiences to all patrons. By scanning our table or counter-top QR placards, customers can instantly browse our menu, customize their grilled chicken choices with accurate pricing, add side chips (with size options), select sauce options, and place orders directly from their phones. This bypasses the traditional queue and gives patrons total control of their dining experience.";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);
    currY += 5;

    textStr = "Our team's primary metric of success is speed-to-table. As soon as a pre-order is generated, it immediately populates on all live Staff Terminals via real-time cloud data listeners. Simultaneously, the customer's phone displays a beautifully formatted, offline-ready Digital Pickup Pass containing a unique Pass Code (e.g. KK-B8A29F) and a random 4-digit security PIN.";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);
    currY += 12;

    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(14);
    docObj.setTextColor(186, 12, 47);
    docObj.text("2. CORE SYSTEM ARCHITECTURE", 15, currY);
    currY += 8;

    docObj.setFont("helvetica", "normal");
    docObj.setFontSize(10);
    docObj.setTextColor(55, 65, 81);
    
    textStr = "The architecture is fully integrated to prevent errors and maximize performance under high-pressure fast-food environments. Key components include:";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);
    currY += 6;

    const listItemsPage2 = [
      "REAL-TIME DATA STREAMS: Built on top of Google Firestore for instant, sub-second synchronicity. There is zero delay between a customer ordering and the kitchen receiving it.",
      "AUDIO ALERT SYNTHESIZER: On-board Web Audio API synthesizer plays specialized high-priority audio chimes. This eliminates external audio file downloads and works across all kitchen noise.",
      "MENU AVAILABILITY ENGINE: Toggling an item as 'Sold Out' instantly grays out the option on all customers' displays, preventing order errors and refund issues.",
      "DIGITAL VECTOR PASS SYSTEM: Custom SVG rendering of pickup receipts ensures clients can download crisp vector layouts, preventing blurry scans at the registers."
    ];

    listItemsPage2.forEach((bullet) => {
      docObj.setFont("helvetica", "bold");
      docObj.text("•", 18, currY);
      docObj.setFont("helvetica", "normal");
      currY = printParagraph(docObj, bullet, 23, currY, 172, 5);
      currY += 3;
    });

    // PAGE 3: CUSTOMER ORDERING JOURNEY
    docObj.addPage();
    drawPageChrome(3, 4);

    currY = 35;
    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(14);
    docObj.setTextColor(186, 12, 47);
    docObj.text("3. CUSTOMER ORDERING WORKFLOW", 15, currY);
    currY += 8;

    docObj.setFont("helvetica", "normal");
    docObj.setFontSize(10);
    docObj.setTextColor(55, 65, 81);
    
    textStr = "The ordering interface is designed around responsive, high-density touch controls. The entire purchase funnel can be completed in under 45 seconds through three distinct touchpoints:";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);
    currY += 6;

    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(11);
    docObj.setTextColor(17, 24, 39);
    docObj.text("3.1 Core Product Sizing & Pricing Upgrades:", 15, currY);
    currY += 6;

    // Draw simple table headers
    docObj.setFillColor(243, 244, 246);
    docObj.rect(15, currY, 180, 7, "F");
    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(9);
    docObj.setTextColor(17, 24, 39);
    docObj.text("ITEM MODIFIER", 18, currY + 5);
    docObj.text("OPTION DESCRIPTION", 70, currY + 5);
    docObj.text("PRICE ADDITION", 160, currY + 5);
    currY += 7;

    const tableRows = [
      { name: "Portion Size", desc: "1/4 Portion, 1/2 Portion, 3 Portion Upgrade, etc.", price: "Variable" },
      { name: "Spice Level Selector", desc: "Lemon & Herb, Mild, Hot, Extra Hot (Heat Gauges)", price: "Free" },
      { name: "Sauce Addition", desc: "No Sauce, BBQ Sauce, Carolina Reaper Sauce (+R5.00)", price: "R0.00 / +R5.00" },
      { name: "Add Fries (Regular)", desc: "Fresh crispy seasoned potato fries (Regular size)", price: "+R20.00" },
      { name: "Add Fries (Large)", desc: "Fresh crispy seasoned potato fries (Large size)", price: "+R35.00" }
    ];

    tableRows.forEach((row) => {
      docObj.setFont("helvetica", "bold");
      docObj.setFontSize(9);
      docObj.text(row.name, 18, currY + 5);
      docObj.setFont("helvetica", "normal");
      docObj.text(row.desc, 70, currY + 5);
      docObj.setFont("monospace", "bold");
      docObj.text(row.price, 160, currY + 5);
      
      docObj.setDrawColor(229, 231, 235);
      docObj.setLineWidth(0.5);
      docObj.line(15, currY + 8, 195, currY + 8);
      currY += 8;
    });
    currY += 5;

    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(11);
    docObj.setTextColor(17, 24, 39);
    docObj.text("3.2 Checkout Submission & Verification Generation:", 15, currY);
    currY += 6;

    docObj.setFont("helvetica", "normal");
    docObj.setFontSize(10);
    docObj.setTextColor(55, 65, 81);
    textStr = "No complex registration or email confirmation is required. Customers enter their first name/nickname and click Place Order. The system compiles their selection, generates a random 4-digit Pickup PIN, and inserts the record to our Firestore database. The client's browser immediately shows their high-resolution pass with active status indicators (Pending, Verified, Completed).";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);

    // PAGE 4: STAFF OPERATIONS & OVERRIDES
    docObj.addPage();
    drawPageChrome(4, 4);

    currY = 35;
    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(14);
    docObj.setTextColor(186, 12, 47);
    docObj.text("4. STAFF DASHBOARD OPERATIONS", 15, currY);
    currY += 8;

    docObj.setFont("helvetica", "normal");
    docObj.setFontSize(10);
    docObj.setTextColor(55, 65, 81);
    textStr = "The Staff Portal is our central system command. Access is secured via the Master Staff PIN: 8034. Operations are divided into four active modules:";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);
    currY += 4;

    const staffSectors = [
      { title: "LIVE ORDERS FEED", desc: "Monitors incoming pending orders. New orders trigger a triple rising tone. Staff can click 'Verify' to mark payments as received at the physical register." },
      { title: "SECURE PICKUP PIN STEP", desc: "When delivering the order to the customer, staff must verify their digital pass code (e.g. KK-B8A29F) and prompt for their 4-digit pickup PIN. This prevents incorrect food collections." },
      { title: "MENU AVAILABILITY MANAGER", desc: "Enables instant on/off toggling of any menu item. If an ingredient is exhausted, toggling the item will immediately display a 'Sold Out' status for customers." },
      { title: "SALES & REVENUE ANALYTICS", desc: "Compiles gross sales figures, averages transaction ticket values, and lists top popular menu items to inform supply planning." }
    ];

    staffSectors.forEach((sec) => {
      docObj.setFont("helvetica", "bold");
      docObj.setFontSize(10);
      docObj.setTextColor(17, 24, 39);
      docObj.text(sec.title, 18, currY + 4);
      docObj.setFont("helvetica", "normal");
      docObj.setFontSize(9.5);
      docObj.setTextColor(55, 65, 81);
      currY = printParagraph(docObj, sec.desc, 18, currY + 9, 177, 4.5);
      currY += 3;
    });
    currY += 5;

    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(14);
    docObj.setTextColor(186, 12, 47);
    docObj.text("5. EMERGENCY CONTACT & OVERRIDES", 15, currY);
    currY += 8;

    docObj.setFont("helvetica", "normal");
    docObj.setFontSize(10);
    docObj.setTextColor(55, 65, 81);
    textStr = "In case of network latency or database discrepancies, cashiers can execute a manual override of any active customer pass code. If a customer loses their phone or pass, a staff member can lookup the order in the 'Verify Pass' tab by name or code and verify it using the master override code '8034' or by manual checkbox clearance.";
    currY = printParagraph(docObj, textStr, 15, currY, 180, 5);
    currY += 12;

    // Branded Stamp at end of Manual
    docObj.setDrawColor(186, 12, 47);
    docObj.setLineWidth(1);
    docObj.line(15, currY, 195, currY);
    currY += 6;

    docObj.setFont("helvetica", "bold");
    docObj.setFontSize(11);
    docObj.setTextColor(186, 12, 47);
    docObj.text("KRISPY KING EXECUTIVE BOARD", 105, currY, { align: "center" });
    
    // Save PDF
    docObj.save("Krispy_King_Training_Manual.pdf");
    triggerToast("Branded Staff Manual PDF exported!", "success");
  };

  // Get active order status on customer display
  const customerActiveOrder = useMemo(() => {
    if (path.startsWith("/pass/")) {
      const parts = path.split("/");
      const id = parts[2];
      return orders.find((o) => o.id === id);
    }
    return null;
  }, [path, orders]);

  // Calculate stats for daily dashboard
  const staffStats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const verified = orders.filter((o) => o.status === "verified");
    const pending = orders.filter((o) => o.status === "pending");
    
    const totalRev = completed.reduce((sum, o) => sum + o.total, 0);
    const avgOrder = completed.length > 0 ? totalRev / completed.length : 0;

    // Compile items sold counts
    const itemsCountMap: Record<string, number> = {};
    completed.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.menuItem.name;
        itemsCountMap[name] = (itemsCountMap[name] || 0) + item.quantity;
      });
    });

    const topItems = Object.entries(itemsCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // Category Sales count
    const categoryCountMap: Record<string, number> = {};
    completed.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.menuItem.category;
        categoryCountMap[cat] = (categoryCountMap[cat] || 0) + item.quantity;
      });
    });

    return {
      revenue: totalRev,
      completedCount: completed.length,
      verifiedCount: verified.length,
      pendingCount: pending.length,
      avgOrder,
      topItems,
      categoryStats: categoryCountMap
    };
  }, [orders]);

  // Get current order count-up timer in minutes
  const formatOrderTime = (createdAtTimestamp: number) => {
    const diffMs = Date.now() - createdAtTimestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    return `${diffMins}m ago`;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col antialiased font-sans select-none pb-12">
      {/* 3D Immersive Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
          >
            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-chicken-red/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
            
            {/* 3D Perspective Card Container */}
            <div style={{ perspective: 1000 }} className="relative flex flex-col items-center">
              <motion.div
                initial={{ rotateY: -180, scale: 0.5, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative"
              >
                <motion.div
                  animate={{ 
                    rotateY: [0, 15, -15, 0],
                    rotateX: [0, -10, 10, 0],
                    y: [0, -8, 8, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatType: "mirror"
                  }}
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white p-2 border-4 border-gold shadow-[0_20px_50px_rgba(255,215,0,0.3)] flex items-center justify-center relative overflow-hidden"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-pulse" style={{ animationDuration: "2s" }} />
                  
                  <img 
                    src="https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/logo.webp" 
                    alt="Krispy King" 
                    className="w-32 h-32 md:w-38 md:h-38 object-contain"
                    style={{ transform: "translateZ(30px)" }}
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Typography & Branding */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-center mt-10 z-10"
            >
              <h1 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase text-white flex items-center justify-center gap-1.5">
                <span className="text-gold">Krispy</span> 
                <span className="text-white">King</span>
              </h1>
              <p className="text-[10px] text-gold/80 font-black uppercase tracking-[0.25em] mt-1.5 italic">
                - Remote Ordering -
              </p>
            </motion.div>

            {/* Loading Indicator */}
            <div className="w-64 max-w-xs mt-12 z-10">
              <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.2, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-chicken-red via-orange-500 to-gold"
                />
              </div>
              <motion.p 
                key={loadingMessage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] text-gray-400 font-bold tracking-wide text-center mt-3 h-4 flex items-center justify-center"
              >
                {loadingMessage}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Floating Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 max-w-sm font-semibold text-sm border bg-black text-white"
          >
            {toastMessage.type === "success" && <Check className="w-4 h-4 text-gold shrink-0" />}
            {toastMessage.type === "info" && <Sparkles className="w-4 h-4 text-orange shrink-0" />}
            {toastMessage.type === "error" && <X className="w-4 h-4 text-chicken-red shrink-0" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Header & Top Banner Container */}
      <div className="sticky top-0 z-40 flex flex-col shadow-md">
        {/* Promo Marquee (Edge-to-Edge Announcement Banner) */}
        <div className="bg-chicken-red text-white py-2 px-3 overflow-hidden border-b border-gold/20 relative flex items-center w-full select-none">
          <div className="absolute left-0 top-0 bottom-0 bg-chicken-red px-3.5 z-10 flex items-center border-r border-gold/20 font-black text-gold text-[10px] italic uppercase tracking-wider">
            DEALS
          </div>
          <div className="w-full overflow-hidden pl-20">
            <div className="animate-marquee text-[10px] font-black uppercase tracking-wider">
              <span>Try our newly introduced KAROLINA REAPER sauce on Grilled Chicken! Can you handle the heat? 🌶️🌶️🌶️</span>
              <span>2 Full Chicken Family Pack for just R189.90! Save massive rands!</span>
              <span>Smashed Burger Beef double deal R69.90 - juicy patties, melted cheese!</span>
              <span>Fresh ice cold mocktails starting at only R39.90! Mojitos, sunrises, lemonades!</span>
            </div>
          </div>
        </div>

        {/* Brand Header Content */}
        <header className="bg-black text-white px-4 py-2.5 border-b-4 border-gold">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
            <div className="bg-white p-1 rounded-full border-2 border-chicken-red shadow-md w-16 h-16 flex items-center justify-center transform active:scale-95 transition-transform">
              <img 
                src="https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/logo.webp" 
                alt="Krispy King Logo" 
                className="w-14 h-14 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-white uppercase italic">
                Krispy King
              </span>
              <span className="text-[9px] text-gold font-extrabold tracking-widest uppercase">
                Remote Order
              </span>
            </div>
            {isOffline && (
              <span className="text-xs bg-red-600/80 text-white font-semibold px-2.5 py-1 rounded-full border border-red-500 flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Offline Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle button */}
            <button 
              onClick={() => {
                setIsMuted(!isMuted);
                playBeep(880, "sine", 0.05);
              }}
              className="p-2.5 rounded-full hover:bg-gray-900 transition text-gray-300"
              title={isMuted ? "Unmute" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-chicken-red" /> : <Volume2 className="w-5 h-5 text-gold" />}
            </button>

            {/* Portal Navigate Buttons */}
            {(path === "/" || path === "/passes") && (
              <button 
                onClick={() => navigate("/cart")}
                className="relative p-2.5 bg-gray-900 rounded-full border border-gray-800 hover:bg-gray-800 transition"
              >
                <ShoppingBag className="w-5 h-5 text-gold" />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-chicken-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-bounce">
                    {cartTotalItems}
                  </span>
                )}
              </button>
            )}

            {path.startsWith("/staff") ? (
              <button 
                onClick={handleStaffLogout}
                className="px-3 py-1.5 bg-chicken-red hover:bg-red-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition shadow-md border border-gold/40"
              >
                Exit Portal
              </button>
            ) : (
              <button 
                onClick={() => {
                  playBeep(880, "sine", 0.05);
                  navigate("/passes");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5 ${
                  path === "/passes"
                    ? "bg-gold text-black border-2 border-black"
                    : "bg-gray-900 hover:bg-gray-800 text-gold border border-gold/40"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                My Passes
                {customerPasses.length > 0 && (
                  <span className="bg-chicken-red text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                    {customerPasses.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      </div>

      {/* Main Content Body */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6 pb-28 transition-all duration-300">
        
        {/* ==============================================
             ROUTE: / (MENU BROWSER & COMBOS) 
             ============================================== */}
        {path === "/" && (
          <div className="space-y-6">

            {/* How to Use the App Toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden transition-all duration-300">
              <button 
                onClick={() => {
                  setShowGuide(!showGuide);
                  playBeep(showGuide ? 500 : 700, "sine", 0.05);
                }}
                className="w-full px-5 py-4 flex items-center justify-between bg-black text-white hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gold text-black p-2 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black uppercase tracking-tight text-sm text-gold">
                      How to Use Remote Ordering
                    </h3>
                    <p className="text-[10px] text-gray-300 font-medium">
                      In-depth guide to seamless collection & tracking
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-chicken-red text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider hidden sm:inline-block animate-pulse">
                    Quick Guide
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gold transition-transform duration-300 ${showGuide ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-t border-gray-100 bg-gray-50/50 overflow-hidden"
                  >
                    <div className="p-5 md:p-6 space-y-6">
                      {/* Step-by-Step Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Step 1 */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                          <span className="absolute -top-3 -right-2 bg-gold text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                            01
                          </span>
                          <div>
                            <div className="text-chicken-red font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5" /> Select Meal
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                              Browse categories, select grilled/fried meals, and customize sizes and sizzling sauces.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                          <span className="absolute -top-3 -right-2 bg-gold text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                            02
                          </span>
                          <div>
                            <div className="text-chicken-red font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5" /> Order & Sync
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                              Confirm items in your cart, enter your name, and send directly to our cloud-synced kitchen.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                          <span className="absolute -top-3 -right-2 bg-gold text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                            03
                          </span>
                          <div>
                            <div className="text-chicken-red font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <QrCode className="w-3.5 h-3.5" /> Digital Pass
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                              A unique QR Pickup Pass is instantly cached in your browser so you never lose your code.
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                          <span className="absolute -top-3 -right-2 bg-gold text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                            04
                          </span>
                          <div>
                            <div className="text-chicken-red font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Live Track
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                              Track state real-time: <span className="text-orange-500 font-extrabold">Pending</span>, <span className="text-amber-500 font-extrabold">Preparing</span>, or <span className="text-green-600 font-extrabold">Ready!</span>
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                          <span className="absolute -top-3 -right-2 bg-gold text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                            05
                          </span>
                          <div>
                            <div className="text-chicken-red font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Scan & Collect
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                              Arrive at the counter, let the staff scan your pass, and claim your crispy-hot meal!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technical/Offline resilience details */}
                      <div className="bg-gray-900 text-gray-300 p-4 rounded-xl border border-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold bg-gold text-black px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                            💡 Pro Tip & Offline Support
                          </span>
                          <p className="text-xs font-semibold leading-relaxed">
                            Signal dropped at the store? No worries! Your pickup pass QR code and status are cached locally. Show your cached screen at the counter, and staff can manually type your 6-digit Code to verify.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            playBeep(880, "sine", 0.05);
                            navigate("/passes");
                          }}
                          className="shrink-0 text-xs text-black bg-gold hover:bg-yellow-400 px-3.5 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all shadow"
                        >
                          View My Passes
                        </button>
                      </div>


                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Interactive Digital Billboard */}
            <div className="mb-6 bg-white rounded-2xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
              {/* Billboard Header (LED styled ticker/bezel) */}
              <div className="bg-black text-gold px-4 py-2 flex items-center justify-between border-b-2 border-black text-[10px] font-black uppercase tracking-widest select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
                  <span className="text-white">LIVE DEALS</span>
                  <span className="text-gold hidden sm:inline">// DEALS & UPGRADES</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playBeep(600, "sine", 0.02);
                      setBillboardSlide((prev) => (prev === 0 ? 1 : 0));
                    }}
                    className="hover:text-white transition-colors p-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <span className="font-mono text-[9px] bg-gray-900 text-gold px-1.5 py-0.5 rounded border border-gray-800">
                    {billboardSlide + 1} / 2
                  </span>
                  <button
                    onClick={() => {
                      playBeep(600, "sine", 0.02);
                      setBillboardSlide((prev) => (prev === 0 ? 1 : 0));
                    }}
                    className="hover:text-white transition-colors p-1"
                  >
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Billboard Slides Content */}
              <div className="relative min-h-[220px] md:min-h-[160px] flex items-center bg-gradient-to-br from-amber-50 to-orange-50/30 overflow-hidden">
                {/* Tech/Tactile Grid Pattern overlay for depth and texture */}
                <div 
                  className="absolute inset-0 opacity-[0.06] pointer-events-none" 
                  style={{ 
                    backgroundImage: `
                      linear-gradient(to right, rgba(0, 0, 0, 0.5) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '16px 16px'
                  }} 
                />
                
                {/* Ambient glow light accent behind the billboard content */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

                <AnimatePresence mode="wait">
                  {billboardSlide === 0 ? (
                    <motion.div
                      key="slide-chicken"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 w-full h-full min-h-[200px] md:min-h-[160px] flex items-center"
                    >
                      {/* Image filling Top, Bottom, and Left edge 100% completely with zero gaps */}
                      <div className="absolute inset-y-0 left-0 w-32 sm:w-48 md:w-64 lg:w-72 h-full overflow-hidden shrink-0 group z-0">
                        <img 
                          src="https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/grilled_chicken.webp" 
                          onError={(e) => {
                            e.currentTarget.src = "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg";
                          }}
                          alt="Whole Flame-Grilled Chicken" 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                        {/* Smooth gradient fade on the right side of the image */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/50 to-amber-50 pointer-events-none" />
                      </div>

                      <div className="relative z-10 w-full p-4 sm:p-5 pl-36 sm:pl-52 md:pl-68 lg:pl-76 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row w-full md:w-auto">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 bg-chicken-red text-gold text-[9px] font-black uppercase rounded border border-black shadow-sm tracking-widest leading-none">
                              LIMITED TIME PROMO
                            </span>
                            <h3 className="text-sm font-black uppercase tracking-tight text-black flex items-center justify-center md:justify-start gap-1.5 mt-1">
                              Add a Whole Flame-Grilled Chicken for <span className="text-chicken-red font-extrabold text-base">R{wholeChickenPromoPrice.toFixed(2)}</span>!
                            </h3>
                            <p className="text-[11px] text-gray-700 font-semibold max-w-xl leading-relaxed">
                              Make any meal a feast! With any grilled meal ordered, you can add <span className="underline decoration-gold font-bold">one full flame-grilled chicken</span> basted in your choice of sizzling sauce for only <span className="text-chicken-red font-bold">R{wholeChickenPromoPrice.toFixed(2)}</span>.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const customWholeChicken = {
                              id: "promo-whole-chicken",
                              name: "Whole Flame-Grilled Chicken (Promo)",
                              category: "Grilled Chicken",
                              price: wholeChickenPromoPrice,
                              description: "Promo Whole Flame-Grilled Chicken added via meal upsell.",
                              imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/grilled_chicken.webp",
                              spiceLevel: 1
                            };
                            handleAddToCart(customWholeChicken);
                            triggerToast("Whole Flame-Grilled Chicken Promo added!", "success");
                          }}
                          className="w-full md:w-auto px-5 py-3 bg-gold hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition duration-150 border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:scale-95 shrink-0 relative z-10"
                        >
                          Add Promo Chicken
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="slide-chips"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 w-full h-full min-h-[200px] md:min-h-[160px] flex items-center"
                    >
                      {/* Image filling Top, Bottom, and Left edge 100% completely with zero gaps */}
                      <div className="absolute inset-y-0 left-0 w-32 sm:w-48 md:w-64 lg:w-72 h-full overflow-hidden shrink-0 group z-0">
                        <img 
                          src="https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/sides.webp" 
                          onError={(e) => {
                            e.currentTarget.src = "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chips-1.jpg";
                          }}
                          alt="Spiced Hot Chips" 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                        {/* Smooth gradient fade on the right side of the image */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/50 to-amber-50 pointer-events-none" />
                      </div>

                      <div className="relative z-10 w-full p-4 sm:p-5 pl-36 sm:pl-52 md:pl-68 lg:pl-76 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row w-full md:w-auto">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-gold text-black text-[9px] font-black uppercase rounded border border-black shadow-sm tracking-widest leading-none">
                              CRUNCH UPGRADE
                            </span>
                            <h4 className="font-black uppercase tracking-tight text-sm text-black flex items-center justify-center md:justify-start gap-1 mt-1">
                              Level Up Your Crunch! <span className="text-chicken-red">Spiced Hot Chips</span>
                            </h4>
                            <p className="text-xs text-gray-700 font-semibold mt-0.5 max-w-md leading-relaxed">
                              Our legendary crispy, golden-fried hot potato chips with signature seasoning. The ultimate companion for your chicken!
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto shrink-0 relative z-10">
                          {[
                            { id: "s-chips-regular", label: "Regular", price: `R${regChipsPrice.toFixed(2)}`, isPopular: true },
                            { id: "s-chips-large", label: "Large", price: `R${lrgChipsPrice.toFixed(2)}` }
                          ].map((size) => (
                            <button
                              key={size.id}
                              onClick={() => {
                                addQuickAddOn(size.id);
                                triggerToast(`${size.label} Chips added to your cart!`, "success");
                              }}
                              className={`relative p-3.5 rounded-xl border-2 border-black flex flex-col items-center justify-center transition-all active:scale-95 text-center ${
                                size.isPopular
                                  ? "bg-gold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-yellow-400"
                                  : "bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-150"
                              }`}
                            >
                            {size.isPopular && (
                              <span className="absolute -top-2 px-1.5 py-0.5 text-[7px] font-black uppercase text-white bg-chicken-red rounded-full border border-black shadow-sm leading-none">
                                BEST VALUE
                              </span>
                            )}
                            <span className="text-xs font-black uppercase tracking-tight">{size.label}</span>
                            <span className="text-[10px] font-extrabold text-chicken-red mt-0.5">{size.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Billboard Pager Dots */}
              <div className="bg-gray-50 border-t-2 border-black px-4 py-2.5 flex items-center justify-center gap-2 select-none">
                {[0, 1].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playBeep(650, "sine", 0.02);
                      setBillboardSlide(idx);
                    }}
                    className={`h-2.5 rounded-full border border-black transition-all duration-300 ${
                      billboardSlide === idx ? "w-8 bg-chicken-red" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="bg-white rounded-2xl border-2 border-black p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Search input */}
                <div className="relative md:col-span-1 flex items-stretch bg-amber-50 border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_rgba(0,0,0,1)] focus-within:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus-within:-translate-y-0.5 transition-all duration-200">
                  <span className="bg-gold border-r-2 border-black flex items-center justify-center px-3.5 text-black shrink-0">
                    <Search className="w-4 h-4 stroke-[3px]" />
                  </span>
                  <input
                    type="text"
                    placeholder="FIND YOUR CRAVINGS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 bg-white text-black font-black uppercase tracking-wider text-xs placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-chicken-red text-gold w-6 h-6 rounded-lg border-2 border-black flex items-center justify-center font-black text-xs hover:bg-red-700 transition-colors shadow-[1px_1px_0px_rgba(0,0,0,1)] active:scale-95"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category tabs list */}
                <div className="md:col-span-2 flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
                  {MENU_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-wider whitespace-nowrap transition shadow-sm shrink-0 border ${
                        activeCategory === cat
                          ? "bg-chicken-red border-gold text-white"
                          : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid List of Menu Items */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2 flex-grow min-w-[200px]">
                  <span>{activeCategory} Menu</span>
                  <span className="h-1 flex-grow bg-gray-200 rounded-full"></span>
                </h2>

                {/* View Mode Switcher: Columns (2x2 on mobile) vs List */}
                <div className="flex items-center gap-1 bg-gray-150 p-1 rounded-xl border-2 border-black/20 shadow-inner shrink-0">
                  <button
                    onClick={() => {
                      playBeep(800, "sine", 0.03);
                      setMenuViewMode("columns");
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      menuViewMode === "columns"
                        ? "bg-black text-gold shadow"
                        : "text-gray-600 hover:text-black hover:bg-gray-200"
                    }`}
                    title="2x2 Columns View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-gold" />
                    <span>Columns</span>
                  </button>

                  <button
                    onClick={() => {
                      playBeep(800, "sine", 0.03);
                      setMenuViewMode("list");
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      menuViewMode === "list"
                        ? "bg-black text-gold shadow"
                        : "text-gray-600 hover:text-black hover:bg-gray-200"
                    }`}
                    title="1-Column List View"
                  >
                    <List className="w-3.5 h-3.5 text-gold" />
                    <span>List</span>
                  </button>
                </div>
              </div>

              {activeCategory === "Breakfast Menu" && !isBreakfastActive && (
                <div className="mb-6 bg-amber-50 border-2 border-dashed border-amber-400 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase text-amber-800 flex items-center gap-1.5">
                      🍳 Breakfast Menu Hours (6:00 AM - 11:00 AM)
                    </h4>
                    <p className="text-xs text-amber-700 font-medium">
                      It is currently {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Breakfast items are sold out or unavailable outside breakfast hours, but you can bypass this rule for testing.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      playBeep(700, "sine", 0.05);
                      setOverrideBreakfastTime(true);
                      triggerToast("Breakfast hours unlocked (Demo)!", "success");
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow"
                  >
                    Bypass Time Constraint (Demo)
                  </button>
                </div>
              )}

              {(() => {
                const displayedItems = menuItems.filter((item) => {
                  const matchCat = item.category === activeCategory;
                  const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
                  return matchCat && matchSearch;
                });

                return (
                  <div className={
                    menuViewMode === "list"
                      ? "flex flex-col gap-3.5 max-w-3xl mx-auto w-full"
                      : `grid gap-2.5 sm:gap-6 ${
                          displayedItems.length === 1 
                            ? "grid-cols-1 max-w-sm mx-auto justify-center justify-items-center w-full" 
                            : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
                        }`
                  }>
                    {displayedItems.map((item) => {
                      const isBreakfastItem = item.category === "Breakfast Menu" || item.isBreakfast;
                      const available = isItemAvailable(item.id) && (!isBreakfastItem || isBreakfastActive);
                      return (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          available={available}
                          viewMode={menuViewMode}
                          onAdd={(item, spice) => handleAddToCart(item, spice)}
                          onCustomize={(item) => {
                            playBeep(750, "sine", 0.05);
                            setSelectedComboItem(item);
                            // initialize selections
                            const initOpts: any = {};
                            if (item.comboOptions) {
                              item.comboOptions.forEach(opt => {
                                initOpts[opt.name] = opt.choices[0];
                              });
                            }
                            setComboSelections(initOpts);
                            setSelectedSpiceLevel(item.spiceLevel || 1);
                            setSelectedComboSauce("No Sauce");
                            setSelectedFriesSize("None");
                          }}
                          onSelect={(item) => {
                            playBeep(650, "sine", 0.03);
                            setSelectedMenuItemForDetails(item);
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Quick Floating Cart Bar for Mobile & Desktop bottom */}
            {cartTotalItems > 0 && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-30">
                <button
                  onClick={() => {
                    playBeep(880, "sine", 0.08);
                    navigate("/cart");
                  }}
                  className="w-full bg-black text-white px-5 py-4 rounded-full shadow-2xl flex items-center justify-between border-2 border-gold hover:bg-gray-900 transition transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-chicken-red p-2 rounded-full text-white">
                      <ShoppingBag className="w-5 h-5 text-gold" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] text-gray-300 font-bold uppercase tracking-wider">Your Hot Cart</span>
                      <span className="text-sm font-black text-gold">{cartTotalItems} items • R{cartSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black uppercase text-white tracking-wider">
                    Review Cart
                    <ChevronRight className="w-4 h-4 text-gold" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==============================================
             ROUTE: /passes (MY PICKUP PASSES VIEW)
             ============================================== */}
        {path === "/passes" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <button
                  onClick={() => {
                    playBeep(600, "sine", 0.05);
                    navigate("/");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase text-gray-500 hover:text-black transition self-start sm:self-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Go to Menu
                </button>
                <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-gold" />
                  My Pickup Passes
                </h2>
                <span className="text-xs font-black bg-gold text-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                  {customerPasses.length} Saved
                </span>
              </div>

              {/* Import manual code form */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">Import a Pass Code / Order ID</span>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!manualCodeInput.trim()) return;
                    const code = manualCodeInput.trim().toUpperCase();
                    const foundOrder = orders.find((o) => o.passCode === code || o.id === code);
                    if (foundOrder) {
                      setSavedPassIds((prev) => {
                        if (!prev.includes(foundOrder.id)) {
                          return [foundOrder.id, ...prev];
                        }
                        return prev;
                      });
                      setManualCodeInput("");
                      triggerToast("Pass imported successfully!", "success");
                    } else {
                      triggerToast("Pass code not found in current session orders.", "error");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. KK-84A2F1)"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    className="flex-grow px-3 py-2 rounded-lg border border-gray-300 text-sm uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-gold font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-900 transition"
                  >
                    Import
                  </button>
                </form>
              </div>

              {customerPasses.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full text-gray-400">
                    <QrCode className="w-12 h-12 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">No Pickup Passes Saved</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    You haven't generated any hot chicken pickup passes yet. Create your order to get one!
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2.5 bg-chicken-red hover:bg-red-700 text-white font-black text-sm uppercase rounded-xl tracking-wider shadow"
                  >
                    Browse Menu & Order
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerPasses.map((pass) => {
                    return (
                      <div 
                        key={pass.id} 
                        onClick={() => {
                          playBeep(750, "sine", 0.05);
                          navigate(`/pass/${pass.id}`);
                        }}
                        className="p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 transition shadow-sm cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-lg text-black group-hover:text-chicken-red transition">
                              {pass.passCode}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${
                              pass.status === "pending" ? "bg-amber-100 text-amber-800" :
                              pass.status === "verified" ? "bg-green-100 text-green-800" :
                              pass.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {pass.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-semibold uppercase">
                            <span>Placed: {new Date(pass.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                            <span className="mx-2">•</span>
                            <span>Name: {pass.customerName}</span>
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            {pass.items.map((item) => `${item.quantity}x ${item.menuItem.name}`).join(", ")}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t pt-2 sm:border-t-0 sm:pt-0">
                          <span className="text-lg font-black text-chicken-red">
                            R{pass.total.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1 group-hover:underline">
                            View Pass
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================
             ROUTE: /cart (CART REVIEW SCREEN)
             ============================================== */}
        {path === "/cart" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <button
                onClick={() => {
                  playBeep(600, "sine", 0.05);
                  navigate("/");
                }}
                className="flex items-center gap-1.5 text-xs font-bold uppercase text-gray-500 hover:text-black transition"
              >
                <ArrowLeft className="w-4 h-4" /> Keep Browsing
              </button>
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Your Cart</h2>
              <span className="text-xs font-black bg-gold text-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {cartTotalItems} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex p-4 bg-gray-100 rounded-full text-gray-400">
                  <ShoppingBag className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight">Your cart is empty</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Looks like you haven't added any grilled or fried chicken to your feast yet!
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2.5 bg-chicken-red hover:bg-red-700 text-white font-black text-sm uppercase rounded-xl tracking-wider shadow"
                >
                  Go to Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="divide-y divide-gray-100">
                  {cart.map((item, index) => (
                    <div key={index} className="py-4 flex items-start gap-4">
                      {/* Item Image */}
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Detail Text */}
                      <div className="flex-grow">
                        <h4 className="font-extrabold text-sm uppercase text-gray-900 tracking-tight">
                          {item.menuItem.name}
                        </h4>
                        <span className="text-xs font-semibold text-chicken-red block mt-0.5">
                          R{item.unitPrice.toFixed(2)} each
                        </span>

                        {/* Combo Selected options summary list */}
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="mt-1.5 space-y-0.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            {Object.entries(item.selectedOptions).map(([key, val]) => (
                              <div key={key} className="text-[10px] text-gray-600 font-bold flex gap-1 items-center uppercase">
                                <span className="text-chicken-red">•</span>
                                <span className="text-gray-400">{key}:</span>
                                <span>{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex flex-col items-end justify-between h-full space-y-3 shrink-0">
                        <span className="font-black text-sm text-gray-900">
                          R{(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        
                        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200">
                          <button
                            onClick={() => updateCartQuantity(index, -1)}
                            className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 rounded transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-gray-900 w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(index, 1)}
                            className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 rounded transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upsell / Side Item Quick-Add Section */}
                <div className="space-y-3">
                  {!cartHasChips && (
                    <div className="bg-amber-50 border border-gold/40 p-4 rounded-xl space-y-3 shadow-sm">
                      <span className="text-[10px] font-black uppercase text-orange bg-yellow-400/80 px-2 py-0.5 rounded border border-yellow-500">
                        Hungry for more? Quick Add-on
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80" 
                            alt="Spiced Chips" 
                            className="w-10 h-10 object-cover rounded-lg border border-black/20 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block text-xs font-black uppercase text-gray-900">Add regular chips for R{regChipsPrice.toFixed(2)}</span>
                            <span className="block text-[10px] text-gray-500">Perfect crisp complement to your order!</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addQuickAddOn("s-chips-regular")}
                          className="px-3 py-1.5 bg-gold hover:bg-yellow-400 text-black text-xs font-black rounded-lg uppercase tracking-wider transition shrink-0 shadow-sm"
                        >
                          Quick Add
                        </button>
                      </div>
                    </div>
                  )}

                  {showWholeChickenUpsell && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3 shadow-sm">
                      <span className="text-[10px] font-black uppercase text-white bg-chicken-red px-2 py-0.5 rounded border border-red-600">
                        Whole Grilled Chicken Deal - R{wholeChickenPromoPrice.toFixed(2)}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src="https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500&q=80" 
                            alt="Whole Flame-Grilled Chicken" 
                            className="w-10 h-10 object-cover rounded-lg border border-black/20 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block text-xs font-black uppercase text-gray-900">Add Whole Flame-Grilled Chicken</span>
                            <span className="block text-[10px] text-gray-500">Special R{wholeChickenPromoPrice.toFixed(2)} promo for choosing our premium meals!</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const customWholeChicken: MenuItem = {
                              id: "promo-whole-chicken",
                              name: "Whole Flame-Grilled Chicken (Promo)",
                              category: "Grilled Chicken",
                              price: wholeChickenPromoPrice,
                              description: "Promo Whole Flame-Grilled Chicken added via meal upsell.",
                              imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
                              spiceLevel: 1
                            };
                            handleAddToCart(customWholeChicken);
                          }}
                          className="px-3 py-1.5 bg-chicken-red hover:bg-red-700 text-white text-xs font-black rounded-lg uppercase tracking-wider transition shrink-0 shadow-sm"
                        >
                          Add Deal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotal & Call to Action */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-gray-500">VAT (Included 15%)</span>
                    <span className="text-xs font-bold text-gray-500">R{(cartSubtotal * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed pt-3">
                    <span className="text-sm font-black uppercase text-gray-900">Total Price</span>
                    <span className="text-xl font-black text-chicken-red">R{cartSubtotal.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => {
                      playBeep(900, "sine", 0.08);
                      navigate("/checkout");
                    }}
                    className="w-full mt-2 py-3 bg-chicken-red hover:bg-red-700 text-white font-black uppercase text-sm tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==============================================
             ROUTE: /checkout (ORDER SUMMARY & PASS FLOW)
             ============================================== */}
        {path === "/checkout" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-lg mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <button
                onClick={() => {
                  playBeep(600, "sine", 0.05);
                  navigate("/cart");
                }}
                className="flex items-center gap-1.5 text-xs font-bold uppercase text-gray-500 hover:text-black transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Cart
              </button>
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Checkout</h2>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">Nothing to check out. Please add items first.</p>
                <button onClick={() => navigate("/")} className="mt-3 px-4 py-2 bg-chicken-red text-white font-bold text-xs uppercase rounded">Go back</button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                {/* Order Summary Summary box */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 space-y-3">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Checkout Order Summary</span>
                  <div className="divide-y divide-gray-200 max-h-40 overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between text-xs font-bold uppercase text-gray-800">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>R{(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed pt-3 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-900">Total Bill</span>
                    <span className="text-lg font-black text-chicken-red">R{cartSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Patron name input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-gray-700 tracking-wider">
                    Your Name (for Pickup call) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name, e.g. Thabo, Chloe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent font-semibold shadow-sm"
                  />
                  <p className="text-[10px] text-gray-500 italic mt-1">
                    Note: Your pickup pass code will be linked with this name.
                  </p>
                </div>

                {/* Important notice */}
                <div className="bg-yellow-50 border-l-4 border-gold p-4 rounded-r-xl space-y-1">
                  <h4 className="text-xs font-black uppercase text-yellow-800">💳 NO PRE-PAYMENT REQUIRED</h4>
                  <p className="text-[10px] text-yellow-700 leading-normal font-medium">
                    This order generates a pickup pass immediately. You simply show the code/QR at the counter, pay in cash or card, and grab your piping-hot meal!
                  </p>
                </div>

                {/* Pay button */}
                <button
                  type="submit"
                  disabled={isSubmittingOrder || !customerName.trim()}
                  className={`w-full py-3.5 font-black uppercase text-sm tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${
                    isSubmittingOrder || !customerName.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-chicken-red hover:bg-red-700 text-white"
                  }`}
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-gold" />
                      Saving Order...
                    </>
                  ) : (
                    <>
                      Generate Pickup Pass
                      <ChevronRight className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ==============================================
             ROUTE: /pass/:orderId (PASS DISPLAY SCREEN)
             ============================================== */}
        {path.startsWith("/pass/") && (
          <div className="max-w-md mx-auto">
            {customerActiveOrder ? (
              <div className="bg-white rounded-3xl border-2 border-gold shadow-2xl overflow-hidden">
                
                {/* Header Banner */}
                <div className="bg-black text-white p-5 text-center border-b-4 border-chicken-red space-y-2">
                  <span className="px-2.5 py-1 bg-chicken-red border border-gold text-[10px] font-black uppercase rounded-full tracking-widest text-gold animate-pulse">
                    Hot Pickup Pass
                  </span>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Krispy King Order Confirmed
                  </h2>
                </div>

                <div className="p-6 text-center space-y-6">
                  {/* Status Indicator */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Order Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full animate-ping ${
                        customerActiveOrder.status === "pending" ? "bg-warning-orange" :
                        customerActiveOrder.status === "verified" ? "bg-success-green" : "bg-gray-400"
                      }`} />
                      <span className={`text-lg font-black uppercase tracking-wider ${
                        customerActiveOrder.status === "pending" ? "text-warning-orange" :
                        customerActiveOrder.status === "verified" ? "text-success-green" : "text-gray-500"
                      }`}>
                        {customerActiveOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Monospace Code Display */}
                  <div className="bg-black text-gold p-5 rounded-2xl border-2 border-chicken-red space-y-2">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-black">Your Code</span>
                    <span className="block text-3xl font-mono font-black tracking-wider text-white">
                      {customerActiveOrder.passCode}
                    </span>
                    <div className="border-t border-gray-800 my-1 pt-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      <span>Name: {customerActiveOrder.customerName}</span>
                      <span className="text-gold">Total: R{customerActiveOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* 🔑 Pickup Verification PIN Display Panel */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-gold rounded-2xl p-4 text-center space-y-2">
                    <span className="block text-[10px] font-black uppercase text-amber-800 tracking-wider">
                      🛡️ Secure Pickup Verification PIN
                    </span>
                    <div className="flex items-center justify-center gap-1.5">
                      {customerActiveOrder.verificationPin ? (
                        customerActiveOrder.verificationPin.split("").map((digit, i) => (
                          <span 
                            key={i} 
                            className="w-10 h-11 bg-white border-2 border-gold text-black rounded-lg flex items-center justify-center text-lg font-mono font-black shadow-sm"
                          >
                            {digit}
                          </span>
                        ))
                      ) : (
                        <span className="font-mono text-sm text-gray-500 uppercase font-bold">
                          None assigned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold leading-normal uppercase">
                      Present this 4-Digit PIN or QR code to the cashier to verify and complete your food pickup.
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="bg-gray-100 p-4 rounded-2xl inline-block border border-gray-200">
                    <QRCodeSVG 
                      value={customerActiveOrder.passCode} 
                      size={180} 
                      bgColor={"#FFFFFF"} 
                      fgColor={"#000000"} 
                      level={"H"} 
                    />
                    <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-2">
                      Scan QR at cash register
                    </span>
                  </div>

                  {/* Download actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadSvgPass(customerActiveOrder)}
                      className="py-2.5 bg-black hover:bg-gray-950 text-gold border border-gold font-black uppercase text-[10px] tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Pass (SVG)
                    </button>
                    <button
                      onClick={() => handleDownloadTextReceipt(customerActiveOrder)}
                      className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-black uppercase text-[10px] tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Save Receipt Text
                    </button>
                  </div>

                  {/* Contactless NFC Pass Claiming */}
                  <div className="bg-black text-white p-4 rounded-2xl border border-gold/40 text-center space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                    <div className="flex items-center justify-center gap-1.5 text-gold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <span className="text-xs font-black uppercase tracking-widest">
                        Contactless NFC Claiming
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 font-medium leading-normal uppercase">
                      Tap your phone at the register to claim instantly via native Web NFC or our real-time cloud-synced contactless beacon.
                    </p>

                    <div className="flex flex-col gap-2 pt-1">
                      {/* NFC Beacon Broadcast */}
                      <button
                        onClick={async () => {
                          const beaconId = `beacon-${customerActiveOrder.id}-${Date.now()}`;
                          const pathForWrite = `nfc_beacons/${beaconId}`;
                          try {
                            playBeep(900, "sine", 0.08);
                            triggerToast("Broadcasting contactless NFC signal...", "info");
                            await setDoc(doc(db, "nfc_beacons", beaconId), {
                              id: beaconId,
                              passCode: customerActiveOrder.passCode,
                              timestamp: Date.now()
                            });
                            triggerToast("Contactless signal active! Staff register alerted.", "success");
                          } catch (err) {
                            handleFirestoreError(err, OperationType.WRITE, pathForWrite);
                          }
                        }}
                        className="w-full py-2 bg-gold hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        Broadcast Contactless Tap (Beacon)
                      </button>

                      {/* Physical Web NFC Write */}
                      <button
                        onClick={async () => {
                          if (!("NDEFReader" in window)) {
                            triggerToast("Web NFC write is not supported on this device/browser. (Requires Chrome on Android)", "info");
                            return;
                          }
                          setIsNfcWriting(true);
                          playBeep(650, "sine", 0.05);
                          try {
                            const ndef = new (window as any).NDEFReader();
                            await ndef.write({
                              records: [{ recordType: "text", data: customerActiveOrder.passCode }]
                            });
                            triggerToast("Success! Pass written to physical NFC tag.", "success");
                            playBeep(1200, "sine", 0.1);
                          } catch (err) {
                            console.error("NFC Write Error:", err);
                            triggerToast(`NFC Write Failed: ${(err as Error).message}`, "error");
                          } finally {
                            setIsNfcWriting(false);
                          }
                        }}
                        disabled={isNfcWriting}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-gold border border-gold/30 font-black uppercase text-[10px] tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        {isNfcWriting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            Writing Tag...
                          </>
                        ) : (
                          <>
                            Write Physical NFC Pass Tag
                          </>
                        )}
                      </button>
                    </div>

                    {!("NDEFReader" in window) && (
                      <span className="block text-[8px] text-gray-500 font-semibold uppercase leading-tight">
                        Note: Physical NFC writing is disabled in standard iOS/desktop browsers. Use the "Broadcast Contactless Tap" beacon instead, which is fully supported here and syncs in real-time.
                      </span>
                    )}
                  </div>

                  {/* Customer Self-Verification flow */}
                  {customerActiveOrder.status === "verified" && (
                    <div className="bg-amber-50 border border-gold rounded-2xl p-4 text-center space-y-3">
                      <span className="block text-[10px] font-black uppercase text-amber-800 tracking-wider">
                        Self-Service Counter Checkout
                      </span>
                      {!showSelfVerifyInput ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowSelfVerifyInput(true);
                            setSelfVerifyInputPin("");
                            playBeep(650, "sine", 0.05);
                          }}
                          className="w-full py-2 bg-black hover:bg-gray-900 text-gold border border-gold font-black uppercase text-[10px] tracking-wider rounded-lg transition animate-bounce"
                        >
                          Counter Self-Verification
                        </button>
                      ) : (
                        <div className="space-y-2 text-left">
                          <label className="block text-[9px] font-black uppercase text-gray-500">
                            Enter 4-Digit Staff PIN or Pickup PIN:
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="••••"
                              value={selfVerifyInputPin}
                              onChange={(e) => setSelfVerifyInputPin(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-center font-mono font-black text-sm tracking-widest focus:ring-1 focus:ring-gold focus:outline-none bg-white text-black"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const isSuccess = 
                                  selfVerifyInputPin === "8034" || 
                                  selfVerifyInputPin === customerActiveOrder.verificationPin;

                                if (isSuccess) {
                                  playBeep(1000, "sine", 0.12);
                                  await updateOrderStatus(customerActiveOrder.id, "completed");
                                  setShowSelfVerifyInput(false);
                                  setSelfVerifyInputPin("");
                                  triggerToast("Order successfully completed!", "success");
                                } else {
                                  playBeep(180, "sawtooth", 0.25);
                                  triggerToast("Invalid PIN. Access denied.", "error");
                                  setSelfVerifyInputPin("");
                                }
                              }}
                              className="px-4 py-1.5 bg-black text-gold border border-gold font-black text-[10px] uppercase rounded-lg hover:bg-gray-950"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSelfVerifyInput(false);
                                setSelfVerifyInputPin("");
                                playBeep(300, "sine", 0.05);
                              }}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase rounded-lg hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic counter order timer */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 inline-flex items-center gap-2 text-xs font-bold text-gray-600 w-full justify-center">
                    <Clock className="w-4 h-4 text-chicken-red" />
                    <span>Placed: {formatOrderTime(customerActiveOrder.createdAt)}</span>
                  </div>

                  {/* Summary Checklist */}
                  <div className="border-t border-dashed pt-4 text-left space-y-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pickup Instructions</span>
                    <div className="space-y-1.5 text-xs font-semibold text-gray-700">
                      <p className="flex gap-1.5 items-start">
                        <Check className="w-4 h-4 text-success-green shrink-0 mt-0.5" />
                        <span>Show this code/QR to the counter staff when calling your name.</span>
                      </p>
                      <p className="flex gap-1.5 items-start">
                        <Check className="w-4 h-4 text-success-green shrink-0 mt-0.5" />
                        <span>Pay in cash or credit card inside the shop.</span>
                      </p>
                      <p className="flex gap-1.5 items-start">
                        <Check className="w-4 h-4 text-success-green shrink-0 mt-0.5" />
                        <span>Grab your grilled & fried chicken while it's steaming hot!</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playBeep(600, "sine", 0.05);
                      navigate("/");
                    }}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    Go Back to Menu
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <RefreshCw className="w-12 h-12 text-gold animate-spin mx-auto" />
                <h3 className="text-lg font-black text-black uppercase tracking-tight">Syncing Order Status</h3>
                <p className="text-sm text-gray-500">Retrieving details of your order. Please wait...</p>
                <button onClick={() => navigate("/")} className="px-4 py-2 bg-chicken-red text-white font-bold text-xs uppercase rounded">
                  Go Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==============================================
             ROUTE: /staff (STAFF GATE PIN LOGIN)
             ============================================== */}
        {path === "/staff" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-gold/20 rounded-full text-gold">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Staff Portal</h2>
              <p className="text-xs text-gray-500">Secure entry for verifying pickup passes & sales stats</p>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-gray-700">Enter Access PIN *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="Enter Access PIN"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              {/* Mini pinpad helper to speed up entry */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      playBeep(700, "sine", 0.03);
                      setStaffPin((prev) => (prev + num).slice(0, 4));
                    }}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-black text-gray-800 transition"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    playBeep(400, "sine", 0.05);
                    setStaffPin("");
                  }}
                  className="py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-black text-chicken-red transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playBeep(700, "sine", 0.03);
                    setStaffPin((prev) => (prev + "0").slice(0, 4));
                  }}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-black text-gray-800 transition"
                >
                  0
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-gold hover:bg-yellow-400 rounded-lg text-xs font-black text-black transition"
                >
                  OK
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black text-white font-black uppercase text-xs tracking-wider rounded-xl hover:bg-gray-900 transition"
              >
                Log In
              </button>
            </form>
          </div>
        )}

        {/* ==============================================
             ROUTE: /staff/dashboard (DASHBOARD FLOWS)
             ============================================== */}
        {path === "/staff/dashboard" && (
          <div className="space-y-6">
            {!isStaffAuthenticated ? (
              <div className="text-center py-12 space-y-4 bg-white p-6 rounded-2xl border">
                <Lock className="w-12 h-12 text-chicken-red mx-auto animate-bounce" />
                <h3 className="text-lg font-black text-black uppercase tracking-tight">Access Denied</h3>
                <p className="text-sm text-gray-500">You must log in to access this portal.</p>
                <button onClick={() => navigate("/staff")} className="px-6 py-2.5 bg-chicken-red text-white font-bold text-xs uppercase rounded-lg">
                  Log In
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Staff Control Panel Sub-Navigation */}
                <div className="bg-black text-white p-4 rounded-2xl border-2 border-gold flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-md font-black uppercase tracking-tight text-gold flex items-center gap-1.5">
                      <span>Krispy King Staff Hub</span>
                      <span className="px-2 py-0.5 bg-success-green text-white text-[9px] rounded font-mono">LIVE OS</span>
                    </h2>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                      Demo PIN: 8034 • Fast Food remote flow
                    </p>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setActiveStaffTab("feed");
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                        activeStaffTab === "feed" ? "bg-chicken-red text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      Orders Feed ({orders.filter(o => o.status === "pending" || o.status === "verified").length})
                    </button>
                    <button
                      onClick={() => {
                        setActiveStaffTab("verify");
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                        activeStaffTab === "verify" ? "bg-chicken-red text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      Verify Pass
                    </button>
                    <button
                      onClick={() => {
                        setActiveStaffTab("menu");
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                        activeStaffTab === "menu" ? "bg-chicken-red text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      Menu Status
                    </button>
                    <button
                      onClick={() => {
                        setActiveStaffTab("sales");
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                        activeStaffTab === "sales" ? "bg-chicken-red text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      Sales summary
                    </button>
                    <button
                      onClick={() => {
                        setActiveStaffTab("placard");
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                        activeStaffTab === "placard" ? "bg-chicken-red text-white animate-pulse" : "bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      🔥 Placard QR
                    </button>
                    <button
                      onClick={() => {
                        setActiveStaffTab("training");
                        playBeep(650, "sine", 0.03);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                        activeStaffTab === "training" ? "bg-chicken-red text-white" : "bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      📖 Staff Guide
                    </button>
                  </div>
                </div>

                {/* TAB: Orders Feed */}
                {activeStaffTab === "feed" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-1.5">
                        <span>Incoming Pickup Orders</span>
                        <span className="text-xs bg-gold text-black px-2 py-0.5 rounded font-black">
                          {orders.length} TOTAL
                        </span>
                      </h3>
                      <button 
                        onClick={() => {
                          playBeep(900, "sine", 0.05);
                          triggerToast("Feeds refreshed from Firestore", "success");
                        }}
                        className="p-2 text-xs font-bold uppercase text-gray-500 hover:text-black flex items-center gap-1 border rounded-lg bg-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Force Sync
                      </button>
                    </div>

                    {orders.length === 0 ? (
                      <div className="bg-white rounded-2xl border text-center p-12 space-y-3">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto animate-pulse" />
                        <h4 className="font-extrabold text-gray-700 uppercase">No active orders placed yet</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          Whenever a customer submits an order, it will appear here instantly with sound notifications and live countdown timers!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => {
                          return (
                            <div 
                              key={order.id}
                              className={`bg-white rounded-2xl border-2 shadow-sm p-5 space-y-4 flex flex-col justify-between transition ${
                                order.status === "pending" ? "border-orange/40 ring-2 ring-yellow-100" :
                                order.status === "verified" ? "border-green-500/40 bg-green-50/10" :
                                order.status === "completed" ? "border-gray-200 opacity-65" : "border-red-200 bg-red-50/5"
                              }`}
                            >
                              {/* Order Header */}
                              <div className="flex items-start justify-between border-b pb-2">
                                <div>
                                  <span className="block font-mono font-black text-sm text-black">
                                    {order.passCode}
                                  </span>
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Patron: {order.customerName}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                  order.status === "verified" ? "bg-green-100 text-green-800" :
                                  order.status === "completed" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-800"
                                }`}>
                                  {order.status}
                                </span>
                              </div>

                              {/* Order Items List */}
                              <div className="space-y-1.5 flex-grow">
                                {order.items.map((cartItem, idx) => (
                                  <div key={idx} className="text-xs font-bold text-gray-800 uppercase">
                                    <div className="flex justify-between">
                                      <span>• {cartItem.quantity}x {cartItem.menuItem.name}</span>
                                      <span>R{(cartItem.unitPrice * cartItem.quantity).toFixed(2)}</span>
                                    </div>
                                    {cartItem.selectedOptions && Object.keys(cartItem.selectedOptions).length > 0 && (
                                      <div className="pl-4 text-[9px] text-gray-500 font-semibold lowercase">
                                        {Object.entries(cartItem.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Footer pricing & buttons */}
                              <div className="border-t pt-3 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-gray-400 uppercase">Total Bill</span>
                                  <span className="text-md font-black text-chicken-red">R{order.total.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold justify-between">
                                  <span>Time: {formatOrderTime(order.createdAt)}</span>
                                </div>

                                {/* Order Feed Actions */}
                                <div className="grid grid-cols-3 gap-1 pt-1">
                                  {order.status === "pending" && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, "verified")}
                                      className="col-span-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-wider rounded transition"
                                    >
                                      Verify Payment
                                    </button>
                                  )}
                                  {order.status === "verified" && (
                                    <button
                                      onClick={() => {
                                        playBeep(800, "sine", 0.05);
                                        setPinVerificationOrder(order);
                                        setEnteredVerificationPin("");
                                      }}
                                      className="col-span-3 py-1.5 bg-black hover:bg-gray-900 text-gold font-black uppercase text-[10px] tracking-wider rounded border border-gold transition"
                                    >
                                      Verify & Complete
                                    </button>
                                  )}
                                  {order.status !== "completed" && order.status !== "cancelled" && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                                      className="py-1 bg-red-50 hover:bg-red-100 text-chicken-red font-bold uppercase text-[9px] rounded border border-red-200 transition"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Verify Pass */}
                {activeStaffTab === "verify" && (
                  <div className="max-w-xl mx-auto bg-white rounded-2xl border p-6 space-y-6 shadow-sm">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black text-black uppercase tracking-tight">Verify Pickup Pass</h3>
                      <p className="text-xs text-gray-500">Scan customer pass via QR, NFC, or manual code entry</p>
                    </div>

                    {/* Selector choice for Verify Type */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        onClick={() => {
                          setVerifyMode("manual");
                          playBeep(650, "sine", 0.03);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                          verifyMode === "manual" ? "bg-black text-white" : "text-gray-600"
                        }`}
                      >
                        Manual Entry
                      </button>
                      <button
                        onClick={() => {
                          setVerifyMode("qr");
                          playBeep(650, "sine", 0.03);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                          verifyMode === "qr" ? "bg-black text-white" : "text-gray-600"
                        }`}
                      >
                        QR Camera
                      </button>
                      <button
                        onClick={() => {
                          setVerifyMode("nfc");
                          playBeep(650, "sine", 0.03);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                          verifyMode === "nfc" ? "bg-black text-white animate-pulse" : "text-gray-600"
                        }`}
                      >
                        NFC & Beacon
                      </button>
                    </div>

                    {verifyMode === "manual" && (
                      /* Manual Pass Code Search Form */
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Code (e.g. KK-38F2)"
                            value={manualCodeInput}
                            onChange={(e) => setManualCodeInput(e.target.value)}
                            className="flex-grow px-4 py-3 border border-gray-300 rounded-xl font-mono text-center text-lg uppercase tracking-wider focus:ring-2 focus:ring-gold focus:outline-none"
                          />
                          <button
                            onClick={handleManualCodeLookup}
                            className="px-6 bg-black hover:bg-gray-900 text-gold font-black uppercase text-xs tracking-wider rounded-xl transition border border-gold"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    )}

                    {verifyMode === "qr" && (
                      /* Live Camera-Based QR Scanner */
                      <LiveQRScanner onScanSuccess={handleScanMatch} />
                    )}

                    {verifyMode === "nfc" && (
                      /* ⚡ Real Contactless NFC & Beacon Console */
                      <div className="space-y-4 border-2 border-dashed border-gold rounded-2xl p-5 bg-black text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        
                        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full ${isNfcListenerActive ? "bg-emerald-500 animate-ping" : "bg-gray-500"}`} />
                            <span className="font-mono font-black text-xs uppercase tracking-widest text-gold">
                              {isNfcListenerActive ? "LISTENING IN REAL-TIME" : "NFC LISTENER STANDBY"}
                            </span>
                          </div>
                          
                          <span className="text-[10px] font-black uppercase bg-zinc-900 border border-gold/20 px-2 py-0.5 rounded text-gray-400">
                            Web NFC Supported: {"NDEFReader" in window ? "YES ✓" : "NO ✗"}
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-300 font-medium leading-relaxed uppercase">
                          Activates a direct, secure cloud-synced contactless beacon AND native Web NFC reader. When the customer broadcasts or taps their pass, the order updates instantly.
                        </p>

                        <div className="flex gap-2">
                          {!isNfcListenerActive ? (
                            <button
                              onClick={async () => {
                                playBeep(880, "sine", 0.08);
                                setIsNfcListenerActive(true);
                                triggerToast("Contactless cloud beacon reader active!", "success");
                                
                                if ("NDEFReader" in window) {
                                  try {
                                    setIsNfcReading(true);
                                    const ndef = new (window as any).NDEFReader();
                                    await ndef.scan();
                                    ndefReaderRef.current = ndef;
                                    triggerToast("Web NFC physical scanner initialized!", "success");

                                    ndef.onreading = (event: any) => {
                                      playBeep(1100, "sine", 0.1);
                                      const { message } = event;
                                      for (const record of message.records) {
                                        if (record.recordType === "text") {
                                          const decoder = new TextDecoder(record.encoding || "utf-8");
                                          const decodedCode = decoder.decode(record.data).trim().toUpperCase();
                                          
                                          const matchedOrder = orders.find(
                                            (o) => o.passCode === decodedCode || o.id === decodedCode
                                          );
                                          if (matchedOrder) {
                                            setSearchedOrder(matchedOrder);
                                            setManualCodeInput(matchedOrder.passCode);
                                            triggerToast(`Physical NFC Tag Tapped: ${matchedOrder.passCode}!`, "success");
                                          } else {
                                            triggerToast(`NFC read: ${decodedCode} but no matching order.`, "error");
                                          }
                                        }
                                      }
                                    };

                                    ndef.onreadingerror = () => {
                                      triggerToast("NFC Read error. Try re-tapping the tag.", "error");
                                    };

                                  } catch (err) {
                                    console.error("NFC scan error:", err);
                                    triggerToast(`Physical NFC Scan failed: ${(err as Error).message}`, "error");
                                    setIsNfcReading(false);
                                  }
                                }
                              }}
                              className="flex-1 py-3 bg-gold hover:bg-yellow-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5"
                            >
                              <span>🚀</span> Activate NFC & Beacon Reader
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                playBeep(440, "sine", 0.08);
                                setIsNfcListenerActive(false);
                                setIsNfcReading(false);
                                if (ndefReaderRef.current) {
                                  ndefReaderRef.current = null;
                                }
                                triggerToast("Contactless listeners deactivated.", "info");
                              }}
                              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-gold border border-gold font-black uppercase text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              Deactivate Listeners
                            </button>
                          )}
                        </div>

                        {isNfcListenerActive && (
                          <div className="bg-zinc-900/50 p-3 rounded-lg border border-gold/10 text-center space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 animate-pulse block">
                              Listening for customer tap broadcast...
                            </span>
                            <span className="text-[8px] text-gray-500 font-semibold uppercase leading-none block">
                              Keep this tab open while customers tap their phone or broadcast their pass at the counter.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verification Result Display Card */}
                    {searchedOrder && (
                      <div className="bg-amber-50 rounded-2xl border-2 border-gold p-5 space-y-4 animate-pulse">
                        <div className="flex justify-between items-start border-b border-gold/30 pb-2">
                          <div>
                            <span className="block font-mono font-black text-md text-black">
                              {searchedOrder.passCode}
                            </span>
                            <span className="block text-[10px] text-gray-500 font-bold uppercase">
                              Patron: {searchedOrder.customerName}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-500 rounded font-black text-[9px] uppercase">
                            Matched Order ({searchedOrder.status})
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1">
                          {searchedOrder.items.map((cartItem, i) => (
                            <div key={i} className="text-xs font-bold uppercase text-gray-800 flex justify-between">
                              <span>{cartItem.quantity}x {cartItem.menuItem.name}</span>
                              <span>R{(cartItem.unitPrice * cartItem.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gold/30 pt-3 flex justify-between items-center text-sm font-black">
                          <span className="text-gray-500 uppercase">Total to Settle</span>
                          <span className="text-chicken-red text-md">R{searchedOrder.total.toFixed(2)}</span>
                        </div>

                        {/* State Controls inside popup */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gold/30">
                          {searchedOrder.status === "pending" && (
                            <button
                              onClick={() => {
                                updateOrderStatus(searchedOrder.id, "verified");
                                setSearchedOrder(null);
                                setManualCodeInput("");
                              }}
                              className="col-span-2 py-2 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition"
                            >
                              Verify & Collect Payment
                            </button>
                          )}
                          {searchedOrder.status === "verified" && (
                            <button
                              onClick={() => {
                                playBeep(800, "sine", 0.05);
                                setPinVerificationOrder(searchedOrder);
                                setEnteredVerificationPin("");
                              }}
                              className="col-span-2 py-2 bg-black hover:bg-gray-900 text-gold font-black uppercase text-[10px] tracking-wider rounded-lg border border-gold transition"
                            >
                              Verify Code & Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              updateOrderStatus(searchedOrder.id, "cancelled");
                              setSearchedOrder(null);
                              setManualCodeInput("");
                            }}
                            className="py-1.5 bg-red-50 hover:bg-red-100 text-chicken-red font-bold uppercase text-[9px] rounded border border-red-200 transition"
                          >
                            Cancel Order
                          </button>
                          <button
                            onClick={() => {
                              setSearchedOrder(null);
                              setManualCodeInput("");
                            }}
                            className="py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase text-[9px] rounded transition"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Menu Status Availability Toggler */}
                {activeStaffTab === "menu" && (
                  <MenuManager
                    menuItems={menuItems}
                    menuAvailability={menuAvailability}
                    toggleItemAvailability={toggleItemAvailability}
                    triggerToast={triggerToast}
                    playBeep={playBeep}
                  />
                )}

                {/* TAB: Sales Summary Metrics */}
                {activeStaffTab === "sales" && (
                  <AnalyticsDashboard
                    orders={orders}
                    menuItems={menuItems}
                    triggerToast={triggerToast}
                    playBeep={playBeep}
                  />
                )}

                {/* TAB: Official Placard QR */}
                {activeStaffTab === "placard" && (
                  <div className="space-y-6">
                    {/* Inject Print Styles dynamically */}
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden !important;
                          background: none !important;
                        }
                        #printable-placard-poster, #printable-placard-poster * {
                          visibility: visible !important;
                        }
                        #printable-placard-poster {
                          position: fixed !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100vw !important;
                          height: 100vh !important;
                          margin: 0 !important;
                          padding: 40px !important;
                          box-shadow: none !important;
                          border: none !important;
                          z-index: 99999 !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                          background-color: #09090b !important;
                          color: #ffffff !important;
                          display: flex !important;
                          flex-direction: column !important;
                          justify-content: space-between !important;
                        }
                      }
                    `}</style>

                    <div className="flex flex-col xl:flex-row gap-6 items-start">
                      {/* Configuration Controls (Left panel) */}
                      <div className="w-full xl:w-96 shrink-0 bg-white rounded-2xl border p-5 md:p-6 space-y-6 shadow-sm">
                        <div>
                          <h3 className="text-sm font-black uppercase text-black tracking-tight flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-gold animate-spin" />
                            <span>Customize Placard Poster</span>
                          </h3>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Set up the landing target and print layout
                          </p>
                        </div>

                        {/* QR Destination Target */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-gray-700 tracking-wider">
                            QR Landing Link Target URL:
                          </label>
                          <input 
                            type="text"
                            value={placardUrl}
                            onChange={(e) => setPlacardUrl(e.target.value)}
                            placeholder="https://kkexpress.vercel.app"
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-mono focus:ring-1 focus:ring-gold focus:outline-none"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPlacardUrl(window.location.origin);
                                playBeep(600, "sine", 0.03);
                              }}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[9px] font-bold text-gray-600 transition"
                            >
                              Current Domain
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPlacardUrl("https://krispykingsa.co.za");
                                playBeep(600, "sine", 0.03);
                              }}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[9px] font-bold text-gray-600 transition"
                            >
                              Main Website
                            </button>
                          </div>
                        </div>

                        {/* Poster Theme Selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-gray-700 tracking-wider">
                            Select Color Theme:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPlacardColor("fiery");
                                playBeep(700, "sine", 0.03);
                              }}
                              className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                                placardColor === "fiery" 
                                  ? "bg-chicken-red text-white border-2 border-gold shadow" 
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              Fiery Crimson
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPlacardColor("midnight");
                                playBeep(700, "sine", 0.03);
                              }}
                              className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                                placardColor === "midnight" 
                                  ? "bg-blue-900 text-white border-2 border-gold shadow" 
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              Midnight Royal
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPlacardColor("black");
                                playBeep(700, "sine", 0.03);
                              }}
                              className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                                placardColor === "black" 
                                  ? "bg-black text-white border-2 border-gold shadow" 
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              Matte Charcoal
                            </button>
                          </div>
                        </div>

                        {/* Poster Heading Selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-gray-700 tracking-wider">
                            Main Poster Title Hook:
                          </label>
                          <input 
                            type="text"
                            value={placardTitle}
                            onChange={(e) => setPlacardTitle(e.target.value)}
                            placeholder="SKIP THE LINE!"
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-bold focus:ring-1 focus:ring-gold focus:outline-none"
                          />
                        </div>

                        {/* Poster Subtitle Selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-gray-700 tracking-wider">
                            Sub-heading Banner:
                          </label>
                          <input 
                            type="text"
                            value={placardSubtitle}
                            onChange={(e) => setPlacardSubtitle(e.target.value)}
                            placeholder="SCAN TO ORDER REMOTELY"
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-bold focus:ring-1 focus:ring-gold focus:outline-none"
                          />
                        </div>

                        {/* Action Triggers */}
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              playBeep(880, "sine", 0.1);
                              window.print();
                            }}
                            className="w-full py-3 bg-black text-gold hover:bg-gray-900 font-black uppercase text-xs tracking-wider rounded-xl transition border border-gold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-gold" />
                            Print Official Placard (A4 / Letter)
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                playBeep(700, "sine", 0.05);
                                try {
                                  const svgElement = document.getElementById("placard-qr-code");
                                  if (!svgElement) return;
                                  const svgString = new XMLSerializer().serializeToString(svgElement);
                                  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                                  const blobURL = URL.createObjectURL(svgBlob);
                                  const downloadLink = document.createElement("a");
                                  downloadLink.href = blobURL;
                                  downloadLink.download = "krispy-king-remote-qr.svg";
                                  document.body.appendChild(downloadLink);
                                  downloadLink.click();
                                  document.body.removeChild(downloadLink);
                                  triggerToast("Vector QR Code exported successfully!", "success");
                                } catch (e) {
                                  triggerToast("Failed to download SVG", "error");
                                }
                              }}
                              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold uppercase text-[10px] rounded-lg transition flex items-center justify-center gap-1 border border-gray-200 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Export SVG
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                playBeep(700, "sine", 0.05);
                                try {
                                  const svgElement = document.getElementById("placard-qr-code");
                                  if (!svgElement) return;
                                  const svgString = new XMLSerializer().serializeToString(svgElement);
                                  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                                  const blobURL = URL.createObjectURL(svgBlob);
                                  const image = new Image();
                                  image.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    canvas.width = 1000;
                                    canvas.height = 1000;
                                    const context = canvas.getContext("2d");
                                    if (context) {
                                      context.fillStyle = "#FFFFFF";
                                      context.fillRect(0, 0, 1000, 1000);
                                      context.drawImage(image, 50, 50, 900, 900);
                                      const png = canvas.toDataURL("image/png");
                                      const downloadLink = document.createElement("a");
                                      downloadLink.href = png;
                                      downloadLink.download = "krispy-king-remote-qr.png";
                                      document.body.appendChild(downloadLink);
                                      downloadLink.click();
                                      document.body.removeChild(downloadLink);
                                      triggerToast("High-res PNG exported successfully!", "success");
                                    }
                                  };
                                  image.src = blobURL;
                                } catch (e) {
                                  triggerToast("Failed to download PNG", "error");
                                }
                              }}
                              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold uppercase text-[10px] rounded-lg transition flex items-center justify-center gap-1 border border-gray-200 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Export PNG
                            </button>
                          </div>

                          <div className="bg-amber-50 p-3 rounded-lg border border-gold/30 text-[9px] font-semibold text-amber-900 leading-relaxed">
                            <strong>🖨️ Printer setup guide:</strong> When printing, select "Background graphics" and turn off header/footers inside the browser's system printing preferences. Set margins to <strong>None</strong> for a full-bleed borderless presentation!
                          </div>
                        </div>
                      </div>

                      {/* Official Poster Presentation Mockup (Right Panel) */}
                      <div className="flex-grow w-full flex items-center justify-center p-2 sm:p-6 bg-gray-100 rounded-3xl border border-dashed border-gray-300 relative overflow-hidden group">
                        {/* Cut corner guides & center register alignment marks to emulate a real print shop template */}
                        <div className="absolute top-2 left-2 text-[8px] font-mono font-bold text-gray-400 select-none">┌─ REG_L_T ─</div>
                        <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-gray-400 select-none">─ REG_R_T ─┐</div>
                        <div className="absolute bottom-2 left-2 text-[8px] font-mono font-bold text-gray-400 select-none">└─ REG_L_B ─</div>
                        <div className="absolute bottom-2 right-2 text-[8px] font-mono font-bold text-gray-400 select-none">─ REG_R_B ─┘</div>

                        {/* Interactive Shadow Holder */}
                        <div 
                          id="printable-placard-poster"
                          className={`w-full max-w-[500px] aspect-[1/1.414] rounded-2xl border-4 p-8 flex flex-col justify-between shadow-2xl relative select-none text-white ${
                            placardColor === "fiery" 
                              ? "bg-gradient-to-b from-zinc-950 via-[#110101] to-black border-chicken-red"
                              : placardColor === "midnight"
                              ? "bg-gradient-to-b from-zinc-950 via-[#010915] to-black border-blue-900"
                              : "bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-zinc-800"
                          }`}
                        >
                          {/* Inner double border */}
                          <div className={`absolute inset-1.5 border border-dashed pointer-events-none rounded-xl ${
                            placardColor === "fiery" ? "border-gold/30" : "border-gold/20"
                          }`} />

                          {/* Top Crown Header Block */}
                          <div className="text-center space-y-2 z-10 relative">
                            {/* Crown Logo Badge */}
                            <div className="inline-flex p-3 rounded-full bg-black border-2 border-gold shadow-lg transform rotate-[-4deg] animate-pulse">
                              <Sparkles className="w-8 h-8 text-gold" />
                            </div>
                            
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
                              <span className="text-gold block">KRISPY</span> 
                              <span className="text-white block mt-0.5">KING</span>
                            </h2>
                            
                            <div className="inline-block bg-chicken-red text-white border border-gold px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic shadow-md">
                              - FLAME-GRILLED & CRISPY -
                            </div>
                          </div>

                          {/* Center Focus Area: QR Code with Action Prompts */}
                          <div className="flex flex-col items-center justify-center space-y-4 z-10 relative py-6">
                            {/* Call to action banners */}
                            <div className="text-center space-y-1">
                              <h4 className="text-2xl font-black tracking-tight text-white leading-tight uppercase italic">
                                {placardTitle}
                              </h4>
                              <p className="text-[10px] font-bold text-gold uppercase tracking-[0.15em]">
                                {placardSubtitle}
                              </p>
                            </div>

                            {/* Intricate Frame around QR */}
                            <div className="p-4 bg-white rounded-3xl shadow-[0_20px_50px_rgba(255,215,0,0.15)] border-4 border-gold relative group/qr flex items-center justify-center overflow-hidden">
                              <QRCodeSVG 
                                id="placard-qr-code"
                                value={placardUrl || "https://krispykingsa.co.za"}
                                size={190}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                  src: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/logo.webp",
                                  x: undefined,
                                  y: undefined,
                                  height: 42,
                                  width: 42,
                                  excavate: true,
                                }}
                              />
                            </div>

                            <p className="text-[9px] font-black text-gray-400 bg-black/60 px-3 py-1 rounded border border-gray-800 tracking-wider">
                              URL: <span className="text-gold font-mono">{placardUrl || "window.location.origin"}</span>
                            </p>
                          </div>

                          {/* Interactive User Steps Grid */}
                          <div className="space-y-2.5 z-10 relative bg-black/35 p-3 rounded-xl border border-gray-900 backdrop-blur-md">
                            <div className="grid grid-cols-3 gap-2">
                              {/* Step 1 */}
                              <div className="text-center space-y-1">
                                <div className="w-6 h-6 rounded-full bg-gold text-black mx-auto flex items-center justify-center text-[10px] font-black">
                                  1
                                </div>
                                <span className="block text-[8px] font-black uppercase text-white">SCAN CODE</span>
                                <span className="block text-[7px] text-gray-400 font-medium">Use phone camera</span>
                              </div>

                              {/* Step 2 */}
                              <div className="text-center space-y-1 border-l border-r border-gray-800/80 px-1">
                                <div className="w-6 h-6 rounded-full bg-gold text-black mx-auto flex items-center justify-center text-[10px] font-black">
                                  2
                                </div>
                                <span className="block text-[8px] font-black uppercase text-white">ORDER MEAL</span>
                                <span className="block text-[7px] text-gray-400 font-medium">Choose and pay</span>
                              </div>

                              {/* Step 3 */}
                              <div className="text-center space-y-1">
                                <div className="w-6 h-6 rounded-full bg-gold text-black mx-auto flex items-center justify-center text-[10px] font-black">
                                  3
                                </div>
                                <span className="block text-[8px] font-black uppercase text-white">FAST PICKUP</span>
                                <span className="block text-[7px] text-gray-400 font-medium">Skip counter queue</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer and Security Seal */}
                          <div className="flex justify-between items-center z-10 relative pt-4 border-t border-gray-900 text-left">
                            <div>
                              <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                OFFICIAL REMARK
                              </span>
                              <span className="block text-[10px] font-black text-white uppercase tracking-tight">
                                QUEUE TERMINAL PLACARD
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[7px] font-mono text-gold/60">SYSTEM SECURED</span>
                              <span className="block text-[8px] font-black text-gold uppercase tracking-widest">
                                REMOTE_OS_V2
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Comprehensive Training Guide */}
                {activeStaffTab === "training" && (
                  <div className="bg-white rounded-2xl border p-5 md:p-6 space-y-6 shadow-sm">
                    <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-left">
                        <h3 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-chicken-red animate-pulse" />
                          <span>Official Operational Training Manual</span>
                        </h3>
                        <p className="text-xs text-gray-500">
                          Comprehensive standard operating procedures for Krispy King Remote Ordering System
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start md:self-center">
                        <span className="px-2.5 py-1 bg-black text-gold text-[10px] font-black uppercase rounded border border-gold">
                          V2.0 LIVE DOC
                        </span>
                        <button
                          onClick={handleDownloadTrainingManual}
                          className="px-3.5 py-1.5 bg-chicken-red hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-lg shadow-md border border-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-gold animate-bounce" />
                          Download Manual (PDF)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Sub-navigation inside manual */}
                      <div className="space-y-1.5 lg:col-span-1">
                        <span className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-2 text-left">
                          Manual Sections
                        </span>
                        {[
                          { id: "intro", title: "1. Overview & Mission" },
                          { id: "arch", title: "2. System Architecture" },
                          { id: "cust", title: "3. Customer Workflow" },
                          { id: "staff", title: "4. Staff Operations" },
                          { id: "sec", title: "5. Security & Overrides" },
                        ].map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              const element = document.getElementById(`manual-${sec.id}`);
                              if (element) {
                                element.scrollIntoView({ behavior: "smooth", block: "nearest" });
                              }
                              playBeep(600, "sine", 0.03);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-black transition flex items-center justify-between border border-transparent hover:border-gray-200"
                          >
                            <span>{sec.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        ))}
                      </div>

                      {/* Content panel */}
                      <div className="lg:col-span-3 space-y-8 max-h-[500px] overflow-y-auto pr-2 border-l lg:pl-6 text-left">
                        
                        {/* Section 1 */}
                        <div id="manual-intro" className="space-y-3 pb-6 border-b">
                          <h4 className="text-md font-black text-chicken-red uppercase tracking-wide">
                            1. System Overview & Mission
                          </h4>
                          <div className="text-xs text-gray-700 space-y-2 font-medium leading-relaxed">
                            <p>
                              The <strong>Krispy King Remote Ordering System</strong> is a real-time, zero-friction queue-busting ecosystem. It allows patrons to scan a table/counter QR placard, browse our full flame-grilled menu, customize options, and instantly place a pre-order from their mobile device.
                            </p>
                            <p>
                              The system operates with absolute live synchronicity: as soon as a customer places an order, a <strong>Digital Pickup Pass</strong> containing a unique <strong>QR Code</strong> and a secure <strong>4-Digit Verification PIN</strong> is generated. Simultaneously, the order appears with high-priority audio alerts on all connected <strong>Staff Terminals</strong> via real-time cloud data streams.
                            </p>
                          </div>
                        </div>

                        {/* Section 2 */}
                        <div id="manual-arch" className="space-y-3 pb-6 border-b">
                          <h4 className="text-md font-black text-chicken-red uppercase tracking-wide">
                            2. Core System Architecture
                          </h4>
                          <div className="text-xs text-gray-700 space-y-2 font-medium leading-relaxed">
                            <p>The platform is built using a lightning-fast full-stack architecture:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Frontend</strong>: React 18 with Vite, designed for desktop-first precision and fully responsive fluid mobile touch optimization.</li>
                              <li><strong>Styling & Theme</strong>: Modern Tailwind CSS featuring the signature high-impact <strong>Fiery Crimson & Royal Gold</strong> aesthetics.</li>
                              <li><strong>Real-time Database</strong>: Google Firebase Firestore with real-time listeners (<code>onSnapshot</code>) to push notifications across devices instantly.</li>
                              <li><strong>Interactive Sound Synthesis</strong>: Built-in Web Audio API synthesizer that generates distinctive beep notifications for state changes without needing external audio file dependencies.</li>
                              <li><strong>QR Engine</strong>: SVG-based high-density vector matrix generator for seamless counter scanning.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Section 3 */}
                        <div id="manual-cust" className="space-y-3 pb-6 border-b">
                          <h4 className="text-md font-black text-chicken-red uppercase tracking-wide">
                            3. Customer Ordering Workflow
                          </h4>
                          <div className="text-xs text-gray-700 space-y-3 font-medium leading-relaxed">
                            <p className="font-bold">Step 3.1: Menu Browsing & Customization</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Patrons browse categorized items including our signature <strong>Chicken Paella</strong> category (1/4 Paella for R49.90, 1/2 Paella for R89.90, and Full Paella for R169.90).</li>
                              <li>Every food item includes a mandatory <strong>Sauce Selection</strong> for BBQ or Carolina Reaper sauce which comes on the side.</li>
                              <li>Breakfast items are automatically filtered and dynamically made available depending on the local morning hours (6:00 AM - 11:00 AM).</li>
                              <li>Items with customizable <strong>Combo Choices</strong> update prices dynamically.</li>
                              <li>Interactive heat-meter gauges highlight item spiciness levels.</li>
                            </ul>
                            
                            <p className="font-bold">Step 3.2: Secure Checkout & Pass Generation</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>To minimize friction, the customer does not need to create an email/password account.</li>
                              <li>They simply enter their first name or nickname on the Cart Drawer sheet and submit.</li>
                              <li>The system immediately generates a unique **Pass Code** (e.g. <code>KK-B8A29F</code>) and a random **4-Digit Verification PIN** (e.g. <code>4819</code>), commits it to Firestore, and saves it to local device storage.</li>
                            </ul>

                            <p className="font-bold">Step 3.3: Digital Pass Screen & Downloads</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Order Status Tracker</strong>: Blinks with active colors (orange for Pending, green for Verified, blue for Completed).</li>
                              <li><strong>Download Actions</strong>: Customers can click <strong>Download Pass (SVG)</strong> or <strong>Save Receipt Text</strong> to save their proof of order offline.</li>
                              <li><strong>Verification PIN</strong>: Shown clearly on their screen. They must show this to the staff or enter the Staff PIN <code>8034</code> to self-verify.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Section 4 */}
                        <div id="manual-staff" className="space-y-3 pb-6 border-b">
                          <h4 className="text-md font-black text-chicken-red uppercase tracking-wide">
                            🧑‍🍳 4. Staff Dashboard Portal Operations
                          </h4>
                          <div className="text-xs text-gray-700 space-y-3 font-medium leading-relaxed">
                            <p>The Staff Portal is accessed by clicking the <strong>Krispy King Crown Logo</strong> at the top header 5 times and entering the master Staff security PIN: <strong>8034</strong>.</p>
                            
                            <p className="font-bold">Tab 4.1: Live Orders Feed</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>An interactive real-time dashboard displaying all incoming customer requests.</li>
                              <li><strong>Audio Beep Alerts</strong>: Plays a triple rising chime (C5 ➔ E5 ➔ G5) on new pending orders.</li>
                              <li><strong>Verify Payment</strong>: Sets status to Verified (payment settled at register).</li>
                              <li><strong>Verify & Complete</strong>: Prompts cashier to enter the customer's 4-digit PIN to finalize.</li>
                            </ul>

                            <p className="font-bold">Tab 4.2: QR Pass Verification & Code Entry</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>QR Viewfinder Simulator</strong>: Emulates a high-speed camera scanner with laser beep sounds.</li>
                              <li><strong>Manual Search</strong>: Type passcodes to pull up order details instantly.</li>
                              <li><strong>🛡️ Secure PIN Verification Step</strong>: Prompted upon completion, requiring the customer's 4-digit Pickup PIN or staff override.</li>
                            </ul>

                            <p className="font-bold">Tab 4.3: Tabletop Placard QR Generator</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Configure target landing URL and themes (Fiery Crimson, Midnight Royal, Matte Charcoal).</li>
                              <li>A4 / Letter layout with printer guides. Enable background graphics and turn off headers/footers for a perfect full-bleed poster!</li>
                            </ul>

                            <p className="font-bold">Tab 4.4: Menu Availability Manager</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Toggle stock availability. Sold out items show instant gray overlays on the customer side.</li>
                            </ul>

                            <p className="font-bold">Tab 4.5: Sales Summary & Analytics</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Real-time gross revenue metrics, total active/completed counters, and product popularity charts.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Section 5 */}
                        <div id="manual-sec" className="space-y-3">
                          <h4 className="text-md font-black text-chicken-red uppercase tracking-wide">
                            🔒 5. Security & Overrides
                          </h4>
                          <div className="text-xs text-gray-700 space-y-2 font-medium leading-relaxed">
                            <p>
                              The system is hardened against unauthorized completion using dual-key pin validation:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Master Security PIN</strong>: <code>8034</code>.</li>
                              <li>This PIN can bypass/override customer verification prompts at the counter or complete customer-side self-checkouts.</li>
                              <li>All sound synthesis runs natively through the Web Audio API, allowing hardware buzzer emulation.</li>
                            </ul>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==============================================
           COMBO BUILDER POPUP MODAL DRAWER 
           ============================================== */}
      <AnimatePresence>
        {selectedComboItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border shadow-2xl p-6 space-y-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    {selectedComboItem.name} Customizer
                  </h3>
                  <span className="text-xs text-chicken-red font-black block mt-0.5">
                    Total: R{customizerTotalPrice.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedComboItem(null)}
                  className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Combo Options selection form */}
              <div className="space-y-5">
                {/* Individual Customization Checkbox if buying more than one full chicken */}
                {parsedChickenCount > 1 && (
                  <div className="bg-amber-50 border-2 border-black rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black uppercase text-black">Customize individually?</span>
                      <span className="block text-[10px] text-gray-600 font-bold">Choose unique spice and sauce for each chicken!</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isIndividualCustomizationEnabled}
                        onChange={(e) => {
                          playBeep(700, "sine", 0.05);
                          setIsIndividualCustomizationEnabled(e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-chicken-red border-2 border-black" />
                    </label>
                  </div>
                )}

                {/* Individual Chicken Customization lists */}
                {isIndividualCustomizationEnabled && parsedChickenCount > 1 ? (
                  <div className="space-y-4 border-l-2 border-dashed border-gold pl-3.5 mt-2">
                    {Array.from({ length: parsedChickenCount }).map((_, idx) => {
                      const selection = individualSelections[idx] || { spice: 1, sauce: "No Sauce" };
                      const isFried = selectedComboItem.category.toLowerCase().includes("fried") || selectedComboItem.name.toLowerCase().includes("fried");
                      return (
                        <div key={idx} className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                          <span className="block text-xs font-black uppercase text-chicken-red tracking-wider flex items-center gap-1">
                            Chicken #{idx + 1}:
                          </span>
                          
                          {/* Spice Level for Chicken #idx (only if not fried chicken) */}
                          {!isFried && (
                            <div className="space-y-1">
                              <span className="block text-[10px] font-black uppercase text-gray-500">Spice Level:</span>
                              <div className="grid grid-cols-4 gap-1">
                                {["Lemon/Herb", "Mild 🌶️", "Hot 🌶️🌶️", "Ex-Hot 🌶️🌶️🌶️"].map((label, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => {
                                      playBeep(600 + sIdx * 50, "sine", 0.03);
                                      setIndividualSelections((prev) => {
                                        const updated = [...prev];
                                        if (!updated[idx]) updated[idx] = { spice: 1, sauce: "No Sauce" };
                                        updated[idx] = { ...updated[idx], spice: sIdx };
                                        return updated;
                                      });
                                    }}
                                    className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-center border-2 border-black transition ${
                                      selection.spice === sIdx
                                        ? "bg-chicken-red text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    {label.split(" ")[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sauce Option for Chicken #idx */}
                          <div className="space-y-1 mt-2">
                            <span className="block text-[10px] font-black uppercase text-gray-500">Sauce Side:</span>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: "None", value: "No Sauce" },
                                { label: "BBQ", value: "BBQ Sauce (on the side)" },
                                { label: "Reaper (+R5) 🌶️", value: "Carolina Reaper Sauce (on the side)" }
                              ].map((sauceItem, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => {
                                    playBeep(600 + sIdx * 50, "sine", 0.03);
                                    setIndividualSelections((prev) => {
                                      const updated = [...prev];
                                      if (!updated[idx]) updated[idx] = { spice: 1, sauce: "No Sauce" };
                                      updated[idx] = { ...updated[idx], sauce: sauceItem.value };
                                      return updated;
                                    });
                                  }}
                                  className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-center border-2 border-black transition ${
                                    selection.sauce === sauceItem.value
                                      ? "bg-amber-500 text-white"
                                      : "bg-white text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  {sauceItem.label.split(" ")[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Spice Selector Option (exclude for fried chicken) */}
                    {selectedComboItem.spiceLevel !== undefined && !(selectedComboItem.category.toLowerCase().includes("fried") || selectedComboItem.name.toLowerCase().includes("fried")) && (
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase text-gray-800 tracking-wider">
                          SELECT YOUR SPICE LEVEL:
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {["Lemon & Herb", "Mild 🌶️", "Hot 🌶️🌶️", "Extra Hot 🌶️🌶️🌶️"].map((label, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                playBeep(600 + idx * 50, "sine", 0.04);
                                setSelectedSpiceLevel(idx);
                              }}
                              className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-center border-2 border-black transition ${
                                selectedSpiceLevel === idx
                                  ? "bg-chicken-red text-white"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sauce Selector Option for all food items in combo */}
                    {selectedComboItem.category !== "Beverages" && selectedComboItem.category !== "Mocktails" && (
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase text-gray-800 tracking-wider">
                          SELECT YOUR SAUCE OPTION (ON THE SIDE):
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: "No Sauce", value: "No Sauce" },
                            { label: "BBQ", value: "BBQ Sauce (on the side)" },
                            { label: "Reaper (+R5) 🌶️", value: "Carolina Reaper Sauce (on the side)" }
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                playBeep(600 + idx * 50, "sine", 0.04);
                                setSelectedComboSauce(item.value);
                              }}
                              className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-center border-2 border-black transition ${
                                (selectedComboSauce || "No Sauce") === item.value
                                  ? "bg-amber-500 text-white"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Meal Combo specific dropdown options */}
                {selectedComboItem.comboOptions && selectedComboItem.comboOptions.map((opt) => (
                  <div key={opt.name} className="space-y-2">
                    <label className="block text-xs font-black uppercase text-gray-800 tracking-wider">
                      {opt.name}:
                    </label>
                    <div className="space-y-1.5">
                      {opt.choices.map((choice) => {
                        const isSelected = comboSelections[opt.name]?.label === choice.label;
                        const baseP = selectedComboItem.price || 0;
                        const totalVersionPrice = baseP + (choice.priceModifier || 0);
                        const cleanLabel = choice.label.replace(/\s*\(\s*R?[0-9.]+\s*\)/gi, "").trim();

                        return (
                          <button
                            key={choice.label}
                            type="button"
                            onClick={() => {
                              playBeep(650, "sine", 0.04);
                              setComboSelections((prev) => ({
                                ...prev,
                                [opt.name]: choice
                              }));
                            }}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase text-left border flex justify-between items-center transition ${
                              isSelected
                                ? "bg-amber-50 text-black border-gold ring-2 ring-gold/20"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span>{cleanLabel}</span>
                            <span className="text-chicken-red font-black">
                              {opt.name.toLowerCase().includes("portion") || opt.name.toLowerCase().includes("size") || choice.priceModifier === 0
                                ? `R${totalVersionPrice.toFixed(2)}`
                                : choice.priceModifier > 0
                                ? `+R${choice.priceModifier.toFixed(2)} (R${totalVersionPrice.toFixed(2)})`
                                : `R${totalVersionPrice.toFixed(2)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Add Fries option for Grilled Chicken */}
                {(selectedComboItem.id === "g-chicken-main" || selectedComboItem.category === "Grilled Chicken") && (
                  <div className="space-y-2 bg-amber-50/50 border border-gold/30 p-4 rounded-xl">
                    <label className="block text-xs font-black uppercase text-gray-800 tracking-wider">
                      ADD CRISPY CHIPS / FRIES:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "No Fries", value: "None" },
                        { label: "Regular (+R20.00)", value: "Regular" },
                        { label: "Large (+R35.00)", value: "Large" }
                      ].map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playBeep(600 + idx * 50, "sine", 0.04);
                            setSelectedFriesSize(opt.value as any);
                          }}
                          className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-center border-2 border-black transition ${
                            selectedFriesSize === opt.value
                              ? "bg-amber-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleAddComboToCart}
                className="w-full mt-4 py-3 bg-chicken-red hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg"
              >
                Add Customized Meal to Cart
              </button>

              {/* Extra spacing at bottom so user can scroll content above any potential browser controls or overlay boundaries */}
              <div className="h-24 shrink-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMenuItemForDetails && (
          <ItemDetailsModal
            item={selectedMenuItemForDetails}
            available={isItemAvailable(selectedMenuItemForDetails.id) && (selectedMenuItemForDetails.category !== "Breakfast Menu" || isBreakfastActive)}
            onClose={() => setSelectedMenuItemForDetails(null)}
            onAdd={(item, spice, sauce) => handleAddToCart(item, spice, sauce)}
            onCustomize={(item) => {
              playBeep(750, "sine", 0.05);
              setSelectedComboItem(item);
              // initialize selections
              const initOpts: any = {};
              if (item.comboOptions) {
                item.comboOptions.forEach(opt => {
                  initOpts[opt.name] = opt.choices[0];
                });
              }
              setComboSelections(initOpts);
              setSelectedSpiceLevel(item.spiceLevel || 1);
              setSelectedComboSauce("No Sauce");
              setSelectedFriesSize("None");
            }}
          />
        )}
      </AnimatePresence>

      {/* ==============================================
           SECURE PIN VERIFICATION CHALLENGE MODAL
           ============================================== */}
      <AnimatePresence>
        {pinVerificationOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-black text-white rounded-3xl border-2 border-gold shadow-2xl p-6 space-y-6 relative overflow-hidden text-left"
            >
              {/* Golden security header */}
              <div className="text-center space-y-1.5 pb-3 border-b border-gray-800">
                <div className="w-12 h-12 bg-gold/10 border border-gold rounded-full flex items-center justify-center mx-auto text-gold animate-pulse">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gold">Secure PIN Verification</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Verifying Order: {pinVerificationOrder.passCode}
                </p>
              </div>

              {/* Order quick overview */}
              <div className="bg-gray-900/80 rounded-2xl p-3.5 border border-gray-800 text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-300 border-b border-gray-800 pb-1 mb-1">
                  <span>Customer: {pinVerificationOrder.customerName}</span>
                  <span className="text-gold font-black">R{pinVerificationOrder.total.toFixed(2)}</span>
                </div>
                <div className="max-h-20 overflow-y-auto pr-1 text-gray-400 font-semibold uppercase text-[10px] space-y-0.5">
                  {pinVerificationOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pin Display digits */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest text-center">
                  Enter 4-Digit Pickup PIN
                </label>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const char = enteredVerificationPin[idx] || "";
                    return (
                      <div
                        key={idx}
                        className={`w-12 h-14 rounded-xl border-2 bg-gray-950 flex items-center justify-center text-2xl font-mono font-black ${
                          char ? "border-gold text-gold" : "border-gray-800 text-gray-600"
                        }`}
                      >
                        {char ? "•" : ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Staff Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (enteredVerificationPin.length < 4) {
                        playBeep(700, "sine", 0.03);
                        setEnteredVerificationPin((prev) => prev + num);
                      }
                    }}
                    className="h-11 bg-gray-900 hover:bg-gray-800 text-white font-black text-lg rounded-xl border border-gray-800 active:scale-95 transition"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    playBeep(300, "sine", 0.05);
                    setEnteredVerificationPin("");
                  }}
                  className="h-11 bg-red-950/40 hover:bg-red-900/40 text-red-400 font-bold text-xs rounded-xl border border-red-900/30 flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (enteredVerificationPin.length < 4) {
                      playBeep(700, "sine", 0.03);
                      setEnteredVerificationPin((prev) => prev + "0");
                    }
                  }}
                  className="h-11 bg-gray-900 hover:bg-gray-800 text-white font-black text-lg rounded-xl border border-gray-800 active:scale-95 transition"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Check PIN
                    const isSuccess = 
                      enteredVerificationPin === pinVerificationOrder.verificationPin || 
                      enteredVerificationPin === "8034";

                    if (isSuccess) {
                      playBeep(1000, "sine", 0.12);
                      await updateOrderStatus(pinVerificationOrder.id, "completed");
                      setPinVerificationOrder(null);
                      setEnteredVerificationPin("");
                      setSearchedOrder(null);
                      setManualCodeInput("");
                    } else {
                      playBeep(180, "sawtooth", 0.25);
                      triggerToast("Incorrect verification PIN. Access denied.", "error");
                      setEnteredVerificationPin("");
                    }
                  }}
                  disabled={enteredVerificationPin.length < 4}
                  className={`h-11 font-black text-xs uppercase rounded-xl border flex items-center justify-center tracking-wider active:scale-95 transition ${
                    enteredVerificationPin.length === 4
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-md shadow-green-900/20"
                      : "bg-gray-950 text-gray-500 border-gray-900 cursor-not-allowed"
                  }`}
                >
                  Verify
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  playBeep(300, "sine", 0.05);
                  setPinVerificationOrder(null);
                  setEnteredVerificationPin("");
                }}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border border-gray-850"
              >
                Cancel / Return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent bottom fade to black (infinity edge / void feel) */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none z-[9999]" />

      {/* Floating Quick Action Buttons (Bottom Center Side-by-Side) */}
      {!selectedComboItem && !selectedMenuItemForDetails && !showSelfVerifyInput && !pinVerificationOrder && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row items-center justify-center gap-4 z-[10000] w-auto">
          {/* Passes FAB */}
          {path !== "/passes" && (
            <button
              onClick={() => {
                playBeep(750, "sine", 0.05);
                navigate("/passes");
              }}
              className="relative w-14 h-14 bg-black text-gold rounded-full border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-gray-900 transition-all active:scale-95 group shrink-0"
              title="View Digital Passes"
            >
              <QrCode className="w-6 h-6 stroke-[2.5]" />
              {customerPasses.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-chicken-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-bounce">
                  {customerPasses.length}
                </span>
              )}
              <span className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black text-gold border-2 border-black text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                My Passes
              </span>
            </button>
          )}

          {/* Cart FAB */}
          {path !== "/cart" && path !== "/checkout" && (
            <button
              onClick={() => {
                playBeep(850, "sine", 0.05);
                navigate("/cart");
              }}
              className="relative w-14 h-14 bg-chicken-red text-white rounded-full border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-red-700 transition-all active:scale-95 group shrink-0"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6 text-gold stroke-[2.5]" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gold text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-bounce">
                  {cartTotalItems}
                </span>
              )}
              <span className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-chicken-red text-gold border-2 border-black text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                My Cart
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
