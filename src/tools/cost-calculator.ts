export interface CostInput {
  readonly neighborhood?: string;
  readonly housing_type?: string;
}

interface PriceRange {
  readonly low: number;
  readonly high: number;
}

type HousingPrices = Readonly<Record<string, PriceRange | null>>;

interface NeighborhoodData {
  readonly name: string;
  readonly housing: HousingPrices;
}

const NEIGHBORHOODS: readonly NeighborhoodData[] = [
  {
    name: "Mission",
    housing: {
      room: { low: 1800, high: 2500 },
      studio: { low: 2500, high: 3200 },
      "1br": { low: 3000, high: 4000 },
      "hacker-house": { low: 1500, high: 2000 },
    },
  },
  {
    name: "SOMA",
    housing: {
      room: { low: 2000, high: 2800 },
      studio: { low: 2800, high: 3500 },
      "1br": { low: 3500, high: 4500 },
      "hacker-house": { low: 1800, high: 2200 },
    },
  },
  {
    name: "Hayes Valley",
    housing: {
      room: { low: 2200, high: 3000 },
      studio: { low: 3000, high: 3800 },
      "1br": { low: 3800, high: 5000 },
      "hacker-house": null,
    },
  },
  {
    name: "Dogpatch",
    housing: {
      room: { low: 1600, high: 2200 },
      studio: { low: 2200, high: 2800 },
      "1br": { low: 2800, high: 3500 },
      "hacker-house": { low: 1400, high: 1800 },
    },
  },
  {
    name: "Richmond",
    housing: {
      room: { low: 1400, high: 2000 },
      studio: { low: 2000, high: 2600 },
      "1br": { low: 2600, high: 3200 },
      "hacker-house": { low: 1200, high: 1600 },
    },
  },
  {
    name: "Sunset",
    housing: {
      room: { low: 1300, high: 1900 },
      studio: { low: 1900, high: 2500 },
      "1br": { low: 2400, high: 3000 },
      "hacker-house": { low: 1100, high: 1500 },
    },
  },
];

const UTILITIES = { low: 100, high: 150 };
const FOOD = { low: 500, high: 800 };
const TRANSPORT = { low: 100, high: 200 };

const HOUSING_TYPE_LABELS: Readonly<Record<string, string>> = {
  room: "Room",
  studio: "Studio",
  "1br": "1-Bedroom",
  "hacker-house": "Hacker House",
};

const HOUSING_TYPES = ["room", "studio", "1br", "hacker-house"] as const;

function normalizeNeighborhood(input: string): string {
  return input.toLowerCase().replace(/[\s_-]+/g, "");
}

function findNeighborhood(name: string): NeighborhoodData | undefined {
  const normalized = normalizeNeighborhood(name);
  return NEIGHBORHOODS.find(
    (n) => normalizeNeighborhood(n.name) === normalized
  );
}

function normalizeHousingType(input: string): string | undefined {
  const normalized = input.toLowerCase().replace(/[\s_]+/g, "-");
  const aliases: Readonly<Record<string, string>> = {
    room: "room",
    studio: "studio",
    "1br": "1br",
    "1-br": "1br",
    "1bed": "1br",
    "1-bed": "1br",
    "1bedroom": "1br",
    "1-bedroom": "1br",
    "hacker-house": "hacker-house",
    "hackerhouse": "hacker-house",
    "hacker": "hacker-house",
  };
  return aliases[normalized];
}

function formatPrice(range: PriceRange | null): string {
  return range ? `$${range.low}-$${range.high}` : "N/A";
}

function formatTotal(rent: PriceRange): string {
  const totalLow = rent.low + UTILITIES.low + FOOD.low + TRANSPORT.low;
  const totalHigh = rent.high + UTILITIES.high + FOOD.high + TRANSPORT.high;
  return `$${totalLow}-$${totalHigh}/mo`;
}

function formatNeighborhoodDetail(n: NeighborhoodData): string {
  const lines = HOUSING_TYPES.map((type) => {
    const label = HOUSING_TYPE_LABELS[type];
    const price = n.housing[type];
    return `  ${label}: ${formatPrice(price)}`;
  });

  const cheapest = HOUSING_TYPES.reduce<PriceRange | null>((best, type) => {
    const price = n.housing[type];
    if (!price) return best;
    if (!best || price.low < best.low) return price;
    return best;
  }, null);

  const totalLine = cheapest
    ? `  **Estimated total (cheapest option):** ${formatTotal(cheapest)}`
    : "";

  return [`## ${n.name}`, ...lines, "", totalLine].join("\n");
}

