(() => {
  "use strict";

  if (window.__upcDirectSeekInstalled) return;
  window.__upcDirectSeekInstalled = true;

  const SEEK_SMALL_SECONDS = 30;
  const SEEK_LARGE_SECONDS = 120;
  let toastTimer;

  function mediaElements() {
    return [...document.querySelectorAll("video, audio")].filter(
      (media) => media.readyState > 0
    );
  }

  function activeMedia() {
    const media = mediaElements();
    return (
      media.find((item) => !item.paused && !item.ended) ||
      media.sort((a, b) => (b.duration || 0) - (a.duration || 0))[0] ||
      null
    );
  }

  function bounds(media) {
    let start = 0;
    let end = Number.isFinite(media.duration) ? media.duration : Infinity;

    if (media.seekable?.length) {
      start = media.seekable.start(0);
      end = media.seekable.end(media.seekable.length - 1);
    }

    return { start, end };
  }

  function formatTime(seconds) {
    const value = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    return hours
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      : `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function showToast(message, error = false) {
    let toast = document.getElementById("upc-direct-seek-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "upc-direct-seek-toast";
      Object.assign(toast.style, {
        position: "fixed",
        left: "50%",
        bottom: "12%",
        transform: "translateX(-50%)",
        zIndex: "2147483647",
        padding: "10px 16px",
        borderRadius: "8px",
        color: "white",
        font: "600 15px system-ui, sans-serif",
        pointerEvents: "none",
        boxShadow: "0 4px 18px rgba(0, 0, 0, .4)",
        transition: "opacity 150ms ease"
      });
      (document.body || document.documentElement).appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background = error ? "rgba(150, 25, 25, .92)" : "rgba(15, 15, 15, .88)";
    toast.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 1200);
  }

  function createSeekButton(label, seconds, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    Object.assign(button.style, {
      minWidth: "58px",
      height: "42px",
      padding: "0 12px",
      border: "1px solid rgba(255, 255, 255, .35)",
      borderRadius: "21px",
      background: "rgba(16, 16, 18, .88)",
      color: "white",
      font: "700 14px system-ui, sans-serif",
      cursor: "pointer",
      boxShadow: "0 3px 14px rgba(0, 0, 0, .45)"
    });
    button.addEventListener("mouseenter", () => {
      button.style.background = "rgb(35, 154, 152)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "rgba(16, 16, 18, .88)";
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      seekBy(seconds);
      button.blur();
    });
    return button;
  }

  function installSeekControls() {
    if (!document.body || document.getElementById("upc-direct-seek-controls")) return;

    const controls = document.createElement("div");
    controls.id = "upc-direct-seek-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Direct seek controls");
    Object.assign(controls.style, {
      position: "fixed",
      right: "24px",
      bottom: "92px",
      zIndex: "2147483646",
      display: "none",
      gap: "8px",
      alignItems: "center",
      pointerEvents: "auto"
    });
    controls.append(
      createSeekButton("+30s", SEEK_SMALL_SECONDS, "Seek forward 30 seconds"),
      createSeekButton("+2m", SEEK_LARGE_SECONDS, "Seek forward 2 minutes")
    );
    document.body.appendChild(controls);

    const updateControls = () => {
      const mediaAvailable = mediaElements().length > 0;
      controls.style.display = mediaAvailable ? "flex" : "none";

      const fullscreenContainer = document.fullscreenElement;
      const target =
        fullscreenContainer && fullscreenContainer.tagName !== "VIDEO"
          ? fullscreenContainer
          : document.body;
      if (target && controls.parentElement !== target) target.appendChild(controls);
    };

    document.addEventListener("fullscreenchange", updateControls);
    window.setInterval(updateControls, 750);
    updateControls();
  }

  function seekBy(seconds) {
    const media = activeMedia();
    if (!media) {
      showToast("UPC seek: no active player", true);
      return false;
    }

    const { start, end } = bounds(media);
    const target = Math.min(end - 0.05, Math.max(start, media.currentTime + seconds));

    try {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLMediaElement.prototype,
        "currentTime"
      )?.set;
      if (setter) setter.call(media, target);
      else media.currentTime = target;
      showToast(`${seconds > 0 ? "+" : ""}${seconds}s  ·  ${formatTime(target)}`);
      return true;
    } catch (error) {
      console.warn("[UPC Direct Seek] Seek failed", error);
      showToast("UPC seek failed", true);
      return false;
    }
  }

  window.upcSeek = seekBy;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installSeekControls, { once: true });
  } else {
    installSeekControls();
  }

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      let seconds = 0;
      if (event.code === "ArrowRight") {
        seconds = event.shiftKey ? SEEK_LARGE_SECONDS : SEEK_SMALL_SECONDS;
      } else if (event.code === "ArrowLeft") {
        seconds = event.shiftKey ? -SEEK_LARGE_SECONDS : -SEEK_SMALL_SECONDS;
      } else {
        return;
      }

      if (seekBy(seconds)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  console.info(
    "[UPC Direct Seek] Installed. Arrow keys seek ±30s; Shift+Arrow seeks ±120s."
  );
})();
