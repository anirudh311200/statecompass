const CLERK_DATA_ATTR = "data-clerk-publishable-key";

let clerkPromise;

function getPublishableKey() {
  if (typeof document === "undefined") {
    return import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  }

  return (
    document.documentElement.getAttribute(CLERK_DATA_ATTR) ||
    import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ||
    ""
  );
}

function waitForClerkScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.Clerk) {
    return Promise.resolve(window.Clerk);
  }

  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.Clerk) {
        window.clearInterval(timer);
        resolve(window.Clerk);
        return;
      }

      if (Date.now() - started > 15000) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 50);
  });
}

export async function getClerk() {
  if (typeof window === "undefined") {
    return null;
  }

  const publishableKey = getPublishableKey();
  if (!publishableKey) {
    return null;
  }

  if (!clerkPromise) {
    clerkPromise = waitForClerkScript().then(async (Clerk) => {
      if (!Clerk) {
        return null;
      }

      if (!Clerk.loaded) {
        await Clerk.load({ publishableKey });
      }

      return Clerk;
    });
  }

  return clerkPromise;
}

export async function getClerkSessionToken() {
  const clerk = await getClerk();
  if (!clerk?.session) {
    return null;
  }

  try {
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

export async function getClerkAuthHeaders(extraHeaders = {}) {
  const token = await getClerkSessionToken();
  if (!token) {
    return { ...extraHeaders };
  }

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  };
}

export async function signOutClerk() {
  const clerk = await getClerk();
  if (!clerk?.session) {
    return;
  }

  await clerk.signOut();
}

export async function whenClerkReady(callback) {
  const clerk = await getClerk();
  if (!clerk) {
    callback(null, null);
    return;
  }

  callback(clerk, clerk.user ?? null);
  clerk.addListener((resources) => {
    callback(clerk, resources.user ?? null);
  });
}

export function mountClerkSignIn(element, options = {}) {
  return getClerk().then((clerk) => {
    if (!clerk || !element) {
      return null;
    }

    return clerk.mountSignIn(element, {
      signUpUrl: "/sign-up",
      fallbackRedirectUrl: options.fallbackRedirectUrl ?? "/me",
      signUpFallbackRedirectUrl: options.signUpFallbackRedirectUrl ?? "/me",
      ...options,
    });
  });
}

export function mountClerkSignUp(element, options = {}) {
  return getClerk().then((clerk) => {
    if (!clerk || !element) {
      return null;
    }

    return clerk.mountSignUp(element, {
      signInUrl: "/sign-in",
      fallbackRedirectUrl: options.fallbackRedirectUrl ?? "/me",
      signInFallbackRedirectUrl: options.signInFallbackRedirectUrl ?? "/me",
      ...options,
    });
  });
}

export function mountClerkUserButton(element, options = {}) {
  return getClerk().then((clerk) => {
    if (!clerk || !element) {
      return null;
    }

    return clerk.mountUserButton(element, {
      afterSignOutUrl: "/",
      userProfileUrl: "/me",
      ...options,
    });
  });
}
