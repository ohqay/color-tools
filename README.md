# Color Converter MCP Server

```
██████╗  ██████╗ ██╗      ██████╗ ██╗   ██╗██████╗ 
██╔════╝██╔═══██╗██║     ██╔═══██╗██║   ██║██╔══██╗
██║     ██║   ██║██║     ██║   ██║██║   ██║██████╔╝
██║     ██║   ██║██║     ██║   ██║██║   ██║██╔══██╗
╚██████╗╚██████╔╝███████╗╚██████╔╝╚██████╔╝██║  ██║
 ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
████████╗ ██████╗  ██████╗ ██╗     ███████╗        
╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝        
   ██║   ██║   ██║██║   ██║██║     ███████╗        
   ██║   ██║   ██║██║   ██║██║     ╚════██║        
   ██║   ╚██████╔╝╚██████╔╝███████╗███████║        
   ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
```

A Model Context Protocol (MCP) server that provides color conversion capabilities between different color formats.

## Features

- Convert colors between multiple formats:
  - Hexadecimal (e.g., `#D4C7BA`, `#FFF`, `#RGBA`, `#RRGGBBAA`)
  - RGB (e.g., `rgb(212, 199, 186)`, `255, 0, 0`)
  - RGBA with alpha/transparency (e.g., `rgba(255, 0, 0, 0.5)`)
  - HSL (e.g., `hsl(30, 24%, 78%)`)
  - HSLA with alpha/transparency (e.g., `hsla(30, 24%, 78%, 0.8)`)
  - HSB/HSV (e.g., `hsb(30, 12%, 83%)`, `hsv(240, 100%, 100%)`)
  - CMYK (e.g., `cmyk(0%, 6%, 12%, 17%)`)
