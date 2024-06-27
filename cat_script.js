// DOM elements
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector("#delete-btn");
const botBtn = document.getElementById('bot-btn');
const showCatButton = document.getElementById('show-cat-btn');

// API Key parts
const API_KEY_PARTS = ["5f85aff0", "dce9", "4166", "9386", "8518a46706f9"];
const API_KEY = API_KEY_PARTS.join("-");

// Initial conversation state
let userText = "";
let conversationHistory = [];

// Default chat template from localStorage or static content
const loadChatHistory = () => {
    const defaultChat = `
        <div class="default-text">
            <h2>This is Catopia AI</h2>
            <h3>Powered by Llama-3-8b</h3>
            <div class="disclaimer">
                <p>Important Notice: This AI may occasionally hallucinate; please verify important information via the navigation bar.</p>
            </div>
        </div>
    `;
    chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultChat;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

// Create a new chat element
const createChatElement = (content, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv;
};

// Fetch response from API and handle it
const getChatResponse = async (incomingChatDiv) => {
    const API_URL = "https://api.awanllm.com/v1/chat/completions";
    const pElement = document.createElement("p");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "Awanllm-Llama-3-8B-Dolfin",
            messages: [
                { 
                    role: "system", 
                    content: `You are Jason, a cat lover. Here is your instruction: ${JSON.stringify(instruction_Details)}. You are showing a cat photo. Provide information based on the details about the cat: ${JSON.stringify(breedData)}.` 
                },
                ...conversationHistory,
                { role: "user", content: userText },
            ],
            repetition_penalty: 1.1,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            max_tokens: 1024,
            stream: false
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        const botResponse = data.choices[0].message.content.trim();
        const parsedResponse = parseResponse(botResponse);
        pElement.innerHTML = parsedResponse;
        conversationHistory.push({ role: "assistant", content: botResponse });
    } catch (error) {
        pElement.classList.add("error");
        pElement.textContent = "Oops! Something went wrong while retrieving the response. Please try again.";
    }

    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
    localStorage.setItem("all-chats", chatContainer.innerHTML);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

// Parse response to handle URLs
const parseResponse = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
};

// Copy response text to clipboard
const copyResponse = (copyBtn) => {
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(responseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
};

// Show typing animation before response is received
const showTypingAnimation = () => {
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/chatbot.jpg" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                </div>`;
    const incomingChatDiv = createChatElement(html, "incoming");
    chatContainer.appendChild(incomingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    getChatResponse(incomingChatDiv);
};

// Handle user outgoing chat message
const handleOutgoingChat = async () => {
    if (!userText) return;

    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <p>${userText}</p>
                    </div>
                </div>`;

    const outgoingChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    conversationHistory.push({ role: "user", content: userText });

    if (userText === "Show me a cat!") {
        const catDetail = await fetchCatImage(); // Assuming fetchCatImage() is defined elsewhere
        if (catDetail) {
            const { url: cat_img, breed: cat_breed } = catDetail;
            const catImageHtml = `<div class="chat-content">
                                    <div class="chat-details">
                                        <img src="${cat_img}" alt="Cat" style="max-width: 100%; height: auto;">
                                    </div>
                                  </div>`;
            const catImageDiv = createChatElement(catImageHtml, "incoming");
            chatContainer.appendChild(catImageDiv);
            chatContainer.scrollTo(0, chatContainer.scrollHeight);

            const catInfo = `The cat is a ${cat_breed.name}. Some characteristics: ${cat_breed.temperament}. Origin: ${cat_breed.origin}.`;
            conversationHistory.push({ role: "system", content: catInfo });
        }
    }

    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

    setTimeout(showTypingAnimation, 500);
};

// Handle click on "Show me a cat!" button
const handleShowCatButtonClick = async () => {
    // Clear local storage and conversation history
    localStorage.removeItem("all-chats");
    conversationHistory = [];
    
    // Load chat history from local storage or default
    loadChatHistory();
    
    // Set user text to trigger cat request
    userText = "Show me a cat!";
    
    // Create outgoing chat message UI
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <p>${userText}</p>
                    </div>
                </div>`;

    const outgoingChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    // Add user message to conversation history
    conversationHistory.push({ role: "user", content: userText });

    // Handle cat request with delayed animation
    setTimeout(showTypingAnimation, 500);
};

// Handle delete button click to clear local storage and conversation history
deleteButton.addEventListener("click", () => {
    localStorage.removeItem("all-chats");
    conversationHistory = [];
    loadChatHistory();
});

// Adjust input height dynamically based on content
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${initialInputHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Handle Enter key press to send message
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        userText = chatInput.value.trim();
        handleOutgoingChat();
    }
});

// Initial height of input
const initialInputHeight = chatInput.scrollHeight;

// Function to handle suggestions click event
const handleSuggestionClick = () => {
    const suggestionsContainer = document.querySelector('.suggestions');
    suggestionsContainer.innerHTML = '';
};

// Event listener for suggestion click
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('suggestion')) {
        handleSuggestionClick();
    }
});

// Event listener for DOMContentLoaded to set up bot options overlay
document.addEventListener('DOMContentLoaded', () => {
    const botOptionsContent = document.querySelector('.bot-options-content');

    const overlay = document.createElement('div');
    overlay.className = 'bot-options-overlay';
    document.body.appendChild(overlay);

    overlay.appendChild(botOptionsContent);

    // Toggle bot options display on bot button click
    botBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.classList.toggle('show');
        botOptionsContent.classList.toggle('show');
    });

    // Close bot options on overlay click
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.classList.remove('show');
            botOptionsContent.classList.remove('show');
        }
    });

    // Prevent closing options on clicking within the content
    botOptionsContent.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Add click event listener for "Show me a cat!" button
    showCatButton.addEventListener('click', handleShowCatButtonClick);
});

// Load initial chat history on page load
loadChatHistory();

// Event listener for send button click
sendButton.addEventListener("click", () => {
    userText = chatInput.value.trim();
    handleOutgoingChat();
});
