export const CITIES = [
  { id: "doha", label: "Doha", country: "Qatar" },
  { id: "dubai", label: "Dubai", country: "UAE" },
  { id: "london", label: "London", country: "United Kingdom" },
  { id: "singapore", label: "Singapore", country: "Singapore" },
  { id: "lisbon", label: "Lisbon", country: "Portugal" },
];

export const INTENTS = [
  { id: "serious", label: "Serious relationship", emoji: "💍" },
  { id: "casual", label: "Casual dating", emoji: "🍸" },
  { id: "friendship", label: "Friendship", emoji: "🤝" },
  { id: "networking", label: "Professional networking", emoji: "💼" },
  { id: "activity", label: "Activity partners", emoji: "🏃" },
];

export const DISCOVERY_DEFAULTS = {
  showMe: "everyone", // "men" | "women" | "everyone"
  maxDistanceKm: 80,
  ageRange: [18, 65],
  globalMode: false,
  intents: [], // empty = no intent filter
  vibeCheckEnabled: true,
};

export const AGE_BOUNDS = { min: 18, max: 65 };
export const DISTANCE_BOUNDS = { min: 1, max: 160 };

export const FREE_SWIPES_PER_DAY = 30;

export const PLANS = {
  free: {
    id: "free",
    label: "Free",
    perks: [
      `${FREE_SWIPES_PER_DAY} swipes per day`,
      "Unlimited chat with your matches",
      "Ice breaker games",
    ],
  },
  premium: {
    id: "premium",
    label: "Premium",
    priceZar: 219,
    perks: [
      "Unlimited swipes",
      "See everyone who liked you",
      "Trust scores on every profile",
      "Vibe Check message coaching",
      "Priority in the discovery deck",
    ],
  },
};

export const TRAVEL_MODE = {
  id: "travel",
  label: "Travel Mode",
  priceZar: 179,
  description: "Swipe in any city before you land.",
};

export const TRUST_WEIGHTS = {
  verification: 35,
  responseRate: 25,
  reportHistory: 20,
  accountConsistency: 10,
  postMatchFeedback: 10,
};

// Trust scores are shown to women by default; men opt in once verified.
export const TRUST_RING_VISIBLE_TO = ["woman"];

export const ICE_BREAKERS = [
  {
    id: "would-you-rather",
    label: "Would You Rather",
    emoji: "🤔",
    prompts: [
      "Would you rather move to a new country every year, or settle in one forever?",
      "Would you rather never eat your home comfort food again, or never speak your first language again?",
      "Would you rather have a 5-minute commute in a boring city, or a 90-minute one in a beautiful city?",
      "Would you rather host every dinner party, or never cook again?",
    ],
  },
  {
    id: "expat-trivia",
    label: "Expat Trivia",
    emoji: "🌍",
    prompts: [
      "Quick one: which country has the most expats per capita? (I promise I know the answer.)",
      "Trivia: how many countries can you name that use the euro? Loser buys coffee.",
      "Which city do you think has the biggest expat community in the world?",
      "What's the one phrase you learned first in your new city's language?",
    ],
  },
  {
    id: "hot-takes",
    label: "Hot Takes",
    emoji: "🔥",
    prompts: [
      "Hot take: brunch is overrated everywhere except the city you left behind. Discuss.",
      "Hot take: you don't really live somewhere until you've argued with a landlord in the local language.",
      "Hot take: airport lounges are the best restaurants in most cities.",
      "Hot take: everyone romanticises the city they moved away from.",
    ],
  },
  {
    id: "two-truths",
    label: "2 Truths 1 Lie",
    emoji: "🎭",
    prompts: [
      "Two truths and a lie: I've lived in 4 countries, I can't ride a bike, I once missed a flight on purpose.",
      "Two truths and a lie: I speak 3 languages badly, I've never had a passport stamp refused, I hate the beach.",
      "Two truths and a lie: I moved abroad with one suitcase, I've met a head of state, I can't swim.",
    ],
  },
];

export const VIBE_TIERS = [
  { min: 70, label: "Great vibe", color: "#00B894" },
  { min: 35, label: "Could be warmer", color: "#C9A227" },
  { min: 0, label: "Risky", color: "#E63946" },
];

export const VIBE_WARNING_THRESHOLD = 35;
export const VIBE_DEBOUNCE_MS = 600;

export const MAX_VOICE_NOTE_SECONDS = 60;
export const MAX_PROFILE_PHOTOS = 6;

export const PAYFAST = {
  merchantId: process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_ID,
  merchantKey: process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_KEY,
  notifyUrl:
    process.env.EXPO_PUBLIC_PAYFAST_NOTIFY_URL ||
    "https://us-central1-primi-signals.cloudfunctions.net/payfastITN",
  sandbox: process.env.EXPO_PUBLIC_PAYFAST_SANDBOX !== "false",
};

export function intentLabel(id) {
  return INTENTS.find((i) => i.id === id)?.label || id;
}

export function cityLabel(id) {
  if (!id) return "";
  return CITIES.find((c) => c.id === String(id).toLowerCase())?.label || id;
}
