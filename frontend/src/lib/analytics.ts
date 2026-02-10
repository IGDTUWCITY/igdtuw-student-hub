const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const isBrowser = typeof window !== "undefined";
const canTrack =
  isBrowser &&
  typeof GA_MEASUREMENT_ID === "string" &&
  GA_MEASUREMENT_ID.trim().length > 0;

let initialized = false;

function loadGtagScript(measurementId: string) {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src=\"https://www.googletagmanager.com/gtag/js?id=${measurementId}\"]`
  );

  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function initAnalytics() {
  if (!canTrack || initialized) return;

  const measurementId = GA_MEASUREMENT_ID!.trim();
  loadGtagScript(measurementId);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  initialized = true;
}

export function trackPageView(path: string) {
  if (!canTrack || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: document.title,
  });
}

export function analyticsEnabled() {
  return canTrack;
}
