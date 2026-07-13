# 👑 KRISPY KING OPERATIONAL TRAINING MANUAL
## System Version: 2.1 • Security Status: ACTIVE

---

## 📖 TABLE OF CONTENTS
1. [SYSTEM OVERVIEW & DESIGN PHILOSOPHY](#1-system-overview--design-philosophy)
2. [CUSTOMER-FACING FLOW & PLATFORM CORES](#2-customer-facing-flow--platform-cores)
3. [DIGITAL PASSES & DOWNLOADING GUIDE](#3-digital-passes--downloading-guide)
4. [STAFF PORTAL OPERATIONS & ORDERS FEED](#4-staff-portal-operations--orders-feed)
5. [🛡️ SECURE CODE VERIFICATION SYSTEM](#5-secure-code-verification-system)
6. [🛠️ DEMO OVERRIDES & BYPASS OPERATIONS](#6-demo-overrides--bypass-operations)

---

## 1. SYSTEM OVERVIEW & DESIGN PHILOSOPHY
The **Krispy King Ordering Engine** is designed to eliminate front-counter order friction, maximize kitchen output, and provide a seamless digital pass workflow for patrons. By combining robust client-side caching with real-time Firestore database synchronization, we achieve extremely high speed and operational resilience.

### Core Architecture Pillars:
- **Zero-friction onboarding**: Patrons do not need to register with passwords or input sensitive email addresses. They provide a first name/nickname, checkout, and receive an instant digital pickup pass.
- **Durable cloud persistence**: Active tickets are synchronized in real-time across customers and staff views.
- **Hardware-buzzer emulation**: All touch interactions, ticket alerts, and scanning activities feature real-time auditory feedback synthesized natively in the browser via the Web Audio API (no heavy external assets required).

---

## 2. CUSTOMER-FACING FLOW & PLATFORM CORES
Customers interact with a responsive grid menu to build their orders.

### 2.1 Category Exploration
Patrons filter through the available categories, including our specialty lines:
1. **Grilled Chicken**: Our signature flame-grilled bastings.
2. **Chicken Paella**:
   - **1/4 Chicken Paella** (R49.90)
   - **1/2 Chicken Paella** (R89.90)
   - **Full Chicken Paella** (R169.90)
3. **Fried Chicken** & **Krispy Fried Tenders**
4. **Sides & Extras**, **Beverages**, and **Mocktails**

### 2.2 Sauce Customization (On-The-Side)
To accommodate customer taste preferences, **every single food item** on the menu contains a mandatory sauce selector offering:
- **No Sauce** (Default)
- **BBQ Sauce (on the side) 🍯**
- **Carolina Reaper Sauce (on the side) 🌶️**

### 2.3 Dynamic Combo Builder
When choosing a Meal Combo, the customer accesses an interactive customizer drawer to:
1. Choose their side (e.g. Regular Fries, Spicy Rice, Onion Rings).
2. Choose their beverage (e.g. Soft Drink, Juice, Water).
3. Select their spice level (Lemon & Herb, Mild, Hot, Extra Hot).
4. Select their sauce option (No Sauce, BBQ, Carolina Reaper) which comes on the side.

---

## 3. DIGITAL PASSES & DOWNLOADING GUIDE
Once the customer inputs their name on the checkout sheet and submits, the system generates a unique **Pass Code** (e.g. `KK-8E2B`) and a random secure **4-Digit Verification PIN** (e.g. `4819`).

### 3.1 Digital Pass Interface
The Digital Pass page contains three core segments:
- **Order Status Tracker**: Blinks dynamically based on current status:
  - **PENDING (Orange)**: Settle cash or card payment at the physical counter.
  - **VERIFIED (Green)**: Payment received, kitchen actively preparing meal.
  - **COMPLETED (Blue)**: Order successfully collected.
- **Interactive QR Code**: Rendered in SVG for cashiers to scan with the counter viewfinder.
- **Offline Download Actions**:
  - **Download Pass (SVG)**: Downloads a high-resolution Vector Graphic Pass. This pass is fully stylized and self-contained, allowing customers to show it at the counter even if they completely lose internet access.
  - **Save Receipt Text**: Generates and downloads a clean, plain-text remote receipt containing all itemizations, options, and pickup instructions.

---

## 4. STAFF PORTAL OPERATIONS & ORDERS FEED
Staff access the terminal dashboard to manage active queues. To log into the staff view, click the **Staff Entry** option in the app navigation.

### 4.1 Real-Time Orders Feed
The Active Orders Feed lists all incoming orders chronologically.
- **Audio Alerts**: On every incoming order, the staff console emits a dual-tone alert beep to alert line cooks.
- **Status Filtering**: Orders are divided into active columns or sorted by status (Pending -> Verified -> Completed) for convenient queue management.

### 4.2 Order Processing Actions
- **Verify Payment**: For "Pending" orders, clicking this verifies the patron paid cash or card at the counter, which updates the status to "Verified" (Green) and plays a chime.
- **Verify & Complete**: For "Verified" orders, clicking this launches the **Secure PIN Verification Challenge**.

---

## 5. 🛡️ SECURE CODE VERIFICATION SYSTEM
To prevent food theft and verify that the correct patron receives their hot chicken, we enforce two secure code verification pipelines:

### 5.1 Staff Challenge (Pickup PIN Verification)
When staff click **Verify & Complete** on a verified order, the terminal prompts a numeric keypad.
- Staff must enter the customer's unique **4-digit Pickup PIN** (displayed on the customer's phone or downloadable pass).
- Entering the correct PIN completes the order, logs the pickup timestamp, and clears the ticket.
- **Staff Master Override PIN**: Cashiers can bypass customer PIN checks by entering the secure master PIN **`8034`** on the terminal.

### 5.2 Customer Self-Verification Checkout
At self-service counters, customers can complete their own pickup. On their active pass view, a **Counter Self-Verification** option is displayed:
- The customer clicks the button and is prompted to enter either the **Staff Counter PIN (`8034`)** or their own **Pickup PIN** to mark the order as completed.

---

## 6. 🛠️ DEMO OVERRIDES & BYPASS OPERATIONS
To facilitate easy testing and demos, several manual override mechanisms are built into the app:
- **Breakfast Hours Bypass**: Breakfast menu items are automatically locked outside of 6:00 AM - 11:00 AM. Click **Bypass Time Constraint (Demo)** inside the Breakfast category list to unlock breakfast ordering immediately.
- **QR Viewfinder Simulator**: Under the staff's **Verify Pass** tab, staff can simulate camera QR scanning. Choose an active customer order from the dropdown, then click **Simulate Scanner Beep** to mock a high-speed hardware QR scan.
