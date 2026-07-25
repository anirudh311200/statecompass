/** iPhone-only UX helpers — no-op on desktop. */

function isIphoneSafari() {
  return CSS.supports("-webkit-touch-callout", "none");
}

function isPhoneViewport() {
  return window.matchMedia("(max-width: 480px)").matches;
}

function centerActiveNavLink() {
  if (!isIphoneSafari() || !isPhoneViewport()) {
    return;
  }

  const nav = document.querySelector(".site-nav");
  const active = nav?.querySelector(".nav-link.is-active");
  if (!nav || !active) {
    return;
  }

  requestAnimationFrame(() => {
    active.scrollIntoView({ inline: "center", block: "nearest" });
  });
}

function init() {
  centerActiveNavLink();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}
