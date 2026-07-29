import React from 'react';

/** Canonical icon names offered in the habit editor's icon picker. */
export const HABIT_ICONS = ['heart', 'diamond', 'circle', 'square', 'star', 'triangle'] as const;
export type HabitIconName = (typeof HABIT_ICONS)[number];

export type HabitIconProps = {
  icon: string;
  color: string;
  size?: number;
  className?: string;
};

/**
 * Renders a habit's identity as a real SVG shape+color pair.
 *
 * Previously HabitCell/CalendarView/Legend each rendered `icon.charAt(0)`,
 * so two habits like "Read" and "Run" (or any habits sharing a first
 * letter) were visually indistinguishable. Any icon value that isn't one of
 * the canonical shapes (e.g. legacy/free-text icon names) falls back to a
 * filled circle so identity is still a distinct shape+color pair rather
 * than a random letter.
 */
export const HabitIcon: React.FC<HabitIconProps> = ({ icon, color, size = 16, className }) => {
  const normalized = (icon || '').trim().toLowerCase();
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: color,
    'aria-hidden': true as const,
    className,
  };

  switch (normalized) {
    case 'heart':
      return (
        <svg {...svgProps}>
          <path d="M12 21s-6.7-4.35-9.3-8.1C.8 10.2 1.4 6.9 4.2 5.4c2.1-1.1 4.6-.5 5.9 1.3.6.8 1.9.8 2.5 0 1.3-1.8 3.8-2.4 5.9-1.3 2.8 1.5 3.4 4.8 1.5 7.5C18.7 16.65 12 21 12 21z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...svgProps}>
          <polygon points="12,2 22,12 12,22 2,12" />
        </svg>
      );
    case 'square':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
        </svg>
      );
    case 'star':
      return (
        <svg {...svgProps}>
          <polygon points="12,2 15,9 22,9.3 16.5,14 18.2,21 12,17.2 5.8,21 7.5,14 2,9.3 9,9" />
        </svg>
      );
    case 'triangle':
      return (
        <svg {...svgProps}>
          <polygon points="12,3 22,21 2,21" />
        </svg>
      );
    case 'circle':
    default:
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

export default HabitIcon;
