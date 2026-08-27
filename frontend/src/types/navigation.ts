import type { IconName } from '../components/common'

export interface NavItem {
  label: string
  to: string
  icon: IconName
  section?: 'primary' | 'account'
}
