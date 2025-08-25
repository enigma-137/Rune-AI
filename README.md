
---

# Rune – AI Chrome Extension

Rune is a lightweight Chrome extension that lets you interact with AI directly from your browser. It uses a minimal UI and communicates with Gemini API to deliver responses seamlessly.

## 🚀 How it Works

* The extension injects a small popup where you can send prompts.
* It calls the AI API via your API key stored in `background.js`.
* Responses are returned in real time based on Duckducgo search api inside the extension UI.

## 🔑 Setup (Add Your API Key)

1. Open the project folder.
2. Go to `background.js`.
3. Find the section where the API key is stored:

```js
chrome.storage.local.set({ GEMINI_API_KEY: "AI-your gemini api key" });
```

4. Replace `"your_api_key_here"` with your actual key.
5. Save the file.

## 🖥️ Run it on Chrome

1. Open **Google Chrome**.
2. Go to `chrome://extensions/`.
3. Enable **Developer Mode** (top-right).
4. Click **Load unpacked**.
5. Select the project folder.
6. The Rune icon will appear in your browser toolbar 🎉

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repo
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "add feature"`)
4. Push to your branch (`git push origin feature-name`)
5. Open a Pull Request

---
