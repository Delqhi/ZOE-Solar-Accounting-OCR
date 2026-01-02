import { ExtractedData } from '../types';

// --- Configuration: Grocery Retailers ---

const GROCERY_RETAILERS = [
  // German retailers
  'rewe',
  'lidl',
  'edeka',
  'aldi',
  'aldi nord',
  'aldi süd',
  'netto',
  'netto marken-discount',
  'penny',
  'kaufland',
  'dm',
  'rossmann',
  'müller',
  'albrecht',
  'norma',
  'tegut',
  'real',
  ' Globus',
  'famila',
  'marktkauf',
  'netto city',
  'lidl international',

  // Austrian
  'spar',
  'billa',
  'merkur',
  'penny market',
  'hofer',

  // Swiss
  'migros',
  'coop',
  'denner',
  'aldi schweiz',

  // Dutch
  'albert heijn',
  'jumbo',
  'lidl nl',
  'aldi nl',

  // Belgian
  'colruyt',
  'delhaize',
  'carrefour belgique',

  // French
  'carrefour',
  'leclerc',
  'auchan',
  'intermarché',
  'casino',
  'franprix',
  'monoprix',

  // Spanish
  'mercadona',
  'dia',
  'eroski',

  // UK
  'tesco',
  'sainsbury',
  'asda',
  'morrisons',
  'waitrose',
  'marks & spencer',
  'co-op',

  // Nordic
  'ica',
  'coop norden',
  'rema 1000',
  'kiwi',
  'joker',

  // Australian
  'woolworths',
  'coles',
  'aldi au',
  'iga',

  // US/Canada
  'walmart',
  'target',
  'costco',
  'kroger',
  'safeway',
  'publix',
  'whole foods',
  'trader joe',

  // Other European
  'bunnings',
  'officeworks',
  'kmart',
  'big w',
  'target au',
  'savings',
  'primark',
  'h&m',
  'zara',
  'uniqlo',
  'decathlon',
  'action',
  'tedi',
  'kik',
  'pimkie',
  'c&a',
  'new Yorker'
];

// --- Configuration: Private Item Keywords ---

const PRIVATE_ITEM_KEYWORDS = [
  // Zigaretten / Tabak / Tobacco
  'zigarette',
  'zigaretten',
  'tabak',
  'cigarette',
  'cigarettes',
  'tobacco',
  'tabacco',
  'marlboro',
  'camel',
  'lucky strike',
  'pall mall',
  'west',
  'dunhill',
  'chesterfield',
  'capri',
  'gitanes',
  'gauloises',
  'davidoff',
  'rothmans',
  'winston',
  'parliament',
  'vape',
  'e-zigarette',
  'e liquid',
  'liquids',
  'liquids',
  'shisha',
  'tabakwasser',
  'tabakersatz',
  'nikotin',
  'rauchzubehör',
  'tabakwaren',

  // Bier / Beer
  'bier',
  'beer',
  'pils',
  'pilsener',
  'helles',
  'weizen',
  'weissbier',
  'weizenbier',
  'dunkel',
  'starkbier',
  'bockbier',
  'alkoholfrei',
  'radler',
  'alkoholfreies bier',
  'mischgetränk',
  'krombacher',
  'warsteiner',
  'paulaner',
  'becks',
  'bitburger',
  'heineken',
  'carlsberg',
  'stella artois',
  'amstel',
  'corona',
  'modelo',
  'guinness',
  'budweiser',
  'coors',
  'miller',
  'stout',
  'ipa',
  'ale',
  'lagern',
  'pilsner',

  // Wein / Wine
  'wein',
  'wine',
  'rotwein',
  'weisswein',
  'rosé',
  'rosewein',
  'schaumwein',
  'champagner',
  'champagne',
  'prosecco',
  'sekt',
  'mwein',
  'liebfrauenmilch',
  'rheingau',
  'mosel',
  'pfalz',
  'spanischerwein',
  'franzwein',
  'italwein',
  'tinto',
  'blanco',
  'merlot',
  'chardonnay',
  'riesling',
  'spätburgunder',
  'grauburgunder',
  'weißburgunder',
  'sauvignon blanc',
  'pinot noir',
  'cabernet',
  ' Rioja',
  'bordeaux',
  'burgunder',
  'sangria',
  'weinbrand',

  // Spirituosen / Spirits
  'spirituosen',
  'spirits',
  'whisky',
  'whiskey',
  'wodka',
  'vodka',
  'gin',
  'rum',
  'cognac',
  'brandy',
  'calvados',
  'armagnac',
  'tequila',
  'mezcal',
  'schnaps',
  'obstler',
  'kirschwasser',
  'williams',
  'mirabellen',
  'slivovitz',
  'ouzo',
  'raki',
  'absinth',
  'vermouth',
  'likör',
  'liqueur',
  'baileys',
  'kahlua',
  'jägermeister',
  'feige',
  'underberg',
  'korn',
  'wodka',
  'rum',
  'bourbon',
  'scotch',
  'irish whiskey',
  'cognac',
  'armagnac',
  'grappa',
  'cointreau',
  'grand marnier',
  'triple sec',
  'amaretto',
  'frangelico',
  'limoncello',
  'aperol',
  'campari',
  'aperitif',
  'bitters',
  'tonic',
  'grog',

  // Sonstige Alkoholika / Other Alcohol
  'alkohol',
  'alcohol',
  'hochalkoholisch',
  'high proof',
  'portwein',
  'madeira',
  'sherry',
  'marsala',
  'vermouth',
  'cocktail',
  'long drink',
  'shots',
  'alc',
  'alkoholische',
  'alkoholhaltig',
  'ethanol',
  'trinkalkohol',

  // Private/Personal items (extended)
  ' Zeitschrift',
  'zeitschrift',
  'zeitung',
  'buch',
  'taschenbuch',
  'roman',
  'magazin',
  'glücksspiel',
  'lotto',
  'lottoannahme',
  'totoblock',
  'spielhalle',
  'casino',
  'wettbüro',
  'sportwette',
  'poker',
  'glücksrad',
  'lose',
  'lotterieschein'
];

