export type ViewId = 'home' | 'devices' | 'settings'

export const view = $state({
  current: 'home' as ViewId
})

export function goTo(next: ViewId): void {
  view.current = next
}
