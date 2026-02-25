# Service Images Directory

This directory contains custom images for service cards displayed throughout the platform.

## Image Specifications

- **Format**: WebP recommended (with PNG/JPG fallback)
- **Size**: **1000×600 pixels (5:3 aspect ratio)** - REQUIRED for consistent display
- **Alternative Sizes**: 800×480px or 1500×900px (must maintain 5:3 ratio)
- **File Size**: Optimize for web (under 200KB recommended)
- **Naming**: Use descriptive names (e.g., `gta5-topup-gold.webp`, `fortnite-boosting-rank.webp`)

## Image Style Guidelines

### Topups Category (💰 In-game currency)
- **Visual style**: Stacks of currency, coins, credits, vault imagery
- **Examples**: 
  - GTA 5: Cash stacks with "GTA$" symbols
  - Fortnite: V-Bucks icon with glow
  - Rocket League: Credits with neon effects
- **Color palette**: Gold/yellow tones (#fbbf24) to match brand

### Boosting Category (⚡ Rank/Level progression)
- **Visual style**: Upward arrows, level bars, ranking badges, progress meters
- **Examples**:
  - GTA 5: Rank badge with arrow, RP bar filling
  - Fortnite: Battle Pass progression, XP bar
  - Rocket League: Rank badges (Bronze → Champion)
- **Color palette**: Blue/electric tones (#60a5fa) for energy/progression

### Accounts Category (👤 Pre-built accounts)
- **Visual style**: Character profiles, account screens, unlock showcases
- **Examples**:
  - GTA 5: High-level character with luxury vehicles
  - Fortnite: Account with rare skins/emotes
  - Forza Horizon 6: Car collection showcase
- **Color palette**: Purple/premium tones (#a78bfa) for exclusivity

## Design Requirements

**Essential Elements:**
- Dark background (#0a0e1a or similar) to match site theme
- Game logo/icon subtly placed (optional - top corner)
- High contrast with bright accent colors
- No small text - images must work at thumbnail size
- Modern gradient overlays matching CSS linear-gradients

**Style Should Be:**
- Gaming-focused and energetic
- Professional, not cheap/scammy
- Consistent color scheme across all images
- Clean and modern aesthetic

## Adding Service Images

1. Create or source a 1000×600px image (5:3 aspect ratio)
2. Optimize for web (compress to under 200KB)
3. Save as WebP format (with PNG fallback if needed)
4. Name descriptively: `{game}-{category}-{descriptor}.webp`
5. Place in this directory (`/public/service-images/`)
6. In Admin Panel → Items → Edit/Create, set Icon/Image URL to: `/service-images/your-image.webp`

## Example File Names

```
gta5-topup-cash-vault.webp
gta5-boosting-rank-up.webp
gta5-account-premium.webp
fortnite-topup-vbucks.webp
fortnite-boosting-battlepass.webp
rocket-league-boosting-champion.webp
forza-credits-gold.webp
```

## Example Usage

```javascript
// In Admin Panel when creating/editing an item
{
  name: "GTA$ 100M Package",
  icon: "/service-images/gta5-topup-cash-vault.webp",
  category: "Topups",
  game: "GTA 5"
}
```

## Fallback Behavior

If no custom image is provided, services will display:
1. Item's icon field if set
2. Game's icon_url as fallback
3. Default placeholder: `/zeusservicesPackage.webp`

## Tools for Creating Images

- **Canva Pro**: Use gaming templates (easiest for non-designers)
- **Midjourney/DALL-E**: AI-generated images with prompts
- **Fiverr**: Hire designers ($20-50 for a full set)
- **Photoshop/Figma**: For professional customization

## Design Tips

- Use high-quality game assets/screenshots as base
- Add overlays/gradients for depth
- Keep focus on central element (currency/rank/character)
- Ensure text is readable if included
- Test at card size (300-400px wide) before finalizing
