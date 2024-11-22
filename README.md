# LLM Chrome Extension

## Getting Started

*For non-developers, skip steps 1 & 2 and direcly download the `dist` folder and proceed with the remaining steps*

1. Install dependencies `npm install`
    * Make sure Node.js is installed `node -v` should display a version, otherwise if you have Homebrew `brew install node`.
2. Build the extension `npm run build`
    * This creates a `dist` folder with the **unpacked extension**. The `dist` folder is what needs to be uploaded to chrome.
3. Open the Chrome Extensions page: Type `chrome://extensions/ ` in the address bar and hit Enter.
4. Enable `Developer Mode: Toggle Developer` mode switch to on.
5. Load the extension: Click “Load unpacked” and select the extension directory's `dist` folder.
6. Confirm Loading: Extensions appear on the Extensions page.

### No-Code Step-by-Step Setup

![Instructions](screenshots/20241122/chrome_extension_step_by_step.png)

### Screenshots

How the chrome app looks and works in your browser:
![On Start](screenshots/20241122/1_on_start.png)

![Classification](screenshots/20241122/2_classified.png)

![Summary Visualization](screenshots/20241122/3_summary_visual.png)

![History](screenshots/20241122/4_history.png)