// --- Detection Logic ---

export interface PrivateDocumentResult {
  isPrivate: boolean;
  reason?: string;
  detectedVendor?: string;
  privateItemCount: number;
  totalItemCount: number;
}

/**
 * Detects if a document should be classified as private.
 *
 * Rules:
 * 1. Document must be from a known grocery/retailer vendor
 * 2. ALL line items must be private items (cigarettes, alcohol, etc.)
 * 3. If mixed items (some private, some business) → NOT private
 */
export const detectPrivateDocument = (data: ExtractedData): PrivateDocumentResult => {
  const result: PrivateDocumentResult = {
    isPrivate: false,
    privateItemCount: 0,
    totalItemCount: 0
  };

  // Step 1: Check if vendor is a grocery/retailer
  const vendorName = (data.lieferantName || '').toLowerCase();
  const detectedRetailer = GROCERY_RETAILERS.find(retailer =>
    vendorName.includes(retailer.toLowerCase())
  );

  if (!detectedRetailer) {
    // Not a known grocery retailer, assume business document
    return result;
  }

  result.detectedVendor = detectedRetailer;

  // Step 2: Analyze line items
  const lineItems = data.lineItems || [];
  result.totalItemCount = lineItems.length;

  if (lineItems.length === 0) {
    // No line items to analyze, cannot determine → assume not private
    return result;
  }

  // Check each line item
  let hasPrivateItems = false;
  let hasBusinessItems = false;

  for (const item of lineItems) {
    const description = (item.description || '').toLowerCase();
    const isPrivateItem = PRIVATE_ITEM_KEYWORDS.some(keyword =>
      description.includes(keyword.toLowerCase())
    );

    if (isPrivateItem) {
      hasPrivateItems = true;
      result.privateItemCount++;
    } else {
      hasBusinessItems = true;
    }
  }

  // Step 3: Determine if document is private
  // Rule: Document is private ONLY if ALL items are private items
  if (hasPrivateItems && !hasBusinessItems) {
    result.isPrivate = true;
    result.reason = `Nur private Positionen erkannt (${result.privateItemCount}/${result.totalItemCount} Positionen: Zigaretten/Alkoholika bei ${detectedRetailer})`;
  }

  return result;
};

// --- Debug/Test Helpers ---

export const isPrivateVendor = (vendorName: string): boolean => {
  const normalized = vendorName.toLowerCase();
  return GROCERY_RETAILERS.some(retailer => normalized.includes(retailer.toLowerCase()));
};

export const isPrivateItem = (description: string): boolean => {
  const normalized = description.toLowerCase();
  return PRIVATE_ITEM_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()));
};

// Export for potential reuse
export { GROCERY_RETAILERS, PRIVATE_ITEM_KEYWORDS };
