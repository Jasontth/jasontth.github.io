const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector("#delete-btn");
const botBtn = document.getElementById('bot-btn');

document.addEventListener('DOMContentLoaded', (event) => {
    const botBtn = document.getElementById('bot-btn');
    const botOptionsContent = document.querySelector('.bot-options-content');

    // Create overlay div
    const overlay = document.createElement('div');
    overlay.className = 'bot-options-overlay';
    document.body.appendChild(overlay);

    // Move options content into overlay
    overlay.appendChild(botOptionsContent);

    botBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        overlay.classList.toggle('show');
        botOptionsContent.classList.toggle('show');
    });

    // Close the overlay if the user clicks outside of the options content
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.classList.remove('show');
            botOptionsContent.classList.remove('show');
        }
    });

    // Prevent clicks inside the options content from closing the overlay
    botOptionsContent.addEventListener('click', function(event) {
        event.stopPropagation();
    });
});


let userText = "null";
const part1 = "5f85aff0";
const part2 = "dce9";
const part3 = "4166";
const part4 = "9386";
const part5 = "8518a46706f9";

let conversationHistory = [];

function getApiKey() {
    return part1 + "-" + part2+ "-" + part3+ "-" + part4+ "-" + part5;
}

const API_KEY = getApiKey();

const loadDataFromLocalstorage = () => {
    // Load saved chats and theme from local storage and apply/add on the page
    const defaultText = `
        <div class="default-text">
            <h2>This is Jason AI</h2>
            <h3>Powered by Llama-3-8b</h3>
            <div class="disclaimer">
                <p>Important Notice: This AI may occasionally hallucinate; please verify important information via the navigation bar.</p>
            </div>
        </div>
    `;
    chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to bottom of the chat container
}

const createChatElement = (content, className) => {
    // Create new div and apply chat, specified class and set html content of div
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv; // Return the created chat div
}

const getChatResponse = async (incomingChatDiv) => {
    const API_URL = "https://api.awanllm.com/v1/chat/completions";
    const pElement = document.createElement("p");

    // Define the properties and data for the API request
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
                    content: `You are Jason, a social data scientist. Here is your instruction: ${JSON.stringify(instruction_Details)}. If asked about your resume, provide information based on the details provided: ${JSON.stringify(resumeDetails)}.` 
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
    }

    // Send POST request to API, get response and set the response as paragraph element text
    try {
        const response = await (await fetch(API_URL, requestOptions)).json();
        const botResponse = response.choices[0].message.content.trim();
        
        // Parse the bot response to detect links and make them clickable
        const parsedResponse = parseResponse(botResponse);

        // Set the parsed response as the text content of the paragraph element
        pElement.innerHTML = parsedResponse;

        conversationHistory.push({ role: "assistant", content: botResponse });
    } catch (error) { // Add error class to the paragraph element and set error text
        pElement.classList.add("error");
        pElement.textContent = "Oops! Something went wrong while retrieving the response. Please try again.";
    }

    // Remove the typing animation, append the paragraph element, and save the chats to local storage
    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
    localStorage.setItem("all-chats", chatContainer.innerHTML);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

const parseResponse = (text) => {
    // Regular expression to find URLs within a text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    // Replace URLs with clickable links
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}


const copyResponse = (copyBtn) => {
    // Copy the text content of the response to the clipboard
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(responseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
}

const showTypingAnimation = () => {
    // Display the typing animation and call the getChatResponse function
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
    // Create an incoming chat div with typing animation and append it to chat container
    const incomingChatDiv = createChatElement(html, "incoming");
    chatContainer.appendChild(incomingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    getChatResponse(incomingChatDiv);
}

const handleOutgoingChat = () => {
    userText = chatInput.value.trim(); // Get chatInput value and remove extra spaces
    if (!userText) return; // If chatInput is empty return from here

    // Clear the input field and reset its height
    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <p>${userText}</p>
                    </div>
                </div>`;

    // Create an outgoing chat div with user's message and append it to chat container
    const outgoingChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    // Add user message to the conversation history
    conversationHistory.push({ role: "user", content: userText });

    setTimeout(showTypingAnimation, 500);
}

deleteButton.addEventListener("click", () => {
    // Remove the chats from local storage and call loadDataFromLocalstorage function
    localStorage.removeItem("all-chats");
    conversationHistory = []; // Clear the conversation history
    loadDataFromLocalstorage();
    });

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {
    // Adjust the height of the input field dynamically based on its content
    chatInput.style.height = `${initialInputHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    // If the Enter key is pressed without Shift and the window width is larger 
    // than 800 pixels, handle the outgoing chat
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
  
// Function to handle suggestion button click
const handleSuggestionClick = () => {
    const suggestionsContainer = document.querySelector('.suggestions');
    suggestionsContainer.innerHTML = ''; // Remove all suggestion buttons by clearing innerHTML
  };
  
  // Add event listener to the suggestions container
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('suggestion')) {
      handleSuggestionClick();
    }
  });


  var McButton = $("[data=hamburger-menu]");
var McBar1 = McButton.find("b:nth-child(1)");
var McBar2 = McButton.find("b:nth-child(2)");
var McBar3 = McButton.find("b:nth-child(3)");



McButton.click( function() {
  $(this).toggleClass("active");
  
  if (McButton.hasClass("active")) {
    McBar1.velocity({ top: "50%" }, {duration: 200, easing: "swing"});
    McBar3.velocity({ top: "50%" }, {duration: 200, easing: "swing"})
          .velocity({rotateZ:"90deg"}, {duration: 800, delay: 200, easing: [500,20] });
    McButton.velocity({rotateZ:"135deg"}, {duration: 800, delay: 200, easing: [500,20] });
  } else {
    McButton.velocity("reverse");
    McBar3.velocity({rotateZ:"0deg"}, {duration: 800, easing: [500,20] })
          .velocity({ top: "100%" }, {duration: 200, easing: "swing"});
    McBar1.velocity("reverse", {delay: 800});
  }
});

