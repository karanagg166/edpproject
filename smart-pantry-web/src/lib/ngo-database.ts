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

  // ─── GWALIOR ───
  { id:"gwl-1", name:"Goonj Collection Centre Gwalior", city:"Gwalior", state:"Madhya Pradesh", address:"Lashkar, Gwalior, MP 474001", lat:26.2183, lng:78.1828, category:"charity", tags:["food","clothing","relief"] },
  { id:"gwl-2", name:"Akshaya Patra Foundation Gwalior", city:"Gwalior", state:"Madhya Pradesh", address:"Morar, Gwalior, MP 474006", lat:26.2340, lng:78.2090, phone:"+91-751-2400000", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"gwl-3", name:"Sewa Bharati Gwalior", city:"Gwalior", state:"Madhya Pradesh", address:"City Centre, Gwalior, MP 474011", lat:26.2100, lng:78.1850, category:"charity", tags:["food","welfare","community"] },

  // ─── UJJAIN ───
  { id:"ujn-1", name:"Annapurna Seva Trust Ujjain", city:"Ujjain", state:"Madhya Pradesh", address:"Freeganj, Ujjain, MP 456010", lat:23.1765, lng:75.7885, category:"community_kitchen", tags:["free meals","langar","food"] },
  { id:"ujn-2", name:"Rotary Club Food Bank Ujjain", city:"Ujjain", state:"Madhya Pradesh", address:"Madhav Nagar, Ujjain, MP 456001", lat:23.1828, lng:75.7772, category:"food_bank", tags:["food","donation","rotary"] },

  // ─── REWA ───
  { id:"rwa-1", name:"Jan Seva Foundation Rewa", city:"Rewa", state:"Madhya Pradesh", address:"Civil Lines, Rewa, MP 486001", lat:24.5362, lng:81.2957, category:"charity", tags:["food","welfare","community"] },
  { id:"rwa-2", name:"Community Kitchen Rewa", city:"Rewa", state:"Madhya Pradesh", address:"Chorhata, Rewa, MP 486001", lat:24.5300, lng:81.3000, category:"community_kitchen", tags:["free meals","daily","food"] },

  // ─── SATNA ───
  { id:"stn-1", name:"Feeding India Hub Satna", city:"Satna", state:"Madhya Pradesh", address:"Civil Lines, Satna, MP 485001", lat:24.5672, lng:80.8322, category:"food_bank", tags:["hunger relief","food","NGO"] },
  { id:"stn-2", name:"Goonj Drop-off Satna", city:"Satna", state:"Madhya Pradesh", address:"Birla Nagar, Satna, MP 485005", lat:24.5720, lng:80.8450, category:"charity", tags:["food","clothing","donation"] },

  // ─── VARANASI ───
  { id:"var-1", name:"Akshaya Patra Foundation Varanasi", city:"Varanasi", state:"Uttar Pradesh", address:"Lanka, Varanasi, UP 221005", lat:25.2677, lng:82.9913, phone:"+91-542-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"var-2", name:"Goonj Collection Centre Varanasi", city:"Varanasi", state:"Uttar Pradesh", address:"Sigra, Varanasi, UP 221010", lat:25.3176, lng:82.9739, category:"charity", tags:["food","clothing","relief"] },
  { id:"var-3", name:"Kashi Annapurna Trust", city:"Varanasi", state:"Uttar Pradesh", address:"Dashashwamedh Ghat, Varanasi, UP 221001", lat:25.3100, lng:83.0100, category:"community_kitchen", tags:["langar","free meals","spiritual"] },

  // ─── AGRA ───
  { id:"agr-1", name:"Robin Hood Army Agra", city:"Agra", state:"Uttar Pradesh", address:"Sadar Bazaar, Agra, UP 282001", lat:27.1767, lng:78.0081, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"agr-2", name:"Goonj Collection Centre Agra", city:"Agra", state:"Uttar Pradesh", address:"Kamla Nagar, Agra, UP 282005", lat:27.1900, lng:78.0200, category:"charity", tags:["food","clothing","relief"] },

  // ─── KANPUR ───
  { id:"knp-1", name:"Akshaya Patra Foundation Kanpur", city:"Kanpur", state:"Uttar Pradesh", address:"Kakadeo, Kanpur, UP 208025", lat:26.4609, lng:80.3000, phone:"+91-512-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"knp-2", name:"Feeding India Hub Kanpur", city:"Kanpur", state:"Uttar Pradesh", address:"Civil Lines, Kanpur, UP 208001", lat:26.4730, lng:80.3319, category:"food_bank", tags:["hunger relief","food","NGO"] },

  // ─── PRAYAGRAJ ───
  { id:"prg-1", name:"Sangam Food Bank Prayagraj", city:"Prayagraj", state:"Uttar Pradesh", address:"Civil Lines, Prayagraj, UP 211001", lat:25.4358, lng:81.8463, category:"food_bank", tags:["food","hunger relief","bank"] },
  { id:"prg-2", name:"Robin Hood Army Prayagraj", city:"Prayagraj", state:"Uttar Pradesh", address:"Allengunj, Prayagraj, UP 211002", lat:25.4484, lng:81.8322, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"prg-3", name:"Sewa Bharati Prayagraj", city:"Prayagraj", state:"Uttar Pradesh", address:"Tagore Town, Prayagraj, UP 211002", lat:25.4600, lng:81.8500, category:"charity", tags:["food","welfare","community"] },

  // ─── GORAKHPUR ───
  { id:"grk-1", name:"Akshaya Patra Foundation Gorakhpur", city:"Gorakhpur", state:"Uttar Pradesh", address:"Betiahata, Gorakhpur, UP 273001", lat:26.7606, lng:83.3732, phone:"+91-551-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"grk-2", name:"Goonj Collection Centre Gorakhpur", city:"Gorakhpur", state:"Uttar Pradesh", address:"Bank Road, Gorakhpur, UP 273001", lat:26.7550, lng:83.3800, category:"charity", tags:["food","clothing","relief"] },

  // ─── MEERUT ───
  { id:"mrt-1", name:"Robin Hood Army Meerut", city:"Meerut", state:"Uttar Pradesh", address:"Shastri Nagar, Meerut, UP 250001", lat:28.9845, lng:77.7064, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"mrt-2", name:"Feeding India Hub Meerut", city:"Meerut", state:"Uttar Pradesh", address:"Civil Lines, Meerut, UP 250001", lat:28.9890, lng:77.6900, category:"food_bank", tags:["hunger relief","food","NGO"] },

  // ─── BAREILLY ───
  { id:"bar-1", name:"Goonj Collection Centre Bareilly", city:"Bareilly", state:"Uttar Pradesh", address:"Civil Lines, Bareilly, UP 243001", lat:28.3670, lng:79.4304, category:"charity", tags:["food","clothing","relief"] },
  { id:"bar-2", name:"Sewa Bharati Bareilly", city:"Bareilly", state:"Uttar Pradesh", address:"Subhash Nagar, Bareilly, UP 243001", lat:28.3600, lng:79.4200, category:"charity", tags:["food","welfare","community"] },

  // ─── ALIGARH ───
  { id:"ali-1", name:"Robin Hood Army Aligarh", city:"Aligarh", state:"Uttar Pradesh", address:"Civil Lines, Aligarh, UP 202001", lat:27.8974, lng:78.0880, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"ali-2", name:"Rotary Club Food Bank Aligarh", city:"Aligarh", state:"Uttar Pradesh", address:"Ramghat Road, Aligarh, UP 202001", lat:27.8850, lng:78.0800, category:"food_bank", tags:["food","donation","rotary"] },

  // ─── PATNA ───
  { id:"pat-1", name:"Akshaya Patra Foundation Patna", city:"Patna", state:"Bihar", address:"Phulwari Sharif, Patna, Bihar 801505", lat:25.5941, lng:85.1376, phone:"+91-612-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"pat-2", name:"Goonj Collection Centre Patna", city:"Patna", state:"Bihar", address:"Boring Road, Patna, Bihar 800001", lat:25.6100, lng:85.1400, category:"charity", tags:["food","clothing","relief"] },
  { id:"pat-3", name:"Robin Hood Army Patna", city:"Patna", state:"Bihar", address:"Fraser Road, Patna, Bihar 800001", lat:25.6200, lng:85.1200, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── RANCHI ───
  { id:"rnc-1", name:"Akshaya Patra Foundation Ranchi", city:"Ranchi", state:"Jharkhand", address:"Kanke, Ranchi, Jharkhand 834006", lat:23.3441, lng:85.3096, phone:"+91-651-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"rnc-2", name:"Goonj Collection Centre Ranchi", city:"Ranchi", state:"Jharkhand", address:"Harmu, Ranchi, Jharkhand 834002", lat:23.3600, lng:85.3300, category:"charity", tags:["food","clothing","relief"] },

  // ─── BHUBANESWAR ───
  { id:"bbsr-1", name:"Akshaya Patra Foundation Bhubaneswar", city:"Bhubaneswar", state:"Odisha", address:"Patia, Bhubaneswar, Odisha 751024", lat:20.3538, lng:85.8200, phone:"+91-674-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"bbsr-2", name:"Robin Hood Army Bhubaneswar", city:"Bhubaneswar", state:"Odisha", address:"Saheed Nagar, Bhubaneswar, Odisha 751007", lat:20.2961, lng:85.8245, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"bbsr-3", name:"Goonj Collection Centre Bhubaneswar", city:"Bhubaneswar", state:"Odisha", address:"Jaydev Vihar, Bhubaneswar, Odisha 751013", lat:20.3100, lng:85.8350, category:"charity", tags:["food","clothing","relief"] },

  // ─── GUWAHATI ───
  { id:"gwt-1", name:"Akshaya Patra Foundation Guwahati", city:"Guwahati", state:"Assam", address:"Zoo Road, Guwahati, Assam 781005", lat:26.1445, lng:91.7362, phone:"+91-361-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"gwt-2", name:"Goonj Collection Centre Guwahati", city:"Guwahati", state:"Assam", address:"Chandmari, Guwahati, Assam 781003", lat:26.1600, lng:91.7500, category:"charity", tags:["food","clothing","relief"] },

  // ─── KOCHI ───
  { id:"koc-1", name:"Akshaya Patra Foundation Kochi", city:"Kochi", state:"Kerala", address:"Kalamassery, Ernakulam, Kerala 683104", lat:10.0000, lng:76.3200, phone:"+91-484-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"koc-2", name:"Robin Hood Army Kochi", city:"Kochi", state:"Kerala", address:"MG Road, Ernakulam, Kerala 682011", lat:9.9816, lng:76.2999, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"koc-3", name:"Goonj Collection Centre Kochi", city:"Kochi", state:"Kerala", address:"Palarivattom, Kochi, Kerala 682025", lat:9.9900, lng:76.3100, category:"charity", tags:["food","clothing","relief"] },

  // ─── THIRUVANANTHAPURAM ───
  { id:"tvm-1", name:"Akshaya Patra Foundation Thiruvananthapuram", city:"Thiruvananthapuram", state:"Kerala", address:"Kaniyapuram, Thiruvananthapuram, Kerala 695301", lat:8.5241, lng:76.9366, phone:"+91-471-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"tvm-2", name:"Robin Hood Army Thiruvananthapuram", city:"Thiruvananthapuram", state:"Kerala", address:"Kowdiar, Thiruvananthapuram, Kerala 695003", lat:8.5067, lng:76.9520, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── COIMBATORE ───
  { id:"cbe-1", name:"Akshaya Patra Foundation Coimbatore", city:"Coimbatore", state:"Tamil Nadu", address:"Podanur, Coimbatore, Tamil Nadu 641023", lat:10.9810, lng:76.9697, phone:"+91-422-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"cbe-2", name:"Robin Hood Army Coimbatore", city:"Coimbatore", state:"Tamil Nadu", address:"RS Puram, Coimbatore, Tamil Nadu 641002", lat:11.0050, lng:76.9600, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── VISAKHAPATNAM ───
  { id:"vsk-1", name:"Akshaya Patra Foundation Visakhapatnam", city:"Visakhapatnam", state:"Andhra Pradesh", address:"Rushikonda, Visakhapatnam, AP 530045", lat:17.7384, lng:83.2187, phone:"+91-891-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"vsk-2", name:"Goonj Collection Centre Visakhapatnam", city:"Visakhapatnam", state:"Andhra Pradesh", address:"Dwaraka Nagar, Visakhapatnam, AP 530016", lat:17.7200, lng:83.3000, category:"charity", tags:["food","clothing","relief"] },

  // ─── MYSURU ───
  { id:"mys-1", name:"Akshaya Patra Foundation Mysuru", city:"Mysuru", state:"Karnataka", address:"Hebbal, Mysuru, Karnataka 570016", lat:12.2958, lng:76.6394, phone:"+91-821-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"mys-2", name:"Robin Hood Army Mysuru", city:"Mysuru", state:"Karnataka", address:"Saraswathipuram, Mysuru, Karnataka 570009", lat:12.3050, lng:76.6550, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── DEHRADUN ───
  { id:"ddn-1", name:"Goonj Collection Centre Dehradun", city:"Dehradun", state:"Uttarakhand", address:"Rajpur Road, Dehradun, Uttarakhand 248001", lat:30.3165, lng:78.0322, category:"charity", tags:["food","clothing","relief"] },
  { id:"ddn-2", name:"Robin Hood Army Dehradun", city:"Dehradun", state:"Uttarakhand", address:"Paltan Bazaar, Dehradun, Uttarakhand 248001", lat:30.3255, lng:78.0420, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── AMRITSAR ───
  { id:"asr-1", name:"Gurudwara Sri Harmandir Sahib Langar", city:"Amritsar", state:"Punjab", address:"Golden Temple, Amritsar, Punjab 143001", lat:31.6200, lng:74.8765, category:"community_kitchen", tags:["langar","free meals","sikh","daily"] },
  { id:"asr-2", name:"Robin Hood Army Amritsar", city:"Amritsar", state:"Punjab", address:"Lawrence Road, Amritsar, Punjab 143001", lat:31.6340, lng:74.8700, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── LUDHIANA ───
  { id:"ldh-1", name:"Akshaya Patra Foundation Ludhiana", city:"Ludhiana", state:"Punjab", address:"Sherpur, Ludhiana, Punjab 141003", lat:30.9010, lng:75.8573, phone:"+91-161-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"ldh-2", name:"Goonj Collection Centre Ludhiana", city:"Ludhiana", state:"Punjab", address:"Model Town, Ludhiana, Punjab 141002", lat:30.9100, lng:75.8700, category:"charity", tags:["food","clothing","relief"] },

  // ─── JODHPUR ───
  { id:"jod-1", name:"Akshaya Patra Foundation Jodhpur", city:"Jodhpur", state:"Rajasthan", address:"Mandore, Jodhpur, Rajasthan 342304", lat:26.3050, lng:73.0243, phone:"+91-291-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"jod-2", name:"Robin Hood Army Jodhpur", city:"Jodhpur", state:"Rajasthan", address:"Sardarpura, Jodhpur, Rajasthan 342001", lat:26.2890, lng:73.0243, category:"food_bank", tags:["surplus food","hunger","volunteers"] },

  // ─── RAIPUR ───
  { id:"rai-1", name:"Akshaya Patra Foundation Raipur", city:"Raipur", state:"Chhattisgarh", address:"Tatibandh, Raipur, CG 492001", lat:21.2514, lng:81.6296, phone:"+91-771-2770300", category:"food_bank", tags:["midday meal","children","food"] },
  { id:"rai-2", name:"Goonj Collection Centre Raipur", city:"Raipur", state:"Chhattisgarh", address:"Shankar Nagar, Raipur, CG 492007", lat:21.2600, lng:81.6400, category:"charity", tags:["food","clothing","relief"] },

  // ─── GOA (PANAJI) ───
  { id:"goa-1", name:"Robin Hood Army Goa", city:"Panaji", state:"Goa", address:"Panaji, Goa 403001", lat:15.4909, lng:73.8278, category:"food_bank", tags:["surplus food","hunger","volunteers"] },
  { id:"goa-2", name:"Goonj Collection Centre Goa", city:"Panaji", state:"Goa", address:"Porvorim, North Goa 403521", lat:15.5200, lng:73.8450, category:"charity", tags:["food","clothing","relief"] },
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
