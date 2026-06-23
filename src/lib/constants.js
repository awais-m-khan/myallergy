export const EU_BIG_14 = [
  { name: 'Peanuts',    off_tag: 'en:peanuts',                        category: 'Nuts & seeds' },
  { name: 'Tree nuts',  off_tag: 'en:nuts',                           category: 'Nuts & seeds' },
  { name: 'Milk',       off_tag: 'en:milk',                           category: 'Dairy' },
  { name: 'Eggs',       off_tag: 'en:eggs',                           category: 'Eggs' },
  { name: 'Gluten',     off_tag: 'en:gluten',                         category: 'Grains' },
  { name: 'Wheat',      off_tag: 'en:wheat',                          category: 'Grains' },
  { name: 'Soy',        off_tag: 'en:soybeans',                       category: 'Legumes' },
  { name: 'Fish',       off_tag: 'en:fish',                           category: 'Seafood' },
  { name: 'Shellfish',  off_tag: 'en:crustaceans',                    category: 'Seafood' },
  { name: 'Sesame',     off_tag: 'en:sesame-seeds',                   category: 'Nuts & seeds' },
  { name: 'Mustard',    off_tag: 'en:mustard',                        category: 'Condiments' },
  { name: 'Celery',     off_tag: 'en:celery',                         category: 'Vegetables' },
  { name: 'Lupin',      off_tag: 'en:lupin',                          category: 'Legumes' },
  { name: 'Sulphites',  off_tag: 'en:sulphur-dioxide-and-sulphites',  category: 'Additives' },
  { name: 'Molluscs',   off_tag: 'en:molluscs',                       category: 'Seafood' },
]

export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe', 'anaphylactic']

export const SEVERITY_STYLES = {
  mild:          { badge: 'bg-green-100 text-green-700',   label: 'Mild' },
  moderate:      { badge: 'bg-yellow-100 text-yellow-700', label: 'Moderate' },
  severe:        { badge: 'bg-orange-100 text-orange-700', label: 'Severe' },
  anaphylactic:  { badge: 'bg-red-100 text-red-700',       label: 'Anaphylactic' },
}
