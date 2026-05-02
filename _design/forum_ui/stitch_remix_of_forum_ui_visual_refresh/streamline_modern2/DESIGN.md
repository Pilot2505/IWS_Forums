---
name: Streamline Modern
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414751'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717783'
  outline-variant: '#c1c7d3'
  surface-tint: '#0060ac'
  primary: '#005da7'
  on-primary: '#ffffff'
  primary-container: '#2976c7'
  on-primary-container: '#fdfcff'
  inverse-primary: '#a4c9ff'
  secondary: '#496080'
  on-secondary: '#ffffff'
  secondary-container: '#c1d9fe'
  on-secondary-container: '#485e7e'
  tertiary: '#7f5300'
  on-tertiary: '#ffffff'
  tertiary-container: '#a06900'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#b1c8ed'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#314867'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb953'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

# Design System: Streamline Modern

## Brand & Style
The brand personality is professional, dependable, and modern. By moving to a primary blue palette and the Inter typeface, the UI evokes a sense of clarity and technological precision. The target audience includes professionals who value efficiency and a clean, "no-fuss" interface.

The design style follows a **Corporate / Modern** aesthetic. It prioritizes readability and functional balance, utilizing ample white space and subtle soft edges to create a friendly yet business-ready environment.

## Colors
The color palette is streamlined to focus on a singular primary blue, emphasizing a focused and trustworthy user experience.

*   **Primary (#4A90E2):** A bright, clear blue used for primary actions, active states, and key branding elements.
*   **Neutral (#F8F9FA):** A very light, cool grey used for backgrounds and subtle surface divisions, maintaining a high-contrast and airy feel against the primary blue.
*   **Color Mode:** The system is designed for a Light Mode default, ensuring maximum legibility and a clean, professional appearance.

## Typography
We use **Inter** for all typographic levels. Inter is a variable font family carefully crafted & designed for computer screens, providing excellent legibility even at small sizes.

Headlines use a heavier weight to establish a clear hierarchy, while body text maintains a standard weight with comfortable line heights to facilitate long-form reading. Labels are slightly tighter and use medium weights to distinguish them from standard body copy.

## Layout & Spacing
The system utilizes a **fluid grid** model with an 8px spacing rhythm. This ensures that all components and layouts remain consistent and scale gracefully across different screen sizes.

Standard margins are set to 24px for mobile and 32px for desktop, with consistent 16px gutters between grid columns.

## Elevation & Depth
Depth is conveyed through **tonal layers** and very subtle **ambient shadows**. Surfaces are primarily separated by subtle shifts in the neutral background colors or low-contrast outlines. When shadows are used for elevation (e.g., in modals or floating action buttons), they are soft, diffused, and have a low opacity to avoid distracting the user.

## Shapes
The shape language is **Soft**. All primary UI elements, such as buttons and input fields, feature a 0.25rem (4px) corner radius. This subtle rounding moves away from a harsh industrial look toward a more approachable, modern feel while maintaining a professional structure.

## Components
*   **Buttons:** Contained buttons use the Primary Blue background with white text and a 4px corner radius.
*   **Input Fields:** Use a light stroke with a 4px corner radius and Inter for placeholder text.
*   **Cards:** Use a white background on the Neutral grey surface, with a very subtle shadow or a 1px border.
*   **Chips:** Small, rounded elements with 4px radius used for tags or filters, typically utilizing a light tint of the primary color.