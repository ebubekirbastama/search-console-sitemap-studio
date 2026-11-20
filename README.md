# Sitemap Studio for Google Search Console

A **free, open-source Chrome Manifest V3 extension** that submits sitemap paths across Google Search Console properties one at a time, with confirmation-dialog checks, resumable jobs, and local activity logs.

**Suggested GitHub repository:** `search-console-sitemap-studio`

> Independent community project. **Not affiliated with or endorsed by Google.** Use only on Search Console properties you are authorized to manage.

## Features

- **Batch submission:** one Search Console property per line.
- **URL-prefix and Domain properties:** examples below.
- **Submission observation:** enters `sitemap.xml`, clicks **Submit**, then waits for a recognized success dialog **and its Close button**. It **does not click Close**.
- **Resume / pause / reset:** job progress persists in Chrome's local extension storage.
- **Error handling:** submission and navigation timeouts are logged and subsequent sites are attempted.
- **Export logs:** download a UTF-8 TXT log, including error details.
- **English and Turkish interface.** Some English, Turkish, Spanish, French, German, Italian and Portuguese Search Console text patterns are recognized, but other locales may require updates.
- **No preloaded domains, no external server, no account-data collection.**

## Install (unpacked extension)

1. Download the ZIP from GitHub Releases or clone this repository.
2. Extract it if using the ZIP.
3. Open `chrome://extensions`, enable **Developer mode**.
4. Select **Load unpacked** and choose the folder containing `manifest.json`.
5. Open the extension popup, enter your verified Search Console properties, and click **Start new job**.

## Example property list

```text
example.com
https://example.org/
https://example.org/blog/
sc-domain:example.net
```

- Bare names such as `example.com` are treated as the `https://example.com/` URL-prefix property.
- Full `http://` and `https://` properties are kept as entered, including an optional path prefix.
- `sc-domain:example.net` identifies a Google Search Console Domain property.
- **The property must exactly match an accessible Search Console property.**
- The sitemap input accepts a **relative XML path** such as `sitemap.xml` or `sitemap_index.xml`. It does not accept arbitrary URLs.

## How it works

1. User starts the job in the popup.
2. The extension opens the Search Console Sitemaps page for the first property in a new tab.
3. It finds the sitemap input and the Submit button, then clicks Submit.
4. It waits for a recognized success dialog with a visible Close/OK button. **It never clicks that button.**
5. After observing success (or a timeout/error), it logs the outcome and opens the next property.
6. A watchdog attempts to recover if a tab or navigation stalls.

**Important:** Clicking Submit is not proof of acceptance. A success dialog indicates the UI acknowledged the submission; it is **not** proof that Google crawled or indexed any URLs. Always check Search Console for the actual sitemap status.

The extension uses `chrome.storage.local` for settings, progress and logs. Nothing is sent to the extension author. It interacts only with Google's Search Console page as directed by the user.

## Permissions

| Permission | Reason |
|---|---|
| `tabs` | Open and monitor one Search Console work tab at a time. |
| `scripting` | Run the sitemap input / confirmation observation script. |
| `storage` | Save the user's list, job progress and log locally. |
| `alarms` | Watchdog for stalled operations. |
| `https://search.google.com/*` | Access to Google Search Console pages only. |

## Limitations

- Google can change Search Console's HTML, UI wording, or workflow; selectors and translations may need maintenance.
- Unrecognized language labels may cause timeouts and logged errors, not silent success.
- The extension is not an official Google API client and does not bypass Search Console access requirements.
- In a long job, avoid manually closing the active work tab.
- **Automated UI submission can be brittle. Test with a small set of your own properties first.**

## Development

Files: `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, `icons/`.

To test syntax: `node --check background.js && node --check content.js && node --check popup.js`.

Contributions are welcome, especially selector compatibility fixes and additional locale strings.

## Privacy

See [PRIVACY.md](PRIVACY.md). This extension has no tracking or remote analytics.

## License

MIT — see [LICENSE](LICENSE).
