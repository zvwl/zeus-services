# Game Icons Directory

This directory contains game icons used throughout the multi-game platform.

## Icon Specifications

- **Format**: WebP recommended (with SVG/PNG fallback)
- **Size**: 128x128 pixels
- **Color**: Full color with transparent or solid background
- **Naming**: Use game slug (e.g., `gta5.webp`, `fortnite.webp`)

## Required Icons

1. `gta5.webp` - GTA 5 / GTA Online
2. `forza-horizon-6.webp` - Forza Horizon 6
3. `fortnite.webp` - Fortnite
4. `rocket-league.webp` - Rocket League
5. `default.webp` - Fallback icon for games without custom icons

## Adding New Game Icons

1. Create a 128x128px icon for the game
2. Save as WebP format (or PNG/SVG)
3. Name it using the game's slug (lowercase, hyphens for spaces)
4. Place in this directory
5. Update the game record in the database with the path: `/game-icons/your-game-slug.webp`

## Icon Guidelines

- Keep icons recognizable at small sizes (40x40px in dropdowns)
- Use official game logos/artwork when possible
- Maintain consistent style across all icons
- Ensure good contrast for visibility

## Example Usage

```javascript
// In games table
{
  name: "GTA 5",
  slug: "gta5",
  icon_url: "/game-icons/gta5.webp"
}
```

The icons will automatically be used in:
- Category dropdown menus
- Game selection interfaces
- Category page headers
- Admin panels

## Copyright Notice

Game icons are property of their respective publishers and developers. Use only for identification purposes within this platform.
