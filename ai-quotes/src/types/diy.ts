/**
 * Types and interfaces for Online Builder AI DIY Assistant
 */

export interface DiagnosticQuestion {
  id: string;
  question: string;
  hint?: string;
  options: {
    id: string;
    label: string;
    isRecommended?: boolean;
    specImpact?: string;
  }[];
  selectedOptionId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'tool' | 'material';
  quantity: string;
  specifications: string;
  estimatedPrice: number;
  userHasItem: boolean;
  priority: 'critical' | 'recommended' | 'optional';
  whyNeeded: string;
}

export interface JobStep {
  stepNumber: number;
  title: string;
  instruction: string;
  proTip?: string;
  safetyWarning?: string;
}

export interface SafetyGearItem {
  id: string;
  name: string;
  gearType: 'eye_protection' | 'hand_protection' | 'respiratory' | 'hearing' | 'body';
  description: string;
  whyMandatory: string;
  isCritical: boolean;
  userHasGear: boolean;
  estimatedPrice: number;
}

export interface DiagnosisResult {
  jobId: string;
  title: string;
  category: string;
  summary: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  detectedIssues: string[];
  safetyWarnings: string[];
  safetyGear?: SafetyGearItem[];
  questions: DiagnosticQuestion[];
  items: InventoryItem[];
  steps: JobStep[];
  refinementNotes?: string;
  snapshotUrl?: string;
}

export interface StoreInfo {
  id: string;
  chain: 'Mica Hardware' | 'Builders Warehouse' | 'DIY Store';
  name: string;
  distance: number; // in km
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  pickupTime: string;
  deliveryAvailable: boolean;
  deliveryFee: number;
}

export interface StoreItemQuote {
  price: number;
  inStock: boolean;
  stockCount: number;
  aisle: string;
  bay: string;
}

export interface StoreComparison {
  store: StoreInfo;
  itemQuotes: Record<string, StoreItemQuote>;
  totalMissingCost: number;
  missingItemsCount: number;
  savingsVsAvg: number;
  allInStock: boolean;
  isLowestPrice: boolean;
  isClosest: boolean;
  isBestValue: boolean;
}

export interface HandoffItem {
  id: string;
  name: string;
  quantity: string;
  unitPriceZar: number;
}

/** What the AI feature passes to the main delivery app once the customer picks a store. */
export interface MainAppHandoff {
  source: 'online-builder-ai';
  jobTitle: string;
  storeId: string;
  storeName: string;
  items: HandoffItem[];
  subtotalZar: number;
  pricesArePlaceholder: boolean;
  createdAt: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  imagePath: string;
  userPrompt: string;
}
