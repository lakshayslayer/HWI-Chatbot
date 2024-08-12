import { useState, useEffect, useRef } from "react";
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
    { message: "Hello, I'm Swasth! Ask me anything!", sentTime: "just now", sender: "ChatGPT" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [textFileContent, setTextFileContent] = useState("");
  const [soundTracks, setSoundTracks] = useState([
    { name: "Rainforest", file: "/public/mixkit-light-rain-loop-1253 (1).wav" },
    { name: "Autumn Sky", file: "/public/autumn-sky-meditation-7618.mp3" },
    { name: "Deep Meditaion", file: "/public/deep-meditation-192828.mp3" },
    { name: "Flute", file: "/public/flute-meditation-music-8-230805.mp3" },
    { name: "Meditation Blue", file: "/public/meditation-blue-138131.mp3" },
    { name: "Thunderstrom", file: "/public/mixkit-calm-thunderstorm-in-the-jungle-2415 (1).wav" },
    { name: "Campfire", file: "/public/mixkit-campfire-crackles-1330.wav" },
    { name: "Light-Rain", file: "/public/mixkit-light-rain-loop-1253 (1).wav" },
    { name: "Birds", file: "/public/mixkit-morning-birds-2472.wav" },
    { name: "River in Forest", file: "/public/mixkit-river-in-the-forest-with-birds-1216 (1).wav" },
    { name: "Heavy-Rain", file: "/public/mixkit-thunderstorm-and-rain-loop-2402 (1).wav" },
  ]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const audioRef = useRef(null); // Ref to manage the audio element

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
                If the user's query indicates that they are experiencing stress, depression, anxiety, or related symptoms, suggest nature soundtracks that may help alleviate their discomfort. 
                Provide a mental well-being helpline number (14416) with some motivational quotes if relevant. 
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
    const botMessage = data.choices[0].message.content;

    // Check if the bot's response includes a recommendation for nature sounds
    if (botMessage.includes("soundtracks")) {
      const playSoundMessage = {
        message: "It seems like you're feeling stressed. Here are some calming nature sounds for you:",
        sentTime: "just now",
        sender: "ChatGPT",
      };
      
      // Select 3 random soundtracks
      const randomTracks = soundTracks
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setSelectedTracks(randomTracks);

      setMessages([...chatMessages, playSoundMessage]);
    } else {
      setMessages([
        ...chatMessages,
        { message: botMessage, sender: "ChatGPT" },
      ]);
    }

    // Check if the user's query is related to mental well-being
    if (apiMessages.some(msg => msg.content.toLowerCase().includes("stress") || msg.content.toLowerCase().includes("depression") || msg.content.toLowerCase().includes("anxiety"))) {
      const helplineMessage = {
        message: "If you need someone to talk to, please call the mental well-being helpline: 14416. Remember, 'Every day may not be good, but there is something good in every day.'",
        sentTime: "just now",
        sender: "ChatGPT",
      };
      setMessages(prevMessages => [...prevMessages, helplineMessage]);
    }

    setIsTyping(false);
  }

  const playNatureSound = (file) => {
    if (audioRef.current) {
      audioRef.current.pause(); // Stop the currently playing audio
      audioRef.current.currentTime = 0; // Reset to the start
    }
    
    audioRef.current = new Audio(file); // Create a new audio element
    audioRef.current.play(); // Play the selected soundtrack
  };

  return (
    <div className="App">
      <div className="chat-container">
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={isTyping ? <TypingIndicator content="Swasth is typing" /> : null}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`message-wrapper ${msg.sender === "ChatGPT" ? "bot" : "user"}`}>
                  {msg.sender === "ChatGPT" && (
                    <img
                      src="https://raw.githubusercontent.com/lakshayslayer/HWI-Chatbot/main/public/Bot-health.png"
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
                    {msg.message.includes("Here are some calming nature sounds for you:") && (
                      <div className="sound-buttons">
                        {selectedTracks.map((track, idx) => (
                          <button key={idx} onClick={() => playNatureSound(track.file)}>
                            {track.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.sender === "user" && (
                    <img
                      src="https://raw.githubusercontent.com/lakshayslayer/HWI-Chatbot/main/public/UserImage.png"
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
