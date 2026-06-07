// HumanoidVerse — Shared Data (robots are loaded from robots.json)
let ROBOTS = [];
let MANUFACTURERS = [];

// News data — Real verified headlines May 2026
const NEWS = [
  { id: 1, title: "Japan Airlines Deploys Humanoid Robots at Haneda Airport", date: "2026-05-18", category: "Deployment", robot: null, excerpt: "JAL began a 3-year operational trial with Unitree-based humanoids for baggage loading, container transport, and cabin cleaning at Tokyo's Haneda Airport." },
  { id: 2, title: "BMW Expands Figure AI Pilot to Leipzig Factory", date: "2026-05-14", category: "Deployment", robot: "figure-03", excerpt: "Following success at Spartanburg (30K vehicles produced), BMW is scaling Figure AI humanoid deployment to its Leipzig plant for EV battery assembly." },
  { id: 3, title: "Schaeffler Signs 1,000+ Robot Deal with Humanoid Startup", date: "2026-05-10", category: "Business", robot: null, excerpt: "London-based startup 'Humanoid' signed a multi-year agreement with German industrial giant Schaeffler targeting 1,000+ humanoid robots across global facilities by 2032." },
  { id: 4, title: "Tesla Optimus Production-Intent Units Begin Summer 2026", date: "2026-05-08", category: "Production", robot: "optimus", excerpt: "Tesla confirmed production of Optimus production-intent units will begin at Fremont factory this summer, with high-volume production targeted for 2027." },
  { id: 5, title: "Global Robotics Market Reaches $38 Billion — 34% YoY Growth", date: "2026-05-05", category: "Market", robot: null, excerpt: "Counterpoint Research reports the global robotics market reached $38B in 2026. Humanoid sector alone valued at $6.24B with 12 commercial platforms now available." },
  { id: 6, title: "12 Commercial Humanoid Platforms Now Available for Purchase", date: "2026-05-01", category: "Market", robot: null, excerpt: "The number of commercially available humanoid robot platforms has quadrupled from just 3 in 2024 to 12 in 2026, signaling rapid industry maturation." },
  { id: 7, title: "VLA Models Used in 40% of New Humanoid Deployments", date: "2026-04-28", category: "Technology", robot: null, excerpt: "Vision-Language-Action models are now integrated in 40% of new humanoid robot deployments, enabling robots to better understand and interact with environments." },
  { id: 8, title: "1X Technologies NEO Begins First Consumer Shipments", date: "2026-04-22", category: "Deployment", robot: "neo", excerpt: "1X Technologies' NEO humanoid, designed for home environments, has started its first customer shipments in 2026, entering the mass consumer market." }
];

// Stat specs metadata
const SPEC_LABELS = {
  height: { label: "Height", unit: "cm", icon: "📏" },
  weight: { label: "Weight", unit: "kg", icon: "⚖️" },
  dof: { label: "Degrees of Freedom", unit: "", icon: "🦾" },
  speed: { label: "Max Speed", unit: "m/s", icon: "⚡" },
  payload: { label: "Payload", unit: "kg", icon: "📦" },
  battery: { label: "Battery Life", unit: "hrs", icon: "🔋" },
  ip_rating: { label: "IP Rating", unit: "", icon: "🛡️" },
  actuator: { label: "Actuator Type", unit: "", icon: "⚙️" },
  connectivity: { label: "Connectivity", unit: "", icon: "📡" }
};

const CATEGORIES = ["All", "Industrial", "General Purpose", "AI-Native", "Logistics", "Research & Education", "Research", "Healthcare & Industrial", "Industrial & Service", "Home & Service", "Service & Home", "Social & Service", "Research & Legacy", "Social & Entertainment", "Manufacturing", "Service & Hospitality"];
