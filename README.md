# dividir
dividir.cash aplicacion para dividir gastos

## Dev login

Set `VITE_DEV_LOGIN_ENABLED=true` in `.env.local` to expose the one-click dev login.
The backend credentials provider only accepts it in non-production Convex runtime, so
it stays dev-only even without an extra backend env flag.

## PDF utility

Remove page background color from a PDF:

```bash
npm run pdf:remove-background -- "/path/to/input.pdf" --output "/path/to/output.pdf"
```

Useful flags:

- `--threshold 50` for more aggressive background cleanup
- `--background "#f2f0ef"` to force the background color instead of auto-detecting it
- `--transparent` to make the removed background transparent instead of white

The script rasterizes each page, cleans the background, and rebuilds the PDF. If you need
searchable/selectable text to stay intact, this is the wrong approach.
