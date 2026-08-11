export const gyms: any[] = [];

export const cities = [
  { name: "Bangalore", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400" },
  { name: "Mumbai", image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=400" },
  { name: "Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=400" },
  { name: "Hyderabad", image: "https://images.unsplash.com/photo-1574007557239-acf6863bc375?auto=format&fit=crop&q=80&w=400" }
];

export const pricingPlans = [
  {
    name: "Daily Pack",
    price: "₹99",
    features: ["Access to 1 Gym", "Valid for 24 Hours", "Locker Access", "Basic Amenities"],
    buttonText: "Buy Now",
    popular: false
  },
  {
    name: "10-Day Pack",
    price: "₹799",
    features: ["Access to any Gym", "Valid for 30 Days", "Free Trainer Consultation", "Priority Support"],
    buttonText: "Buy Now",
    popular: true
  },
  {
    name: "Monthly Pack",
    price: "₹1,999",
    features: ["Unlimited Access", "All Cities", "Personal Trainer (2 Sessions)", "Free Merchandise"],
    buttonText: "Buy Now",
    popular: false
  }
];