- Extended hex format support with alpha channel (#RGBA, #RRGGBBAA)
- Support for CSS named colors (140+ colors like `red`, `blue`, `coral`)
- Auto-detect input color format
- Support for multiple output formats in a single conversion
- Color harmony generation based on color theory:
  - Complementary (opposite colors)
  - Analogous (adjacent colors)
  - Triadic (three evenly spaced)
  - Tetradic/Square (four evenly spaced)
  - Split-complementary (base + two adjacent to complement)
  - Double-complementary (two complementary pairs)
- Custom angle adjustments for fine-tuning harmonies
- Comprehensive error handling with detailed validation messages
- Includes `color-info` tool for server information and examples
- MCP Resources for accessing color palettes and data:
  - Material Design color palette
  - Tailwind CSS color palette
  - CSS named colors organized by category
  - Web-safe colors (216 colors)

## Installation

1. Clone this repository:
```bash
git clone [repository-url]
cd color-converter-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

### Configuring Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "color-converter": {
      "command": "node",
      "args": ["/path/to/color-converter-mcp/dist/index.js"]
    }
  }
}
```

Replace `/path/to/color-converter-mcp` with the actual path to your installation.

### Using the Tools

Once configured, you can use the tools in Claude:

#### convert-colour
```
Convert #D4C7BA to RGB format
```

```
Convert rgb(212, 199, 186) to all formats
```

```
Convert "coral" to hex, rgb, and hsl
```

```
Convert rgba(255, 0, 0, 0.5) to hsla
```

#### color-info
```
Get information about the color converter
```

#### generate-harmony
```
Generate a complementary color scheme for #FF6B6B
```

```
Create a triadic harmony from blue in RGB format
```

```
Generate analogous colors from #4ECDC4 with 5 colors
```

## Tool Parameters

### convert-colour
- `input` (required): The color value to convert
- `from` (optional): Source format - if not specified, will auto-detect
- `to` (optional): Array of target formats - if not specified, converts to all formats

### color-info
No parameters required - returns server information and examples

### generate-harmony
- `baseColor` (required): The base color to generate harmonies from (any supported format)
- `harmonyType` (required): Type of harmony - `complementary`, `analogous`, `triadic`, `tetradic`, `square`, `split-complementary`, or `double-complementary`
- `outputFormat` (optional): Format for output colors - defaults to `hex`
- `options` (optional): Additional options:
  - `angleAdjustment`: Custom angle adjustment in degrees
  - `analogousCount`: Number of colors for analogous harmony (default: 3)
  - `analogousAngle`: Angle between analogous colors (default: 30)

## MCP Resources

The server provides the following resources that can be accessed via MCP ReadResource requests:

### Available Resources

1. **color-palettes** - List of all available color palettes
   - Returns metadata about all available palettes including name, version, and color count

2. **palette://material-design** - Material Design color palette
   - Complete Material Design 3.0 color palette with 19 colors and their shades (50-900)

3. **palette://tailwind** - Tailwind CSS color palette  
   - Tailwind CSS v3.0 default palette with 22 colors and extended shades (50-950)

4. **colors://named** - CSS named colors organized by category
   - All 147 CSS named colors organized into categories like "Basic Colors", "Reds & Pinks", etc.

5. **colors://web-safe** - Web-safe color palette
   - The 216 web-safe colors that display consistently across browsers, organized by hue

### Resource Response Format

All resources return JSON data with `application/json` mime type. Example structures:

#### Palette Resource
```json
{
  "name": "Material Design",
  "description": "Material Design color palette with primary colors and their shades",
  "version": "3.0",
  "colors": [
    {
      "name": "red",
      "shades": [
        { "name": "50", "value": "#ffebee" },
        { "name": "100", "value": "#ffcdd2" },
        // ... more shades
      ]
    }
    // ... more colors
  ]
}
```

#### Named Colors Resource
```json
{
  "name": "CSS Named Colors",
  "description": "All CSS named colors organized by category",
  "totalColors": 147,
  "categories": [
    {
      "name": "Basic Colors",
      "description": "Fundamental color names",
      "colors": [
        { "name": "black", "hex": "#000000" },
        { "name": "white", "hex": "#ffffff" },
        // ... more colors
      ]
    }
    // ... more categories
  ],
  "allColors": [/* sorted list of all colors */]
}
```

### Example Requests

#### Convert with specific formats
```json
{
  "input": "#D4C7BA",
  "to": ["rgb", "hsl", "hsb", "cmyk"]
}
```

#### Convert named color
```json
{
  "input": "coral",
  "to": ["hex", "rgba", "hsla"]
}
```

### Example Response
```json
{
  "success": true,
  "input": "#D4C7BA",
  "detectedFormat": "hex",
  "hex": "#d4c7ba",
  "rgb": "rgb(212, 199, 186)",
  "hsl": "hsl(30, 23%, 78%)",
  "hsb": "hsb(30, 12%, 83%)",
  "cmyk": "cmyk(0%, 6%, 12%, 17%)"
}
```

## Color Harmonies

The `generate-harmony` tool creates aesthetically pleasing color combinations based on color theory principles:

### Harmony Types

1. **Complementary**: Two colors opposite on the color wheel (180° apart)
   - High contrast, vibrant combinations
   - Example: Red (#FF0000) → Cyan (#00FFFF)

2. **Analogous**: Adjacent colors on the color wheel
   - Harmonious, serene combinations
   - Default: 3 colors with 30° spacing
   - Customizable count and angle

3. **Triadic**: Three colors evenly spaced (120° apart)
   - Vibrant yet balanced schemes
   - Forms an equilateral triangle on the color wheel

4. **Tetradic/Square**: Four colors evenly spaced (90° apart)
   - Rich, diverse color schemes
   - Forms a square on the color wheel

5. **Split-Complementary**: Base color + two adjacent to its complement
   - High contrast with more nuance than pure complementary
   - Default: ±30° from the complement

6. **Double-Complementary**: Two complementary pairs
   - Complex, rich color schemes
   - Forms a rectangle on the color wheel

### Example Harmony Requests

```json
{
  "baseColor": "#FF6B6B",
  "harmonyType": "complementary",
  "outputFormat": "hex"
}
```

```json
{
  "baseColor": "blue",
  "harmonyType": "analogous",
  "outputFormat": "rgb",
  "options": {
    "analogousCount": 5,
    "analogousAngle": 15
  }
}
```

### Example Harmony Response

```json
{
  "success": true,
  "input": "#FF6B6B",
  "harmonyType": "triadic",
  "outputFormat": "hex",
  "result": {
    "baseColor": "#ff6b6b",
    "colors": ["#ff6b6b", "#6bff6b", "#6b6bff"],
    "colorCount": 3,
    "description": "Three colors evenly spaced around the color wheel (120° apart), offering vibrant yet balanced schemes",
    "rawHSLValues": [
      { "h": 0, "s": 58, "l": 71 },
      { "h": 120, "s": 58, "l": 71 },
      { "h": 240, "s": 58, "l": 71 }
    ]
  }
}
```

## Supported Color Formats

### Input Formats

- **Hex**: `#RGB`, `#RGBA`, `#RRGGBB`, or `#RRGGBBAA` (case-insensitive)
- **RGB**: `rgb(r, g, b)` or `r, g, b` (values 0-255)
- **RGBA**: `rgba(r, g, b, a)` (RGB values 0-255, alpha 0-1)
- **HSL**: `hsl(h, s%, l%)` (h: 0-360, s/l: 0-100)
- **HSLA**: `hsla(h, s%, l%, a)` (HSL values + alpha 0-1)
- **HSB/HSV**: `hsb(h, s%, b%)` or `hsv(h, s%, v%)` (h: 0-360, s/b: 0-100)
- **CMYK**: `cmyk(c%, m%, y%, k%)` (all values 0-100)
- **Named Colors**: All CSS named colors (e.g., `red`, `coral`, `dodgerblue`)

### Notes

- HSB and HSV are treated as identical (they are the same color model)
- CMYK conversion is simplified and not color-profile accurate
- Auto-detection works for all supported format variations
- Named colors are converted through their hex values
- Alpha/transparency is preserved when converting between RGBA and HSLA
- Extended hex formats support alpha channel (#RGBA → 4-digit, #RRGGBBAA → 8-digit)

## MCP Resources

The server provides read-only resources for accessing color data:

### Available Resources

1. **color-palettes** - List of available color palettes
   - URI: `color-palettes`
   - Returns metadata about available palettes

2. **Material Design Palette** - Google's Material Design colors
   - URI: `palette://material-design`
   - Returns 19 colors with shades (50-900)

3. **Tailwind CSS Palette** - Tailwind's color system
   - URI: `palette://tailwind`
   - Returns 22 colors with shades (50-950)

4. **Named Colors** - All CSS named colors organized by category
   - URI: `colors://named`
   - Returns 147 colors in 11 categories

5. **Web-Safe Colors** - 216 web-safe colors
   - URI: `colors://web-safe`
   - Returns colors organized by hue groups

### Accessing Resources in Claude

```
Get the Material Design color palette
```

```
Show me all CSS named colors
```

## Development

### Project Structure

```
color-converter-mcp/
├── src/
│   ├── index.ts           # MCP server implementation
│   ├── colorConverter.ts  # Color conversion algorithms
│   ├── colorHarmony.ts    # Color harmony generation
│   ├── types.ts          # TypeScript type definitions
│   ├── namedColors.ts    # CSS named color definitions
│   ├── __tests__/        # Test files
│   │   ├── colorHarmony.test.ts   # Harmony generation tests
│   │   └── ...           # Other test files
│   └── resources/        # MCP resource data
│       ├── palettes.ts            # Material Design & Tailwind palettes
│       ├── webSafeColors.ts       # Web-safe color definitions
│       └── namedColorsCategories.ts # Categorized named colors
├── examples/
│   └── color-harmony-example.ts   # Harmony usage examples
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

The project includes comprehensive unit tests with excellent coverage:

```bash
npm test                    # Run tests in watch mode
npm test -- --run          # Run tests once
npm test -- --coverage     # Run with coverage report
```

**Test Coverage**: 
- Line Coverage: 99.65% ✅
- Function Coverage: 100% ✅
- Branch Coverage: 94.85% ✅
- Total Tests: 184 tests across 7 test files

Tests cover:
- All color conversion functions
- Format detection and parsing
- Extended hex formats with alpha
- Named color support
- MCP server functionality
- Resource handlers
- Error handling and edge cases

## License

MIT