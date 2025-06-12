# WCAG Color Accessibility Guide

This guide explains the Web Content Accessibility Guidelines (WCAG) 2.1 color contrast requirements and best practices for creating accessible color schemes.

## WCAG 2.1 Contrast Requirements

### Success Criterion 1.4.3: Contrast (Minimum) - Level AA

- **Normal text**: Minimum contrast ratio of **4.5:1**
- **Large text**: Minimum contrast ratio of **3:1**
  - Large text is defined as:
    - 18pt (24px) or larger
    - 14pt (18.5px) or larger when bold

### Success Criterion 1.4.6: Contrast (Enhanced) - Level AAA

- **Normal text**: Minimum contrast ratio of **7:1**
- **Large text**: Minimum contrast ratio of **4.5:1**

## Understanding Contrast Ratios

The contrast ratio is calculated using the relative luminance of the foreground and background colors:

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```

Where:
- L1 = relative luminance of the lighter color
- L2 = relative luminance of the darker color

### Relative Luminance Calculation

Relative luminance is calculated using the formula:
```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
```

Where R, G, and B are the linearized color channel values (gamma-corrected).

## Using the Accessibility Tools

### 1. Check Contrast Tool

Check if two colors meet WCAG standards:

```json
{
  "tool": "check-contrast",
  "arguments": {
    "foreground": "#333333",
    "background": "#FFFFFF"
  }
}
```

Response includes:
- Contrast ratio
- Pass/fail for AA and AAA standards
- Recommendations

### 2. Find Accessible Color Tool

Find an accessible alternative to a color:

```json
{
  "tool": "find-accessible-color",
  "arguments": {
    "targetColor": "#888888",
    "backgroundColor": "#FFFFFF",
    "options": {
      "targetContrast": 4.5,
      "maintainHue": true,
      "preferDarker": true
    }
  }
}
```

Options:
- `targetContrast`: Desired contrast ratio (default: 4.5)
- `maintainHue`: Try to keep the same color hue (default: true)
- `preferDarker`: Prefer darker alternatives (default: auto)

### 3. Simulate Color Blindness Tool

See how colors appear to people with color vision deficiencies:

```json
{
  "tool": "simulate-colorblind",
  "arguments": {
    "color": "#FF0000",
    "type": "protanopia"
  }
}
```

Supported types:
- **Protanopia**: Red-blind (1.3% of males)
- **Protanomaly**: Red-weak (1.3% of males)
- **Deuteranopia**: Green-blind (1.2% of males)
- **Deuteranomaly**: Green-weak (5% of males)
- **Tritanopia**: Blue-blind (very rare)
- **Tritanomaly**: Blue-weak (rare)
- **Achromatopsia**: Complete color blindness
- **Achromatomaly**: Partial color blindness

## Best Practices

### 1. Don't Rely on Color Alone

Always provide additional visual cues:
- Icons or symbols
- Text labels
- Patterns or textures
- Underlines for links

### 2. Test with Real Content

- Test with actual text sizes and fonts
- Consider anti-aliasing effects
- Test on different screens and devices

### 3. Consider Context

- Higher contrast for critical information
- Body text needs good contrast for extended reading
- UI elements should be clearly distinguishable

### 4. Color Blindness Considerations

- Avoid problematic color combinations:
  - Red/green (most common issue)
  - Blue/purple
  - Green/brown
- Use color blind safe palettes
- Test designs with color blindness simulators

### 5. Common Accessible Color Combinations

High contrast combinations that work well:
- Black (#000000) on White (#FFFFFF) - 21:1
- Dark Gray (#333333) on White (#FFFFFF) - 12.6:1
- Navy Blue (#000080) on White (#FFFFFF) - 8.6:1
- Dark Green (#006400) on White (#FFFFFF) - 5.9:1

### 6. Tools for Designers

When designing accessible color schemes:
1. Start with a base color
2. Use the `find-accessible-color` tool to find compliant alternatives
3. Test combinations with `check-contrast`
4. Verify with `simulate-colorblind` for color blindness
5. Generate accessible palettes using color harmony tools

## Common Mistakes to Avoid

1. **Light gray text on white**: Often fails contrast requirements
2. **Colored text on colored backgrounds**: Can be problematic without testing
3. **Assuming brand colors are accessible**: Always verify
4. **Using color as the only differentiator**: Especially in charts/graphs
5. **Placeholder text with poor contrast**: Should meet contrast requirements

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Universal Design](https://jfly.uni-koeln.de/color/)

## Quick Reference

| Standard | Normal Text | Large Text |
|----------|-------------|------------|
| WCAG AA  | 4.5:1       | 3:1        |
| WCAG AAA | 7:1         | 4.5:1      |

| Text Size | Classification |
|-----------|----------------|
| < 18pt (24px) | Normal text |
| ≥ 18pt (24px) | Large text |
| < 14pt (18.5px) bold | Normal text |
| ≥ 14pt (18.5px) bold | Large text |

Remember: Accessibility is not just about compliance—it's about ensuring everyone can use and enjoy your content!