// This enables use of the searchbar. See manifest.json for the omnibox keyword.
/*"omnibox": {
      "keyword": "@standards"
    }
*/
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    chrome.omnibox.setDefaultSuggestion({
        description: 'Entering a keyword triggers the extension.',
    });
});