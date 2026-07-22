import { MenuItem } from "./types";

const RAW_MENU_ITEMS: MenuItem[] = [
  // --- GRILLED CHICKEN ---
  {
    id: "g-chicken-main",
    name: "Flame-Grilled Chicken",
    category: "Grilled Chicken",
    price: 34.90,
    description: "Signature flame-grilled chicken basted in your choice of legendary sauce.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Chicken-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Portion Size",
        choices: [
          { label: "Quarter Chicken", priceModifier: 0 },
          { label: "Half Chicken", priceModifier: 35.00 },
          { label: "Full Chicken", priceModifier: 90.00 },
          { label: "2 Full Chicken Family Pack", priceModifier: 155.00 }
        ]
      },
      {
        name: "Chips / Meal Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 15.00 }
        ]
      }
    ]
  },

  // --- CHICKEN PAELLA ---
  {
    id: "paella-main",
    name: "Signature Chicken Paella",
    category: "Chicken Paella",
    price: 49.90,
    description: "Flavourful signature chicken paella seasoned with traditional spices.",
    spiceLevel: 2,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/paella.webp",
    isCombo: true,
    comboOptions: [
      {
        name: "Portion Size",
        choices: [
          { label: "1/4 Chicken Paella", priceModifier: 0 },
          { label: "1/2 Chicken Paella", priceModifier: 40.00 },
          { label: "Full Chicken Paella", priceModifier: 120.00 }
        ]
      }
    ]
  },

  // --- FRIED CHICKEN ---
  {
    id: "f-1pc",
    name: "1pc Fried Chicken",
    category: "Fried Chicken",
    price: 21.90,
    description: "One piece of crispy, golden fried chicken. Option to add chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_1.webp",
    servingSize: "1 Piece",
    isCombo: true,
    comboOptions: [
      {
        name: "Fries/Chips Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 10.00 }
        ]
      }
    ]
  },
  {
    id: "f-2pc",
    name: "2pc Fried Chicken",
    category: "Fried Chicken",
    price: 36.90,
    description: "Two pieces of crispy, golden fried chicken. Option to add chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_2.webp",
    servingSize: "2 Pieces",
    isCombo: true,
    comboOptions: [
      {
        name: "Fries/Chips Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 5.00 }
        ]
      }
    ]
  },
  {
    id: "f-3pc",
    name: "3pc Fried Chicken",
    category: "Fried Chicken",
    price: 54.90,
    description: "Three pieces of crunchy golden fried chicken. Option to add chips.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_3.webp",
    servingSize: "3 Pieces",
    isCombo: true,
    comboOptions: [
      {
        name: "Fries/Chips Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 15.00 }
        ]
      }
    ]
  },
  {
    id: "f-4pc",
    name: "4pc Fried Chicken",
    category: "Fried Chicken",
    price: 69.90,
    description: "Four pieces of legendary crunchy fried chicken. Option to add chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_4.webp",
    servingSize: "4 Pieces",
    isCombo: true,
    comboOptions: [
      {
        name: "Fries/Chips Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 20.00 }
        ]
      }
    ]
  },
  {
    id: "f-8pc",
    name: "8pc Fried Chicken",
    category: "Fried Chicken",
    price: 124.90,
    description: "Eight pieces of delicious fried chicken. Option to add chips.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_8.webp",
    servingSize: "8 Pieces",
    isCombo: true,
    comboOptions: [
      {
        name: "Fries/Chips Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 25.00 }
        ]
      }
    ]
  },

  // --- KRISPY FRIED TENDERS ---
  {
    id: "t-tenders-main",
    name: "Krispy Fried Tenders",
    category: "Krispy Fried Tenders",
    price: 24.90,
    description: "Crispy, golden chicken tenders served with our signature dipping sauce.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Tenders-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Portion Size",
        choices: [
          { label: "1pc Tender", priceModifier: 0 },
          { label: "2pc Tenders", priceModifier: 20.00 },
          { label: "3pc Tenders + Chips", priceModifier: 40.00 }
        ]
      }
    ]
  },

  // --- KRISPY FRIED WINGS ---
  {
    id: "w-wings-main",
    name: "Krispy & Grilled Wings",
    category: "Krispy Fried Wings",
    price: 39.90,
    description: "Tender, juicy chicken wings basted or fried to golden crispy perfection.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Fried-Chicken-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Style",
        choices: [
          { label: "Krispy Fried", priceModifier: 0 },
          { label: "Dipped (Glazed & Saucy)", priceModifier: 0 },
          { label: "Flame-Grilled", priceModifier: 0 }
        ]
      },
      {
        name: "Portion Size",
        choices: [
          { label: "4 Wings", priceModifier: 0 },
          { label: "6 Wings", priceModifier: 10.00 },
          { label: "12 Wings", priceModifier: 60.00 }
        ]
      }
    ]
  },

  // --- BURGERS ---
  {
    id: "kb-burger-main",
    name: "King Fried Burger",
    category: "Burgers",
    price: 37.90,
    description: "Crispy chicken burger with our signature king patties.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Size Option",
        choices: [
          { label: "Single King Burger", priceModifier: 0 },
          { label: "Double King Burger", priceModifier: 22.00 },
          { label: "Triple King Burger", priceModifier: 37.00 }
        ]
      },
      {
        name: "Chips / Meal Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 15.00 }
        ]
      }
    ]
  },
  {
    id: "kb-beef-burger",
    name: "Beef Burger",
    category: "Burgers",
    price: 37.90,
    description: "Flame-grilled juicy beef patty with fresh lettuce, sliced tomato, gherkins, and our secret burger sauce on a toasted sesame seed bun.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "/kkx-beef-burger.png",
    isCombo: true,
    comboOptions: [
      {
        name: "Size Option",
        choices: [
          { label: "Single Beef Burger", priceModifier: 0 },
          { label: "Double Beef Burger", priceModifier: 22.00 },
          { label: "Triple Beef Burger", priceModifier: 37.00 }
        ]
      },
      {
        name: "Chips / Meal Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 15.00 }
        ]
      }
    ]
  },

  // --- KAROLINA REAPER WINGS ---
  {
    id: "krw-wings-main",
    name: "Karolina Reaper Wings",
    category: "Karolina Reaper Wings",
    price: 42.90,
    description: "Extreme heat wings, basted in Karolina Reaper sauce.",
    spiceLevel: 3,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Dipped-Wings-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Portion Size",
        choices: [
          { label: "4 Wings", priceModifier: 0 },
          { label: "6 Wings", priceModifier: 12.00 },
          { label: "12 Wings", priceModifier: 62.00 }
        ]
      }
    ]
  },

  // --- BURGERS ---
  {
    id: "b-double-deal",
    name: "Double Burger Deal",
    category: "Burgers",
    price: 69.90,
    description: "Get two of our delicious burgers in one great deal! Choose Chicken or Beef, Fried or Grilled.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Chicken-Burger-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Burger Style Option",
        choices: [
          { label: "Chicken (Fried)", priceModifier: 0 },
          { label: "Chicken (Grilled)", priceModifier: 0 },
          { label: "Beef (Grilled)", priceModifier: 0 }
        ]
      },
      {
        name: "Chips / Meal Option",
        choices: [
          { label: "Without Chips", priceModifier: 0 },
          { label: "With Chips", priceModifier: 15.00 }
        ]
      }
    ]
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
    id: "fm-sixer",
    name: "Krispy Sixer Meal",
    category: "Family Meals",
    price: 149.90,
    description: "6 Piece Fried Chicken, Large Chips & 4 Buns.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-mix",
    name: "Krispy Mix Meal",
    category: "Family Meals",
    price: 179.90,
    description: "1/2 Grilled Chicken, Medium Chips, 4 Piece Fried Chicken, Spicy Rice & 4 Rolls.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-fafa-krispy",
    name: "Krispy Fafa Meal",
    category: "Family Meals",
    price: 169.90,
    description: "8 Piece Fried Chicken, Large Chips & 4 Rolls.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-fiesta-krispy",
    name: "Krispy Family Fiesta",
    category: "Family Meals",
    price: 259.90,
    description: "8 Piece Fried Chicken, Large Chips, Coleslaw, 2 Fried Chicken Burgers, 2L Cold Drink & 4 Rolls.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-mega-krispy",
    name: "MEGA Krispy Meal",
    category: "Family Meals",
    price: 319.90,
    description: "16 Piece Fried Chicken, x2 Large Chips and 8 Rolls.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-fafa-grilled",
    name: "Grilled Fafa Meal",
    category: "Family Meals",
    price: 169.90,
    description: "Whole Grilled Chicken, Large Chips & 4 Rolls.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-fiesta-grilled",
    name: "Grilled Family Fiesta",
    category: "Family Meals",
    price: 259.90,
    description: "Full Grilled Chicken, Large Chips, Coleslaw, 2 Fried Chicken Burgers, 2L Cold Drink & 4 Rolls.",
    spiceLevel: 1,
    isPopular: true,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },
  {
    id: "fm-mega-grilled",
    name: "MEGA Grilled Meal",
    category: "Family Meals",
    price: 319.90,
    description: "2 Whole Grilled Chicken, x2 Large Chips and 8 Rolls.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp"
  },

  // --- SIDES & EXTRAS ---
  {
    id: "s-chips-regular",
    name: "Chips (Regular)",
    category: "Sides & Extras",
    price: 19.90,
    description: "A standard portion of our famous crispy spiced potato chips.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Side+Item"
  },
  {
    id: "s-chips-large",
    name: "Chips (Large)",
    category: "Sides & Extras",
    price: 34.90,
    description: "A large shared box of crispy golden seasoned chips.",
    spiceLevel: 0,
    isPopular: true,
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

  // --- BEVERAGES ---
  {
    id: "bev-coke-440ml",
    name: "Coke (440ml)",
    category: "Beverages",
    price: 20.00,
    description: "Coca-Cola Classic carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Coke+440ml",
    servingSize: "440ml"
  },
  {
    id: "bev-coke-500ml-can",
    name: "Coke (500ml Can)",
    category: "Beverages",
    price: 20.00,
    description: "Coca-Cola Classic carbonated soft drink can.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Coke+500ml+Can",
    servingSize: "500ml Can"
  },
  {
    id: "bev-coke-1lt",
    name: "Coke (1L)",
    category: "Beverages",
    price: 25.00,
    description: "Coca-Cola Classic 1-litre bottle.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Coke+1L",
    servingSize: "1L"
  },
  {
    id: "bev-coke-2lt",
    name: "Coke (2L)",
    category: "Beverages",
    price: 35.00,
    description: "Coca-Cola Classic 2-litre family size bottle.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Coke+2L",
    servingSize: "2L"
  },
  {
    id: "bev-sprite-2lt",
    name: "Sprite (2L)",
    category: "Beverages",
    price: 35.00,
    description: "Refreshing Lemon-Lime carbonated soft drink family bottle.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Sprite+2L",
    servingSize: "2L"
  },
  {
    id: "bev-sprite-440ml",
    name: "Sprite (440ml)",
    category: "Beverages",
    price: 20.00,
    description: "Refreshing Lemon-Lime carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Sprite+440ml",
    servingSize: "440ml"
  },
  {
    id: "bev-fanta-440ml",
    name: "Fanta Orange (440ml)",
    category: "Beverages",
    price: 20.00,
    description: "Fanta Orange carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Fanta+440ml",
    servingSize: "440ml"
  },
  {
    id: "bev-pepsi-750ml",
    name: "Pepsi (750ml)",
    category: "Beverages",
    price: 17.00,
    description: "Pepsi carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Pepsi+750ml",
    servingSize: "750ml"
  },
  {
    id: "bev-pepsi-330ml",
    name: "Pepsi (330ml)",
    category: "Beverages",
    price: 12.00,
    description: "Pepsi carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Pepsi+330ml",
    servingSize: "330ml"
  },
  {
    id: "bev-mountain-dew",
    name: "Mountain Dew",
    category: "Beverages",
    price: 12.00,
    description: "Mountain Dew citrus carbonated soft drink by PepsiCo.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Mountain+Dew",
    servingSize: "-"
  },
  {
    id: "bev-mirinda",
    name: "Mirinda Orange",
    category: "Beverages",
    price: 12.00,
    description: "Mirinda Orange carbonated soft drink by PepsiCo.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Mirinda",
    servingSize: "-"
  },
  {
    id: "bev-7up",
    name: "7UP",
    category: "Beverages",
    price: 12.00,
    description: "7UP crisp lemon-lime carbonated soft drink by PepsiCo.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=7UP",
    servingSize: "-"
  },
  {
    id: "bev-cream-soda-500ml",
    name: "Cream Soda (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Cream Soda carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Cream+Soda+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-razz-500ml",
    name: "Razz (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Razz raspberry-flavoured carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Razz+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-iron-brew-500ml",
    name: "Iron Brew (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Classic Iron Brew carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Iron+Brew+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-orange-500ml",
    name: "Orange (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Orange carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Orange+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-pineapple-500ml",
    name: "Pineapple (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Pineapple carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Pineapple+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-cocopina-500ml",
    name: "Cocopina (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Cocopina coconut-pineapple carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Cocopina+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-litchi-500ml",
    name: "Litchi (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Litchi carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Litchi+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-rocky-ginger-500ml",
    name: "Rocky Ginger Beer (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Rocky Ginger carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Rocky+Ginger+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-passion-lemonade-500ml",
    name: "Passion Fruit & Lemonade (500ml)",
    category: "Beverages",
    price: 13.00,
    description: "Passion Fruit & Lemonade carbonated soft drink by Jive / Double O.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Passion+Lemonade+500ml",
    servingSize: "500ml"
  },
  {
    id: "bev-rocky-ginger-2lt",
    name: "Rocky Ginger Beer (2L)",
    category: "Beverages",
    price: 25.00,
    description: "Jive Rocky Ginger family bottle soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Rocky+Ginger+2L",
    servingSize: "2L"
  },
  {
    id: "bev-lem-lime-2lt",
    name: "Lem & Lime (2L)",
    category: "Beverages",
    price: 25.00,
    description: "Jive Lemon & Lime carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Lem+Lime+2L",
    servingSize: "2L"
  },
  {
    id: "bev-pine-spike-2lt",
    name: "Pine Spike (2L)",
    category: "Beverages",
    price: 25.00,
    description: "Jive Pine Spike carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Pine+Spike+2L",
    servingSize: "2L"
  },
  {
    id: "bev-mango-tango-2lt",
    name: "Mango Tango (2L)",
    category: "Beverages",
    price: 25.00,
    description: "Jive Mango Tango carbonated soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Mango+Tango+2L",
    servingSize: "2L"
  },
  {
    id: "bev-iron-brew-2lt",
    name: "Iron Brew (2L)",
    category: "Beverages",
    price: 25.00,
    description: "Jive Iron Brew family bottle soft drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Iron+Brew+2L",
    servingSize: "2L"
  },
  {
    id: "bev-energade",
    name: "Energade",
    category: "Beverages",
    price: 18.00,
    description: "Energade sports hydration drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Energade",
    servingSize: "-"
  },
  {
    id: "bev-still-water",
    name: "Still Water",
    category: "Beverages",
    price: 10.00,
    description: "Pure chilled still mineral water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Still+Water",
    servingSize: "-"
  },
  {
    id: "bev-sparkling-water",
    name: "Sparkling Water",
    category: "Beverages",
    price: 15.00,
    description: "Pure chilled sparkling mineral water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Sparkling+Water",
    servingSize: "-"
  },
  {
    id: "bev-score",
    name: "Score Energy",
    category: "Beverages",
    price: 15.00,
    description: "Score Energy Drink for an instant power boost.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Score+Energy",
    servingSize: "-"
  },
  {
    id: "bev-dragon",
    name: "Dragon Energy",
    category: "Beverages",
    price: 15.00,
    description: "Dragon Energy Drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Dragon+Energy",
    servingSize: "-"
  },
  {
    id: "bev-switch",
    name: "Switch Energy",
    category: "Beverages",
    price: 15.00,
    description: "Switch Premium Energy Drink.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Switch+Energy",
    servingSize: "-"
  },
  {
    id: "bev-red-bull",
    name: "Red Bull",
    category: "Beverages",
    price: 25.00,
    description: "Red Bull Energy Drink. Vitalizes body and mind.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Red+Bull",
    servingSize: "-"
  },
  {
    id: "bev-marula-aquella",
    name: "Marula (Aquella)",
    category: "Beverages",
    price: 17.00,
    description: "Aquella Marula flavoured sparkling spring water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Marula+Aquella",
    servingSize: "-"
  },
  {
    id: "bev-litchi-aquella",
    name: "Litchi (Aquella)",
    category: "Beverages",
    price: 17.00,
    description: "Aquella Litchi flavoured sparkling spring water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Litchi+Aquella",
    servingSize: "-"
  },
  {
    id: "bev-lemon-aquella",
    name: "Lemon (Aquella)",
    category: "Beverages",
    price: 17.00,
    description: "Aquella Lemon flavoured sparkling spring water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Lemon+Aquella",
    servingSize: "-"
  },
  {
    id: "bev-watermelon-aquella",
    name: "Watermelon (Aquella)",
    category: "Beverages",
    price: 17.00,
    description: "Aquella Watermelon flavoured sparkling spring water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Watermelon+Aquella",
    servingSize: "-"
  },
  {
    id: "bev-strawberry-aquella",
    name: "Strawberry (Aquella)",
    category: "Beverages",
    price: 17.00,
    description: "Aquella Strawberry flavoured sparkling spring water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Strawberry+Aquella",
    servingSize: "-"
  },
  {
    id: "bev-honeymelon-aquella",
    name: "Honey Melon (Aquella)",
    category: "Beverages",
    price: 17.00,
    description: "Aquella Honey Melon flavoured sparkling spring water.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Honey+Melon+Aquella",
    servingSize: "-"
  },
  {
    id: "bev-fruitree-juice",
    name: "Fruitree Juice",
    category: "Beverages",
    price: 15.00,
    description: "Fruitree premium nectar fruit juice.",
    spiceLevel: 0,
    isAvailable: true,
    imageUrl: "https://via.placeholder.com/300x200/F5F5F5/333333?text=Fruitree+Juice",
    servingSize: "-"
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
    id: "ct-twista-main",
    name: "Fully Loaded Twista",
    category: "Chicken Twista",
    price: 49.90,
    description: "Premium wrapped chicken strips loaded with fresh ingredients, available in both grilled and fried styles.",
    spiceLevel: 1,
    isAvailable: true,
    imageUrl: "https://www.krispykingsa.co.za/wp-content/uploads/2024/01/Grilled-Twista-1.jpg",
    isCombo: true,
    comboOptions: [
      {
        name: "Preparation Style",
        choices: [
          { label: "Crispy Fried", priceModifier: 0 },
          { label: "Flame-Grilled", priceModifier: 0 }
        ]
      },
      {
        name: "Fillings Option",
        choices: [
          { label: "Standard Loaded Salad & Sauce", priceModifier: 0 },
          { label: "Creamy Coleslaw Filling", priceModifier: 0 },
          { label: "Feta, Jalapenos & Chips (+R10.00)", priceModifier: 10.00 }
        ]
      }
    ]
  }
];

const mapItemImage = (item: MenuItem): string => {
  const cat = item.category.toLowerCase();
  const name = item.name.toLowerCase();

  // If the item has a custom asset image (e.g., our kkx beef burger.png), preserve it!
  if (item.imageUrl && (item.imageUrl.startsWith("/") || item.imageUrl.includes("kkx"))) {
    let url = item.imageUrl;
    if (url.includes("kkx beef burger")) {
      url = "/kkx-beef-burger.png";
    }
    return url;
  }

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
    // General fallback for Fried Chicken (such as our consolidated main card)
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1080/images/menu/krispy_8.webp";
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
    return "https://www.krispykingsa.co.za/cdn-cgi/image/width=1200/images/menu/family_meals.webp";
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

export const MENU_ITEMS: MenuItem[] = RAW_MENU_ITEMS
  .filter((item) => {
    const cat = item.category.toLowerCase();
    return cat !== "breakfast menu" && cat !== "kiddies meals" && cat !== "meals & combos";
  })
  .map((item) => ({
    ...item,
    imageUrl: mapItemImage(item),
  }));
