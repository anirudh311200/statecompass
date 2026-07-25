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

const CLERK_APPEARANCE = {
  variables: {
    colorBackground: "#0a0a0a",
    colorText: "#fafafa",
    colorTextSecondary: "#888888",
    colorInputBackground: "#111111",
    colorInputText: "#fafafa",
    colorPrimary: "#fafafa",
    colorPrimaryText: "#000000",
    colorDanger: "#f87171",
    colorSuccess: "#4ade80",
    colorNeutral: "#fafafa",
    colorShimmer: "#1a1a1a",
    borderRadius: "10px",
    fontFamily: '"Sora", system-ui, sans-serif',
    fontSize: "0.85rem",
  },
  elements: {
    rootBox: {
      width: "100%",
      boxShadow: "none",
    },
    cardBox: {
      width: "100%",
      boxShadow: "none",
    },
    card: {
      backgroundColor: "transparent",
      boxShadow: "none",
      border: "none",
      padding: "0",
      gap: "1rem",
    },
    header: {
      display: "none",
    },
    headerTitle: {
      display: "none",
    },
    headerSubtitle: {
      display: "none",
    },
    footer: {
      display: "none",
    },
    footerAction: {
      display: "none",
    },
    footerActionLink: {
      display: "none",
    },
    dividerLine: {
      backgroundColor: "#1a1a1a",
    },
    dividerText: {
      color: "#888888",
    },
    formFieldLabel: {
      color: "#888888",
    },
    formFieldInput: {
      backgroundColor: "#111111",
      borderColor: "#1a1a1a",
      color: "#fafafa",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      borderRadius: "8px",
    },
    formFieldInputWrapper: {
      width: "100%",
      maxWidth: "100%",
    },
    formFieldRow: {
      width: "100%",
      maxWidth: "100%",
    },
    form: {
      width: "100%",
      maxWidth: "100%",
    },
    main: {
      width: "100%",
      maxWidth: "100%",
    },
    formFieldInputShowPasswordButton: {
      color: "#888888",
    },
    formButtonPrimary: {
      backgroundColor: "#fafafa",
      color: "#000000",
      fontWeight: "600",
      "&:hover": {
        backgroundColor: "#e5e5e5",
      },
    },
    socialButtonsBlockButton: {
      backgroundColor: "#111111",
      borderColor: "#1a1a1a",
      color: "#fafafa",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderColor: "#525252",
      },
    },
    identityPreview: {
      backgroundColor: "#111111",
      borderColor: "#1a1a1a",
    },
    identityPreviewText: {
      color: "#fafafa",
    },
    formFieldAction: {
      color: "#fafafa",
    },
    alertText: {
      color: "#fafafa",
    },
  },
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    showOptionalFields: false,
  },
  options: {
    showOptionalFields: false,
  },
};

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
      appearance: CLERK_APPEARANCE,
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
      appearance: CLERK_APPEARANCE,
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
