export interface NGO {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  category: string; // "food_bank" | "shelter" | "charity" | "community_kitchen"
  tags: string[];
}

export const NGO_DATABASE: NGO[] = [
  // ─── JABALPUR ───
  {
    id: "jbp-1",
    name: "Rotary Club Food Bank Jabalpur",
    city: "Jabalpur",
    state: "Madhya Pradesh",
    address: "Civil Lines, Jabalpur, MP 482001",
    lat: 23.1815,
    lng: 79.9864,
    phone: "+91-761-2400000",
    category: "food_bank",
    tags: ["food", "donation", "rotary"],
  },
  {
    id: "jbp-2",
    name: "Goonj Collection Centre Jabalpur",
    city: "Jabalpur",
    state: "Madhya Pradesh",
    address: "Napier Town, Jabalpur, MP 482001",
    lat: 23.1644,
    lng: 79.9349,
    phone: "+91-11-26972351",
    category: "charity",
    tags: ["food", "clothing", "essentials"],
  },
  {
    id: "jbp-3",
    name: "Annapurna Seva Trust Jabalpur",
    city: "Jabalpur",
    state: "Madhya Pradesh",
    address: "Sadar, Jabalpur, MP 482001",
    lat: 23.1743,
    lng: 79.9426,
    category: "community_kitchen",
    tags: ["langar", "free meals", "food"],
  },
  {
    id: "jbp-4",
    name: "Akshaya Patra Foundation Jabalpur",
    city: "Jabalpur",
    state: "Madhya Pradesh",
    address: "Adhartal, Jabalpur, MP 482004",
    lat: 23.2012,
    lng: 79.9761,
    phone: "+91-761-2357222",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },

  // ─── INDORE ───
  {
    id: "ind-1",
    name: "Sewa Bharati Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    address: "Scheme No. 54, Vijay Nagar, Indore, MP 452010",
    lat: 22.7633,
    lng: 75.8897,
    phone: "+91-731-2551234",
    category: "charity",
    tags: ["food", "welfare", "community"],
  },
  {
    id: "ind-2",
    name: "Akshaya Patra Foundation Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    address: "Sanwer Road, Indore, MP 452015",
    lat: 22.7445,
    lng: 75.8235,
    phone: "+91-731-2721234",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "ind-3",
    name: "Goonj Collection Centre Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    address: "Old Palasia, Indore, MP 452001",
    lat: 22.7231,
    lng: 75.8778,
    category: "charity",
    tags: ["food", "clothing", "relief"],
  },
  {
    id: "ind-4",
    name: "Roti Bank Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    address: "MG Road, Indore, MP 452001",
    lat: 22.7196,
    lng: 75.8577,
    phone: "+91-731-4066111",
    category: "community_kitchen",
    tags: ["free food", "hunger relief", "daily meals"],
  },

  // ─── BHOPAL ───
  {
    id: "bpl-1",
    name: "Akshaya Patra Foundation Bhopal",
    city: "Bhopal",
    state: "Madhya Pradesh",
    address: "Kolar Road, Bhopal, MP 462042",
    lat: 23.2099,
    lng: 77.4029,
    phone: "+91-755-2670000",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "bpl-2",
    name: "Sanjay Gandhi Nishulk Aushadhi Vitran Yojana Centre",
    city: "Bhopal",
    state: "Madhya Pradesh",
    address: "New Market, Bhopal, MP 462003",
    lat: 23.2333,
    lng: 77.4167,
    category: "shelter",
    tags: ["welfare", "community", "support"],
  },
  {
    id: "bpl-3",
    name: "Goonj Bhopal Collection Centre",
    city: "Bhopal",
    state: "Madhya Pradesh",
    address: "MP Nagar Zone II, Bhopal, MP 462011",
    lat: 23.2295,
    lng: 77.4353,
    category: "charity",
    tags: ["food", "clothing", "donation"],
  },
  {
    id: "bpl-4",
    name: "Rotary Club Food Bank Bhopal",
    city: "Bhopal",
    state: "Madhya Pradesh",
    address: "Arera Colony, Bhopal, MP 462016",
    lat: 23.2082,
    lng: 77.4532,
    category: "food_bank",
    tags: ["food", "donation", "rotary"],
  },

  // ─── DELHI ───
  {
    id: "del-1",
    name: "ISKCON Food Relief Foundation (Akshaya Patra) Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "Hare Krishna Hill, Sant Nagar, East of Kailash, New Delhi 110065",
    lat: 28.5451,
    lng: 77.2499,
    phone: "+91-11-26845688",
    category: "food_bank",
    tags: ["midday meal", "prasad", "food relief"],
  },
  {
    id: "del-2",
    name: "Goonj Delhi Hub",
    city: "Delhi",
    state: "Delhi",
    address: "J-93, Shivaji Park, Punjabi Bagh, New Delhi 110026",
    lat: 28.6686,
    lng: 77.1321,
    phone: "+91-11-26972351",
    category: "charity",
    tags: ["food", "clothing", "relief", "disaster"],
  },
  {
    id: "del-3",
    name: "Robin Hood Army Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "Lajpat Nagar, New Delhi 110024",
    lat: 28.5677,
    lng: 77.2433,
    phone: "+91-9999999844",
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "del-4",
    name: "Feeding India (Zomato Foundation)",
    city: "Delhi",
    state: "Delhi",
    address: "DLF Cyber City, Gurugram (serving Delhi NCR)",
    lat: 28.4969,
    lng: 77.0888,
    phone: "+91-9999115093",
    category: "food_bank",
    tags: ["food waste", "hunger relief", "NGO"],
  },
  {
    id: "del-5",
    name: "Sikh Sewak Society Langar Hall",
    city: "Delhi",
    state: "Delhi",
    address: "Gurudwara Bangla Sahib, New Delhi 110001",
    lat: 28.6266,
    lng: 77.2087,
    category: "community_kitchen",
    tags: ["langar", "free meals", "sikh", "daily"],
  },

  // ─── MUMBAI ───
  {
    id: "mum-1",
    name: "Robin Hood Army Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Andheri West, Mumbai 400058",
    lat: 19.1197,
    lng: 72.8463,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "mum-2",
    name: "Roti Bank Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Dadar, Mumbai 400014",
    lat: 19.0176,
    lng: 72.8432,
    phone: "+91-9322228922",
    category: "community_kitchen",
    tags: ["free food", "daily meals", "hunger relief"],
  },
  {
    id: "mum-3",
    name: "Goonj Mumbai Collection Centre",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Kurla West, Mumbai 400070",
    lat: 19.0724,
    lng: 72.8796,
    category: "charity",
    tags: ["food", "clothing", "relief"],
  },
  {
    id: "mum-4",
    name: "Akshaya Patra Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Mira Road, Thane 401107",
    lat: 19.2955,
    lng: 72.8724,
    phone: "+91-22-28116440",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },

  // ─── KOLKATA ───
  {
    id: "kol-1",
    name: "Missionaries of Charity (Mother Teresa's)",
    city: "Kolkata",
    state: "West Bengal",
    address: "54A, A.J.C. Bose Road, Kolkata 700016",
    lat: 22.5419,
    lng: 88.3566,
    phone: "+91-33-22497115",
    category: "shelter",
    tags: ["food", "shelter", "charity", "destitute"],
  },
  {
    id: "kol-2",
    name: "Robin Hood Army Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    address: "Park Street, Kolkata 700071",
    lat: 22.5513,
    lng: 88.3525,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "kol-3",
    name: "Ramakrishna Mission Lokasiksha Parishad",
    city: "Kolkata",
    state: "West Bengal",
    address: "Belur Math, Belur, Howrah 711202",
    lat: 22.6367,
    lng: 88.3501,
    phone: "+91-33-26548563",
    category: "charity",
    tags: ["food", "education", "welfare"],
  },

  // ─── CHENNAI ───
  {
    id: "che-1",
    name: "Akshaya Patra Foundation Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "Govindappa Naicker St, Perambur, Chennai 600011",
    lat: 13.1185,
    lng: 80.2507,
    phone: "+91-44-25512345",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "che-2",
    name: "Robin Hood Army Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "Anna Nagar, Chennai 600040",
    lat: 13.0850,
    lng: 80.2101,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "che-3",
    name: "Goonj Chennai Collection Centre",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "T. Nagar, Chennai 600017",
    lat: 13.0418,
    lng: 80.2341,
    category: "charity",
    tags: ["food", "clothing", "relief"],
  },

  // ─── BANGALORE ───
  {
    id: "blr-1",
    name: "Akshaya Patra Foundation Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "72, 3rd Cross Rd, ISKON, Rajajinagar, Bengaluru 560010",
    lat: 12.9920,
    lng: 77.5490,
    phone: "+91-80-23471972",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "blr-2",
    name: "Robin Hood Army Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "Koramangala, Bengaluru 560034",
    lat: 12.9352,
    lng: 77.6245,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "blr-3",
    name: "Goonj Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "Indiranagar, Bengaluru 560038",
    lat: 12.9784,
    lng: 77.6408,
    category: "charity",
    tags: ["food", "clothing", "relief"],
  },

  // ─── HYDERABAD ───
  {
    id: "hyd-1",
    name: "Akshaya Patra Foundation Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    address: "Saroornagar, Hyderabad 500035",
    lat: 17.3588,
    lng: 78.5545,
    phone: "+91-40-24014678",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "hyd-2",
    name: "Robin Hood Army Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    address: "Banjara Hills, Hyderabad 500034",
    lat: 17.4156,
    lng: 78.4347,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "hyd-3",
    name: "Goonj Hyderabad Collection Centre",
    city: "Hyderabad",
    state: "Telangana",
    address: "Ameerpet, Hyderabad 500016",
    lat: 17.4374,
    lng: 78.4487,
    category: "charity",
    tags: ["food", "clothing", "relief"],
  },

  // ─── PUNE ───
  {
    id: "pun-1",
    name: "Robin Hood Army Pune",
    city: "Pune",
    state: "Maharashtra",
    address: "Koregaon Park, Pune 411001",
    lat: 18.5362,
    lng: 73.8931,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
  {
    id: "pun-2",
    name: "Akshaya Patra Foundation Pune",
    city: "Pune",
    state: "Maharashtra",
    address: "Hadapsar, Pune 411028",
    lat: 18.4925,
    lng: 73.9333,
    phone: "+91-20-27120015",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "pun-3",
    name: "Goonj Pune Collection Centre",
    city: "Pune",
    state: "Maharashtra",
    address: "Aundh, Pune 411007",
    lat: 18.5592,
    lng: 73.8072,
    category: "charity",
    tags: ["food", "clothing", "relief"],
  },

  // ─── AHMEDABAD ───
  {
    id: "ahm-1",
    name: "Akshaya Patra Foundation Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    address: "Vastral, Ahmedabad 382418",
    lat: 23.0225,
    lng: 72.5714,
    phone: "+91-79-22745000",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "ahm-2",
    name: "Robin Hood Army Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    address: "CG Road, Ahmedabad 380006",
    lat: 23.0318,
    lng: 72.5521,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },

  // ─── JAIPUR ───
  {
    id: "jai-1",
    name: "Akshaya Patra Foundation Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    address: "Sanganer, Jaipur 302029",
    lat: 26.8148,
    lng: 75.7906,
    phone: "+91-141-2770300",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "jai-2",
    name: "Robin Hood Army Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    address: "C-Scheme, Jaipur 302001",
    lat: 26.9124,
    lng: 75.7873,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },

  // ─── LUCKNOW ───
  {
    id: "lko-1",
    name: "Akshaya Patra Foundation Lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    address: "Vrindavan Yojana, Lucknow 226029",
    lat: 26.8467,
    lng: 80.9462,
    phone: "+91-522-2770300",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "lko-2",
    name: "Robin Hood Army Lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    address: "Hazratganj, Lucknow 226001",
    lat: 26.8467,
    lng: 80.9462,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },

  // ─── NAGPUR ───
  {
    id: "nag-1",
    name: "Akshaya Patra Foundation Nagpur",
    city: "Nagpur",
    state: "Maharashtra",
    address: "Wadi, Nagpur 440023",
    lat: 21.1458,
    lng: 79.0882,
    phone: "+91-712-2770300",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "nag-2",
    name: "Robin Hood Army Nagpur",
    city: "Nagpur",
    state: "Maharashtra",
    address: "Sitabuldi, Nagpur 440012",
    lat: 21.1498,
    lng: 79.0806,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },

  // ─── SURAT ───
  {
    id: "sur-1",
    name: "Akshaya Patra Foundation Surat",
    city: "Surat",
    state: "Gujarat",
    address: "Piplod, Surat 395007",
    lat: 21.1702,
    lng: 72.8311,
    phone: "+91-261-2770300",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },

  // ─── VADODARA ───
  {
    id: "vad-1",
    name: "Akshaya Patra Foundation Vadodara",
    city: "Vadodara",
    state: "Gujarat",
    address: "Gorwa, Vadodara 390016",
    lat: 22.3072,
    lng: 73.1812,
    phone: "+91-265-2770300",
    category: "food_bank",
    tags: ["midday meal", "children", "food"],
  },
  {
    id: "vad-2",
    name: "Robin Hood Army Vadodara",
    city: "Vadodara",
    state: "Gujarat",
    address: "Alkapuri, Vadodara 390007",
    lat: 22.3119,
    lng: 73.1723,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },

  // ─── CHANDIGARH ───
  {
    id: "chd-1",
    name: "Gurudwara Sahib Sector 34 Langar",
    city: "Chandigarh",
    state: "Chandigarh",
    address: "Sector 34 A, Chandigarh 160022",
    lat: 30.7263,
    lng: 76.7762,
    category: "community_kitchen",
    tags: ["langar", "free meals", "daily", "sikh"],
  },
  {
    id: "chd-2",
    name: "Robin Hood Army Chandigarh",
    city: "Chandigarh",
    state: "Chandigarh",
    address: "Sector 17, Chandigarh 160017",
    lat: 30.7400,
    lng: 76.7800,
    category: "food_bank",
    tags: ["surplus food", "hunger", "volunteers"],
  },
];

// ── Utility: filter NGOs near a coordinate (within radiusKm) ──
export function getNGOsNear(
  lat: number,
  lng: number,
  radiusKm: number = 25,
  city?: string
): NGO[] {
  // If city is detected, boost local NGOs first
  return NGO_DATABASE.filter((ngo) => {
    const dist = haversineKm(lat, lng, ngo.lat, ngo.lng);
    return dist <= radiusKm;
  }).sort((a, b) => {
    const da = haversineKm(lat, lng, a.lat, a.lng);
    const db = haversineKm(lat, lng, b.lat, b.lng);
    return da - db;
  });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// ── City list for autocomplete / display ──
export const NGO_CITIES = [
  ...new Set(NGO_DATABASE.map((n) => n.city)),
].sort();
