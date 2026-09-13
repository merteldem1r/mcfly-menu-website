// Plays one screen's video on an endless loop.
// Each page sets window.SCREEN before loading this file.
//
// Deliberately ONE <video> element per page. TV browsers (Tizen, WebOS,
// Android TV, HDMI sticks) typically have a single hardware video decoder;
// a second <video> on the page exhausts it and the screen stays black.
// Screens that show more than one menu use a single pre-rendered clip with
// the sequence and fades baked in.
//
// Clips must stay 1920x1080, H.264 level 4.1: TV browsers choke on 4K and
// drop playback every so often.
//
// Nobody is around to tap a wall-mounted TV, so playback heals itself:
// errors and stalls are retried silently, and the "tap to start" overlay is
// only shown when the browser genuinely blocks autoplay.
(function () {
  "use strict";

  var SOURCES = {
    1: "../../videos/screen-1/1.mp4",
    2: "../../videos/screen-2/2.mp4",
    3: "../../videos/screen-3/3.mp4"
  };

  var WATCHDOG_MS = 5000;     // how often to check the video is still moving
  var RELOAD_SOURCE_AFTER = 2; // failed checks before re-fetching the clip
  var RELOAD_PAGE_AFTER = 6;   // failed checks before reloading the whole page

  var src = SOURCES[window.SCREEN];
  if (!src) throw new Error("unknown screen: " + window.SCREEN);

  var stage = document.getElementById("stage");
  var tap = document.getElementById("tap");

  var video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.loop = true;
  video.preload = "auto";
  stage.appendChild(video);

  var blocked = false;   // autoplay refused; waiting for a tap
  var failures = 0;      // consecutive watchdog checks with no progress
  var lastTime = -1;

  play();

  function play() {
    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        if (err && err.name === "NotAllowedError") {
          console.warn("[menu] autoplay blocked:", err.message);
          blocked = true;
          tap.style.display = "flex";
        } else {
          // AbortError, decode/network hiccups: the watchdog retries.
          console.warn("[menu] play failed:", err && err.name, err && err.message);
        }
      });
    }
  }

  function reloadSource() {
    console.warn("[menu] reloading video source");
    video.src = src;
    video.load();
    play();
  }

  function reloadPage() {
    // Never reload while offline: the TV would be left on a browser error page.
    if (navigator.onLine === false) return reloadSource();
    if (!window.fetch) return location.reload();
    fetch(src, { method: "HEAD", cache: "no-store" }).then(function (r) {
      if (r.ok) location.reload(); else reloadSource();
    }, reloadSource);
  }

  tap.addEventListener("click", function () {
    blocked = false;
    tap.style.display = "none";
    play();
  });

  video.addEventListener("playing", function () {
    blocked = false;
    failures = 0;
    tap.style.display = "none";
  });

  // Some TV browsers drop out of loop after a stall; nudge playback back.
  video.addEventListener("ended", function () {
    video.currentTime = 0;
    play();
  });
  video.addEventListener("error", function () {
    console.error("[menu] video error", video.error && video.error.code);
    setTimeout(reloadSource, 2000);
  });

  setInterval(function () {
    if (blocked || document.visibilityState === "hidden") return;

    var t = video.currentTime;
    var stuck = video.paused || video.ended || t === lastTime;
    lastTime = t;
    if (!stuck) {
      failures = 0;
      return;
    }

    failures++;
    console.warn("[menu] playback stuck, check", failures);
    if (failures >= RELOAD_PAGE_AFTER) {
      failures = 0;
      reloadPage();
    } else if (failures >= RELOAD_SOURCE_AFTER) {
      reloadSource();
    } else {
      play();
    }
  }, WATCHDOG_MS);

  // Digital signage: keep the display awake where the browser supports it.
  if ("wakeLock" in navigator) {
    var lock = null;
    var acquire = function () {
      navigator.wakeLock.request("screen").then(function (l) {
        lock = l;
        l.addEventListener("release", function () { lock = null; });
      }, function () {});
    };
    acquire();
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && !lock) acquire();
    });
  }
})();
