// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Nowify",
      htmlAttrs: { lang: "en" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.gstatic.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;900&display=swap",
        },
      ],
    },
  },
  runtimeConfig: {
    /** Public: appears in the Spotify authorize URL anyway. */
    public: {
      spotifyClientId: "",
    },
    /** Server-only — never exposed to the browser bundle. Set via NUXT_SPOTIFY_CLIENT_SECRET */
    spotifyClientSecret: "",
    /**
     * Server-only — encrypts the HttpOnly session cookie (use a long random string).
     * On Cloudflare Workers, set NUXT_SESSION_SECRET as a Worker secret (Dashboard or
     * `wrangler secret put`); it is not read from the build environment unless you
     * also configure it in Cloudflare.
     */
    sessionSecret: "",
  },
  typescript: {
    strict: true,
  },
  compatibilityDate: "2025-03-01",
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
  },
  nitro: {
    preset: "cloudflare_module",
    /** Required for Workers static assets + node compatibility (Buffer, crypto, etc.). */
    compatibilityDate: "2025-03-01",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: "nowify",
        keep_vars: true,
        /** Prefer Custom Domains over zone routes — Cloudflare provisions DNS + TLS for the hostname. */
        routes: [
          {
            pattern: "now-playing.reetikpatel.me",
            custom_domain: true,
          },
        ],
      },
    },
  },
});
