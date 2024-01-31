import { useState } from "react";
import "./App.css";
import { agentExecutor } from "./utils/agentExecutor";
// import { chain } from "./utils/chain";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const onChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      onSubmit();
    }
  };

  const onSubmit = async () => {
    if (input.trim() !== "") {
      setInput(""); // Clear the input field after adding the message
      setMessages((prevMessages) => [
        ...prevMessages,
        { name: "human", mess: input },
      ]);
      setChatHistory((prevMessages) => [
        ...prevMessages,
        new HumanMessage(input),
      ]);

      //   chain
      //     .invoke({ question: input})
      //     .then((response) => {
      //       setMessages((prevMessages) => [
      //         ...prevMessages,
      //         { name: "AI", mess: response },
      //       ]);
      //     });
      // }
      agentExecutor
        .invoke({
          input: input,
          chat_history: chatHistory,
        })
        .then((response) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            { name: "AI", mess: response.output },
          ]);
          setChatHistory((prevMessages) => [
            ...prevMessages,
            new AIMessage(response.output),
          ]);
        });
    }
  };

  return (
    <>
      <div>
        <input
          name="user-input"
          type="text"
          id="user-input"
          required
          onChange={onChange}
          value={input}
          onKeyDown={handleKeyPress}
        />
        <button onClick={onSubmit}>Enter</button>
      </div>
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <strong>{message.name}: </strong>
              {message.mess}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
