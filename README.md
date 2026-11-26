# Ghosts of the Steppe

A haunted night museum in the browser about the vanishing animals of Kazakhstan.
Üki, a small ice-blue owl, guides you through the halls. Each animal appears in
one of three states: a grey stone statue (forgotten), an amber particle ghost
(remembered) or a warm solid light (saved). Every fact shown has a source link.

Built with Vite, React, TypeScript, React Three Fiber, drei and postprocessing.
The site works with sound off: subtitles are always on, in English and Russian.

## Run

```bash
npm install
npm run dev      # then open the URL Vite prints, usually http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm test`.

## Folder structure

| Path | Contents |
|---|---|
| `src/opening` | Night-steppe opening |
| `src/guide` | Guide Üki |
| `src/scene` | Museum hall, display cases, camera |
| `src/sky` | Sky and stars |
| `src/ui` | Interface and subtitles |
| `src/room` | Snow leopard decision room and its decision logic |
| `src/content` | Animals, facts, sources and texts (`en` and `ru`) |
| `src/theme`, `src/config` | Shared palette and quality settings |
| `public/models` | `.glb` models (Draco, max 3 MB each) |
| `tests` | Tests for content and logic |
| `.kiro` | Steering rules and agent hooks |

## How Kiro was used

- **Steering** in [`.kiro/steering`](.kiro/steering): rules for facts and sources, look and tone, and 3D performance and assets.
- **Specs**: features were planned as requirements, design and tasks before coding.
- **Hooks** in [`.kiro/hooks`](.kiro/hooks): saving `animals.json` checks every source and fund URL. Adding a file to `public/models` reminds me to update `CREDITS.md`.
- Sessions are noted in [`KIRO_LOG.md`](KIRO_LOG.md).

## Credits

All models, fonts and sounds are listed with author and license in [CREDITS.md](CREDITS.md).

## License

MIT © Madina. See [LICENSE](LICENSE).
