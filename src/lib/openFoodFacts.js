const BASE = 'https://world.openfoodfacts.org'

const COUNTRY_TAGS = {
  gb: 'en:united-kingdom',
  us: 'en:united-states',
  au: 'en:australia',
  ca: 'en:canada',
  ae: 'en:united-arab-emirates',
  pk: 'en:pakistan',
  in: 'en:india',
  fr: 'en:france',
  de: 'en:germany',
}

export async function searchProducts(query, country = 'gb', page = 1) {
  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: '24',
    page: String(page),
    search_simple: '1',
    action: 'process',
    lc: 'en',
    sort_by: 'unique_scans_n', // most scanned = most commonly known products
  })

  if (country !== 'world' && COUNTRY_TAGS[country]) {
    params.set('tagtype_0', 'countries')
    params.set('tag_contains_0', 'contains')
    params.set('tag_0', COUNTRY_TAGS[country])
  }

  const res = await fetch(`${BASE}/cgi/search.pl?${params}`)
  if (!res.ok) return []
  const json = await res.json()

  // filter out products with no English name
  return (json.products ?? []).filter((p) => p.product_name && /[a-zA-Z]/.test(p.product_name))
}

export async function lookupBarcode(barcode) {
  const res = await fetch(`${BASE}/api/v0/product/${barcode}.json`)
  if (!res.ok) return null
  const json = await res.json()
  if (json.status !== 1) return null
  return json.product
}

function parseIngredients(text) {
  if (!text) return []
  return text
    .toLowerCase()
    .split(/[,;()[\]]/)
    .map((s) => s.replace(/\d+(\.\d+)?%?/g, '').trim())
    .filter((s) => s.length > 1)
}

export function assessProduct(product, allergens) {
  if (!product) return { result: 'unknown', flagged: [] }

  const allergenTags = product.allergens_tags ?? []
  const tracesTags = product.traces_tags ?? []
  const ingredients = parseIngredients(product.ingredients_text)

  const flagged = []

  // only fall back to ingredients list when OFF has no allergen tag data at all
  const hasTagData = allergenTags.length > 0 || tracesTags.length > 0

  for (const a of allergens) {
    if (!a.off_tag) continue
    const tag = a.off_tag.toLowerCase()

    if (allergenTags.includes(tag)) {
      const match = a.exceptions ? 'traces' : 'contains'
      flagged.push({ ...a, match })
    } else if (tracesTags.includes(tag)) {
      flagged.push({ ...a, match: 'traces' })
    } else if (!hasTagData && ingredients.length > 0) {
      // parse actual ingredient list — whole-word match only, not substring
      const name = a.name.toLowerCase()
      const found = ingredients.some((ing) => ing === name || ing.startsWith(name + ' ') || ing.endsWith(' ' + name))
      if (found) flagged.push({ ...a, match: 'traces' })
    }
  }

  if (flagged.length === 0) return { result: 'safe', flagged: [] }

  const hasContains = flagged.some((f) => f.match === 'contains')
  return { result: hasContains ? 'unsafe' : 'warning', flagged }
}

export function getIngredients(product) {
  return parseIngredients(product?.ingredients_text)
}
