export const navigation = [
  { id: 'hero', label: 'Overview', icon: '◈' },
  { id: 'products', label: 'Products', icon: '▦' },
  { id: 'collections', label: 'Collections', icon: '▱' },
  { id: 'catalog-insights', label: 'Catalog insights', icon: '▥' },
  { id: 'register', label: 'Community', icon: '♧' },
] as const

export type SectionId = (typeof navigation)[number]['id']

export function isSectionId(value: string): value is SectionId {
  return navigation.some(item => item.id === value)
}

export interface SectionPosition {
  id: SectionId
  top: number
  bottom: number
}

export function sectionForScroll(
  positions: readonly SectionPosition[],
  atBottom: boolean,
  hash: string,
  viewportHeight: number,
): SectionId | undefined {
  const ordered = [...positions].sort((a, b) => a.top - b.top)
  if (atBottom) {
    // More than one anchor can land at the same maximum scroll offset.
    const requested = ordered.find(section => `#${section.id}` === hash && section.bottom > 120 && section.top < viewportHeight)
    return requested?.id ?? ordered.at(-1)?.id
  }
  return ordered.find(section => section.bottom > 120)?.id
}
