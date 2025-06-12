# Color Accessibility Features

This document describes the color accessibility features implemented in the color-converter-mcp project.

## Overview

The color-converter-mcp now includes comprehensive color accessibility features following WCAG 2.1 standards and scientifically accurate color blindness simulations.

## Features

### 1. WCAG Contrast Checking (`check-contrast`)

Calculates the contrast ratio between two colors and checks compliance with WCAG standards.

**Example:**
```json
{
  "tool": "check-contrast",
  "arguments": {
    "foreground": "#333333",
    "background": "#FFFFFF"
  }
}
```

**Features:**
- Calculates contrast ratio using WCAG 2.1 formula
- Checks compliance for:
  - AA standard (4.5:1 normal text, 3:1 large text)
  - AAA standard (7:1 normal text, 4.5:1 large text)
- Provides recommendations based on compliance level
- Supports all color formats (hex, RGB, HSL, etc.)

### 2. Color Blindness Simulation (`simulate-colorblind`)

Simulates how colors appear to people with different types of color vision deficiencies.

**Example:**
```json
{
  "tool": "simulate-colorblind",
  "arguments": {
    "color": "#FF0000",
    "type": "protanopia"
  }
}
```

**Supported Types:**
- **Protanopia**: Red-blind (1.3% of males)
- **Protanomaly**: Red-weak (1.3% of males)
- **Deuteranopia**: Green-blind (1.2% of males)
- **Deuteranomaly**: Green-weak (5% of males)
- **Tritanopia**: Blue-blind (very rare)
- **Tritanomaly**: Blue-weak (rare)
- **Achromatopsia**: Complete color blindness
- **Achromatomaly**: Partial color blindness

**Features:**
- Uses scientifically accurate transformation matrices
- Preserves relative luminance relationships
- Can simulate all types at once if no specific type is provided

### 3. Find Accessible Colors (`find-accessible-color`)

Finds an accessible alternative to a given color that meets WCAG contrast requirements.

**Example:**
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

**Features:**
- Finds colors that meet specified contrast ratios
- Option to maintain original hue
- Can prefer darker or lighter alternatives
- Provides additional accessible color pair suggestions
- Returns contrast ratio of suggested color

## Implementation Details

### Color Accessibility Module (`src/colorAccessibility.ts`)

Implements WCAG 2.1 contrast calculations:
- Relative luminance calculation
- Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
- Compliance checking for AA and AAA standards
- Accessible color generation algorithms

### Color Blindness Module (`src/colorBlindness.ts`)

Implements color blindness simulations:
- Transformation matrices for each type of color blindness
- Gamma correction for accurate color space conversions
- Color distinguishability checking
- Color blind safe palette generation

## Testing

Comprehensive test suites ensure accuracy:
- WCAG contrast calculations verified against known values
- Color blindness simulations tested with pure colors
- Edge cases and boundary conditions covered
- 100% test coverage for critical functions

## Best Practices Guide

A comprehensive WCAG guide (`WCAG_ACCESSIBILITY_GUIDE.md`) is included with:
- WCAG 2.1 requirements explained
- Best practices for accessible design
- Common mistakes to avoid
- Quick reference tables
- Usage examples for all tools

## Integration

The accessibility features are fully integrated into the MCP server:
- Available as standard MCP tools
- Support all existing color formats
- Consistent error handling and validation
- Detailed response formatting

## Future Enhancements

Potential future additions:
- APCA (Advanced Perceptual Contrast Algorithm) support
- Pattern overlay suggestions for color blind users
- Accessible gradient generation
- Color palette accessibility scoring