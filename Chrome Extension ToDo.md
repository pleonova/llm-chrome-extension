# Chrome Extension ToDo
## Setting up Chrome
> If you haven't done so already, it's important to enable the experimental features in Chrome so you can leverage local/on-device/in-browser AI capabilities, You can do so by heading to chrome://flags/ via the search bar and enabling all the relevant flags. Here's a list of links to enable:

* [chrome://flags/#optimization-guide-on-device-model](chrome://flags/#optimization-guide-on-device-model) select `Enabled BypassPerfRequirement`
* [chrome://flags/#prompt-api-for-gemini-nano](chrome://flags/#prompt-api-for-gemini-nano)
* [chrome://flags/#summarization-api-for-gemini-nano](chrome://flags/#summarization-api-for-gemini-nano)
* [chrome://flags/#translation-api](chrome://flags/#translation-api) select `Enabled without language pack limit`
* [chrome://flags/#writer-api-for-gemini-nano](chrome://flags/#writer-api-for-gemini-nano)
* [chrome://flags/#rewriter-api-for-gemini-nano](chrome://flags/#rewriter-api-for-gemini-nano)

## Setup Gemini LLM 
(*subject to change as the prompt API is a trial feature*)

* Complete the steps outlined in the README.md file in the Getting Started section (you should have completed uploading the extension files)
* Make sure you have the latest version of Chrome installed (minimum version 131)
* Register for the `Gemini API Access` trial here https://developer.chrome.com/origintrials/#/register_trial/
  * Enter `chrome-extension://[YOUR-EXTENSION-ID]` in the Web Origin field
  * To find the extension-id:
    1. Open `chrome://extensions/` in Chrome
    2. Click `Details` on your uploaded extension
    3. Copy the ID from either:
       - The URL: `chrome-extension://[YOUR-EXTENSION-ID]/`
       - The extensions table
  * Select `0-10,000` in Expected Usage
  * Check all boxes in Disclosure and Acknowledgements section
  * Click `Register`
* Copy the received trial token and create a `.env` file in the root directory of the project. Paste it into your `.env` file on a new line starting with `AI_LANGUAGE_MODEL_TRIAL_TOKEN=<token>`. 




## Resources
* https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/ai.gemini-on-device 
* https://github.com/explainers-by-googlers/prompt-api
* https://tomayac.github.io/prompt-api-playground/
* https://github.com/rustyzone/ai-ext-built-ins

## Todos
[ ] - Launch instructions on first install. 

[ ] - get pageData for processing

[ ] - use built-in AI features to process data locally

* [ ] - Language API

* [ ] - Summarization API

* [ ] - [Prompt API in Extensions](https://developer.chrome.com/docs/extensions/ai/prompt-api) 

	* [ ] - set up a Prompt API In Extenstions System Prompt

[ ] - allow the user to select what they want to scan

* [ ] - window.selection

* [ ] - dev tools hover and select element.

* [ ] - allow user to scan the whole page

* [ ] - will probably need a programmatic catch-all or use Prompt API in Extensions to parse text.


## Future Ideas 

[ ] - Translation API (might not work in extensions)
* [ ] - use on-device AI to translate the page in a sidebar
	
	