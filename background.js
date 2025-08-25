chrome.runtime.onInstalled.addListener(() => {
  console.log("Rune AI Assistant installed.");
  chrome.storage.local.set({ GEMINI_API_KEY: "YOUR API KEY" });

});
