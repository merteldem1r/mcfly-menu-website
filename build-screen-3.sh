#!/usr/bin/env sh
# Screen 3 shows two menus. TV browsers only reliably decode one video at a
# time, so instead of switching files at runtime we bake both menus into a
# single looping clip.
#
# The panels must never go dark, so there is no fade to black anywhere: the
# menus crossfade directly into each other, and the clip ends on a crossfade
# back to menu A's opening frame. Because the last frame equals the first
# frame, the browser's native loop is invisible.
#
#   menu A | hold | >< | menu B | hold | >< back to A's first frame | (loop)
set -e

HOLD=2.5   # seconds each menu stays on screen after its animation ends
FADE=0.8   # crossfade length between menus

IN_A=videos/screen-3/3.mp4
IN_B=videos/screen-3/4.mp4
OUT=videos/screen-3/menu-3.mp4
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Each menu, followed by its last frame held for HOLD seconds.
for f in "$IN_A" "$IN_B"; do
  ffmpeg -v error -i "$f" \
    -vf "tpad=stop_mode=clone:stop_duration=$HOLD,format=yuv420p,fps=30" \
    -c:v libx264 -preset slow -crf 20 -an "$TMP/$(basename "$f")" -y
done

SEG=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/$(basename "$IN_A")")

# Menu A's opening frame, held just long enough to crossfade back onto it.
ffmpeg -v error -i "$IN_A" -frames:v 1 "$TMP/first.png" -y
ffmpeg -v error -loop 1 -t "$FADE" -i "$TMP/first.png" \
  -vf "format=yuv420p,fps=30" -c:v libx264 -preset slow -crf 20 "$TMP/tail.mp4" -y

# Crossfade A into B, then the result back onto A's opening frame.
OFF1=$(echo "$SEG $FADE" | awk '{printf "%.3f", $1 - $2}')
OFF2=$(echo "$SEG $FADE" | awk '{printf "%.3f", $1 * 2 - $2 * 2}')

ffmpeg -v error \
  -i "$TMP/$(basename "$IN_A")" -i "$TMP/$(basename "$IN_B")" -i "$TMP/tail.mp4" \
  -filter_complex "[0][1]xfade=transition=fade:duration=$FADE:offset=$OFF1[x];\
[x][2]xfade=transition=fade:duration=$FADE:offset=$OFF2,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 20 -movflags +faststart -an "$OUT" -y

echo "built $OUT -> $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s"
