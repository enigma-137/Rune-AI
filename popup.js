const chatOutput = document.getElementById("chat-output");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");



async function getPageContent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject a script to get the page text
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            return document.body.innerText.slice(0, 2000);
        },
    });

    return results[0].result;
}


const sendMessage = async () => {
    const query = chatInput.value.trim();
    if (!query) return;

    addMessage("user", query);
    chatInput.value = "";
    
    const typingIndicator = addMessage("assistant", "Reading page and thinking...");

    try {

        const pageText = await getPageContent();

        //  DuckDuckGo search (Optional, keep if you want external info too)
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        const ddgData = await ddgRes.json();
        const ddgAnswer = ddgData.AbstractText || "";

        // Call Gemini
        chrome.storage.local.get("GEMINI_API_KEY", async ({ GEMINI_API_KEY }) => {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `
                            You are an assistant with access to the user's current web page.
                            
                            CURRENT PAGE CONTENT:
                            ${pageText}
                            
                            DUCKDUCKGO INFO:
                            ${ddgAnswer}
                            
                            USER QUERY: 
                            ${query}
                            
                            Please answer the user's query based on the page content provided above.`
                        }]
                    }]
                })
            });

            const data = await response.json();
            const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Error reaching Gemini.";
            updateMessage(typingIndicator, "assistant", formatMarkdown(answer));
        });

    } catch (err) {
        console.error(err);
        updateMessage(typingIndicator, "assistant", "⚠️ Error: " + err.message);
    }
};




sendBtn.addEventListener("click", sendMessage);

//  Enter key to send (Shift+Enter for new line)
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// // Auto-resize textarea
// chatInput.addEventListener("input", function() {
//   this.style.height = "auto";
//   this.style.height = (this.scrollHeight) + "px";
// });


// Auto-resize textarea
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
});


// For addin new messages to the chat
function addMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = content;
    chatOutput.appendChild(messageDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
    return messageDiv;
}

// Update an existing message
function updateMessage(element, role, content) {
    element.className = `message ${role}`;
    element.innerHTML = content;
    chatOutput.scrollTop = chatOutput.scrollHeight;

    // Add copy buttons to code blocks
    addCopyButtons();
}

// Format markdown in messages\
function formatMarkdown(text) {
    // Convert code blocks with language
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code)}</code></pre>`;
    });


    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert bold and italic (simplified)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Convert newlines to <br>
    return text.replace(/\n/g, '<br>');
}

// Helper to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function addCopyButtons() {
    document.querySelectorAll('pre').forEach((pre) => {
        if (!pre.querySelector('.copy-button')) {
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.innerHTML = '<i class="far fa-copy"></i>';
            button.title = 'Copy to clipboard';

            button.addEventListener('click', () => {
                const code = pre.querySelector('code')?.textContent || '';
                navigator.clipboard.writeText(code).then(() => {
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.title = 'Copied!';
                    setTimeout(() => {
                        button.innerHTML = '<i class="far fa-copy"></i>';
                        button.title = 'Copy to clipboard';
                    }, 2000);
                });
            });

            pre.style.position = 'relative';
            pre.appendChild(button); 
        }
    });
}


chatInput.focus();
