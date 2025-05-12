# Reddit Quick Access Buttons UserScript

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

This UserScript adds convenient buttons to the bottom-right corner of Reddit pages for quick access to your **Saved Posts** and **Messages Inbox**.

## Features

*   **Saved Posts Button:** An orange button with a bookmark icon that links directly to `https://www.reddit.com/user/me/saved`.
*   **Messages Button:** A blue button with a mail icon that links directly to `https://www.reddit.com/message/inbox`.
*   **Fixed Position:** Buttons stay fixed in the bottom-right corner as you scroll.
*   **SPA Aware:** Designed to work with Reddit's dynamic navigation (Single Page Application behavior). It uses techniques like a global flag (`@run-at document-start`) and explicit button removal/re-creation to prevent duplicate buttons during page transitions.
*   **Handles Messages Page:** Specifically waits for the full page load (`window.load`) on the `/message/inbox` page before adding buttons, addressing timing issues observed on that particular page.
*   **No Iframes:** Uses the `@noframes` directive to ensure the script only runs in the main page context, preventing issues on pages that might use iframes.

## Installation

1.  **Install a UserScript Manager:** You need a browser extension to manage UserScripts. Popular options include:
    *   [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Opera, Safari)
    *   [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge, Opera)
    *   [Greasemonkey](https://www.greasespot.net/) (Firefox)

2.  **Install the Script:** Click the installation link below. Your UserScript manager should detect it and prompt you for installation.

    *   **[Install Reddit Quick Access](https://github.com/ctrlcmdshft/RedditQuickAccess/raw/refs/heads/main/Reddit-Quick-Access.user.js)**
  
    *(Alternatively, you can manually copy the code from `Reddit Quick Access.user.js` and create a new script in your UserScript manager.)*

## Usage

Once installed, simply browse Reddit while logged in. The buttons should appear automatically in the bottom-right corner of the screen. Click them to navigate to your Saved Posts or Messages Inbox.

## Troubleshooting

*   **Buttons Not Appearing:**
    *   Ensure the UserScript is enabled in your manager.
    *   Check the browser's developer console (F12 -> Console) for any errors related to the script.
    *   Reddit UI updates can sometimes break UserScripts. Check if there's a newer version of this script.
*   **Duplicate Buttons (Should be fixed):** This script includes several measures to prevent duplicates. If you still see them, ensure you have the latest version and that no older versions or conflicting scripts are running. The `@noframes` directive and the global flag check are key.

## Contributing

Feel free to fork this repository, make improvements, and submit pull requests. You can also open issues for bugs or feature suggestions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (or state the license directly if not including a separate file).
