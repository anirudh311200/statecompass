import { whenClerkReady, signOutClerk } from "./clerkClient.js";

function renderSignedOut(container) {
  container.innerHTML = `
    <div class="auth-controls auth-controls--signed-out">
      <a href="/sign-in" class="auth-link">Sign in</a>
      <a href="/sign-up" class="auth-link auth-link--cta">Sign up</a>
    </div>
  `;
}

function renderSignedIn(container) {
  container.innerHTML = `
    <div class="auth-controls auth-controls--signed-in">
      <a href="/me" class="auth-link">Profile</a>
      <button type="button" class="auth-link auth-link--button" data-auth-sign-out>Sign out</button>
    </div>
  `;

  container.querySelector("[data-auth-sign-out]")?.addEventListener("click", () => {
    void signOutClerk();
  });
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