function formatTypeAcrossNeighborhoods(housingType: string): string {
  const label = HOUSING_TYPE_LABELS[housingType] ?? housingType;
  const header = `| Neighborhood | ${label} | Est. Total/mo |`;
  const separator = "|---|---|---|";

  const rows = NEIGHBORHOODS.map((n) => {
    const price = n.housing[housingType];
    const priceStr = formatPrice(price);
    const totalStr = price ? formatTotal(price) : "N/A";
    return `| ${n.name} | ${priceStr} | ${totalStr} |`;
  });

  return [
    `# ${label} Prices Across SF`,
    "",
    header,
    separator,
    ...rows,
    "",
    `*Totals include utilities ($${UTILITIES.low}-$${UTILITIES.high}), food ($${FOOD.low}-$${FOOD.high}), transport ($${TRANSPORT.low}-$${TRANSPORT.high}).*`,
  ].join("\n");
}

function formatSpecificCell(
  n: NeighborhoodData,
  housingType: string
): string {
  const label = HOUSING_TYPE_LABELS[housingType] ?? housingType;
  const price = n.housing[housingType];

  if (!price) {
    return `${label} is not available in ${n.name}.`;
  }

  return [
    `# ${label} in ${n.name}`,
    "",
    `| Expense | Monthly Cost |`,
    `|---|---|`,
    `| Rent | ${formatPrice(price)} |`,
    `| Utilities | $${UTILITIES.low}-$${UTILITIES.high} |`,
    `| Food | $${FOOD.low}-$${FOOD.high} |`,
    `| Transport | $${TRANSPORT.low}-$${TRANSPORT.high} |`,
    `| **Total** | **${formatTotal(price)}** |`,
  ].join("\n");
}

function formatSummary(): string {
  const header = "| Neighborhood | Room | Studio | 1BR | Hacker House |";
  const separator = "|---|---|---|---|---|";

  const rows = NEIGHBORHOODS.map((n) =>
    `| ${n.name} | ${formatPrice(n.housing.room)} | ${formatPrice(n.housing.studio)} | ${formatPrice(n.housing["1br"])} | ${formatPrice(n.housing["hacker-house"])} |`
  );

  return [
    "# SF Housing Cost Estimator",
    "",
    header,
    separator,
    ...rows,
    "",
    "### Other Monthly Costs",
    `- Utilities: $${UTILITIES.low}-$${UTILITIES.high}`,
    `- Food: $${FOOD.low}-$${FOOD.high}`,
    `- Transport: $${TRANSPORT.low}-$${TRANSPORT.high}`,
    "",
    "*Tip: Specify a neighborhood and/or housing type for a detailed breakdown.*",
  ].join("\n");
}

export function estimateCosts(input: CostInput): string {
  const resolvedType = input.housing_type
    ? normalizeHousingType(input.housing_type)
    : undefined;
  const resolvedNeighborhood = input.neighborhood
    ? findNeighborhood(input.neighborhood)
    : undefined;

  if (input.housing_type && !resolvedType) {
    return `Unknown housing type "${input.housing_type}". Valid options: room, studio, 1br, hacker-house.`;
  }

  if (input.neighborhood && !resolvedNeighborhood) {
    const names = NEIGHBORHOODS.map((n) => n.name).join(", ");
    return `Unknown neighborhood "${input.neighborhood}". Available: ${names}.`;
  }

  // Both specified: show specific cell
  if (resolvedNeighborhood && resolvedType) {
    return formatSpecificCell(resolvedNeighborhood, resolvedType);
  }

  // Only neighborhood: show that neighborhood detail
  if (resolvedNeighborhood) {
    return formatNeighborhoodDetail(resolvedNeighborhood);
  }

  // Only housing type: show that type across neighborhoods
  if (resolvedType) {
    return formatTypeAcrossNeighborhoods(resolvedType);
  }

  // Neither: show summary
  return formatSummary();
}
