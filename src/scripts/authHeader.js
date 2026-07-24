import {
  whenClerkReady,
  mountClerkUserButton,
} from "./clerkClient.js";

function renderSignedOut(container) {
  container.innerHTML = `
    <div class="auth-controls auth-controls--signed-out">
      <a href="/sign-in" class="btn btn-ghost btn-sm auth-controls-link">Sign in</a>
      <a href="/sign-up" class="btn btn-secondary btn-sm auth-controls-link">Sign up</a>
    </div>
  `;
}

function renderSignedIn(container) {
  container.innerHTML = `<div class="auth-controls auth-controls--signed-in"><span data-clerk-user-button></span></div>`;
  const mountPoint = container.querySelector("[data-clerk-user-button]");
  mountClerkUserButton(mountPoint);
}

export function initAuthHeader() {
  const container = document.querySelector("[data-auth-controls]");
  if (!container) {
    return;
  }

  whenClerkReady((_clerk, user) => {
    if (user) {
      renderSignedIn(container);
    } else {
      renderSignedOut(container);
    }
  });
}

if (document.querySelector("[data-auth-controls]")) {
  initAuthHeader();
}
