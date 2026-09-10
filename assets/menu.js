// Plays one screen's video on an endless loop.
// Each page sets window.SCREEN before loading this file.
//
// Deliberately ONE <video> element per page. TV browsers (Tizen, WebOS,
// Android TV, HDMI sticks) typically have a single hardware video decoder;
// a second <video> on the page exhausts it and the screen stays black.
// Screens that show more than one menu use a single pre-rendered clip with
// the sequence and fades baked in (see videos/screen-3/menu-3.mp4).
(function () {
  "use strict";

  var SOURCES = {
    1: "../../videos/screen-1/1.mp4",
    2: "../../videos/screen-2/2.mp4",
    3: "../../videos/screen-3/3.mp4"
  };

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

  play();

  function play() {
    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        console.warn("[menu] autoplay blocked:", err && err.message);
        tap.style.display = "flex";
      });
    }
  }

  tap.addEventListener("click", function () {
    tap.style.display = "none";
    play();
  });

  // Some TV browsers drop out of loop after a stall; nudge playback back.
  video.addEventListener("ended", function () {
    video.currentTime = 0;
    play();
  });
  video.addEventListener("error", function () {
    console.error("[menu] video error", video.error && video.error.code);
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
