# McFly Menu Screens

Three menu displays, one page each, video looping forever.
Plain static site — no build step, no dependencies, no framework.

## Live URLs

Once published (see below), each screen opens its own URL:

- `.../menu/1/` — screen 1
- `.../menu/2/` — screen 2
- `.../menu/3/` — `3.mp4` -> hold -> crossfade -> `4.mp4` -> repeat

Open each on its display and press F11 (or ctrl-cmd-F on a Mac) for fullscreen.

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000/menu/1/

## Layout

```
index.html            landing page, links to the three screens
menu/1/index.html     one page per screen; each just sets window.SCREEN
menu/2/index.html
menu/3/index.html
assets/menu.js        the player (playlists and timing live at the top)
assets/menu.css       styling
videos/screen-N/      the clips
.nojekyll             stops GitHub Pages running Jekyll over the files
```

The three screen pages are ten lines each and share one script, so there is
nothing to keep in sync.

## Tweaking

Top of `assets/menu.js`:

- `PLAYLISTS` — which clips play on which screen (add more, they chain in order)
- `GAP_MS` — hold on the last frame before the next clip (2500)
- `FADE_MS` — crossfade length (800)

Clips are 1920x1080, 5s each, letterboxed to fit any screen.
To crop instead of letterbox, change `object-fit` in `assets/menu.css`.
