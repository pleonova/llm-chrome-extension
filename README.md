# LLM Chrome Extension

## Getting Started

* Install dependencies `npm install`
    * Make sure Node.js is installed `node -v` should display a version, otherwise if you have Homebrew `brew install node`.
* Build the extension `npm run build`
    * This creates a `dist` folder with the **unpacked extension**. The `dist` folder is what needs to be uploaded to chrome.
* Open the Chrome Extensions page: Type `chrome://extensions/ ` in the address bar and hit Enter.
* Enable `Developer Mode: Toggle Developer` mode switch to on.
* Load the extension: Click “Load unpacked” and select the extension directory's `dist` folder.
* Confirm Loading: Extensions appear on the Extensions page.

