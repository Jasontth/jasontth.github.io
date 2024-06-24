const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const suggestionBoxes = document.querySelectorAll('.suggestion-box');

function addMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.padding = '10px';
    messageElement.style.margin = '5px 0';
    messageElement.style.borderRadius = '5px';
    messageElement.style.maxWidth = '70%';

    if (isUser) {
        messageElement.style.backgroundColor = '#5C5C5C';
        messageElement.style.alignSelf = 'flex-end';
    } else {
        messageElement.style.backgroundColor = '#444654';
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim() !== '') {
        addMessage(this.value, true);
        // Simulated bot response
        setTimeout(() => {
            addMessage("I'm Jason. This is my resume website");
        }, 1000);
        this.value = '';
    }
});

suggestionBoxes.forEach(box => {
    box.addEventListener('click', function() {
        const suggestion = this.textContent.trim();
        addMessage(`Tell me about: ${suggestion}`, true);
        // Simulated bot response
        setTimeout(() => {
            addMessage(`Sure, I'd be happy to tell you about ${suggestion}. What specific information would you like to know?`);
        }, 1000);
    });
});
