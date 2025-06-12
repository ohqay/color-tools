# Color Converter MCP Server

A Model Context Protocol (MCP) server that provides color conversion capabilities between different color formats.

## Features

- Convert colors between multiple formats:
  - Hexadecimal (e.g., `#D4C7BA`, `#FFF`)
  - RGB (e.g., `rgb(212, 199, 186)`, `255, 0, 0`)
  - RGBA with alpha/transparency (e.g., `rgba(255, 0, 0, 0.5)`)
  - HSL (e.g., `hsl(30, 24%, 78%)`)
  - HSLA with alpha/transparency (e.g., `hsla(30, 24%, 78%, 0.8)`)
  - HSB/HSV (e.g., `hsb(30, 12%, 83%)`, `hsv(240, 100%, 100%)`)
  - CMYK (e.g., `cmyk(0%, 6%, 12%, 17%)`)
- Support for CSS named colors (140+ colors like `red`, `blue`, `coral`)
- Auto-detect input color format
- Support for multiple output formats in a single conversion
- Comprehensive error handling with detailed validation messages
- Includes `color-info` tool for server information and examples

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

## Tool Parameters

### convert-colour
- `input` (required): The color value to convert
- `from` (optional): Source format - if not specified, will auto-detect
- `to` (optional): Array of target formats - if not specified, converts to all formats

### color-info
No parameters required - returns server information and examples

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

## Supported Color Formats

### Input Formats

- **Hex**: `#RGB` or `#RRGGBB` (case-insensitive)
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

## Development

### Project Structure

```
color-converter-mcp/
├── src/
│   ├── index.ts           # MCP server implementation
│   ├── colorConverter.ts  # Color conversion algorithms
│   └── types.ts          # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

Currently, no tests are implemented. To add tests, update the `test` script in `package.json`.

## License

MIT