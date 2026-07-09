"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

// Cloudflare Turnstile site key (public). NEXT_PUBLIC_* values are inlined at
// BUILD time, so adding it in Vercel requires a redeploy to take effect.
// When unset, the widget renders nothing and auth flows work without captcha —
// flip captcha on by setting this AND enabling Turnstile in Supabase → Auth.
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const captchaEnabled = Boolean(TURNSTILE_SITE_KEY);

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileRenderOptions) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Clears the current token and re-runs the challenge (tokens are single-use). */
  reset: () => void;
}

interface TurnstileProps {
  /** Fired with a fresh token once the visitor passes the challenge. */
  onVerify: (token: string) => void;
  /** Fired when the token expires (~5 min) — clear your stored token here. */
  onExpire?: () => void;
  /** Fired if the widget errors. */
  onError?: () => void;
  className?: string;
}

/**
 * Cloudflare Turnstile widget for Supabase Auth. Renders nothing (and reports
 * no token) when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so callers can stay
 * captcha-agnostic. Pass the resulting token as `options.captchaToken` to the
 * Supabase auth call.
 */
export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify, onExpire, onError, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);

    // Keep the latest callbacks without re-running the render effect.
    const cb = useRef({ onVerify, onExpire, onError });
    cb.current = { onVerify, onExpire, onError };

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetId.current && window.turnstile) {
          window.turnstile.reset(widgetId.current);
        }
      },
    }));

    useEffect(() => {
      if (!TURNSTILE_SITE_KEY) return;
      let cancelled = false;
      loadTurnstileScript()
        .then(() => {
          if (
            cancelled ||
            !containerRef.current ||
            !window.turnstile ||
            widgetId.current // guard against double-render (Strict Mode)
          ) {
            return;
          }
          widgetId.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "dark",
            callback: (token) => cb.current.onVerify(token),
            "expired-callback": () => cb.current.onExpire?.(),
            "error-callback": () => cb.current.onError?.(),
          });
        })
        .catch(() => cb.current.onError?.());
      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetId.current);
          } catch {
            // widget already gone — ignore
          }
          widgetId.current = null;
        }
      };
    }, []);

    if (!TURNSTILE_SITE_KEY) return null;
    // min-h reserves the widget's rendered box (Cloudflare's normal size is
    // 300x65) so the buttons below don't jump down when the iframe mounts.
    return (
      <div
        ref={containerRef}
        className={`min-h-[65px]${className ? ` ${className}` : ""}`}
      />
    );
  }
);
