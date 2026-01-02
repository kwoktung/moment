# Couples Memory App - Warm & Cozy Design Guide

## 🎨 Aesthetic Philosophy

**Core Vibe:** Warm & Cozy

- Intimate and personal
- Timeless (memories should feel precious, not trendy)
- Easy to use daily
- Emotionally warm and inviting

---

## 🎭 Typography System

### Font Families

**Primary UI Font: Nunito (Rounded Sans-Serif)**

- **Usage:** Headers, buttons, labels, navigation, metadata
- **Weights:** 400 (regular), 600 (semi-bold), 700 (bold)
- **Why:** Rounded sans-serif creates friendly, soft, approachable feel

**Content Font: Lora (Serif)**

- **Usage:** Memory text, journal entries, photo captions, long-form content
- **Weights:** 400 (regular), 500 (medium), 600 (semi-bold)
- **Why:** Serif makes moments feel more precious and timeless, like reading a letter

### Font Sizing

- **Large headers:** 1.5rem (Nunito Bold)
- **Body content:** 1.05rem (Lora Regular) - slightly larger for readability
- **UI text:** 0.9-1rem (Nunito)
- **Small metadata:** 0.875rem (Nunito)

---

## 🌈 Color Palette

### Primary Colors

```css
--primary-bg: #fff8f0; /* Warm cream background */
--secondary-bg: #ffffff; /* Pure white for cards */
--accent-peach: #ffb5a7; /* Soft peach */
--accent-coral: #ff8c7a; /* Warm coral */
```

### Text Colors

```css
--text-primary: #3d3d3d; /* Soft black for readability */
--text-secondary: #8b7e74; /* Warm gray for metadata */
```

### UI Elements

```css
--border-soft: #f4e8dd; /* Barely-there borders */
--shadow-soft: rgba(255, 139, 122, 0.08); /* Peachy shadow tint */
```

### Usage Guidelines

- **Backgrounds:** Use cream (#FFF8F0) as main, white for cards
- **Accents:** Peach-to-coral gradient for CTAs and highlights
- **Shadows:** Always use warm-tinted shadows, never gray
- **Borders:** Keep them subtle and warm-toned

---

## 🔲 Layout & Structure

### Layout Pattern (X.com-inspired)

- **Feed width:** 600px max (centered)
- **Mobile:** Full width with 1rem padding
- **Card spacing:** 1rem between cards
- **Internal padding:** 1.5rem inside cards

### Card Structure

```
┌─────────────────────────────────┐
│ Avatar + Name + Date            │
├─────────────────────────────────┤
│ Memory Content (Lora font)      │
│ [Optional Image]                │
│ Tags                            │
├─────────────────────────────────┤
│ Action buttons (Love, Comment)  │
└─────────────────────────────────┘
```

---

## 🎯 Design Elements

### Border Radius

- **Cards:** 20px (very rounded)
- **Buttons:** 25px (pill-shaped)
- **Images:** 16px (rounded but not circular)
- **Tags:** 20px (pill-shaped)
- **Avatars:** 50% (circular)

### Shadows & Depth

```css
/* Default card shadow */
box-shadow: 0 4px 16px var(--shadow-soft);

/* Hover state */
box-shadow: 0 8px 24px rgba(255, 139, 122, 0.15);

/* Button shadow */
box-shadow: 0 4px 12px rgba(255, 140, 122, 0.2);
```

### Animations & Interactions

- **Hover lift:** `transform: translateY(-2px)`
- **Transition duration:** 0.2s for micro-interactions
- **Easing:** Default ease for smooth feel

---

## 🔘 Component Patterns

### Primary CTA Button

```css
background: linear-gradient(135deg, #ffb5a7, #ff8c7a);
color: white;
padding: 0.6rem 1.5rem;
border-radius: 25px;
font-weight: 600;
box-shadow: 0 4px 12px rgba(255, 140, 122, 0.2);
```

### Avatar (Couple)

- Two overlapping circles
- Second avatar offset by -15px
- 3px white border for separation
- Gradient background when no photo

### Tags

```css
background-color: #fff0e8; /* Very light peach */
color: #ff8c7a; /* Coral text */
padding: 0.4rem 0.9rem;
border-radius: 20px;
font-weight: 600;
```

### Action Buttons

- No background by default
- Warm gray color (`--text-secondary`)
- Hover: Change to coral (`--accent-coral`)
- Active/Liked: Coral color

---

## 📱 Responsive Considerations

### Breakpoints

- **Mobile:** < 640px - Full width cards, larger touch targets
- **Tablet:** 640px - 1024px - Same layout, slightly more padding
- **Desktop:** > 1024px - Max 600px centered feed

### Mobile Adjustments

- Increase touch target size to minimum 48px
- Slightly larger font sizes for content (1.1rem)
- More padding on cards (2rem)

---

## ✨ Key Differentiators from Standard Designs

1. **Warm color palette** instead of cool grays/blues
2. **Serif font for content** to make memories feel precious
3. **Rounded everything** for approachable feel
4. **Peach-tinted shadows** instead of gray shadows
5. **Couple-focused avatars** that overlap (shows unity)
6. **Emoji-enhanced tags** for personality

---

## 🚀 Implementation Quick Start

### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Lora:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
</html>
```

### CSS Variables

```css
:root {
  --primary-bg: #fff8f0;
  --secondary-bg: #ffffff;
  --accent-peach: #ffb5a7;
  --accent-coral: #ff8c7a;
  --text-primary: #3d3d3d;
  --text-secondary: #8b7e74;
  --border-soft: #f4e8dd;
  --shadow-soft: rgba(255, 139, 122, 0.08);
}

body {
  font-family: "Nunito", sans-serif;
  background-color: var(--primary-bg);
}

.memory-content {
  font-family: "Lora", serif;
  font-size: 1.05rem;
  line-height: 1.7;
}
```

### React/React Native

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        peach: "#FFB5A7",
        coral: "#FF8C7A",
      },
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
        serif: ["Lora", "serif"],
      },
      borderRadius: {
        card: "20px",
        button: "25px",
      },
    },
  },
};
```

---

## 📋 Design Checklist

When creating new components, ensure:

- [ ] Using Nunito for UI elements
- [ ] Using Lora for memory/content text
- [ ] Warm color palette (no cold grays/blues)
- [ ] Generous border radius (20px+ on cards)
- [ ] Peachy shadows, not gray
- [ ] Comfortable line height (1.6-1.7)
- [ ] Sufficient contrast for accessibility
- [ ] Touch targets minimum 48px on mobile

---

## 💡 Future Expansion Ideas

- **Dark mode:** Use deep warm browns instead of pure black
- **Illustrations:** Hand-drawn, soft style (avoid geometric/sharp)
- **Icons:** Rounded icon set (like Feather Icons or Lucide with rounded variant)
- **Animations:** Subtle, smooth, never jarring
- **Photos:** Warm filter overlay option

---

**Last Updated:** December 2024  
**Design System Version:** 1.0
