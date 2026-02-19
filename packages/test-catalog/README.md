# Test Catalog

Catalog ID: `test-catalog`

## Structure

```
skills/          # OpenCode skills
mcp/             # MCP server configurations
meta/
  catalog.json   # Catalog metadata
  schema.json    # Schema reference
```

## Usage

```bash
# Add a skill
npx @bre/ai-setup catalog skill add my-skill

# Validate catalog
npx @bre/ai-setup catalog validate

# Build catalog
npx @bre/ai-setup catalog build
```
