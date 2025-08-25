const chatOutput = document.getElementById("chat-output");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Handle sending messages
const sendMessage = async () => {
    const query = chatInput.value.trim();
    if (!query) return;

    // Add user message to chat
    addMessage("user", query);
    chatInput.value = "";
    chatInput.style.height = "auto";

    
    const typingIndicator = addMessage("assistant", "<div class='typing-indicator'><span></span><span></span><span></span></div>");

    try {
        //  DuckDuckGo search
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        const ddgData = await ddgRes.json();
        let ddgAnswer = ddgData.AbstractText || ddgData.Heading || "";

        //Pass to gemini
        chrome.storage.local.get("GEMINI_API_KEY", async ({ GEMINI_API_KEY }) => {
            if (!GEMINI_API_KEY) {
                updateMessage(typingIndicator, "assistant", "⚠️ No API key found. Please set it first.");
                return;
            }

            try {
                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `
                  You are a helpful assistant.  
- If the query is a question, provide a clear and concise answer.  
- If the query is a statement, explain it.  

Query: ${query}  
DuckDuckGo Info: ${ddgAnswer}  

Guidelines:  
- Keep responses straight to the point.  
- Use code blocks with triple backticks and specify the language when sharing code.  
- Do not include filler phrases (e.g., “I understand”); just give the response directly.  

                  
                  `
                                }]
                            }]
                        })
                    }
                );

                const geminiData = await geminiRes.json();
                const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't find a good answer to that.";

                // Format the response with markdown support
                const formattedAnswer = formatMarkdown(answer);
                updateMessage(typingIndicator, "assistant", formattedAnswer);

            } catch (err) {
                console.error("Gemini API error:", err);
                updateMessage(typingIndicator, "assistant", "⚠️ Sorry, I encountered an error while processing your request.");
            }
        });

    } catch (err) {
        console.error("DuckDuckGo API error:", err);
        updateMessage(typingIndicator, "assistant", "⚠️ I had trouble fetching information. You can try asking again.");
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
