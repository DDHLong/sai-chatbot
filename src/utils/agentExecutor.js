import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/community/tools/dynamic";
import { chain } from "./chain";

const mockApiCall = (item) => {
  return new Promise((resolve) => {
    // Simulate API call with a delay of 1.5 seconds
    setTimeout(() => {
      const mockData = {
        name: "PriceAPI",
        content: { name: item, price: 20000, currency: "VND" },
      };
      resolve(mockData);
    }, 1000);
  });
};

const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0,
});

const tools = [
  new DynamicStructuredTool({
    name: "documents-search",
    description:
      "Query related infomation about the product and its relevant data",
    schema: z.object({
      question: z.string().describe("input of user"),
    }),
    func: async ({ question }) => await chain.invoke({ question: question }), // Outputs still must be strings
  }),
  new DynamicStructuredTool({
    name: "order",
    description: `call this if customer have the intent to buy the items. input should be similar to "I want to order X" or "I want to buy X".`,
    schema: z.object({
      item: z.string().describe("The item user want to order"),
    }),
    func: async ({ item }) => `${item} order is confirm`,
  }),
  new DynamicStructuredTool({
    name: "price",
    description: `call this to get the price of item. input should be asking how much. "bnh" is a vietnamese slang for how much.`,
    schema: z.object({
      item: z.string().describe("The item user want to know the price"),
    }),
    func: async ({ item }) => {
      const res = await mockApiCall(item);
      return JSON.stringify({
        result: res,
      });
    },
  }),
];

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful and enthusiastic saleman who must answer using at least one provided tools. If you really can not find answer using provided tools, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@perfin.com. Always give answer in Vietnamese`,
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const agent = await createOpenAIFunctionsAgent({
  llm,
  tools,
  prompt,
});

export const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
});
