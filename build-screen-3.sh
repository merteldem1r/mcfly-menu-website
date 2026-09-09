#!/usr/bin/env sh
# Screen 3 shows two menus. TV browsers only reliably decode one video at a
# time, so instead of switching files at runtime we bake both menus into a
# single looping clip: menu A, pause, fade to black, menu B, pause, fade out.
# The clip starts and ends on black, so the browser's native loop is seamless.
set -e

HOLD=2.5   # seconds each menu stays on screen after its animation ends
FADE=0.5   # fade-to-black length

IN_A=videos/screen-3/3.mp4
IN_B=videos/screen-3/4.mp4
OUT=videos/screen-3/menu-3.mp4
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for f in "$IN_A" "$IN_B"; do
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  seg_end=$(echo "$dur $HOLD $FADE" | awk '{printf "%.3f", $1 + $2 - $3}')
  ffmpeg -v error -i "$f" \
    -vf "tpad=stop_mode=clone:stop_duration=$HOLD,fade=t=in:st=0:d=$FADE,fade=t=out:st=$seg_end:d=$FADE,format=yuv420p" \
    -c:v libx264 -preset slow -crf 20 -r 30 -an "$TMP/$(basename "$f")" -y
done

printf "file '%s'\nfile '%s'\n" "$TMP/$(basename "$IN_A")" "$TMP/$(basename "$IN_B")" > "$TMP/list.txt"
ffmpeg -v error -f concat -safe 0 -i "$TMP/list.txt" -c copy -movflags +faststart "$OUT" -y

echo "built $OUT -> $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s"
