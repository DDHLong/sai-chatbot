import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { z } from "zod";
import {
  DynamicStructuredTool,
} from "@langchain/community/tools/dynamic";
import { chain } from "./chain";

const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0,
});

const tools = [
  new DynamicStructuredTool({
    name: "documents-search",
    description: "Query related infomation about Scrimba",
    schema: z.object({
      question: z.string().describe("input of user"),
    }),
    func: async ({ question }) => await chain.invoke({ question: question }), // Outputs still must be strings
  }),
  new DynamicStructuredTool({
    name: "order",
    description: `call this to seal a deal with the user. input should be similar to "I want to order X".`,
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
    func: async ({ item }) => `${item} price is 20$`,
  }),
];

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful and enthusiastic support that must answer using at least one provided tools. If you really can not find answer using provided tools, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@perfin.com. Always give answer in Vietnamese`,
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
});
