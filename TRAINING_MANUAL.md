# 👑 KRISPY KING: REMOTE ORDERING SYSTEM
## 📄 OFFICIAL OPERATIONS & TRAINING MANUAL (V2.0)
*For Customers, Front-of-House Cashiers, Kitchen Managers, and Administrators*

---

## 📖 1. SYSTEM OVERVIEW & MISSION

The **Krispy King Remote Ordering System** is a real-time, zero-friction queue-busting ecosystem. It allows patrons to scan a table/counter QR placard, browse our full flame-grilled menu, customize options, and instantly place a pre-order from their mobile device. 

The system operates with absolute live synchronicity: as soon as a customer places an order, a **Digital Pickup Pass** containing a unique **QR Code** and a secure **4-Digit Verification PIN** is generated. Simultaneously, the order appears with high-priority audio alerts on all connected **Staff Terminals** via real-time cloud data streams.

---

## ⚡ 2. CORE SYSTEM ARCHITECTURE

The platform is designed using a lightning-fast full-stack architecture:
1. **Frontend**: React 18 with Vite, designed for desktop-first precision and fully responsive fluid mobile touch optimization.
2. **Styling & Theme**: Modern Tailwind CSS featuring the signature high-impact **Fiery Crimson & Royal Gold** aesthetics.
3. **Real-time Database**: Google Firebase Firestore with real-time listeners (`onSnapshot`) to push notifications across devices instantly.
4. **Interactive Sound Synthesis**: Built-in Web Audio API synthesizer that generates distinctive beep notifications for state changes without needing external audio file dependencies.
5. **QR Engine**: SVG-based high-density vector matrix generator for seamless counter scanning.

---

## 🛒 3. CUSTOMER ORDERING WORKFLOW

```
[Browse Menu] ➔ [Add to Cart] ➔ [Submit Name] ➔ [Generate Digital Pass] ➔ [Show / Download Pass]
```

### Step 3.1: Menu Browsing & Customization
- Patrons browse categorized items (Burgers, Combos, Family Meals, Kiddies, Breakfast, etc.).
- Breakfast items are automatically filtered and dynamically made available depending on the local morning hours (6:00 AM - 11:00 AM).
- Items with customizable **Combo Choices** (e.g. choice of soft drinks, swap for sides, extra wings) update prices dynamically.
- Interactive heat-meter gauges highlight item spiciness levels ranging from **Lemon & Herb** 🍋 to **Extra Hot** 🌶️🌶️🌶️.

### Step 3.2: Secure Checkout
- To minimize friction, the customer does not need to create an email/password account.
- They simply enter their first name or nickname on the **Cart Drawer** sheet and submit.
- The system immediately:
  1. Generates a unique **Pass Code** (e.g., `KK-B8A29F`).
  2. Generates a secure random **4-Digit Pickup Verification PIN** (e.g., `4819`).
  3. Commits the record to the Firestore cluster.
  4. Binds the order locally to the client's device memory under **My Saved Passes** so they can return to it even if they close their browser tab.

### Step 3.3: Digital Pass Screen
The Digital Pass is the customer's proof of purchase and pickup ticket:
- **Order Status Tracker**: Live visual tracker blinking with colors indicating the progress:
  - 🟠 **PENDING**: Awaiting cashier verification & payment settlement.
  - 🟢 **VERIFIED**: Payment received, order in kitchen preparation.
  - 🔵 **COMPLETED**: Food successfully handed over to the customer.
  - 🔴 **CANCELLED**: Order voided.
- **Pass QR Code**: Displays a readable QR containing the order Pass Code.
- **Download Actions**:
  - Customers can tap **Download Pass (SVG)** to download their high-res digital ticket.
  - Customers can tap **Save Receipt Text** to get a clean, lightweight, printer-friendly text file receipt containing itemizations and totals.
- **Verification PIN**: A secure 4-digit PIN is displayed. The customer must either:
  1. Show this PIN to the cashier for manual completion.
  2. Perform **Self-Verification** at the counter by entering the official **Staff PIN (`8034`)** directly on their phone screen to complete the transaction themselves!

---

## 🧑‍🍳 4. STAFF DASHBOARD PORTAL OPERATIONS

The Staff Portal is accessed by clicking the **Krispy King Crown Logo** at the top header 5 times and entering the master Staff security PIN: **`8034`**.

### Tab 4.1: Live Orders Feed
An interactive real-time dashboard displaying all incoming customer requests:
- **Audio Beep Alerts**: When a customer places a new order, the Web Audio Synthesizer triggers a triple rising chime (`C5` ➔ `E5` ➔ `G5`) to alert the kitchen.
- **Dynamic Status Transitions**:
  1. **Verify Payment** (Green Button): Changes status from `Pending` to `Verified` (Cash/Card settled at register).
  2. **Verify & Complete** (Black & Gold Button): Changes status from `Verified` to `Completed` once the order is ready. This button automatically triggers the **Secure Code Verification Step**!
  3. **Cancel** (Red Border): Instantly voids the order and plays a warning error drop sound on the device.

### Tab 4.2: QR Pass Verification & Code Entry
For quick queue checkout at the register:
- **QR Viewfinder Simulator**: Simulates a high-speed camera scanner. Select any active customer pass from the dropdown to emulate a real handheld scanner laser beep!
- **Manual Search**: Cashiers can type the customer's passcode (e.g. `B8A29F` or `KK-B8A29F`) to pull up details instantly.
- **🛡️ Secure PIN Verification Step**:
  - When the cashier clicks **Complete Pickup**, they are prompted with a secure passcode challenge.
  - They must enter the customer's **4-Digit Pickup Verification PIN** (visible on the customer's pass).
  - Alternatively, in emergency overrides (e.g., customer phone died), cashiers can enter the master staff code **`8034`** to complete the pickup.

### Tab 4.3: Tabletop Placard QR Generator
Allows the store manager to print official customer-facing counter signage:
- **Configurable Destination**: Set the landing URL to the active web app domain.
- **Theme Branding**: Switch between **Fiery Crimson** (the high-impact signature red), **Midnight Royal** (luxurious deep blue), or **Matte Charcoal** (sleek high-contrast black).
- **Print Layout**: Optimizes layout for standard **A4 or US Letter** size. Pressing **Print Official Placard** automatically invokes the browser print utility. 
- *Pro Printer Settings*: Turn off headers/footers and check "Background graphics" inside your system print menu for a seamless full-bleed professional print!

### Tab 4.4: Menu Availability Manager
- Toggle stock availability for all menu items on-the-fly.
- When an item is marked "Sold Out", it immediately reflects on the customer's side with a subtle gray overlay and disabled "Add to Cart" triggers, preventing unfulfillable orders.

### Tab 4.5: Sales Summary & Analytics
- Track real-time statistics including:
  - **Gross Revenue Collected**
  - **Order Volume Metrics** (Completed vs. Active vs. Cancelled)
  - **Itemized Product Popularity Rankings** with progress bars showing which burgers or meals are generating the most sales.

---

## 🔒 5. SECURITY & STAFF PIN REFERENCE

- **Master Security PIN**: `8034`
- This PIN is used to:
  1. Login to the **Staff Dashboard Portal**.
  2. Bypass / override manual customer pickup challenges at the register.
  3. Perform customer **Self-Verification** at the counter on their own mobile devices.

---
*End of Manual. Confidential - For Internal Krispy King Personnel Only.*
