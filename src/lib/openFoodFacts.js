const BASE = 'https://world.openfoodfacts.org'

export async function searchProducts(query, page = 1) {
  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: '20',
    page: String(page),
    search_simple: '1',
    action: 'process',
  })
  const res = await fetch(`${BASE}/cgi/search.pl?${params}`)
  if (!res.ok) return []
  const json = await res.json()
  return json.products ?? []
}

export async function lookupBarcode(barcode) {
  const res = await fetch(`${BASE}/api/v0/product/${barcode}.json`)
  if (!res.ok) return null
  const json = await res.json()
  if (json.status !== 1) return null
  return json.product
}

export function assessProduct(product, allergens) {
  if (!product) return { result: 'unknown', flagged: [] }

  const allergenTags = product.allergens_tags ?? []
  const tracesTags = product.traces_tags ?? []
  const ingredientsText = (product.ingredients_text ?? '').toLowerCase()

  const flagged = []

  for (const a of allergens) {
    if (!a.off_tag) continue
    const tag = a.off_tag.toLowerCase()
    const name = a.name.toLowerCase()

    if (allergenTags.includes(tag)) {
      flagged.push({ ...a, match: 'contains' })
    } else if (tracesTags.includes(tag) || ingredientsText.includes(name)) {
      flagged.push({ ...a, match: 'traces' })
    }
  }

  if (flagged.length === 0) return { result: 'safe', flagged: [] }

  const hasContains = flagged.some((f) => f.match === 'contains')
  return { result: hasContains ? 'unsafe' : 'warning', flagged }
}
