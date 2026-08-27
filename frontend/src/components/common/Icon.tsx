import type { JSX, SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'dashboard'
  | 'roadmap'
  | 'learn'
  | 'playground'
  | 'progress'
  | 'tutor'
  | 'user'
  | 'login'
  | 'menu'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-right'
  | 'arrow-left'
  | 'check'
  | 'spark'
  | 'play'
  | 'grid'
  | 'lock'
  | 'bulb'
  | 'eye'
  | 'flask'
  | 'target'
  | 'cpu'
  | 'message'
  | 'trophy'
  | 'layers'
  | 'compass'
  | 'arrow-down'
  | 'magnify'

const paths: Record<IconName, JSX.Element> = {
  home: (
    <path d="M4 11.2 12 4l8 7.2M6 9.6V20h12V9.6M10 20v-5h4v5" />
  ),
  dashboard: (
    <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
  ),
  roadmap: (
    <path d="M4 17.5 9 6l6 12 5-8.5M3.5 17.5h17.5" />
  ),
  learn: (
    <path d="M12 5c-2.5-1.6-6-1.8-9-1.2v13c3-.6 6.5-.4 9 1.2 2.5-1.6 6-1.8 9-1.2v-13c-3-.6-6.5-.4-9 1.2ZM12 5v13.5" />
  ),
  playground: (
    <path d="M12 3 21 12l-9 9-9-9 9-9ZM12 12l-1 5 5-1-1-5Zm0 0-5-1" />
  ),
  progress: (
    <path d="M4 20V11M10 20V5M16 20v-7M22 20H2" />
  ),
  tutor: (
    <path d="M5 16c2 1.2 4.4 2 7 2s5-.8 7-2M5 16 3.5 7l5.5 2.5M19 16l1.5-9-5.5 2.5M9 9.5 12 12l3-2.5M12 12v6.5" />
  ),
  user: (
    <path d="M12 3.5A3.5 3.5 0 1 1 12 10a3.5 3.5 0 0 1 0-6.5ZM4.5 20.5c.6-3.2 3.4-5.2 7.5-5.2s6.9 2 7.5 5.2" />
  ),
  login: (
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l4 4-4 4M14 12H3" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
  'arrow-left': <path d="M19 12H5m6 6-6-6 6-6" />,
  check: <path d="M4 12.5 9.5 18 20 6.5" />,
  spark: (
    <path d="M12 3l1.7 5L19 10.5l-5.3 2.5L12 18l-1.7-5L5 10.5 10.3 8 12 3ZM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17Z" />
  ),
  play: <path d="M8 5.5 18 12 8 18.5z" />,
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  lock: (
    <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
  ),
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3 11.2c-.6.4-1.1 1-1.2 1.8h-3.6c-.1-.8-.6-1.4-1.2-1.8A6 6 0 0 1 12 3Z" />,
  eye: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />,
  flask: <path d="M9.5 3h5M10 3v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 9V3M7.5 15h9" />,
  target: <path d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 11.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1Z" />,
  cpu: <path d="M8 4V2M16 4V2M8 22v-2M16 22v-2M4 8H2M4 16H2M22 8h-2M22 16h-2M7 7h10v10H7zM10 10h4v4h-4z" />,
  message: <path d="M4 5h16v11H9l-5 4V5Z" />,
  trophy: <path d="M7 4h10v4a5 5 0 0 1-10 0V4ZM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 13v4M9 20h6M12 17c-2 0-3.5 1-3.5 3M12 17c2 0 3.5 1 3.5 3" />,
  layers: <path d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5" />,
  compass: <path d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM15.5 8.5l-2 5-5 2 2-5 5-2Z" />,
  'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
  magnify: <path d="M4 11a7 7 0 1 1 14 0 7 7 0 0 1-14 0ZM20 20l-4-4" />,
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const labelled = props['aria-label'] || props['aria-labelledby']
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
