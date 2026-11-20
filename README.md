# Sitemap Studio for Search Console

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=222)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge)
![Storage](https://img.shields.io/badge/Storage-chrome.storage.local-64748B?style=for-the-badge)

> A Chrome Manifest V3 extension for submitting a sitemap path to multiple Google Search Console properties in sequence, checking the visible submission result, and keeping resumable local progress and logs.

## Overview

**Sitemap Studio for Search Console** is a browser extension that automates the repetitive sitemap-submission workflow across a list of Search Console properties.

The extension opens each property’s Sitemaps page, enters a relative sitemap path, submits it, and waits for a recognizable result dialog. It records each property as confirmed or failed, then proceeds to the next property. Jobs can be paused and resumed, and activity logs can be exported as a text file.

This project interacts with the Search Console web interface. It does **not** use the Google Search Console API, does not verify that Google has crawled or indexed a sitemap, and does not guarantee indexing.

## Features

- **Batch processing:** accept multiple Search Console properties, one per line.
- **Property formats:** supports Domain properties such as `sc-domain:example.com` and URL-prefix properties such as `https://example.com/blog/`.
- **Relative sitemap path:** submit a path such as `sitemap.xml` or `sitemaps/main.xml` for each property.
- **Sequential workflow:** opens a dedicated Search Console tab for each property.
- **Result observation:** checks for recognized success or error dialogs and records the outcome.
- **Pause and resume:** saves job state locally so an unfinished batch can be resumed.
- **Watchdog timeout:** detects jobs that remain without a response and records a timeout.
- **Activity log:** stores timestamped stages, property results, warnings, and errors.
- **TXT export:** downloads the recorded results and activity log.
- **English and Turkish popup UI.**
- **Local-only operation:** job state and preferences are stored using `chrome.storage.local`; the source contains no remote telemetry implementation.

## Technology Stack

| Technology | Role |
|---|---|
| **JavaScript** | Extension logic and browser automation |
| **HTML5** | Popup interface |
| **CSS3** | Popup layout and styling |
| **Chrome Extensions Manifest V3** | Extension platform |
| **Chrome Tabs API** | Opens and tracks Search Console tabs |
| **Chrome Scripting API** | Injects the content script into the active property page |
| **Chrome Storage API** | Persists job state, preferences, results, and logs locally |
| **Chrome Alarms API** | Watchdog checks for stalled jobs |
| **Google Search Console UI** | Target interface for sitemap submission |

## Project Structure

```text
search-console-sitemap-studio/
├── manifest.json       # Manifest V3 metadata, permissions, popup and service worker
├── background.js       # Queue, job state, tab lifecycle, resume and watchdog logic
├── content.js          # Search Console page interaction and result-dialog detection
├── popup.html          # Extension popup markup and styles
├── popup.js            # Popup controls, localization, status, logs and TXT export
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Requirements

- Google Chrome or a Chromium-based browser with Manifest V3 extension support.
- Access to the Google account and Search Console properties you intend to manage.
- A sitemap path that is valid and available for each property.
- An active internet connection to use Google Search Console.

The extension does not request Google account credentials. Sign in to Search Console in the browser through Google's normal sign-in flow before starting a job.

## Installation

### Install from the repository (Developer mode)

1. Clone or download this repository:

   ```bash
   git clone https://github.com/ebubekirbastama/search-console-sitemap-studio.git
   ```

2. Open `chrome://extensions` in Google Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the cloned `search-console-sitemap-studio` directory (the directory containing `manifest.json`).
6. Pin **Sitemap Studio** to the browser toolbar for convenient access.

To apply local source changes, return to `chrome://extensions` and reload the extension.

## Usage

1. Sign in to the Google account that has access to the target Search Console properties.
2. Open the Sitemap Studio popup.
3. Select the sitemap path. The default is `sitemap.xml`.
4. Enter one Search Console property per line. Examples:

   ```text
   example.com
   https://example.org/blog/
   sc-domain:example.net
   ```

5. Select **Start new job** and confirm the batch.
6. Keep the browser open while the extension processes the properties. It opens and uses Search Console tabs during the workflow.
7. Review the processed, remaining, and error counters and the activity log.
8. If a job is paused or interrupted, select **Resume** to continue from the saved position.
9. Use **Export TXT** to download the results and activity log.

### Supported sitemap path examples

```text
sitemap.xml
sitemaps/main.xml
news/sitemap.xml
```

The extension expects a **relative path**, not a complete sitemap URL. The same path is submitted for each property in the batch.

## Workflow

```text
User enters properties + sitemap path
                 |
                 v
       Validate and normalize input
                 |
                 v
       Save job in chrome.storage.local
                 |
                 v
    Open Search Console property page
                 |
                 v
       Inject content.js into the tab
                 |
                 v
     Find sitemap field and enter path
                 |
                 v
          Click Submit button
                 |
                 v
       Wait for a recognized dialog
                 |
          +------+------+
          |             |
          v             v
     Success dialog   Error / timeout
          |             |
          +------+------+
                 |
                 v
       Save result and activity log
                 |
                 v
       Process next property or finish
```

The background service worker owns the queue and job lifecycle. The content script is responsible for interacting with the currently selected Search Console page and reporting the observed result to the service worker.

## Data, Permissions and Privacy

The Manifest V3 configuration declares the following permissions:

- `tabs` — create and track the Search Console tabs used by the batch.
- `scripting` — inject the extension's content script into the target page.
- `storage` — persist settings, job progress, results, and logs in browser-local extension storage.
- `alarms` — run the watchdog check for a stalled submission.
- Host permission: `https://search.google.com/*` — interact with Google Search Console pages.

The extension source does not implement a remote analytics or telemetry endpoint. Property lists, job state, and logs are stored locally through `chrome.storage.local`. Exported TXT logs may contain property identifiers and operational details; review the file before sharing it.

## Technical Limitations

- **UI automation, not an official API integration:** the extension depends on the current Search Console page structure, labels, and button behavior. A Google UI change may require selector updates.
- **Language-sensitive selectors:** the content script recognizes a limited set of button labels and success/error phrases. Other interface languages or changed wording may cause a property to be reported as unverified.
- **Dialog-based confirmation:** a success result means a recognized success dialog was observed. It does not confirm that the sitemap was fetched, processed, or indexed.
- **No indexing guarantee:** sitemap submission is only a request to Search Console; crawling and indexing are determined by Google.
- **One sitemap path per batch:** the same relative path is used for every property in a job.
- **Relative path validation is intentionally restrictive:** absolute URLs, leading slashes, and paths containing `..` are rejected.
- **Browser session dependency:** the browser must remain available and signed in. Closing the active work tab pauses the job.
- **Watchdog behavior:** a submission that receives no recognized response may be marked as a timeout/error even if Search Console processed the request.
- **No automatic retry policy:** failed or timed-out properties are recorded; the user can inspect the log and resume or start another job as appropriate.
- **No property discovery:** users must supply the property list themselves and must already have access to each property.

## Safe Use

- Use the extension only with Search Console properties you own or are explicitly authorized to manage.
- Verify every property identifier and sitemap path before starting a batch.
- Start with one test property before submitting a large list.
- Keep your Google account secured with Google's standard authentication and multi-factor authentication.
- Do not share exported logs without checking them for property names and other operational information.
- Review the Search Console result for important properties instead of treating a local “confirmed” status as proof of indexing.
- The extension does not need your Google password; never enter account credentials into the extension popup.

## Modernization Roadmap

- Add automated tests for property parsing, sitemap path validation, queue transitions, and result classification.
- Introduce a configurable and testable localization/selector layer for supported Search Console UI languages.
- Improve DOM readiness detection with resilient selectors and explicit UI-state checks.
- Add a per-property sitemap path option for batches that use different sitemap locations.
- Add configurable retry rules for transient navigation and UI failures, with safeguards against duplicate submissions.
- Provide structured JSON/CSV export in addition to TXT.
- Add a dry-run mode that validates and previews the batch without submitting.
- Improve accessibility and keyboard navigation in the popup.
- Add a documented release and packaging workflow.
- Re-evaluate an official Google API integration if the required API supports the intended workflow and authorization model.

## License

No `LICENSE` file is currently included in this repository. Until a license is added, the source code remains subject to its default copyright terms; reuse, redistribution, and modification rights should not be assumed.

## Developer

**Ebubekir Bastama**

- GitHub: [@ebubekirbastama](https://github.com/ebubekirbastama)
- Repository: [search-console-sitemap-studio](https://github.com/ebubekirbastama/search-console-sitemap-studio)

---

If you find the project useful, consider starring the repository.
