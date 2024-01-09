import { useState } from "react";
import "./App.css";
import { chain } from "./utils/chain";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const onChange = (e) => {
    setInput(e.target.value);
  };

  const onSubmit = async () => {
    if (input.trim() !== "") {
      setMessages((prevMessages) => [
        ...prevMessages,
        { name: "human", mess: input },
      ]);

      setInput(""); // Clear the input field after adding the message

      chain
        .invoke({ question: input, language: "vietnamese" })
        .then((response) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            { name: "AI", mess: response },
          ]);
        });
    }
  };
  console.log(messages);

  return (
    <>
      <div>
        <input
          name="user-input"
          type="text"
          id="user-input"
          required
          onChange={onChange}
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
