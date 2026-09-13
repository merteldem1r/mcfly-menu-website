# McFly Menu Screens

Three menu displays, one page each, video looping forever.
Plain static site — no build step, no dependencies, no framework.

## Live URLs

Once published (see below), each screen opens its own URL:

- `.../menu/1/` — screen 1
- `.../menu/2/` — screen 2
- `.../menu/3/` — both menus in one clip, fading between them, looping

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
videos/screen-N/      the clips (screen 3 plays the pre-rendered menu-3.mp4)
.nojekyll             stops GitHub Pages running Jekyll over the files
```

The three screen pages are ten lines each and share one script, so there is
nothing to keep in sync.

## One video element per page — do not add a second

TV browsers (Tizen, WebOS, Android TV, HDMI sticks) generally have a single
hardware video decoder. A page holding two `<video>` elements exhausts it and
the screen stays black, even though the same page is fine in desktop Chrome.

Screen 3 therefore does NOT switch between two files at runtime. Its two menus
are baked into one clip, `videos/screen-3/menu-3.mp4`, which the browser loops
natively — exactly like screens 1 and 2.

### Rebuilding screen 3

After editing `3.mp4` or `4.mp4`, regenerate the combined clip:

```
./build-screen-3.sh
```

Timing lives at the top of that script (`HOLD`, the pause on each menu, and
`FADE`, the fade to black between them).

## Encoding new videos — keep them 1080p

TV browsers drop 4K H.264 playback every so often (the screen falls back to
"Tap to start the menu"). Before committing a new clip, encode it with:

```
ffmpeg -i in.mp4 -vf "scale=1920:1080,fps=30,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.1 -crf 20 -movflags +faststart -an out.mp4
```

The player also heals itself: stalls and errors are retried, then the clip is
re-fetched, then (if online) the page reloads. The tap overlay only appears
when the browser truly blocks autoplay.

## Tweaking

- `SOURCES` at the top of `assets/menu.js` maps each screen to its video.
- Clips are 1920x1080, letterboxed to fit any screen. To crop instead, change
  `object-fit` in `assets/menu.css`.
