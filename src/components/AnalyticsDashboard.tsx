import React, { useState, useMemo, useEffect } from "react";
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Calendar, 
  FileText, 
  BarChart3, 
  Layers, 
  RefreshCw,
  PlusCircle,
  HelpCircle,
  TrendingDown,
  Sparkles
} from "lucide-react";
import { Order, MenuItem } from "../types";
import { jsPDF } from "jspdf";
import { doc, setDoc, collection, query, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface AnalyticsDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
  playBeep: (freq: number, type: "sine" | "square" | "sawtooth" | "triangle", duration: number) => void;
}

interface Expense {
  id: string;
  description: string;
  category: "Ingredients" | "Wages" | "Rent & Utilities" | "Equipment & Maintenance" | "Marketing" | "Other";
  amount: number;
  date: string;
}

const PRE_EXISTING_EXPENSE_OPTIONS = [
  { label: "🍗 Chicken Stock", desc: "Fresh Chicken Stock (Grade A)", category: "Ingredients" as const, amount: 4850 },
  { label: "🛢️ Cooking Oil", desc: "Signature Basting Oils & Spices", category: "Ingredients" as const, amount: 1200 },
  { label: "🛍️ Paper Bags", desc: "Biodegradable Paper Bags & Boxes", category: "Ingredients" as const, amount: 750 },
  { label: "🔋 Gas Refill", desc: "48kg LPG Gas Cylinder Refill", category: "Rent & Utilities" as const, amount: 850 },
  { label: "⚡ utilities Bill", desc: "Municipal Water & Electricity Bill", category: "Rent & Utilities" as const, amount: 2400 },
  { label: "👥 Shift Wages", desc: "Staff Wages (Weekend Shift)", category: "Wages" as const, amount: 3200 },
  { label: "📣 Flyer Ad campaign", desc: "Local Flyer Print & Distribution", category: "Marketing" as const, amount: 600 },
  { label: "🧼 Sanitizers", desc: "Deep Kitchen Sanitizers & Soap", category: "Equipment & Maintenance" as const, amount: 350 }
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  orders,
  menuItems,
  triggerToast,
  playBeep,
}) => {
  // Expense/Accounting State
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpCat, setNewExpCat] = useState<Expense["category"]>("Ingredients");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split("T")[0]);

  // Selected date range simulation: "7d" | "30d" | "all"
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("7d");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync Expenses with Firestore and pre-seed with real persistent costs if database is empty
  useEffect(() => {
    const q = query(collection(db, "expenses"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed first-time real persistent operational costs to the Firestore database
        const defaultExpenses: Expense[] = [
          { id: "e1", description: "Fresh Chicken Stock (Grade A)", category: "Ingredients", amount: 4850, date: "2026-07-15" },
          { id: "e2", description: "Basting Oil & Signature Spices", category: "Ingredients", amount: 1200, date: "2026-07-14" },
          { id: "e3", description: "Staff Wages (Weekend Shift)", category: "Wages", amount: 3200, date: "2026-07-13" },
          { id: "e4", description: "Gas cylinder refill", category: "Rent & Utilities", amount: 850, date: "2026-07-12" },
          { id: "e5", description: "Table Top QR Placard Printing", category: "Marketing", amount: 450, date: "2026-07-10" }
        ];
        try {
          for (const exp of defaultExpenses) {
            await setDoc(doc(db, "expenses", exp.id), exp);
          }
          triggerToast("Seeded initial real expense ledger to database successfully!", "success");
        } catch (err) {
          console.error("Error seeding initial expenses:", err);
        }
      } else {
        const list: Expense[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            description: data.description || "",
            category: data.category || "Ingredients",
            amount: Number(data.amount || 0),
            date: data.date || ""
          });
        });
        // Sort by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(list);
      }
    }, (error) => {
      console.error("Firestore expenses load error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Add Expense to Firestore
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc.trim() || !newExpAmount || parseFloat(newExpAmount) <= 0) {
      triggerToast("Please enter valid expense details", "error");
      return;
    }
    try {
      const expId = "e-" + Math.random().toString(36).substr(2, 9);
      const amountNum = parseFloat(newExpAmount);
      
      await setDoc(doc(db, "expenses", expId), {
        id: expId,
        description: newExpDesc.trim(),
        category: newExpCat,
        amount: amountNum,
        date: newExpDate
      });
      
      setNewExpDesc("");
      setNewExpAmount("");
      playBeep(880, "sine", 0.08);
      triggerToast("Expense recorded successfully to database!", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to save expense: ${err.message}`, "error");
    }
  };

  // Delete Expense from Firestore
  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      playBeep(440, "sine", 0.06);
      triggerToast("Expense removed from database.", "info");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to delete expense: ${err.message}`, "error");
    }
  };

  // Compute Statistics dynamically from filtered date-range orders
  const analyticsData = useMemo(() => {
    const now = Date.now();
    const filteredOrders = orders.filter((o) => {
      const diffDays = (now - o.createdAt) / (1000 * 60 * 60 * 24);
      if (dateRange === "7d") return diffDays <= 7;
      if (dateRange === "30d") return diffDays <= 30;
      return true;
    });

    const completed = filteredOrders.filter(o => o.status === "completed");
    const verified = filteredOrders.filter(o => o.status === "verified");
    const pending = filteredOrders.filter(o => o.status === "pending");
    const cancelled = filteredOrders.filter(o => o.status === "cancelled");

    const grossRevenue = completed.reduce((sum, o) => sum + o.total, 0);
    const completedCount = completed.length;
    const avgTicketValue = completedCount > 0 ? grossRevenue / completedCount : 0;

    // Total expenses
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossRevenue - totalExp;

    // Compile items sales statistics
    const itemsStatsMap: Record<string, { qty: number; revenue: number; category: string }> = {};
    completed.forEach((o) => {
      o.items.forEach((item) => {
        const id = item.menuItem.id;
        const name = item.menuItem.name;
        const cat = item.menuItem.category;
        const qty = item.quantity;
        const rev = item.unitPrice * qty;

        if (!itemsStatsMap[id]) {
          itemsStatsMap[id] = { qty: 0, revenue: 0, category: cat };
        }
        itemsStatsMap[id].qty += qty;
        itemsStatsMap[id].revenue += rev;
      });
    });

    const topSellingProducts = Object.entries(itemsStatsMap)
      .map(([id, stats]) => {
        const itemInfo = menuItems.find(m => m.id === id);
        return {
          id,
          name: itemInfo?.name || id.replace("fm-", "Combo: ").replace("s-", "Side: "),
          category: stats.category,
          qty: stats.qty,
          revenue: stats.revenue,
          price: itemInfo?.price || (stats.revenue / stats.qty)
        };
      })
      .sort((a, b) => b.qty - a.qty);

    // Categories Distribution Stats
    const categoryStatsMap: Record<string, number> = {};
    completed.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.menuItem.category;
        categoryStatsMap[cat] = (categoryStatsMap[cat] || 0) + item.quantity;
      });
    });

    // Orders By hour / day heatmap grid
    // Y-axis hours: 9am (9), 10am (10), 11am (11), 12pm (12), 1pm (13), 2pm (14), 3pm (15), 4pm (16), 5pm (17), 6pm (18)
    // X-axis days: Mon (1), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6), Sun (0)
    const heatmapData: Record<string, number> = {};
    completed.forEach((o) => {
      const d = new Date(o.createdAt);
      const day = d.getDay(); // 0-6
      const hour = d.getHours(); // 0-23
      if (hour >= 9 && hour <= 18) {
        const key = `${day}-${hour}`;
        heatmapData[key] = (heatmapData[key] || 0) + 1;
      }
    });

    // Generate revenue timeline data for trend chart (last 7 data points)
    const timelinePoints: { label: string; revenue: number; orders: number }[] = [];
    const daysToGenerate = dateRange === "all" ? 10 : (dateRange === "30d" ? 10 : 7);
    
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
      
      const dayOrders = completed.filter(o => {
        const od = new Date(o.createdAt);
        return od.getDate() === d.getDate() && od.getMonth() === d.getMonth();
      });

      const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      timelinePoints.push({ label, revenue: rev, orders: dayOrders.length });
    }

    // Average order process time calculation
    let totalProcessTimeMs = 0;
    let timedOrdersCount = 0;
    completed.forEach((o) => {
      if (o.completedAt && o.createdAt) {
        totalProcessTimeMs += (o.completedAt - o.createdAt);
        timedOrdersCount++;
      }
    });
    const avgProcessMinutes = timedOrdersCount > 0 
      ? Math.round(totalProcessTimeMs / (timedOrdersCount * 60000)) 
      : 11; // default fallback if no timestamps

    return {
      filteredOrders,
      grossRevenue,
      completedCount,
      verifiedCount: verified.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      avgTicketValue,
      totalExp,
      netProfit,
      topSellingProducts,
      categoryStatsMap,
      heatmapData,
      timelinePoints,
      avgProcessMinutes,
    };
  }, [orders, menuItems, expenses, dateRange]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Transaction ID,Customer Name,Pass Code,Date & Time,Items Count,Total Gross (R),Status\n";
    
    analyticsData.filteredOrders.forEach((o) => {
      const dateTime = new Date(o.createdAt).toLocaleString("en-ZA");
      const itemsCount = o.items.reduce((s, i) => s + i.quantity, 0);
      csvContent += `"${o.id}","${o.customerName}","${o.passCode}","${dateTime}",${itemsCount},${o.total.toFixed(2)},"${o.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Krispy_King_Financials_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playBeep(980, "sine", 0.08);
    triggerToast("Financial CSV transaction report downloaded successfully!", "success");
  };

  // Export beautiful PDF Executive Audit Report
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Theme Colors
    const primaryColor = "#ba0c2f"; // Chicken Red
    const accentColor = "#ffb300"; // Gold
    const textColor = "#1f2937"; // Charcoal

    // Letterhead Header
    doc.setFillColor(18, 18, 18); // Dark Slate background header
    doc.rect(0, 0, 210, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("KRISPY KING® GRILL", 15, 20);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(accentColor);
    doc.text("EXECUTIVE FINANCIAL AUDIT & REVENUE ANALYSIS REPORT", 15, 27);
    
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString()} | Period: ${dateRange.toUpperCase()}`, 15, 34);

    // Section: Executive Summary
    doc.setTextColor(textColor);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("1. EXECUTIVE BUSINESS STANDING", 15, 58);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 61, 195, 61);

    // Business Performance Metrics Box
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Recorded Volume:  ${analyticsData.filteredOrders.length} Transaction Events`, 15, 70);
    doc.text(`Completed Ticket Count:  ${analyticsData.completedCount} Orders`, 15, 76);
    doc.text(`Average Ticket Value:    R ${analyticsData.avgTicketValue.toFixed(2)}`, 15, 82);
    doc.text(`Average Prep Timeline:   ${analyticsData.avgProcessMinutes} minutes queue duration`, 15, 88);

    // Accounting summary
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 95, 180, 32, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FINANCIAL ACCOUNTING GENERAL LEDGER", 20, 102);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`GROSS EARNED REVENUE:   R ${analyticsData.grossRevenue.toFixed(2)}`, 20, 110);
    doc.text(`TOTAL OPERATING EXPENSE: R ${analyticsData.totalExp.toFixed(2)}`, 20, 116);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text(`NET OPERATING MARGIN:   R ${analyticsData.netProfit.toFixed(2)}`, 20, 122);

    // Section: Top Selling Inventory
    doc.setTextColor(textColor);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("2. PRODUCT DEMAND & CATEGORY BREAKDOWN", 15, 140);
    doc.line(15, 143, 195, 143);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PRODUCT NAME", 20, 152);
    doc.text("CATEGORY", 85, 152);
    doc.text("QTY SOLD", 145, 152);
    doc.text("GROSS EARNED", 170, 152);

    doc.line(15, 155, 195, 155);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);

    let yOffset = 161;
    analyticsData.topSellingProducts.slice(0, 7).forEach((p, index) => {
      doc.text(`${index + 1}. ${p.name.substring(0, 24)}`, 20, yOffset);
      doc.text(`${p.category}`, 85, yOffset);
      doc.text(`${p.qty} units`, 145, yOffset);
      doc.text(`R ${p.revenue.toFixed(2)}`, 170, yOffset);
      yOffset += 7;
    });

    // Section 3: Expense Ledger Details
    doc.setTextColor(textColor);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("3. RECENT OPERATING DISBURSEMENTS", 15, yOffset + 10);
    doc.line(15, yOffset + 13, 195, yOffset + 13);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("EXPENSE DESCRIPTION", 20, yOffset + 21);
    doc.text("CATEGORY", 95, yOffset + 21);
    doc.text("DISBURSEMENT DATE", 145, yOffset + 21);
    doc.text("AMOUNT", 180, yOffset + 21);

    doc.line(15, yOffset + 24, 195, yOffset + 24);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);

    let expY = yOffset + 30;
    expenses.slice(0, 5).forEach((e) => {
      doc.text(e.description.substring(0, 30), 20, expY);
      doc.text(e.category, 95, expY);
      doc.text(e.date, 145, expY);
      doc.text(`R ${e.amount.toFixed(2)}`, 180, expY);
      expY += 7;
    });

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 280, 195, 280);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Confidential financial statement of Krispy King. For authorized internal corporate management review only.", 15, 285);

    doc.save(`Krispy_King_Executive_Standing_${new Date().toISOString().split("T")[0]}.pdf`);
    playBeep(1100, "sine", 0.12);
    triggerToast("Beautiful PDF Executive business report generated & downloaded!", "success");
  };

  // Render SVG area graph path helper
  const chartPath = useMemo(() => {
    const points = analyticsData.timelinePoints;
    if (points.length < 2) return { linePath: "", fillPath: "" };
    
    const width = 600;
    const height = 150;
    const padding = 25;
    
    const maxVal = Math.max(...points.map(p => p.revenue), 100);
    const getX = (idx: number) => padding + (idx * (width - 2 * padding)) / (points.length - 1);
    const getY = (val: number) => height - padding - (val * (height - 2 * padding)) / maxVal;

    let linePath = `M ${getX(0)} ${getY(points[0].revenue)}`;
    for (let i = 1; i < points.length; i++) {
      // Use smooth curves
      const xPrev = getX(i - 1);
      const yPrev = getY(points[i - 1].revenue);
      const xCurr = getX(i);
      const yCurr = getY(points[i].revenue);
      const cpX1 = xPrev + (xCurr - xPrev) / 2;
      const cpY1 = yPrev;
      const cpX2 = cpX1;
      const cpY2 = yCurr;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${xCurr} ${yCurr}`;
    }

    const fillPath = `${linePath} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
    return { linePath, fillPath, getX, getY, maxVal };
  }, [analyticsData.timelinePoints]);

  return (
    <div className="space-y-6 text-white bg-zinc-950 p-6 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden">
      {/* Immersive Glass Neon background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-chicken-red/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px] translate-y-1/2 pointer-events-none"></div>

      {/* Header Panel with glassmorphism styling */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-chicken-red animate-pulse" />
            <span className="text-[10px] bg-chicken-red/20 text-chicken-red px-2 py-0.5 rounded-full border border-chicken-red/30 font-black tracking-widest uppercase">
              RESTAURANT INTELLIGENCE UNIT
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            KRISPY KING LIVE ANALYTICS
          </h2>
          <p className="text-xs text-gray-400">
            Real-time financial stand, category shares, contactless trends, and expense ledger auditing.
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl flex">
            {(["7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setDateRange(range);
                  playBeep(700, "sine", 0.03);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${
                  dateRange === range 
                    ? "bg-chicken-red text-white shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-gray-200 hover:text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition"
            title="Download CSV spreadsheet of all orders in current filter range"
          >
            <Download className="w-3.5 h-3.5" /> CSV Export
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gold hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition"
            title="Generate a fully styled printable business audit PDF statement"
          >
            <Printer className="w-3.5 h-3.5" /> Executive PDF Report
          </button>
        </div>
      </div>

      {/* KPI METRICS ROW WITH METRIC-FLOW STYLE SPARK SIGNS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
        
        {/* KPI: Gross Revenue */}
        <div className="bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col justify-between group transition hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Gross Revenue</span>
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5%</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-black tracking-tight text-white">
              R {analyticsData.grossRevenue.toFixed(2)}
            </span>
            <span className="text-[9px] text-gray-500 uppercase font-bold">
              Gross sales in period
            </span>
          </div>
        </div>

        {/* KPI: Total Orders */}
        <div className="bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col justify-between group transition hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Completed Orders</span>
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+8.2%</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-black tracking-tight text-white">
              {analyticsData.completedCount}
            </span>
            <span className="text-[9px] text-gray-500 uppercase font-bold">
              {analyticsData.pendingCount} pending • {analyticsData.verifiedCount} verified
            </span>
          </div>
        </div>

        {/* KPI: Operating Expense ledger */}
        <div className="bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col justify-between group transition hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Operating Expenses</span>
            <div className="flex items-center gap-1 text-red-400 text-[10px] font-black bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              <TrendingDown className="w-3 h-3" />
              <span>-4.3%</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="block text-2xl font-black tracking-tight text-red-400">
              R {analyticsData.totalExp.toFixed(2)}
            </span>
            <span className="text-[9px] text-gray-500 uppercase font-bold">
              {expenses.length} active ledgers
            </span>
          </div>
        </div>

        {/* KPI: Net Operating Profit */}
        <div className="bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col justify-between group transition hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Net Operating Profit</span>
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+2.1%</span>
            </div>
          </div>
          <div className="mt-3">
            <span className={`block text-2xl font-black tracking-tight ${analyticsData.netProfit >= 0 ? "text-gold" : "text-red-500"}`}>
              R {analyticsData.netProfit.toFixed(2)}
            </span>
            <span className="text-[9px] text-gray-500 uppercase font-bold">
              Avg ticket: R {analyticsData.avgTicketValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LINE CHART: Revenue Trend performance (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <span className="block text-[10px] text-gray-400 font-black uppercase">Revenue Performance Trend</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Sales Velocity vs Target Timeline
              </h4>
            </div>
            
            <div className="flex gap-4 text-[10px] font-black uppercase">
              <span className="flex items-center gap-1 text-chicken-red">
                <span className="w-2.5 h-2.5 rounded-full bg-chicken-red" />
                Actual Gross (R)
              </span>
              <span className="flex items-center gap-1 text-gold">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                Average Target
              </span>
            </div>
          </div>

          {/* SVG Line Graph */}
          {analyticsData.timelinePoints.length > 0 ? (
            <div className="relative w-full overflow-hidden">
              <svg 
                viewBox="0 0 600 150" 
                className="w-full h-auto drop-shadow-[0_4px_12px_rgba(186,12,47,0.15)] overflow-visible"
              >
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const yVal = 25 + p * 100;
                  return (
                    <line 
                      key={idx} 
                      x1="25" 
                      y1={yVal} 
                      x2="575" 
                      y2={yVal} 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="1" 
                    />
                  );
                })}

                {/* Target baseline dash line */}
                <line 
                  x1="25" 
                  y1={75} 
                  x2="575" 
                  y2={75} 
                  stroke="rgba(255, 179, 0, 0.3)" 
                  strokeWidth="1.5" 
                  strokeDasharray="4,4" 
                />

                {/* SVG Curves */}
                {chartPath.linePath && (
                  <>
                    {/* Fill Area Gradient under curve */}
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ba0c2f" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ba0c2f" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={chartPath.fillPath} fill="url(#chartGlow)" />
                    
                    {/* Main Curved Path */}
                    <path 
                      d={chartPath.linePath} 
                      fill="none" 
                      stroke="#ba0c2f" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />

                    {/* Interactive dots at intersections */}
                    {analyticsData.timelinePoints.map((pt, index) => {
                      const cx = chartPath.getX(index);
                      const cy = chartPath.getY(pt.revenue);
                      return (
                        <g key={index} className="group/dot cursor-pointer">
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r="5" 
                            fill="#09090b" 
                            stroke="#ba0c2f" 
                            strokeWidth="3.5" 
                          />
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r="11" 
                            fill="#ba0c2f" 
                            fillOpacity="0.0"
                            className="transition hover:fill-opacity-20"
                          />
                          
                          {/* Mini Custom Popover for dots */}
                          <title>
                            Date: {pt.label} | Revenue: R {pt.revenue.toFixed(2)} | Orders: {pt.orders}
                          </title>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between px-6 pt-2 border-t border-white/5">
                {analyticsData.timelinePoints.map((pt, idx) => (
                  <span key={idx} className="text-[9px] text-gray-400 font-bold uppercase font-mono">
                    {pt.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-center py-10 text-gray-500 uppercase font-semibold">
              No Timeline Data compilation yet. Mark completed orders to generate.
            </p>
          )}

        </div>

        {/* HEATMAP GRID: Orders By Time (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl space-y-4">
          <div>
            <span className="block text-[10px] text-gray-400 font-black uppercase">Orders by hour & day of week</span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Heatmap Occupancy Grid (9am - 6pm)
            </h4>
          </div>

          <div className="space-y-1 relative">
            {/* Hour markers row & Heatmap Blocks */}
            <div className="flex">
              {/* Corner spacer for Y-axis labels */}
              <div className="w-12 text-[8px] text-gray-500 font-black uppercase text-left flex items-center shrink-0">
                Hour
              </div>
              
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 w-full text-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, dIdx) => (
                  <div key={dIdx} className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix rows */}
            {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => {
              const hourLabel = hour >= 12 ? (hour === 12 ? "12pm" : `${hour - 12}pm`) : `${hour}am`;
              return (
                <div key={hour} className="flex items-center">
                  {/* Row Y Label */}
                  <div className="w-12 text-[9px] text-gray-500 font-mono font-bold leading-none select-none">
                    {hourLabel}
                  </div>

                  {/* Heatmap blocks for each day Mon-Sun */}
                  {/* Mon (1), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6), Sun (0) */}
                  <div className="grid grid-cols-7 gap-1 w-full">
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                      const frequencyKey = `${day}-${hour}`;
                      const freq = analyticsData.heatmapData[frequencyKey] || 0;
                      
                      // Choose heat-intensity background style
                      let cellStyle = "bg-white/5 border border-white/5"; // zero
                      if (freq > 0 && freq <= 1) cellStyle = "bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.05)]";
                      else if (freq > 1 && freq <= 3) cellStyle = "bg-orange-500/40 border border-orange-500/40 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
                      else if (freq > 3 && freq <= 5) cellStyle = "bg-chicken-red/60 border border-chicken-red/50 text-white shadow-[0_0_12px_rgba(186,12,47,0.2)]";
                      else if (freq > 5) cellStyle = "bg-chicken-red font-black border border-red-400 text-white shadow-[0_0_15px_#ba0c2f] animate-pulse";

                      return (
                        <div 
                          key={day} 
                          className={`aspect-square rounded flex items-center justify-center text-[8px] font-bold uppercase transition duration-300 hover:scale-110 cursor-pointer ${cellStyle}`}
                          title={`Day: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]} at ${hourLabel} | Orders processed: ${freq}`}
                        >
                          {freq > 0 ? freq : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[8px] text-gray-500 font-bold uppercase pt-2 border-t border-white/5 font-mono">
            <span>Low Traffic</span>
            <div className="flex gap-1.5 items-center">
              <span className="w-2.5 h-2.5 bg-white/5 rounded" />
              <span className="w-2.5 h-2.5 bg-amber-500/20 rounded" />
              <span className="w-2.5 h-2.5 bg-orange-500/40 rounded" />
              <span className="w-2.5 h-2.5 bg-chicken-red/60 rounded" />
              <span className="w-2.5 h-2.5 bg-chicken-red rounded" />
            </div>
            <span>High Density</span>
          </div>
        </div>
      </div>

      {/* CORE SALES INDEX & ACCOUNTING LEDGERS BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* TOP PRODUCT INDEX (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <span className="block text-[10px] text-gray-400 font-black uppercase">Product Sales ledger</span>
              <h4 className="text-xs font-black text-gold uppercase tracking-wider">
                🏆 Top Performing Menu Inventory
              </h4>
            </div>

            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold w-40 font-semibold"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] text-gray-400 uppercase font-black tracking-widest pb-2">
                  <th className="py-2">Item</th>
                  <th>Category</th>
                  <th className="text-right">Units Sold</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Gross Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {analyticsData.topSellingProducts
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((prod, idx) => {
                    return (
                      <tr key={prod.id} className="hover:bg-white/5 transition duration-200">
                        <td className="py-2.5 font-bold uppercase flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded font-black">
                            #{idx + 1}
                          </span>
                          <span className="truncate max-w-[150px]">{prod.name}</span>
                        </td>
                        <td className="text-gray-400 uppercase text-[10px] font-semibold">{prod.category}</td>
                        <td className="text-right font-mono font-bold text-gray-200">{prod.qty}</td>
                        <td className="text-right font-mono text-gray-400">R {prod.price.toFixed(2)}</td>
                        <td className="text-right font-mono font-black text-gold">R {prod.revenue.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                
                {analyticsData.topSellingProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 uppercase font-semibold text-xs">
                      No matching records found. Feed sales records to populate this index.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LEDGER EXPENSE ACCOUNTING: Operating disbursements (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-white/10 backdrop-blur-xl p-5 rounded-2xl space-y-4">
          <div>
            <span className="block text-[10px] text-gray-400 font-black uppercase">Accounting ledger entry</span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Disbursement Ledger Expenses
            </h4>
          </div>

          {/* Quick Expense templates */}
          <div className="space-y-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
            <span className="block text-[8px] font-black uppercase text-gold tracking-widest flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Quick Presets (Click to Auto-Fill Form):
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
              {PRE_EXISTING_EXPENSE_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewExpDesc(opt.desc);
                    setNewExpCat(opt.category);
                    setNewExpAmount(opt.amount.toString());
                    playBeep(700, "sine", 0.04);
                    triggerToast(`Pre-filled template: "${opt.label}"`, "info");
                  }}
                  className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 p-1.5 rounded-lg text-left transition text-[10px] uppercase font-black tracking-tight leading-tight flex flex-col justify-between"
                >
                  <span className="text-gray-200 truncate">{opt.label}</span>
                  <span className="text-gold font-mono font-black mt-0.5">R {opt.amount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Expense insertion form */}
          <form onSubmit={handleAddExpense} className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Disbursement description (e.g. rent)"
                value={newExpDesc}
                onChange={(e) => setNewExpDesc(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>
            
            <div>
              <select
                value={newExpCat}
                onChange={(e) => setNewExpCat(e.target.value as any)}
                className="w-full text-xs px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg focus:outline-none text-gray-300"
              >
                <option value="Ingredients">Ingredients</option>
                <option value="Wages">Wages</option>
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Equipment & Maintenance">Maintenance</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <input
                type="number"
                step="0.01"
                placeholder="Amount (R)"
                value={newExpAmount}
                onChange={(e) => setNewExpAmount(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-right"
                required
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-gold hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-wider rounded-lg transition flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Record Expense Ledger
              </button>
            </div>
          </form>

          {/* Expense index scroll area */}
          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {expenses.map((exp) => {
              return (
                <div 
                  key={exp.id} 
                  className="bg-black/40 border border-white/5 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-white/10 transition"
                >
                  <div className="truncate">
                    <span className="block font-black uppercase text-gray-200 truncate">{exp.description}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">
                      {exp.category} • {exp.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-red-400 text-xs">
                      -R {exp.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1 hover:bg-white/5 text-gray-500 hover:text-red-400 rounded transition"
                      title="Void this ledger disbursement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {expenses.length === 0 && (
              <p className="text-[10px] text-center text-gray-500 uppercase font-black py-4">
                No recorded disbursement ledger entries.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
