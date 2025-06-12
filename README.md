# Color Converter MCP Server

A Model Context Protocol (MCP) server that provides color conversion capabilities between different color formats.

## Features

- Convert colors between multiple formats:
  - Hexadecimal (e.g., `#D4C7BA`)
  - RGB (e.g., `rgb(212, 199, 186)`)
  - HSL (e.g., `hsl(30, 24%, 78%)`)
  - HSB/HSV (e.g., `hsb(30, 12%, 83%)`)
  - CMYK (e.g., `cmyk(0%, 6%, 12%, 17%)`)
- Auto-detect input color format
- Support for multiple output formats in a single conversion
- Comprehensive error handling with helpful error messages

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

### Using the Tool

Once configured, you can use the `convert-colour` tool in Claude:

```
Convert #D4C7BA to RGB format
```

```
Convert rgb(212, 199, 186) to all formats
```

```
Convert hsl(30, 24%, 78%) to hex and cmyk
```

## Tool Parameters

The `convert-colour` tool accepts the following parameters:

- `input` (required): The color value to convert
- `from` (optional): Source format - if not specified, will auto-detect
- `to` (optional): Array of target formats - if not specified, converts to all formats

### Example Request

```json
{
  "input": "#D4C7BA",
  "to": ["rgb", "hsl", "hsb", "cmyk"]
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
  "hsl": "hsl(30, 24%, 78%)",
  "hsb": "hsb(30, 12%, 83%)",
  "cmyk": "cmyk(0%, 6%, 12%, 17%)"
}
```

## Supported Color Formats

### Input Formats

- **Hex**: `#RGB` or `#RRGGBB` (case-insensitive)
- **RGB**: `rgb(r, g, b)` or `r, g, b` (values 0-255)
- **HSL**: `hsl(h, s%, l%)` (h: 0-360, s/l: 0-100)
- **HSB/HSV**: `hsb(h, s%, b%)` or `hsv(h, s%, v%)` (h: 0-360, s/b: 0-100)
- **CMYK**: `cmyk(c%, m%, y%, k%)` (all values 0-100)

### Notes

- HSB and HSV are treated as identical (they are the same color model)
- CMYK conversion is simplified and not color-profile accurate
- Auto-detection works for most common color format variations

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