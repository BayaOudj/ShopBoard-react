import { PersonIcon } from '../../shared/ui/PersonIcon'
import { navigation } from '../navigation'
import type { SectionId } from '../navigation'
import { Brand } from './Brand'
import styles from './Sidebar.module.css'

interface SidebarProps {
  activeSection: SectionId
  onNavigate: (id: SectionId) => void
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Workspace">
      <Brand />
      <p className={styles.caption}>YOUR WORKSPACE</p>
      <nav className={styles.navigation} aria-label="Main navigation">
        {navigation.map(item => (
          <a key={item.id} href={`#${item.id}`} onClick={() => onNavigate(item.id)}
            aria-current={activeSection === item.id ? 'location' : undefined}>
            <span aria-hidden="true">{item.icon}</span>{item.label}
          </a>
        ))}
      </nav>
      <div className={styles.note}>
        <span className={styles.orb} aria-hidden="true" />
        <strong>A little more possibility.</strong>
        <p>Thoughtful finds. A fresh perspective.</p>
        <a href="#collections" onClick={() => onNavigate('collections')}>Explore collections <span aria-hidden="true">↗</span></a>
      </div>
      <a className={styles.profile} href="#register" onClick={() => onNavigate('register')}>
        <span className={styles.avatar} aria-hidden="true"><PersonIcon /></span>
        <span><strong>Your workspace</strong><small>Join the community ↗</small></span>
      </a>
    </aside>
  )
}
