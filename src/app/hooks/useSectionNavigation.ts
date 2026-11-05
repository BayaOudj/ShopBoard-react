import { useEffect, useRef, useState } from 'react'
import { isSectionId, navigation, sectionForScroll } from '../navigation'
import type { SectionId } from '../navigation'

function sectionFromHash(): SectionId {
  const id = window.location.hash.slice(1)
  return isSectionId(id) ? id : 'hero'
}

export function useSectionNavigation() {
  const [activeSection, setActiveSection] = useState<SectionId>(sectionFromHash)
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({})
  const pendingFrame = useRef<number | null>(null)

  useEffect(() => {
    const updateFromScroll = () => {
      pendingFrame.current = null
      const positions = navigation.flatMap(({ id }) => {
        const element = sectionRefs.current[id]
        if (!element) return []
        const { top, bottom } = element.getBoundingClientRect()
        return [{ id, top, bottom }]
      })
      const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      const current = sectionForScroll(positions, atBottom, window.location.hash, window.innerHeight)
      if (current) setActiveSection(current)
    }
    const scheduleUpdate = () => {
      if (pendingFrame.current === null) pendingFrame.current = window.requestAnimationFrame(updateFromScroll)
    }
    const onHashChange = () => {
      const id = window.location.hash.slice(1)
      if (!id) setActiveSection('hero')
      else if (isSectionId(id)) setActiveSection(id)
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      if (pendingFrame.current !== null) {
        window.cancelAnimationFrame(pendingFrame.current)
        pendingFrame.current = null
      }
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  function registerSection(id: SectionId) {
    return (element: HTMLElement | null) => { sectionRefs.current[id] = element }
  }

  return { activeSection, navigate: setActiveSection, registerSection }
}
