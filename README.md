[![Netlify Status](https://api.netlify.com/api/v1/badges/2d459d5a-509d-49dc-85c1-d0168afd8465/deploy-status)](https://app.netlify.com/sites/peaceful-brahmagupta-4fa075/deploys)

# Nowify

A simple app to display your currently playing Spotify track on a Raspberry Pi, made with Vue.

Nowify will:

- ✅ - Use Spotify Web API to get your current track
- ✅ - Only access that and no other data
- ✅ - Use Access and Refresh Tokens to ensure that you're kept logged in between sessions
- ✅ - Display the current track artist, cover, and a matching vibrant background colour

Nowify needs a webserver to run. The quickest way to get up and running is to use a Jamstack platform like Netlify or GitHub Pages.

- Fork this repository
- Connect your repo to your Jamstack platform
- Add your Spotify Client ID and Client Secret to the platforms environment variables
- Deploy!

### Cloudflare Workers (this repo)

This project uses the Nitro `cloudflare_module` preset (`yarn deploy:cloudflare`). The `NUXT_SESSION_SECRET` used to encrypt cookies is **not** taken from the machine that runs `nuxt build` in CI — it must be set on the **Worker** in Cloudflare so it is stable across deploys:

1. **Set `NUXT_SPOTIFY_CLIENT_SECRET`** in the Cloudflare dashboard (or your CI) if you build with that env var, **and** set **`NUXT_PUBLIC_SPOTIFY_CLIENT_ID`** the same way.
2. **Set `NUXT_SESSION_SECRET` once** as a Worker secret: Cloudflare dashboard → Workers & Pages → your Worker → Settings → Variables and Secrets → Secrets → add `NUXT_SESSION_SECRET`, **or** run `yarn cf:secret:session` after `nuxt build` (interactive).
3. Use **one** long random value; do **not** generate a new secret on every deploy.

If you only set `NUXT_SESSION_SECRET` in GitHub Actions for the build step but never add it as a Cloudflare Worker secret, the deployed Worker will not see it (or it may change each time you try to wire it differently), and sessions will not persist.

---

# How to use

**Prerequisites:**
You will need:

- A GitHub account
- A [Netlify](https://netlify.com) account
- Spotify Client Keys
- A device to display Nowify

### 1. Fork this repository

On this page, click on the 'Fork' button in the top-right to create a copy of the repo as-is on your account. Alternatively, you can clone the repo and push to GitHub.

### 2. Create a new project on Netlify

Log in to Netlify and click 'New site from Git'.

If you're doing this for the first time, you will need to authorise your GitHub account with Netlify by following the instructions.

Once authorised, follow the on-screen instructions to connect your repository. You should be fine to leave the default settings here as-is.

Click on 'Deploy site'.

_Note: Nowify should use Node 14. This has been set in the project environment. I've only ever attempted this Netlify, so cannot help you if you use another platform._

### 3. Create Spotify Client keys.

To allow authorisation to your track data, you'll need to generate Spotify API keys. You can do this by logging in to the [Spotify Dashboard](https://developer.spotify.com/dashboard/applications) creating an app.

Call the application 'Nowify'.

Set the _Redirect URI_ as the URL of your project in Netlify. This must be set else Spotify won't authorise Nowify.

**Important:** The _Redirect URI_ entered in this field must match the URL of your Netlify site exactly, or you'll receive authorisation errors. A common issue is that Spotify will automatically add a trailing slash to the URL upon saving. For example: `https://example.netlify.com` vs `https://example.netlify.com/`.

You can leave the other settings (Callback URL, Bundle IDs etc) blank.

Copy down the Client Secret and Client ID and save your app in the Spotify Dashboard.

### 4. Add the Client ID and Client Secret to Netlify

Now that we have our Spotify API keys, we must let Nowify know that they exist.

To do this, navigate to Netlify > Site Settings > Build & Deploy > Environment

Under _Environment variables_, add two fields. The _Keys_ can be found in the `env.sample` file and the values will be the _Client ID_ and _Client Secret_, respectively.

Hit save.

### 5. View Nowify

Once the environment variables are in, you will have to navigate to your Netlify site overview > Deploys > Trigger Deploy drop-down > click 'Clear cache and deploy site' and wait for deployment to complete. You can now navigate to your Netlify site. You'll be prompted with a Spotify login button. Do that, and you're good to go!

---

Alternatively, you can clone the repo, compile the code offline, and upload to your own webserver (more advanced users only). If you're considering doing this, I'll assume that you somewhat know you're way around build tools.

---

### Original Write up:

[https://ashcroft.dev/blog/now-playing-screen-spotify-raspberry-pi-es6/](https://ashcroft.dev/blog/now-playing-screen-spotify-raspberry-pi-es6/)

### Brief About:

Nowify was a project that I originally made in 2017 when I wanted to learn more modern Javascript. Over the years, I've learned a lot more and had people contact me about Nowify, so I wanted to build a more modern version of it using modern tools. This is still a learning exercise, but hopefully one that's more usable. If you'd like to view the old repository, that can be found on the `old` branch.
