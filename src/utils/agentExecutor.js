import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/community/tools/dynamic";
import { chain } from "./chain";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import { OpenAIFunctionsAgentOutputParser } from "langchain/agents/openai/output_parser";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import {
  checkNoNullFieldsOrEmptyStrings,
  findKeysWithNullValues,
} from "./ultils";

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

let orderDetail = { quantity: null, phone: null, name: null, address: null };

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
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.5,
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
    description:
      "Call this when user want a description of an item or information regarding the size",
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
  // new DynamicStructuredTool({
  //   name: "order",
  //   description: `call this if customer have the intent to buy or order the items. input should be similar to "I want to order X" or "I want to buy X".`,
  //   schema: z.object({
  //     item: z.string().describe("The item user want to order"),
  //   }),
  //   func: async ({ item }) =>
  //     `I have confirm you want to buy ${item}. How many you want to buy?" `,
  // }),
  new DynamicStructuredTool({
    name: "quantity",
    description: `call this if answer the question of how many do the customer want to buy.`,
    schema: z.object({
      quantity: z.number().describe("The number of items user want to order"),
    }),
    func: async ({ quantity }) => {
      orderDetail.quantity = quantity;
      console.log(">>>", orderDetail);
      return "Can please you give me your name, phone number and the address?";
    },
  }),
  new DynamicStructuredTool({
    name: "order-detail",
    description: `call this if one of these is null or empty string ${JSON.stringify(
      {
        orderDetail: orderDetail,
      }
    )}, after customer answer the quantity of the item they want to buy`,
    schema: z.object({
      item: z.string().describe("The item user want to order"),
      name: z.string().nullable().describe("The name of the customer"),
      phone: z.string().nullable().describe("The phone number of the customer"),
      address: z.string().nullable().describe("The address of the customer"),
    }),
    func: async ({ item, name, phone, address }) => {
      orderDetail.name = name;
      orderDetail.phone = phone;
      orderDetail.address = address;
      if (checkNoNullFieldsOrEmptyStrings(orderDetail)) {
        console.log(">>>>", orderDetail);
        return `I have confirm your order :\n${item}, quantity: ${orderDetail.quantity}\naddress: ${name}, ${phone}, ${address}`;
      } else {
        console.log(">>>", orderDetail);
        return `Can you please provide more detail of ${
          findKeysWithNullValues(orderDetail)[0]
        }`;
      }
    },
  }),
  // new DynamicStructuredTool({
  //   name: "order-detail-confirm",
  //   description: `call this if customer type in their address and phone in this format "quantity - phone number - address"`,
  //   schema: z.object({
  //     quantity: z.number().describe("Quantity of item they want to buy"),
  //     phone: z.string().describe("Phone number of the customer"),
  //     address: z.string().describe("Address of the customer"),
  //   }),
  //   func: async ({ phone, address }) =>
  //     `we will deliver to ${address}. Thank you for the order`,
  // }),
  new DynamicStructuredTool({
    name: "price",
    description: `call this to get the price of item. Input should be customer asking how much. "bnh" is a vietnamese slang for how much.`,
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

const MEMORY_KEY = "chat_history";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful and enthusiastic saleman who capable of persuade customers to buy items.Don't add anything else to your answer beside given context. If you really can not find answer using provided tools, say "I'm sorry, I don't know the answer to that." And direct the questioner to customer support email help@perfin.com. Do not make up any infomation about the customer.`,
  ],
  new MessagesPlaceholder(MEMORY_KEY),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const modelWithFunctions = llm.bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
});

const agentWithMemory = RunnableSequence.from([
  {
    input: (i) => i.input,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
    chat_history: (i) => i.chat_history,
  },
  prompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
]);

// const agent = await createOpenAIFunctionsAgent({
//   llm,
//   tools,
//   prompt,
// });

// export const agentExecutor = new AgentExecutor({
//   agent,
//   tools,
//   verbose: true,
// });

export const agentExecutor = AgentExecutor.fromAgentAndTools({
  agent: agentWithMemory,
  tools,
  verbose: true,
});
