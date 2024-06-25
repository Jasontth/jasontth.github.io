const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector("#delete-btn");

let userText = "null";
let conversationHistory = [];



const loadDataFromLocalstorage = () => {
    const defaultText = `
        <div class="default-text">
            <h1>This is Jason</h1>
            <h2>Powered by Gemini-1.5-Flash</h2>
            <p>Ask anything about me</p>
            <div class="disclaimer">
                <p>Important Notice: This AI may occasionally hallucinate; please verify important information via the navigation bar.</p>
            </div>
        </div>
    `;
    chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

const createChatElement = (content, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv;
}

const getChatResponse = async (incomingChatDiv) => {
    const API_URL = "https://api.awanllm.com/v1/chat/completions";
    const pElement = document.createElement("p");

    const API_KEY = "7385278a-2b68-436b-82a7-8df6436ed8f2";

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "{MODEL_NAME}",
            messages: [
                { 
                    role: "system", 
                    content: `Here is the instruction: ${JSON.stringify(instruction_Details)}. If asked about yourself, provide information based on the CV/Resume details provided: ${JSON.stringify(resume_Details)}.` 
                },                
                { role: "user", content: userText } // Assuming userText is defined elsewhere
            ],
            "repetition_penalty": 1.1,
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
            "max_tokens": 1024,
            "stream": true
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        const botResponse = responseData.choices[0].message.content.trim();
        
        // Assuming parseResponse function is defined elsewhere to handle botResponse
        const parsedResponse = parseResponse(botResponse);

        pElement.innerHTML = parsedResponse;
        conversationHistory.push({ role: "assistant", content: botResponse });
    } catch (error) {
        pElement.classList.add("error");
        pElement.textContent = "Oops! Something went wrong while retrieving the response. Please try again.";
        console.error('Error fetching data:', error);
    }

    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
    localStorage.setItem("all-chats", chatContainer.innerHTML);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
};


const parseResponse = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

const copyResponse = (copyBtn) => {
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(responseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
}

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
}

const handleOutgoingChat = () => {
    userText = chatInput.value.trim();
    if (!userText) return;

    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

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

    setTimeout(showTypingAnimation, 500);
}

deleteButton.addEventListener("click", () => {
    localStorage.removeItem("all-chats");
    conversationHistory = [];
    loadDataFromLocalstorage();
});

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${initialInputHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleOutgoingChat();
    }
});

loadDataFromLocalstorage();
sendButton.addEventListener("click", handleOutgoingChat);

function insertSuggestion(text) {
    chatInput.value = text;
}
  
const handleSuggestionClick = () => {
    const suggestionsContainer = document.querySelector('.suggestions');
    suggestionsContainer.innerHTML = '';
};
  
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('suggestion')) {
      handleSuggestionClick();
    }
});
