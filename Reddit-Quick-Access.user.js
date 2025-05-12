// ==UserScript==
// @name         Reddit Corner Buttons (Saved Posts & Messages) + Reddit AD Button Hider
// @namespace    Https://github.com/ctrlcmdshft/RedditQuickAccess
// @version      2.3 // Version updated
// @description  Adds buttons to access Saved Posts and Messages (bottom-right corner) and hides the 'Advertise' button/link on Reddit using its ID. Handles SPA navigation and iframe issues.
// @author       CtrlCmdShft
// @match        https://www.reddit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @noframes     // Crucial: Prevents the script from running in iframes, avoiding duplicate runs on pages like Messages.
// @downloadURL  https://github.com/ctrlcmdshft/RedditQuickAccess/raw/refs/heads/main/Reddit-Quick-Access.user.js
// @updateURL    https://github.com/ctrlcmdshft/RedditQuickAccess/raw/refs/heads/main/Reddit-Quick-Access.user.js
// @grant        GM_addStyle
// @run-at       document-start // Run early to set the global flag and inject styles.
// @license      MIT // Example license, feel free to change
// ==/UserScript==

(function() {
    'use strict';

    /* --- Configuration --- */

    // Constants for button IDs and URLs
    const SAVED_URL = 'https://www.reddit.com/user/me/saved';
    const MESSAGES_URL = 'https://www.reddit.com/message/inbox'; // Base URL for messages page check
    const SAVED_BUTTON_ID = 'userscript-reddit-saved-button';
    const MESSAGES_BUTTON_ID = 'userscript-reddit-messages-button';
    const ADVERTISE_BUTTON_ID = 'advertise-button'; // <-- ID of the button to hide

    // SVG Icons for the buttons
    const BOOKMARK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>`;
    const MAIL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor" aria-hidden="true"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>`;

    /* --- Initialization Guard (Global Flag) --- */

    const GLOBAL_FLAG_NAME = '__redditCornerButtonsInitialized_v2_5__'; // Use a versioned name
    if (window[GLOBAL_FLAG_NAME]) {
        // console.log(`Reddit Corner Buttons & Ad Hider: Global flag ${GLOBAL_FLAG_NAME} found. Aborting secondary execution.`);
        return;
    }
    window[GLOBAL_FLAG_NAME] = true;
    // console.log(`Reddit Corner Buttons & Ad Hider: Global flag ${GLOBAL_FLAG_NAME} set by this instance.`);


    /* --- Styling --- */

    // CSS styles for the buttons and ad hiding.
    const styles = `
        /* Corner Buttons Base Style */
        .userscript-corner-button {
            position: fixed;
            right: 20px;
            z-index: 1001;
            width: 40px;
            height: 40px;
            color: #ffffff;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.2s;
            display: flex !important; /* Use !important needed sometimes on Reddit */
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        .userscript-corner-button svg {
            width: 20px;
            height: 20px;
        }

        /* Saved Posts Button */
        #${SAVED_BUTTON_ID} {
            bottom: 20px;
            background-color: #ff4500; /* Reddit Orange */
        }
        #${SAVED_BUTTON_ID}:hover {
            background-color: #ff5722; /* Lighter orange */
        }

        /* Messages Button */
        #${MESSAGES_BUTTON_ID} {
            bottom: 70px; /* Position above saved button */
            background-color: #0079D3; /* Reddit Blue */
        }
        #${MESSAGES_BUTTON_ID}:hover {
            background-color: #1484D7; /* Lighter blue */
        }

        /* --- Hide the 'Advertise' Button using its ID --- */
        #${ADVERTISE_BUTTON_ID} {
            display: none !important; /* Hide element and remove from layout */
        }
    `;
    // Inject the styles into the page head.
    try {
        GM_addStyle(styles);
        // console.log("Reddit Corner Buttons & Ad Hider: Styles injected.");
    } catch (e) {
        console.error("Reddit Corner Buttons & Ad Hider: Failed to inject styles using GM_addStyle.", e);
    }


    /* --- Core Functions --- */

    /**
     * Creates a button element based on provided options.
     * @param {object} options - Button properties (id, title, svgHTML, url).
     * @returns {HTMLButtonElement|null} The created button element or null on error.
     */
    function createButtonElement(options) {
        try {
            const button = document.createElement('button');
            button.id = options.id;
            button.className = 'userscript-corner-button';
            button.title = options.title;
            button.setAttribute('aria-label', options.title);
            button.innerHTML = options.svgHTML;

            button.onclick = function() {
                window.location.href = options.url;
            };
            return button;
        } catch (e) {
            console.error(`Reddit Corner Buttons & Ad Hider: Error creating button element ${options.id}:`, e);
            return null;
        }
    }

    /**
     * Removes existing corner buttons from the DOM.
     */
    function removeExistingButtons() {
        const idsToRemove = [SAVED_BUTTON_ID, MESSAGES_BUTTON_ID];
        // console.log("Reddit Corner Buttons & Ad Hider: Checking for and removing existing buttons...");
        idsToRemove.forEach(id => {
            const existingButton = document.getElementById(id);
            if (existingButton) {
                // console.log(` - Removing button with ID: ${id}`);
                existingButton.remove();
            }
        });
    }

    /**
     * Ensures corner buttons are present. Removes existing ones and adds new ones.
     */
    function initializeOrRefreshButtons() {
        if (!document.body) {
             console.error("Reddit Corner Buttons & Ad Hider: initializeOrRefreshButtons called but document.body not found!");
             return;
        }
        // console.log("Reddit Corner Buttons & Ad Hider: Running initializeOrRefreshButtons...");

        // 1. Remove potentially lingering buttons
        removeExistingButtons();

        // 2. Define button configurations
        const buttonConfigs = [
            { id: SAVED_BUTTON_ID, title: 'View Saved Posts', svgHTML: BOOKMARK_ICON_SVG, url: SAVED_URL },
            { id: MESSAGES_BUTTON_ID, title: 'View Messages', svgHTML: MAIL_ICON_SVG, url: MESSAGES_URL }
        ];

        // 3. Create and append each button
        buttonConfigs.forEach(config => {
            const buttonElement = createButtonElement(config);
            if (buttonElement) {
                try {
                    document.body.appendChild(buttonElement);
                    // console.log(` - Successfully created and appended button: ${config.id}`);
                } catch(e) {
                    console.error(`Reddit Corner Buttons & Ad Hider: Failed to append button ${config.id} to body:`, e);
                }
            }
        });
        // console.log("Reddit Corner Buttons & Ad Hider: Button refresh/initialization complete.");
    }


    /* --- Initialization Trigger --- */

    // Logic for initializing corner buttons (no changes needed here for the ad hiding part)
    const isOnMessagesPageInitially = window.location.href.startsWith(MESSAGES_URL);

    if (isOnMessagesPageInitially) {
        // Special Handling for Messages Page
        // console.log("Reddit Corner Buttons & Ad Hider: On messages page. Waiting for 'load' event.");
        if (document.readyState === 'complete') {
            // console.log("Reddit Corner Buttons & Ad Hider: 'load' event already complete, running initialization now.");
            initializeOrRefreshButtons();
        } else {
            window.addEventListener('load', initializeOrRefreshButtons);
        }
    } else {
        // Standard Handling for Other Pages
        // console.log("Reddit Corner Buttons & Ad Hider: Not on messages page. Waiting for 'DOMContentLoaded'.");
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            // console.log("Reddit Corner Buttons & Ad Hider: 'DOMContentLoaded' already complete, running initialization now.");
            initializeOrRefreshButtons();
        } else {
            window.addEventListener('DOMContentLoaded', initializeOrRefreshButtons);
        }
    }


    /* --- Global Flag Cleanup --- */

    window.addEventListener('beforeunload', () => {
        // console.log(`Reddit Corner Buttons & Ad Hider: Clearing global flag ${GLOBAL_FLAG_NAME} on beforeunload.`);
        delete window[GLOBAL_FLAG_NAME];
    });

})(); // End of UserScript IIFE
