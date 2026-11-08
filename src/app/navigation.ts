export const navigation = [
  { id: 'hero', label: 'Overview', icon: '◈' },
  { id: 'products', label: 'Products', icon: '▦' },
  { id: 'collections', label: 'Collections', icon: '▱' },
  { id: 'catalog-insights', label: 'Catalog insights', icon: '▥' },
  { id: 'register', label: 'Community', icon: '♧' },
] as const

export type SectionId = (typeof navigation)[number]['id']
