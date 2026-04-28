export const gyms = [
  {
    id: "1",
    name: "Iron Paradise Gym",
    location: "Road No. 12, Banjara Hills, Hyderabad",
    lat: 17.4123,
    lng: 78.4321,
    distance: "1.2 km away",
    rating: 4.8,
    reviews: 234,
    price_per_day: 99,
    tags: ["AC", "Trainer", "Steam Room"],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
    status: "Open",
    hours: "5:00 AM - 11:00 PM",
    description: "Iron Paradise is a premium fitness center in the heart of Banjara Hills. With state-of-the-art equipment, certified trainers, and a motivating environment, we help you achieve your fitness goals.",
    gallery: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800"
    ],
    amenities: ["AC", "Personal Trainer", "Parking", "Locker Room", "WiFi", "Supplements"],
    trainers: [
      { name: "Rajesh Kumar", specialty: "Strength Training", avatar: "https://i.pravatar.cc/150?u=rajesh" },
      { name: "Priya Sharma", specialty: "Yoga & Flexibility", avatar: "https://i.pravatar.cc/150?u=priya" }
    ]
  },
  {
    id: "2",
    name: "Fit & Flex Studio",
    location: "Indiranagar, Bangalore",
    lat: 12.9784,
    lng: 77.6408,
    distance: "2.5 km away",
    rating: 4.5,
    reviews: 128,
    price_per_day: 149,
    tags: ["Yoga", "Zumba", "Shower"],
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800",
    status: "Open",
    hours: "6:00 AM - 10:00 PM",
    description: "Fit & Flex Studio offers a unique blend of high-intensity training and mindful movement. Join our vibrant community to get fit in a fun, supportive atmosphere.",
    gallery: [
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"
    ],
    amenities: ["AC", "Shower", "WiFi", "Zumba Classes", "Yoga Mats"],
    trainers: [
      { name: "Anita Desai", specialty: "Zumba & Cardio", avatar: "https://i.pravatar.cc/150?u=anita" }
    ]
  },
  {
    id: "3",
    name: "Power House Fitness",
    location: "HSR Layout, Bangalore",
    lat: 12.9121,
    lng: 77.6445,
    distance: "0.8 km away",
    rating: 4.9,
    reviews: 412,
    price_per_day: 249,
    tags: ["Crossfit", "Sauna", "Parking"],
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=800",
    status: "Open",
    hours: "5:00 AM - 12:00 AM",
    description: "Experience the raw energy of Power House Fitness. Dedicated zones for powerlifting, crossfit, and functional training make this the ultimate destination for serious athletes.",
    gallery: [
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=800"
    ],
    amenities: ["AC", "Parking", "Sauna", "Locker Room", "Crossfit Rig"],
    trainers: [
      { name: "Vikram Singh", specialty: "Powerlifting", avatar: "https://i.pravatar.cc/150?u=vikram" },
      { name: "Rahul Dev", specialty: "Functional Training", avatar: "https://i.pravatar.cc/150?u=rahul" }
    ]
  },
  {
    id: "4",
    name: "The Gym Co.",
    location: "Whitefield, Bangalore",
    lat: 12.9698,
    lng: 77.7500,
    distance: "4.1 km away",
    rating: 4.2,
    reviews: 89,
    price_per_day: 99,
    tags: ["Basic", "Trainer"],
    image: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=800",
    status: "Closed",
    hours: "6:00 AM - 9:00 PM",
    description: "A friendly neighborhood gym equipped with all the essentials. Perfect for beginners and those looking for a no-nonsense workout space.",
    gallery: [
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=800"
    ],
    amenities: ["AC", "Personal Trainer", "Parking"],
    trainers: [
      { name: "Amit Patel", specialty: "General Fitness", avatar: "https://i.pravatar.cc/150?u=amit" }
    ]
  },
  {
    id: "5",
    name: "Elite Sport Gym",
    location: "Madhapur, Hyderabad",
    lat: 17.4483, // Close to Hitech City
    lng: 78.3915,
    distance: "0.5 km away",
    rating: 4.7,
    reviews: 156,
    price_per_day: 120,
    tags: ["AC", "Crossfit", "Trainer"],
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800",
    status: "Open",
    hours: "5:30 AM - 10:30 PM",
    description: "Elite Sport Gym is your ultimate destination for performance training. Featuring olympic lifting platforms and high-intensity interval training zones.",
    amenities: ["AC", "Personal Trainer", "Parking", "Locker Room", "Shower"],
  },
  {
    id: "6",
    name: "Cult Sports Gym",
    location: "Chaitanyapuri, Hyderabad",
    lat: 17.313243890784122,
    lng: 78.54558170607503,
    distance: "0.2 km away",
    rating: 4.9,
    reviews: 0,
    price_per_day: 99,
    tags: ["AC", "Personal Trainer", "WiFi"],
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800", // Using a consistent high-quality gym image
    status: "Open",
    hours: "5:00 AM - 11:00 PM",
    description: "Cult Sports Gym offers a premium fitness experience with expert trainers and modern amenities. Join us to transform your lifestyle.",
    amenities: ["AC", "Personal Trainer", "WiFi", "Parking", "Locker Room"],
  }
];

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
