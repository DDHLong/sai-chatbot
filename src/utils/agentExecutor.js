import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/community/tools/dynamic";
import { chain } from "./chain";

const clothingArray = [
  "T-shirt",
  "Blazer",
  "Dress",
  "Jeans",
  "Skirt",
  "Jacket",
  "Trousers",
  "Blouse",
  "Sweater",
  "Coat",
  "Shorts",
  "Hoodie",
  "Jumpsuit",
  "Cardigan",
  "Leggings",
];

const clothingItems = [
  { type: "T-shirt", size: "M", quantity: 15, color: "Blue", brand: "Adidas" },
  { type: "Dress", size: "S", quantity: 10, color: "Red", brand: "Zara" },
  { type: "Jeans", size: "L", quantity: 20, color: "Black", brand: "Levi's" },
  { type: "Skirt", size: "XS", quantity: 12, color: "Pink", brand: "H&M" },
  { type: "Jacket", size: "XL", quantity: 8, color: "Green", brand: "Nike" },
  {
    type: "Trousers",
    size: "M",
    quantity: 18,
    color: "Gray",
    brand: "Calvin Klein",
  },
  { type: "Blouse", size: "L", quantity: 25, color: "White", brand: "Mango" },
  { type: "Sweater", size: "S", quantity: 14, color: "Brown", brand: "Gap" },
  { type: "Coat", size: "M", quantity: 9, color: "Beige", brand: "Burberry" },
  {
    type: "Shorts",
    size: "XS",
    quantity: 22,
    color: "Yellow",
    brand: "Tommy Hilfiger",
  },
];

const mockApiCallItemStatus = (item) => {
  const itemStatus = clothingItems.filter((i) => i.type === item);
  console.log(">>>", item, itemStatus);
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        name: "ItemStatusAPI",
        content: itemStatus[0],
      };
      resolve(mockData);
    }, 1000);
  });
};

const mockApiCall = (item) => {
  return new Promise((resolve) => {
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
  callbacks: [
    {
      handleLLMEnd(output) {
        console.log(JSON.stringify(output, null, 2));
      },
    },
  ],
});

const tools = [
  new DynamicStructuredTool({
    name: "documents-search",
    description: "Call this when user want a description of an item",
    schema: z.object({
      question: z.string().describe("input of user"),
    }),
    func: async ({ question }) => await chain.invoke({ question: question }), // Outputs still must be strings
  }),
  new DynamicStructuredTool({
    name: "detail-query",
    description: `Call this when user want to know the status of items. Input should have be ask about these: "quantity", "size", "color" or "brand".`,
    schema: z.object({
      item: z.string().describe(`Just find in these option: ${clothingArray}`),
    }),
    func: async ({ item }) => {
      const itemMatch = clothingArray.find((i) => i === item);
      if (!itemMatch) {
        return `We don't currently have ${item} in the store.`;
      }
      const itemStatus = await mockApiCallItemStatus(item);
      return JSON.stringify({
        result: itemStatus,
      });
    }, // Outputs still must be strings
  }),
  new DynamicStructuredTool({
    name: "order",
    description: `call this if customer have the intent to buy the items. input should be similar to "I want to order X" or "I want to buy X".`,
    schema: z.object({
      item: z.string().describe("The item user want to order"),
    }),
    func: async ({ item }) =>
      `I have confirm you want to buy ${item}.Please provide us the quantity you want to buy,your phone number, address in this format: "quantity - your phone number - address" `,
  }),
  new DynamicStructuredTool({
    name: "order-confirm",
    description: `call this if customer type in their address and phone in this format "quantity - phone number - address"`,
    schema: z.object({
      quantity: z.number().describe("Quantity of item they want to buy"),
      phone: z.string().describe("Phone number of the customer"),
      address: z.string().describe("Address of the customer"),
    }),
    func: async ({ phone, address }) =>
      `we will deliver to ${address}. Thank you for the order`,
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
    `You are a helpful and enthusiastic saleman who must answer using at least one provided tools.Don't add anything else to your answer beside given context. If you really can not find answer using provided tools, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@perfin.com. Always give answer in Vietnamese`,
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
