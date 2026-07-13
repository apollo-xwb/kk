import { MenuItem } from "./types";

const RAW_MENU_ITEMS: MenuItem[] = [
  // --- GRILLED CHICKEN ---
  {
    id: "g-quarter",
    name: "Quarter Chicken",
    category: "Grilled Chicken",
    price: 42.90,
    description: "Flame-grilled quarter chicken basted in your choice of signature sauce.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    servingSize: "Quarter"
  },
  {
    id: "g-half",
    name: "Half Chicken",
    category: "Grilled Chicken",
    price: 69.90,
    description: "Flavourful flame-grilled half chicken, juicy and perfectly basted.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    servingSize: "Half"
  },
  {
    id: "g-full",
    name: "Full Chicken",
    category: "Grilled Chicken",
    price: 99.90,
    description: "Whole signature flame-grilled chicken, ideal for sharing.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    servingSize: "Full"
  },
  {
    id: "g-family-2",
    name: "2 Full Chicken Family Pack",
    category: "Grilled Chicken",
    price: 189.90,
    description: "Double the feast! Two whole flame-grilled chickens with legendary basting.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    servingSize: "2 Full"
  },
  {
    id: "g-family-3",
    name: "3 Full Chicken Family Pack",
    category: "Grilled Chicken",
    price: 249.90,
    description: "Ultimate family size! Three whole flame-grilled chickens basted to perfection.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    servingSize: "3 Full"
  },

  // --- CHICKEN PAELLA ---
  {
    id: "paella-quarter",
    name: "1/4 Chicken Paella",
    category: "Chicken Paella",
    price: 49.90,
    description: "Flavourful signature 1/4 chicken paella seasoned with traditional spices.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/paella.webp",
    servingSize: "1/4"
  },
  {
    id: "paella-half",
    name: "1/2 Chicken Paella",
    category: "Chicken Paella",
    price: 89.90,
    description: "Flavourful signature 1/2 chicken paella basted in your choice of sauce.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/paella.webp",
    servingSize: "1/2"
  },
  {
    id: "paella-full",
    name: "Full Chicken Paella",
    category: "Chicken Paella",
    price: 169.90,
    description: "Our legendary full chicken paella, perfect for sharing.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/paella.webp",
    servingSize: "Full"
  },

  // --- FRIED CHICKEN ---
  {
    id: "f-2pc",
    name: "2pc + Chips",
    category: "Fried Chicken",
    price: 39.90,
    description: "Two pieces of crispy, golden fried chicken served with a portion of chips.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "2pc"
  },
  {
    id: "f-3pc",
    name: "3pc + Chips",
    category: "Fried Chicken",
    price: 54.90,
    description: "Three pieces of crunchy golden fried chicken and hot golden chips.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "3pc"
  },
  {
    id: "f-6pc",
    name: "6pc + Chips",
    category: "Fried Chicken",
    price: 89.90,
    description: "Six golden, crispy fried chicken pieces with our signature fries.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "6pc"
  },
  {
    id: "f-8pc",
    name: "8pc + Chips",
    category: "Fried Chicken",
    price: 119.90,
    description: "Eight pieces of delicious fried chicken and a generous helping of chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "8pc"
  },
  {
    id: "f-12pc",
    name: "12pc + Chips",
    category: "Fried Chicken",
    price: 149.90,
    description: "Twelve pieces of freshly fried crispy chicken with large golden chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "12pc"
  },
  {
    id: "f-15pc",
    name: "15pc + Chips",
    category: "Fried Chicken",
    price: 179.90,
    description: "Fifteen pieces of mouth-watering crispy fried chicken and heaps of fries.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "15pc"
  },
  {
    id: "f-18pc",
    name: "18pc + Chips",
    category: "Fried Chicken",
    price: 219.90,
    description: "Eighteen crispy, crunch-tastic golden fried chicken pieces and family chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "18pc"
  },
  {
    id: "f-24pc",
    name: "24pc + Chips",
    category: "Fried Chicken",
    price: 269.90,
    description: "The ultimate bucket! 24 pieces of crunch fried chicken and extra large chips.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "24pc"
  },

  // --- KRISPY FRIED TENDERS ---
  {
    id: "t-1pc",
    name: "Krispy Fried Tenders 1pc",
    category: "Krispy Fried Tenders",
    price: 19.90,
    description: "Crispy, golden chicken tender served with our signature dipping sauce.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Tenders-1.jpg",
    servingSize: "1pc"
  },
  {
    id: "t-2pc",
    name: "Krispy Fried Tenders 2pc",
    category: "Krispy Fried Tenders",
    price: 39.90,
    description: "Two pieces of crispy golden chicken tenders with dipping sauce.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Tenders-1.jpg",
    servingSize: "2pc"
  },
  {
    id: "t-3pc",
    name: "Krispy Fried Tenders 3pc",
    category: "Krispy Fried Tenders",
    price: 59.90,
    description: "Three pieces of crispy chicken tenders served with dipping sauce and golden chips.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Tenders-1.jpg",
    servingSize: "3pc"
  },

  // --- KRISPY FRIED WINGS ---
  {
    id: "w-4pc-krispy",
    name: "4 Wings Krispy",
    category: "Krispy Fried Wings",
    price: 39.90,
    description: "4 pieces of crunchy golden fried wings.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "4 wings"
  },
  {
    id: "w-4pc-dipped",
    name: "4 Wings Dipped",
    category: "Krispy Fried Wings",
    price: 40.90,
    description: "4 pieces of glazed, saucy chicken wings.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    servingSize: "4 wings"
  },
  {
    id: "w-4pc-grilled",
    name: "4 Wings Grilled",
    category: "Krispy Fried Wings",
    price: 39.90,
    description: "4 pieces of juicy flame-grilled wings.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "4 wings"
  },
  {
    id: "w-6pc-krispy",
    name: "6 Wings Krispy",
    category: "Krispy Fried Wings",
    price: 49.90,
    description: "6 pieces of crunchy golden fried wings.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "6 wings"
  },
  {
    id: "w-6pc-dipped",
    name: "6 Wings Dipped",
    category: "Krispy Fried Wings",
    price: 49.90,
    description: "6 pieces of glazed, saucy chicken wings.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    servingSize: "6 wings"
  },
  {
    id: "w-6pc-grilled",
    name: "6 Wings Grilled",
    category: "Krispy Fried Wings",
    price: 49.90,
    description: "6 pieces of juicy flame-grilled wings.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "6 wings"
  },
  {
    id: "w-12pc-krispy",
    name: "12 Wings Krispy",
    category: "Krispy Fried Wings",
    price: 99.90,
    description: "12 pieces of crunchy golden fried wings.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "12 wings"
  },
  {
    id: "w-12pc-dipped",
    name: "12 Wings Dipped",
    category: "Krispy Fried Wings",
    price: 99.90,
    description: "12 pieces of glazed, saucy chicken wings.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    servingSize: "12 wings"
  },
  {
    id: "w-12pc-grilled",
    name: "12 Wings Grilled",
    category: "Krispy Fried Wings",
    price: 99.90,
    description: "12 pieces of juicy flame-grilled wings.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    servingSize: "12 wings"
  },

  // --- KING FRIED BURGERS ---
  {
    id: "kb-single",
    name: "Single King Burger",
    category: "King Fried Burgers",
    price: 39.90,
    description: "Crispy chicken burger with 1 signature king patty.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Single"
  },
  {
    id: "kb-single-chips",
    name: "Single King + Chips",
    category: "King Fried Burgers",
    price: 49.90,
    description: "Crispy chicken burger with 1 signature king patty and golden chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Single + Chips"
  },
  {
    id: "kb-double",
    name: "Double King Burger",
    category: "King Fried Burgers",
    price: 54.90,
    description: "Crispy chicken burger with 2 signature king patties.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Double"
  },
  {
    id: "kb-double-chips",
    name: "Double King + Chips",
    category: "King Fried Burgers",
    price: 69.90,
    description: "Crispy chicken burger with 2 signature king patties and golden chips.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Double + Chips"
  },
  {
    id: "kb-triple",
    name: "Triple King Burger",
    category: "King Fried Burgers",
    price: 64.90,
    description: "Crispy chicken burger with 3 signature king patties.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Triple"
  },
  {
    id: "kb-triple-chips",
    name: "Triple King + Chips",
    category: "King Fried Burgers",
    price: 79.90,
    description: "Crispy chicken burger with 3 signature king patties and golden chips.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Triple + Chips"
  },

  // --- KAROLINA REAPER WINGS ---
  {
    id: "krw-4",
    name: "4 Karolina Reaper Wings",
    category: "Karolina Reaper Wings",
    price: 42.90,
    description: "4 extreme heat wings, basted in Karolina Reaper sauce.",
    spiceLevel: 3,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    servingSize: "4 wings"
  },
  {
    id: "krw-6",
    name: "6 Karolina Reaper Wings",
    category: "Karolina Reaper Wings",
    price: 54.90,
    description: "6 extreme heat wings, basted in Karolina Reaper sauce.",
    spiceLevel: 3,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    servingSize: "6 wings"
  },
  {
    id: "krw-12",
    name: "12 Karolina Reaper Wings",
    category: "Karolina Reaper Wings",
    price: 104.90,
    description: "12 extreme heat wings, basted in Karolina Reaper sauce. Can you handle the heat?",
    spiceLevel: 3,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    servingSize: "12 wings"
  },

  // --- BURGERS ---
  {
    id: "b-chicken",
    name: "Chicken Burger",
    category: "Burgers",
    price: 36.90,
    description: "Crispy fried or grilled chicken breast fillet on a toasted bun with mayo and lettuce.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Single"
  },
  {
    id: "b-beef",
    name: "Beef Burger",
    category: "Burgers",
    price: 36.90,
    description: "Juicy flame-grilled 100% beef patty with gherkins, lettuce, tomato and burger sauce.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Single"
  },
  {
    id: "b-double-chicken",
    name: "Double Chicken Burger",
    category: "Burgers",
    price: 59.90,
    description: "Two crispy chicken breast fillets layered with fresh lettuce, mayo and melted cheese.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Double"
  },
  {
    id: "b-double-beef",
    name: "Double Beef Burger",
    category: "Burgers",
    price: 59.90,
    description: "Double beef patties, double the flavor! Melted cheddar cheese, gherkins and fresh salad.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Double"
  },
  {
    id: "b-rib",
    name: "Rib Burger",
    category: "Burgers",
    price: 69.90,
    description: "Sweet and sticky flame-grilled rib patty on a fresh bun with gherkins and onion.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    servingSize: "Single"
  },

  // --- MEALS & COMBOS ---
  {
    id: "m-labola",
    name: "Labola Meal",
    category: "Meals & Combos",
    price: 84.90,
    description: "1/4 Grilled Chicken, Pap, Half Portion Livers, 3 Veg.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Chicken Spice Level",
        choices: [
          { label: "Mild 🌶️", priceModifier: 0 },
          { label: "Hot 🌶️🌶️", priceModifier: 0 },
          { label: "Extra Hot 🌶️🌶️🌶️", priceModifier: 0 },
          { label: "Lemon & Herb 🍋", priceModifier: 0 }
        ]
      },
      {
        name: "Livers Flavor",
        choices: [
          { label: "Mild Livers", priceModifier: 0 },
          { label: "Hot Livers", priceModifier: 0 }
        ]
      }
    ]
  },
  {
    id: "m-fafa",
    name: "Grilled FaFa Meal",
    category: "Meals & Combos",
    price: 74.90,
    description: "1/4 Chicken, Chips, 330ml Drink.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Chicken Spice Level",
        choices: [
          { label: "Mild 🌶️", priceModifier: 0 },
          { label: "Hot 🌶️🌶️", priceModifier: 0 },
          { label: "Extra Hot 🌶️🌶️🌶️", priceModifier: 0 },
          { label: "Lemon & Herb 🍋", priceModifier: 0 }
        ]
      },
      {
        name: "Drink Upgrade",
        choices: [
          { label: "330ml Soda (Included)", priceModifier: 0 },
          { label: "Upgrade to 500ml Soda", priceModifier: 7.00 },
          { label: "Upgrade to Mocktail", priceModifier: 20.00 }
        ]
      }
    ]
  },
  {
    id: "m-14-single",
    name: "1/4 Chicken & Single Burger Meal",
    category: "Meals & Combos",
    price: 69.90,
    description: "Quarter grilled chicken, single burger (chicken or beef), chips & drink.",
    spiceLevel: 1,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Burger Patty Option",
        choices: [
          { label: "Chicken Patty", priceModifier: 0 },
          { label: "Beef Patty", priceModifier: 0 }
        ]
      },
      {
        name: "Chicken Spice Level",
        choices: [
          { label: "Mild 🌶️", priceModifier: 0 },
          { label: "Hot 🌶️🌶️", priceModifier: 0 },
          { label: "Extra Hot 🌶️🌶️🌶️", priceModifier: 0 },
          { label: "Lemon & Herb 🍋", priceModifier: 0 }
        ]
      },
      {
        name: "Drink Upgrade",
        choices: [
          { label: "330ml Soda (Included)", priceModifier: 0 },
          { label: "Upgrade to 500ml Soda", priceModifier: 7.00 },
          { label: "Upgrade to Mocktail", priceModifier: 20.00 }
        ]
      }
    ]
  },
  {
    id: "m-14-double",
    name: "1/4 Chicken & Double Burger Meal",
    category: "Meals & Combos",
    price: 84.90,
    description: "Quarter grilled chicken, double burger (chicken or beef), chips & drink.",
    spiceLevel: 2,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Burger Patty Option",
        choices: [
          { label: "Double Chicken Patty", priceModifier: 0 },
          { label: "Double Beef Patty", priceModifier: 0 }
        ]
      },
      {
        name: "Chicken Spice Level",
        choices: [
          { label: "Mild 🌶️", priceModifier: 0 },
          { label: "Hot 🌶️🌶️", priceModifier: 0 },
          { label: "Extra Hot 🌶️🌶️🌶️", priceModifier: 0 },
          { label: "Lemon & Herb 🍋", priceModifier: 0 }
        ]
      },
      {
        name: "Drink Upgrade",
        choices: [
          { label: "330ml Soda (Included)", priceModifier: 0 },
          { label: "Upgrade to 500ml Soda", priceModifier: 7.00 },
          { label: "Upgrade to Mocktail", priceModifier: 20.00 }
        ]
      }
    ]
  },
  {
    id: "m-12-single",
    name: "1/2 Chicken & Single Burger Meal",
    category: "Meals & Combos",
    price: 99.90,
    description: "Half grilled chicken, single burger, family-sized chips & drinks.",
    spiceLevel: 2,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Burger Patty Option",
        choices: [
          { label: "Chicken Patty", priceModifier: 0 },
          { label: "Beef Patty", priceModifier: 0 }
        ]
      },
      {
        name: "Chicken Spice Level",
        choices: [
          { label: "Mild 🌶️", priceModifier: 0 },
          { label: "Hot 🌶️🌶️", priceModifier: 0 },
          { label: "Extra Hot 🌶️🌶️🌶️", priceModifier: 0 }
        ]
      }
    ]
  },
  {
    id: "m-12-double",
    name: "1/2 Chicken & Double Burger Meal",
    category: "Meals & Combos",
    price: 119.90,
    description: "Half grilled chicken, double burger of your choice, large chips & cold drinks.",
    spiceLevel: 2,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Burger Patty Option",
        choices: [
          { label: "Double Chicken Patty", priceModifier: 0 },
          { label: "Double Beef Patty", priceModifier: 0 }
        ]
      },
      {
        name: "Chicken Spice Level",
        choices: [
          { label: "Mild 🌶️", priceModifier: 0 },
          { label: "Hot 🌶️🌶️", priceModifier: 0 },
          { label: "Extra Hot 🌶️🌶️🌶️", priceModifier: 0 }
        ]
      }
    ]
  },
  {
    id: "m-full-single",
    name: "Full Chicken & Single Burger Meal",
    category: "Meals & Combos",
    price: 149.90,
    description: "Full flame-grilled chicken, single burger of choice, massive chips & soft drinks.",
    spiceLevel: 2,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Burger Patty Option",
        choices: [
          { label: "Chicken Patty", priceModifier: 0 },
          { label: "Beef Patty", priceModifier: 0 }
        ]
      }
    ]
  },
  {
    id: "m-full-double",
    name: "Full Chicken & Double Burger Meal",
    category: "Meals & Combos",
    price: 169.90,
    description: "Full flame-grilled chicken, double burger, family chips and large drink combo.",
    spiceLevel: 2,
    isAvailable: true,
    isCombo: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    comboOptions: [
      {
        name: "Burger Patty Option",
        choices: [
          { label: "Double Chicken Patty", priceModifier: 0 },
          { label: "Double Beef Patty", priceModifier: 0 }
        ]
      }
    ]
  },
  {
    id: "m-2full-2single",
    name: "2 Full Chicken & 2 Single Burger Meal",
    category: "Meals & Combos",
    price: 249.90,
    description: "Two whole grilled chickens, two single burgers, giant chips, buns & drinks.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg"
  },
  {
    id: "m-2full-2double",
    name: "2 Full Chicken & 2 Double Burger Meal",
    category: "Meals & Combos",
    price: 319.90,
    description: "Two whole grilled chickens, two double burgers, giant chips, rolls & drinks.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg"
  },
  {
    id: "m-3full-3single",
    name: "3 Full Chicken & 3 Single Burger Meal",
    category: "Meals & Combos",
    price: 319.90,
    description: "Three whole grilled chickens, three single burgers, family pack chips & soft drinks.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg"
  },
  {
    id: "m-3full-3double",
    name: "3 Full Chicken & 3 Double Burger Meal",
    category: "Meals & Combos",
    price: 429.90,
    description: "Ultimate Party Pack! Three whole chickens, three double burgers, chips and drinks.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg"
  },
  {
    id: "m-rib-single",
    name: "Rib & Single Burger Meal",
    category: "Meals & Combos",
    price: 149.90,
    description: "Flame-grilled rib patty burger, single chicken/beef burger, chips & drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg"
  },
  {
    id: "m-rib-double",
    name: "Rib & Double Burger Meal",
    category: "Meals & Combos",
    price: 169.90,
    description: "Flame-grilled rib patty burger, double chicken/beef burger, chips & drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg"
  },
  {
    id: "m-2rib-2single",
    name: "2 Ribs & 2 Single Burger Meal",
    category: "Meals & Combos",
    price: 249.90,
    description: "Two rib burgers, two single chicken/beef burgers, jumbo chips & drinks.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg"
  },
  {
    id: "m-2rib-2double",
    name: "2 Ribs & 2 Double Burger Meal",
    category: "Meals & Combos",
    price: 319.90,
    description: "Two rib burgers, two double chicken/beef burgers, jumbo chips & drinks.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg"
  },
  {
    id: "m-3rib-3single",
    name: "3 Ribs & 3 Single Burger Meal",
    category: "Meals & Combos",
    price: 319.90,
    description: "Three rib burgers, three single chicken/beef burgers, giant chips & drinks.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg"
  },
  {
    id: "m-3rib-3double",
    name: "3 Ribs & 3 Double Burger Meal",
    category: "Meals & Combos",
    price: 429.90,
    description: "The ultimate rib and burger feast for the whole group. Includes giant chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg"
  },

  // --- FAMILY MEALS ---
  {
    id: "fm-feast",
    name: "Krispy Family Feast",
    category: "Family Meals",
    price: 239.90,
    description: "6pc fried chicken, large chips & 4 buns.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg"
  },
  {
    id: "fm-fiesta",
    name: "Grilled Family Fiesta",
    category: "Family Meals",
    price: 239.90,
    description: "Whole grilled chicken, large chips, coleslaw, x2 burgers, 4 rolls & 2L Cold Drink.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg"
  },
  {
    id: "fm-8pc-pack",
    name: "8pc fried chicken, large chips & 4 rolls",
    category: "Family Meals",
    price: 159.90,
    description: "Eight crunchy chicken pieces, a large box of chips and 4 soft rolls.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg"
  },
  {
    id: "fm-16pc-pack",
    name: "16pc chicken, x2 large chips & 8 rolls",
    category: "Family Meals",
    price: 299.90,
    description: "Sixteen crunchy pieces of fried chicken, two large boxes of chips and eight soft rolls.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg"
  },
  {
    id: "fm-2grilled-pack",
    name: "2 whole grilled chicken, x2 large chips & 8 buns",
    category: "Family Meals",
    price: 279.90,
    description: "Two full flame-grilled chickens basted to perfection, with two large chips and eight fresh buns.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg"
  },

  // --- SIDES & EXTRAS ---
  {
    id: "s-pap",
    name: "Pap",
    category: "Sides & Extras",
    price: 21.90,
    description: "Traditional soft South African maize meal porridge, served warm.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-coleslaw",
    name: "Coleslaw",
    category: "Sides & Extras",
    price: 21.90,
    description: "Creamy, fresh-shredded cabbage and carrot salad.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-livers-full",
    name: "Livers (Full Portion)",
    category: "Sides & Extras",
    price: 36.90,
    description: "Spicy flame-grilled chicken livers basted in chili and garlic sauce.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-livers-half",
    name: "Livers (Half Portion)",
    category: "Sides & Extras",
    price: 21.90,
    description: "A half-helping of our legendary spicy, flame-grilled chicken livers.",
    spiceLevel: 2,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-chips-small",
    name: "Chips (Small)",
    category: "Sides & Extras",
    price: 21.90,
    description: "Crispy, golden-fried hot potato chips.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-chips-regular",
    name: "Chips (Regular)",
    category: "Sides & Extras",
    price: 32.90,
    description: "A standard portion of our famous crispy spiced potato chips.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-chips-large",
    name: "Chips (Large)",
    category: "Sides & Extras",
    price: 41.90,
    description: "A large shared box of crispy golden seasoned chips.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-rice",
    name: "Rice",
    category: "Sides & Extras",
    price: 21.90,
    description: "Savory yellow rice seasoned with local herbs.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-roll",
    name: "Roll",
    category: "Sides & Extras",
    price: 10.90,
    description: "Freshly baked soft bread roll with butter.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-salad",
    name: "Side Salad",
    category: "Sides & Extras",
    price: 21.90,
    description: "Crisp garden lettuce, cucumber, tomato and light dressing.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-veg",
    name: "Grilled Veg",
    category: "Sides & Extras",
    price: 21.90,
    description: "Seasoned flame-grilled Mediterranean-style mixed vegetables.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },

  // --- BEVERAGES ---
  {
    id: "d-330ml",
    name: "330ml Soda",
    category: "Beverages",
    price: 21.90,
    description: "Chilled 330ml can of Coca-Cola, Fanta, Sprite, or Creme Soda.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "d-500ml",
    name: "500ml Soda",
    category: "Beverages",
    price: 28.90,
    description: "500ml plastic bottle of your favorite cold carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "d-1l",
    name: "1L Soda",
    category: "Beverages",
    price: 39.90,
    description: "Refreshing 1-litre bottle of cold soda, perfect for two.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "d-2l",
    name: "2L Soda",
    category: "Beverages",
    price: 49.90,
    description: "Massive 2-litre family-sized cold soda bottle.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "d-water-500ml",
    name: "500ml Water",
    category: "Beverages",
    price: 16.90,
    description: "Pure bottled spring water, choice of still or sparkling.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "d-water-1l",
    name: "1L Water",
    category: "Beverages",
    price: 21.90,
    description: "Large 1-litre bottle of pure chilled mineral water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },

  // --- MOCKTAILS ---
  {
    id: "m-mojito",
    name: "Virgin Mojito",
    category: "Mocktails",
    price: 39.90,
    description: "Refreshing lime, fresh mint leaves, cane sugar, topped with crushed ice and soda.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "m-berry",
    name: "Berry Blast",
    category: "Mocktails",
    price: 49.90,
    description: "A delicious blend of sweet wild berries, cranberry juice, and sparkling lemonade.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "m-sunrise",
    name: "Tropical Sunrise",
    category: "Mocktails",
    price: 49.90,
    description: "Layers of orange juice, mango nectar, and grenadine syrup, served cold with ice.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "m-ginger",
    name: "Ginger Fizz",
    category: "Mocktails",
    price: 39.90,
    description: "Zesty ginger syrup, freshly squeezed lemon, and bubbly ginger ale on ice.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "m-citrus",
    name: "Citrus Cooler",
    category: "Mocktails",
    price: 39.90,
    description: "Tangy fresh grapefruit, blood orange, lime and a splash of tonic water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "m-passion",
    name: "Passion Punch",
    category: "Mocktails",
    price: 49.90,
    description: "Exotic passion fruit pulp, pineapple nectar, and bubbly soda served with fresh mint.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "m-lemonade",
    name: "Sparkling Lemonade",
    category: "Mocktails",
    price: 39.90,
    description: "Traditional homemade freshly-squeezed lemon juice topped with sparkling club soda.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },

  // --- BREAKFAST MENU ---
  {
    id: "bf-sandwich",
    name: "Chicken Mayo Sandwich",
    category: "Breakfast Menu",
    price: 29.90,
    description: "Fresh toast filled with creamy chicken mayonnaise.",
    spiceLevel: 0,
    isAvailable: true,
    isBreakfast: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "bf-sandwich-coffee",
    name: "Chicken Mayo Sandwich + Coffee",
    category: "Breakfast Menu",
    price: 39.90,
    description: "Chicken mayo sandwich served with a freshly brewed hot coffee.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    isBreakfast: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "bf-wrap",
    name: "Breakfast Wrap",
    category: "Breakfast Menu",
    price: 39.90,
    description: "Soft tortilla wrap packed with fluffy eggs, chicken strips and cheese.",
    spiceLevel: 0,
    isAvailable: true,
    isBreakfast: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "bf-wrap-coffee",
    name: "Breakfast Wrap + Coffee",
    category: "Breakfast Menu",
    price: 49.90,
    description: "Breakfast wrap served with a warm, refreshing cup of coffee.",
    spiceLevel: 0,
    isAvailable: true,
    isBreakfast: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },

  // --- KIDDIES MEALS ---
  {
    id: "km-burger",
    name: "Kids Burger",
    category: "Kiddies Meals",
    price: 49.90,
    description: "Junior chicken burger, small chips, and a sweet juice box.",
    spiceLevel: 0,
    isAvailable: true,
    isKiddies: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "km-nuggets",
    name: "Kids Nuggets",
    category: "Kiddies Meals",
    price: 49.90,
    description: "4 krispy golden nuggets, small chips, and a sweet juice box.",
    spiceLevel: 0,
    isAvailable: true,
    isKiddies: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "km-combo",
    name: "Kids Combo",
    category: "Kiddies Meals",
    price: 59.90,
    description: "Krispy fried drumstick, 2 nuggets, small chips & juice.",
    spiceLevel: 0,
    isPopular: true,
    isAvailable: true,
    isKiddies: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },

  // --- CHICKEN TWISTA ---
  {
    id: "ct-fried-salads",
    name: "Chicken Twista (Fried strips with salads)",
    category: "Chicken Twista",
    price: 49.90,
    description: "Crispy fried chicken strips with fresh green salads wrapped in a soft warm tortilla.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Twista-1.jpg"
  },
  {
    id: "ct-fried-coleslaw",
    name: "Chicken Twista (Coleslaw with fried strips)",
    category: "Chicken Twista",
    price: 49.90,
    description: "Crunchy fried chicken strips layered with rich, creamy coleslaw in a soft wrap.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Twista-1.jpg"
  },
  {
    id: "ct-grilled-salads",
    name: "Chicken Twista (Grilled strips with salads)",
    category: "Chicken Twista",
    price: 49.90,
    description: "Succulent flame-grilled chicken strips paired with fresh garden salad in a toasted wrap.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Twista-1.jpg"
  },
  {
    id: "ct-grilled-coleslaw",
    name: "Chicken Twista (Coleslaw with grilled strips)",
    category: "Chicken Twista",
    price: 49.90,
    description: "Tender flame-grilled chicken strips layered with rich coleslaw in a soft warm wrap.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Twista-1.jpg"
  },
  {
    id: "ct-grilled-feta",
    name: "Chicken Twista (Feta, jalapenos, chips & salads)",
    category: "Chicken Twista",
    price: 59.90,
    description: "Premium twist! Grilled or fried chicken strips with rich feta cheese, hot jalapenos, chips & salads.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Twista-1.jpg"
  }
];

const mapItemImage = (item: MenuItem): string => {
  const cat = item.category.toLowerCase();
  const name = item.name.toLowerCase();

  // 1. Krispy Fried Chicken Carousel piece counts
  if (cat === "fried chicken" || cat === "krispy fried chicken") {
    if (name.includes("2pc") || name.includes("2 piece")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_2.webp";
    }
    if (name.includes("3pc") || name.includes("3 piece")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_3.webp";
    }
    if (name.includes("4pc") || name.includes("4 piece")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_4.webp";
    }
    if (name.includes("8pc") || name.includes("8 piece") || name.includes("6pc") || name.includes("12pc") || name.includes("15pc") || name.includes("18pc") || name.includes("24pc")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_8.webp";
    }
    if (name.includes("1pc") || name.includes("1 piece")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_1.webp";
    }
  }

  // Double Deals (Krispy vs Grilled)
  if (name.includes("double") && name.includes("burger")) {
    if (name.includes("grilled")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/grilled_chicken_burger_double_deal.webp";
    }
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_chicken_burger_double_deal.webp";
  }

  // Other items / Categories
  if (name.includes("paella")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/paella.webp";
  }
  if (cat.includes("tenders")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_fried_tenders.webp";
  }
  if (cat.includes("wings")) {
    if (cat.includes("reaper") || name.includes("reaper")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/carolina_reaper_wings.webp";
    }
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_fried_wings.webp";
  }
  if (cat.includes("king fried burgers")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/king_fried_burgers.webp";
  }
  if (cat.includes("grilled chicken")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/grilled_chicken.webp";
  }
  if (cat.includes("grilled burgers") || (cat.includes("burgers") && name.includes("grilled"))) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/grilled_burgers.webp";
  }
  if (cat.includes("burgers")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/king_fried_burgers.webp";
  }
  if (cat.includes("breakfast") || item.isBreakfast) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/breakfast.webp";
  }
  if (cat.includes("kiddies") || item.isKiddies) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/kiddies_meals.webp";
  }
  if (cat.includes("twista")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/chicken_twista.webp";
  }
  if (cat.includes("family")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/family_meals.webp";
  }
  if (cat.includes("sides") || cat.includes("extras")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/sides.webp";
  }
  if (cat.includes("mocktails")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/mocktails.webp";
  }
  if (cat.includes("beverages") || cat.includes("drinks")) {
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/mocktails.webp";
  }
  if (cat.includes("meals & combos")) {
    // Determine if meal/combo is mainly grilled or fried
    if (name.includes("grilled") || name.includes("fafa") || name.includes("labola")) {
      return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/grilled_chicken.webp";
    }
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/king_fried_burgers.webp";
  }

  return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/logo.webp";
};

export const MENU_ITEMS: MenuItem[] = RAW_MENU_ITEMS.map((item) => ({
  ...item,
  imageUrl: mapItemImage(item),
}));
