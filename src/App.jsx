import { useState, useEffect } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

function App() {
  const key = import.meta.env.VITE_API_KEY;
  const [messages, setMessages] = useState([
    { message: "Hello, I'm Sai! Ask me anything!", sentTime: "just now", sender: "ChatGPT" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [textFileContent, setTextFileContent] = useState("");

  useEffect(() => {
    fetch("/public/WHO guidlines.txt")
      .then((response) => response.text())
      .then((text) => setTextFileContent(text))
      .catch((error) => console.error("Error loading text file:", error));
  }, []);

  const handleSend = async (message) => {
    const newMessage = { message, direction: "outgoing", sender: "user" };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);

    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) {
    const systemMessage = {
      role: "system",
      content: `You are a health assistant. Use the following text to assist in answering: ${textFileContent}. 
                Only respond to questions related to health, diet, nutrients, or allergies, as well as greetings. 
                If the user's query is not related to these topics, reply with: 'You should ask me about your health.'`,
    };

    const apiMessages = chatMessages.map((msg) => ({
      role: msg.sender === "ChatGPT" ? "assistant" : "user",
      content: msg.message,
    }));

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...apiMessages],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    });

    const data = await response.json();
    setMessages([
      ...chatMessages,
      { message: data.choices[0].message.content, sender: "ChatGPT" },
    ]);
    setIsTyping(false);
  }

  return (
    <div className="App">
      <div className="chat-container">
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={isTyping ? <TypingIndicator content="Sai is typing" /> : null}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`message-wrapper ${msg.sender === "ChatGPT" ? "bot" : "user"}`}>
                  {msg.sender === "ChatGPT" && (
                    <img
                      src="/public/Bot-health.png" // Path to bot image in the public folder
                      alt="Bot"
                      className="bot-image"
                    />
                  )}
                  <div className="message-content">
                    <Message
                      model={{
                        message: msg.message,
                        sentTime: msg.sentTime,
                        sender: msg.sender,
                        direction: msg.sender === "ChatGPT" ? "incoming" : "outgoing",
                      }}
                      className={msg.sender === "ChatGPT" ? "bot" : "user"}
                    />
                  </div>
                  {msg.sender === "user" && (
                    <img
                      src="/public/UserImage.png" // Path to user image in the public folder
                      alt="User"
                      className="user-image"
                    />
                  )}
                </div>
              ))}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
