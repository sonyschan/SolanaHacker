# Skill: gemini_image

Generate images with Gemini AI. Icons, logos, UI graphics use Flash model. NFT art uses Pro model.

## Trigger Hints

- generate icon
- create icon
- app icon
- favicon
- button icon
- UI icon
- logo design
- generate image
- create visual
- make art
- NFT artwork
- background image
- placeholder image

## Tools

- `generate_image`: Generate an image using Gemini AI

## Models

| Model | Use Case | Cost |
|-------|----------|------|
| gemini-2.5-flash-image | Icons, logos, UI graphics, backgrounds | Lower |
| gemini-3-pro-image-preview | NFT art, detailed illustrations | Higher |

## Examples

```
// Generate an app icon
generate_image({
  prompt: "Minimal flat icon of a rocket ship, orange gradient, white background, 512x512",
  model: "gemini-2.5-flash-image",
  filename: "app-icon.png"
})

// Generate a logo
generate_image({
  prompt: "Modern tech logo, letter S made of flowing lines, purple and blue gradient",
  model: "gemini-2.5-flash-image",
  filename: "logo.png"
})
```
