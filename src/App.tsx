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
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MenuItem, CartItem, Order } from "./types";
import { MENU_ITEMS } from "./data";
import { MenuItemCard } from "./components/MenuItemCard";
import { ItemDetailsModal } from "./components/ItemDetailsModal";
import { QRCodeSVG } from "qrcode.react";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc 
} from "firebase/firestore";
import { db } from "./firebase";

const MENU_CATEGORIES = [
  "Grilled Chicken",
  "Fried Chicken",
  "Krispy Fried Tenders",
  "Krispy Fried Wings",
  "King Fried Burgers",
  "Karolina Reaper Wings",
  "Burgers",
  "Chicken Twista",
  "Meals & Combos",
  "Family Meals",
  "Sides & Extras",
  "Breakfast Menu",
  "Kiddies Meals",
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
      "Firing up the grills... 🔥",
      "Perfecting signature spices... 🍗",
      "Simmering Karolina Reaper sauce... 🌶️",
      "Ensuring crispy golden perfection... ✨",
      "Ready to serve South Africa's finest! 👑"
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // --- Real-Time Firestore Synced Database States ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuAvailability, setMenuAvailability] = useState<Record<string, boolean>>({});
  const [isOffline, setIsOffline] = useState<boolean>(false);

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
  const [activeStaffTab, setActiveStaffTab] = useState<"feed" | "verify" | "menu" | "sales" | "placard">("feed");

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
  const [scannerSimulationMode, setScannerSimulationMode] = useState<boolean>(false);
  const [simulatedSelectOrderId, setSimulatedSelectOrderId] = useState<string>("");

  // Total cart items count for badge bouncing
  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Handle adding non-combo items or items with plain spice
  const handleAddToCart = (item: MenuItem, spiceOver?: number) => {
    playBeep(880, "sine", 0.05);
    const resolvedSpice = spiceOver !== undefined ? spiceOver : (item.spiceLevel || 0);
    const selectedSpiceLabel = resolvedSpice === 1 ? "Mild 🌶️" : resolvedSpice === 2 ? "Hot 🌶️🌶️" : resolvedSpice === 3 ? "Extra Hot 🌶️🌶️🌶️" : "Lemon & Herb 🍋";
    
    const cartKey = resolvedSpice > 0 ? { "Spice Level": selectedSpiceLabel } : undefined;
    
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
            unitPrice: item.price
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

    // Add spice level option if any
    if (selectedComboItem.spiceLevel !== undefined) {
      const labels = ["Lemon & Herb 🍋", "Mild 🌶️", "Hot 🌶️🌶️", "Extra Hot 🌶️🌶️🌶️"];
      selectedOptionsRecord["Spice Level"] = labels[selectedSpiceLevel];
    }

    const calculatedUnitPrice = selectedComboItem.price + addedPrice;

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
    const item = MENU_ITEMS.find((m) => m.id === itemId);
    if (item && isItemAvailable(itemId)) {
      handleAddToCart(item);
    }
  };

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
      uniqueId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const orderData = {
        id: uniqueId,
        passCode: generatedPass,
        customerName: customerName.trim(),
        items: cart,
        total: cartSubtotal,
        status: "pending",
        createdAt: Date.now(),
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

  // Simulate scanning a code
  const handleSimulateScan = () => {
    if (!simulatedSelectOrderId) {
      triggerToast("Select an order to simulate", "error");
      return;
    }
    const order = orders.find((o) => o.id === simulatedSelectOrderId);
    if (order) {
      setSearchedOrder(order);
      setManualCodeInput(order.passCode);
      playBeep(1200, "sine", 0.1);
      triggerToast(`Successfully scanned ${order.passCode}!`, "success");
    }
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

      {/* Brand Header */}
      <header className="sticky top-0 z-40 bg-black text-white shadow-md border-b-4 border-gold px-4 py-3">
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

      {/* Main Content Body */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6">
        
        {/* ==============================================
             ROUTE: / (MENU BROWSER & COMBOS) 
             ============================================== */}
        {path === "/" && (
          <div className="space-y-6">
            {/* Promo Marquee */}
            <div className="bg-chicken-red text-white py-2 px-3 rounded-xl overflow-hidden shadow-sm border border-gold/40 relative flex items-center">
              <div className="absolute left-0 top-0 bottom-0 bg-chicken-red px-3 z-10 flex items-center border-r border-gold/20 font-black text-gold text-xs italic uppercase tracking-wider">
                DEALS 🔥
              </div>
              <div className="w-full overflow-hidden pl-20">
                <div className="animate-marquee text-xs font-bold uppercase tracking-wide">
                  <span>🚀 Try our newly introduced KAROLINA REAPER sauce on Grilled Chicken! Can you handle the heat? 🌶️🌶️🌶️</span>
                  <span>🍗 2 Full Chicken Family Pack for just R189.90! Save massive rands! 🍗</span>
                  <span>🍔 Smashed Burger Beef double deal R69.90 - juicy patties, melted cheese! 🍔</span>
                  <span>🍹 Fresh ice cold mocktails starting at only R39.90! Mojitos, sunrises, lemonades! 🍹</span>
                </div>
              </div>
            </div>

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

            {/* Search & Category Filter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Search input */}
                <div className="relative md:col-span-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-5 h-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search chicken, burgers, meals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent font-medium shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                    >
                      Clear
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
              <h2 className="text-xl font-black text-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <span>{activeCategory} Menu</span>
                <span className="h-1 flex-grow bg-gray-200 rounded-full"></span>
              </h2>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MENU_ITEMS.filter((item) => {
                  const matchCat = item.category === activeCategory;
                  const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
                  return matchCat && matchSearch;
                }).map((item) => {
                  const isBreakfastItem = item.category === "Breakfast Menu" || item.isBreakfast;
                  const available = isItemAvailable(item.id) && (!isBreakfastItem || isBreakfastActive);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      available={available}
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
                      }}
                      onSelect={(item) => {
                        playBeep(650, "sine", 0.03);
                        setSelectedMenuItemForDetails(item);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick Floating Cart Bar for Mobile bottom */}
            {cartTotalItems > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-30">
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
                <div className="bg-amber-50 border border-gold/40 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-orange bg-yellow-400/80 px-2 py-0.5 rounded border border-yellow-500">
                    Hungry for more? Quick Add-on
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍟</span>
                      <div>
                        <span className="block text-xs font-black uppercase text-gray-900">Add regular chips for only R32.90</span>
                        <span className="block text-[10px] text-gray-500">Perfect crisp complement to any grilled chicken meal!</span>
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
                  <div className="bg-black text-gold p-6 rounded-2xl border-2 border-chicken-red space-y-2">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Code</span>
                    <span className="block text-3xl font-mono font-black tracking-wider text-white">
                      {customerActiveOrder.passCode}
                    </span>
                    <span className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                      Name: {customerActiveOrder.customerName}
                    </span>
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

                  {/* Dynamic counter order timer */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 inline-flex items-center gap-2 text-xs font-bold text-gray-600">
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
                                      onClick={() => updateOrderStatus(order.id, "completed")}
                                      className="col-span-3 py-1.5 bg-black hover:bg-gray-900 text-gold font-black uppercase text-[10px] tracking-wider rounded border border-gold transition"
                                    >
                                      Mark Completed
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
                      <p className="text-xs text-gray-500">Scan customer QR code or enter code manually</p>
                    </div>

                    {/* Selector choice for Verify Type */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        onClick={() => {
                          setScannerSimulationMode(false);
                          playBeep(650, "sine", 0.03);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                          !scannerSimulationMode ? "bg-black text-white" : "text-gray-600"
                        }`}
                      >
                        Manual Entry
                      </button>
                      <button
                        onClick={() => {
                          setScannerSimulationMode(true);
                          playBeep(650, "sine", 0.03);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                          scannerSimulationMode ? "bg-black text-white animate-pulse" : "text-gray-600"
                        }`}
                      >
                        QR Camera Scanner
                      </button>
                    </div>

                    {!scannerSimulationMode ? (
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
                    ) : (
                      /* QR Scanner Simulation Box */
                      <div className="space-y-4 border rounded-2xl p-4 bg-gray-50 relative overflow-hidden">
                        {/* Simulation overlays */}
                        <div className="border-4 border-dashed border-chicken-red rounded-xl p-6 text-center space-y-3 relative bg-black/5">
                          <Camera className="w-12 h-12 text-chicken-red mx-auto animate-pulse" />
                          <div className="h-0.5 bg-chicken-red animate-bounce" />
                          <span className="block text-[10px] font-black uppercase tracking-widest text-chicken-red">
                            ACTIVE MOCK CAMERA VIEWFINDER
                          </span>

                          <div className="max-w-xs mx-auto space-y-3 bg-white p-3 rounded-lg shadow-md border">
                            <label className="block text-left text-[9px] font-black uppercase text-gray-500">
                              Simulate Pass scan choice:
                            </label>
                            <select
                              value={simulatedSelectOrderId}
                              onChange={(e) => setSimulatedSelectOrderId(e.target.value)}
                              className="w-full text-xs p-1.5 border rounded focus:ring-1 focus:ring-gold bg-gray-50 uppercase font-bold"
                            >
                              <option value="">-- Choose active customer order --</option>
                              {orders.filter(o => o.status === "pending" || o.status === "verified").map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.passCode} - {o.customerName}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={handleSimulateScan}
                              className="w-full py-1.5 bg-chicken-red hover:bg-red-700 text-white font-black uppercase text-[10px] rounded transition"
                            >
                              Simulate Scanner Beep
                            </button>
                          </div>
                        </div>
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
                                updateOrderStatus(searchedOrder.id, "completed");
                                setSearchedOrder(null);
                                setManualCodeInput("");
                              }}
                              className="col-span-2 py-2 bg-black hover:bg-gray-900 text-gold font-black uppercase text-[10px] tracking-wider rounded-lg border border-gold transition"
                            >
                              Complete Pickup
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
                  <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-black uppercase tracking-tight">Menu Availability Manager</h3>
                      <p className="text-xs text-gray-500">Toggle items as "Sold Out" instantly on customers' screens</p>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                      {MENU_ITEMS.map((item) => {
                        const available = isItemAvailable(item.id);
                        return (
                          <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div>
                              <span className="block text-xs font-black uppercase text-gray-900 leading-tight">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">
                                {item.category} • R{item.price.toFixed(2)}
                              </span>
                            </div>

                            <button
                              onClick={() => toggleItemAvailability(item.id, available)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition shadow-sm border ${
                                available 
                                  ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" 
                                  : "bg-red-100 text-chicken-red border-red-300 hover:bg-red-200"
                              }`}
                            >
                              {available ? "Available ✅" : "Sold Out ❌"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB: Sales Summary Metrics */}
                {activeStaffTab === "sales" && (
                  <div className="space-y-6">
                    {/* Metrics grid banner */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-black uppercase">Completed Sales</span>
                          <span className="block text-xl font-black text-chicken-red">R{staffStats.revenue.toFixed(2)}</span>
                        </div>
                        <DollarSign className="w-8 h-8 text-gold shrink-0" />
                      </div>

                      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-black uppercase">Completed Orders</span>
                          <span className="block text-xl font-black text-black">{staffStats.completedCount}</span>
                        </div>
                        <CheckCircle className="w-8 h-8 text-success-green shrink-0" />
                      </div>

                      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-black uppercase">Pending / Verified</span>
                          <span className="block text-xl font-black text-black">
                            {staffStats.pendingCount + staffStats.verifiedCount}
                          </span>
                        </div>
                        <Clock className="w-8 h-8 text-warning-orange shrink-0 animate-pulse" />
                      </div>

                      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-black uppercase">Avg Ticket Size</span>
                          <span className="block text-xl font-black text-black">R{staffStats.avgOrder.toFixed(2)}</span>
                        </div>
                        <TrendingUp className="w-8 h-8 text-gray-400 shrink-0" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Top Selling Items Box */}
                      <div className="bg-white rounded-2xl border p-5 space-y-4">
                        <h4 className="text-sm font-black uppercase text-black border-b pb-2 tracking-tight">
                          🏆 TOP SELLING ITEMS (COMPLETED)
                        </h4>
                        
                        {staffStats.topItems.length === 0 ? (
                          <p className="text-xs text-gray-500 py-6 text-center">
                            No items archived yet. Mark orders complete to compile stats!
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {staffStats.topItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-black text-chicken-red">#{index + 1}</span>
                                  <span className="text-xs font-bold uppercase text-gray-800">{item.name}</span>
                                </div>
                                <span className="text-xs font-black bg-gold text-black px-2 py-0.5 rounded">
                                  {item.qty} sold
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pure CSS/SVG Category Sales Share visual */}
                      <div className="bg-white rounded-2xl border p-5 space-y-4">
                        <h4 className="text-sm font-black uppercase text-black border-b pb-2 tracking-tight">
                          📊 CATEGORY DISTRIBUTION SHARE
                        </h4>

                        {Object.keys(staffStats.categoryStats).length === 0 ? (
                          <p className="text-xs text-gray-500 py-6 text-center">
                            No category data yet. Mark orders complete to render chart!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {(Object.entries(staffStats.categoryStats) as [string, number][]).map(([cat, qty], idx) => {
                              const totalItems = (Object.values(staffStats.categoryStats) as number[]).reduce((s, q) => s + q, 0);
                              const pct = totalItems > 0 ? (qty / totalItems) * 100 : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold uppercase text-gray-700">
                                    <span>{cat}</span>
                                    <span>{pct.toFixed(0)}% ({qty})</span>
                                  </div>
                                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-chicken-red rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
                    Base: R{selectedComboItem.price.toFixed(2)}
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
                {/* Spice Selector Option for all relevant items */}
                {selectedComboItem.spiceLevel !== undefined && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-gray-800 tracking-wider">
                      🌶️ SELECT YOUR SPICE LEVEL:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["Lemon & Herb 🍋", "Mild 🌶️", "Hot 🌶️🌶️", "Extra Hot 🌶️🌶️🌶️"].map((label, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playBeep(600 + idx * 50, "sine", 0.04);
                            setSelectedSpiceLevel(idx);
                          }}
                          className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-center border transition ${
                            selectedSpiceLevel === idx
                              ? "bg-chicken-red text-white border-chicken-red"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                            <span>{choice.label}</span>
                            {choice.priceModifier > 0 && (
                              <span className="text-chicken-red font-black">
                                +R{choice.priceModifier.toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={handleAddComboToCart}
                className="w-full mt-4 py-3 bg-chicken-red hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg"
              >
                Add Customized Meal to Cart
              </button>
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
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
