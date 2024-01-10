import { useState } from "react";
import "./App.css";
import { agentExecutor } from "./utils/agentExecutor";
// import { chain } from "./utils/chain";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const onChange = (e) => {
    setInput(e.target.value);
  };

  const onSubmit = async () => {
    if (input.trim() !== "") {
      setInput(""); // Clear the input field after adding the message
      setMessages((prevMessages) => [
        ...prevMessages,
        { name: "human", mess: input },
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
        })
        .then((response) => {
          console.log(response);
          setMessages((prevMessages) => [
            ...prevMessages,
            { name: "AI", mess: response.output },
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
