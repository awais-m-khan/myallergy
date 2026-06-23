const KEY = 'myallergy_country'

export const COUNTRIES = [
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'us', label: 'United States',  flag: '🇺🇸' },
  { code: 'au', label: 'Australia',      flag: '🇦🇺' },
  { code: 'ca', label: 'Canada',         flag: '🇨🇦' },
  { code: 'ae', label: 'UAE',            flag: '🇦🇪' },
  { code: 'pk', label: 'Pakistan',       flag: '🇵🇰' },
  { code: 'in', label: 'India',          flag: '🇮🇳' },
  { code: 'fr', label: 'France',         flag: '🇫🇷' },
  { code: 'de', label: 'Germany',        flag: '🇩🇪' },
  { code: 'world', label: 'Worldwide',   flag: '🌍' },
]

export function getCountry() {
  return localStorage.getItem(KEY) ?? 'gb'
}

export function setCountry(code) {
  localStorage.setItem(KEY, code)
}
