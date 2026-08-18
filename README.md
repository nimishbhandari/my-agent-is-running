# my-agent-is-running

A tiny, slightly silly website with one job: keep your laptop screen awake while your coding agent grinds away, and put up a "please don't touch this" sign while you're gone.

That's it. That's the whole app. Built for fun, not for scale.

## The problem it solves

Your laptop sleeps the screen after 5 minutes. Your coding agent does not finish in 5 minutes. You go to lunch, come back, and the screen's asleep — or worse, someone "helpfully" closed the lid.

Open this page, hit the button, walk away. Screen stays on, and it politely tells anyone walking by what's going on.

## Features

- **Real screen-wake, not a hack.** Uses the browser's native [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — near-zero CPU, no looping video, no tricks, on the common path.
- **Automatic fallback.** If your browser doesn't support Wake Lock, it quietly falls back to a hidden looping video (generated on the fly, no extra assets) so it still works.
- **Fully editable text.** Title (two lines), subtitle, and the session label are all editable live from the gear icon — no code changes needed.
- **Color controls.** Separate color pickers for the accent, title, subtitle, and session label.
- **Background gallery.** Nine built-in illustrated backgrounds to pick from, or upload your own photo (auto-resized in the browser before it's saved).
- **It remembers.** Every setting is saved to `localStorage` — refresh the page and it's exactly how you left it.
- **Feels like a sign, not a webpage.** Text is unselectable, styled like a poster.
- **"Now playing"-style control.** Toggling the wake lock is styled like pressing play/pause on a track — because why not.

## Quickstart

```bash
pnpm install
pnpm dev
```

Open the printed local URL, click **"Keep screen awake"**, and go do whatever you were going to do.

## Customizing it

Click the gear icon (top-right) to open the settings panel:

- Edit the title, subtitle, and session label
- Pick an accent color and individual text colors
- Choose a background from the built-in gallery, or upload your own image
- Hit **Reset all** to go back to defaults

Everything updates live behind the panel as you type.

## How it works, briefly

- [`src/useWakeLock.js`](src/useWakeLock.js) — requests `navigator.wakeLock.request('screen')`, re-acquires it automatically if the tab regains visibility, and falls back to a `canvas.captureStream()`-driven hidden `<video>` loop if Wake Lock isn't supported.
- [`src/useSettings.js`](src/useSettings.js) — all customization state, persisted to `localStorage`.
- [`src/gallery.js`](src/gallery.js) — pulls the built-in backgrounds straight out of `src/assets`.
- [`src/App.jsx`](src/App.jsx) / [`src/SettingsPanel.jsx`](src/SettingsPanel.jsx) — the page and the customize modal.

## The built-in backgrounds

All nine live in [`src/assets`](src/assets) and show up in the gallery picker:

<table>
<tr>
<td><img src="src/assets/oneone.png" width="160" /></td>
<td><img src="src/assets/onetwo.png" width="160" /></td>
<td><img src="src/assets/onethree.png" width="160" /></td>
</tr>
<tr>
<td><img src="src/assets/onefour.png" width="160" /></td>
<td><img src="src/assets/onefive.jpg" width="160" /></td>
<td><img src="src/assets/onesix.png" width="160" /></td>
</tr>
<tr>
<td><img src="src/assets/oneseven.jpg" width="160" /></td>
<td><img src="src/assets/oneeight.png" width="160" /></td>
<td><img src="src/assets/onenine.png" width="160" /></td>
</tr>
</table>

Mix any of them with your own title/subtitle to fit the moment — "studying," "out for lunch," "do not disturb," whatever's true right now.

## Disclaimer

This is a for-fun side project, not a serious productivity tool. It will not stop someone from closing your laptop lid. It will, however, make a good case for why they shouldn't.
