// Plays one screen's clips on an endless loop.
// Each page sets window.SCREEN before loading this file.
(function () {
  "use strict";

  // Which clips play on which screen. Paths are relative to a /menu/N/ page.
  var PLAYLISTS = {
    1: ["../../videos/screen-1/1.mp4"],
    2: ["../../videos/screen-2/2.mp4"],
    3: ["../../videos/screen-3/3.mp4", "../../videos/screen-3/4.mp4"]
  };

  // Timing between clips on multi-clip screens.
  var GAP_MS  = 2500; // hold on the last frame before switching
  var FADE_MS = 800;  // crossfade length

  var playlist = PLAYLISTS[window.SCREEN];
  if (!playlist) throw new Error("unknown screen: " + window.SCREEN);

  var stage = document.getElementById("stage");
  var tap = document.getElementById("tap");
  document.documentElement.style.setProperty("--fade", FADE_MS + "ms");

  // One <video> per clip, all preloaded up front. Nothing loads at swap time,
  // so there is no race that can strand the sequence mid-loop.
  var els = playlist.map(function (src) {
    var v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.loop = playlist.length === 1; // a lone clip just loops itself
    stage.appendChild(v);
    v.load();
    return v;
  });

  var index = 0;
  var timer = null;

  els[0].classList.add("active");
  play(els[0]);

  if (playlist.length > 1) {
    els.forEach(function (v, i) {
      v.addEventListener("ended", function () {
        if (i === index) schedule();
      });
      // Safety net: if "ended" never arrives (stall, codec hiccup), move on anyway.
      v.addEventListener("timeupdate", function () {
        if (i === index && v.duration && v.currentTime >= v.duration - 0.05) schedule();
      });
    });
  }

  function schedule() {
    if (timer) return; // already queued for this clip
    timer = setTimeout(next, GAP_MS);
  }

  function next() {
    timer = null;
    var outgoing = els[index];
    index = (index + 1) % els.length;
    var incoming = els[index];

    incoming.currentTime = 0;
    play(incoming);
    incoming.classList.add("active");
    outgoing.classList.remove("active");

    // Reset the outgoing clip once it has faded out, ready for its next turn.
    setTimeout(function () {
      outgoing.pause();
      outgoing.currentTime = 0;
    }, FADE_MS);
  }

  function play(el) {
    var p = el.play();
    if (p && p.catch) {
      p.catch(function (err) {
        console.warn("[menu] autoplay blocked:", err && err.message);
        tap.style.display = "flex";
      });
    }
  }

  tap.addEventListener("click", function () {
    tap.style.display = "none";
    els.forEach(function (el) {
      if (el.classList.contains("active")) el.play();
    });
  });

  // Digital signage: keep the display awake where the browser supports it.
  if ("wakeLock" in navigator) {
    var lock = null;
    var acquire = function () {
      navigator.wakeLock.request("screen").then(function (l) { lock = l; }, function () {});
    };
    acquire();
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && !lock) acquire();
    });
  }
})();
