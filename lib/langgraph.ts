import { ChatAnthropic } from "@langchain/anthropic";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
    END,
    MessagesAnnotation,
    START,
    StateGraph
} from "@langchain/langgraph";
import SYSTEM_MESSAGE from "../constants/systemMessage";
import { SystemMessage, trimMessages } from "@langchain/core/messages";
import { ChatPromptTemplate, 
    MessagesPlaceholder 
} from "@langchain/core/prompts";


//customers: https://introspection.apis.stepzen.com/customers
//comments: https://dummyjson.com/comments

//trim the messages to manage conversation history
const trimmer = trimMessages({
    maxTokens: 10,
    strategy: "last", 
    tokenCounter: (msgs) => msgs.length,
    includeSystem: true,
    allowPartial: false,
    startOn: "human",
});

// Connect to wxFlows
const toolClient = new wxflows({
    endpoint: process.env.WXFLOWS_ENDPOINT || "",
    apikey: process.env.WXFLOWS_API_KEY,
})

// Retrieve the tools from wxFlows
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);


//A LOT OF THIS CODE IS FROM THE SETTING UP ANTHROPIC CHAT MODEL WITH LANGCHAIN (NIK's JOB)
const initialiseModel = () => {
    const model = new ChatAnthropic({
        modelName: "claude-3-5-sonnet-20241022",
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.7, // Higher temperature for more creative responses
        maxTokens: 4096, // Max tokens for longer responses
        streaming: true, // Enable streaming for SSE
        clientOptions:{
            defaultHeaders: {
                "anthropic-beta": "prompt-caching-2024-07-31",
            },
        },
        callbacks: [
            {
                handleLLMStart: async () => {
                    console.log("🤖 Starting LLM call")
                },
                handleLLMEnd: async (output) => {
                    console.log("🤖 End LLM call", output);
                    const usage = output.llmOutput?.usage;
                    if (usage) {
                        // console.log("📊 Token Usage:", {
                            // input_tokens: usage.input_tokens,
                            // output_tokens: usage.output_tokens,
                            // total_tokens: usage.input_tokens + usage.output_tokens,
                            // cache_creation_input_tokens:
                                // usage.cache_creation_input_tokens || 0,
                            // cache_read_input_tokens: usage.cache_read_input_tokens || 0,
                        // });
                    }
                },
                // handleLLMNewToken: async (token: string) => {
                    // console.log("🔤 New token:", token);
                // },
            },
        ],
    }).bindTools(tools);

    return model;
};


const createworkflow = () => {
    const model = initialiseModel();

    const stateGraph = new StateGraph(MessagesAnnotation);.addNode(
        "agent", 
        async (state) => {
            const systemContent = SYSTEM_MESSAGE;

            //Create the prompt template with system messages and messages placeholder

            const promptTemplate = ChatPromptTemplate.fromMessages([
                new SystemMessage(systemContent, {
                    cache_control: {type: "ephemeral" },  //set a cache breakpoint (max num = 4)
                }),
                new MessagesPlaceholder("messages"),
            ]);

            //trim the messages to manage conversation history
            const trimmedMessages = await trimmer.invoke(state.messages);;

            //Format the prompt template with the trimmed messages
            const formattedPrompt = await promptTemplate.invoke({ messages: trimmedMessages });

            //Get the model response
            const response = await model.invoke(formattedPrompt);

            //Return the response
            return { messages: [response] };
            
            
        }
    )
    .addEdge(START, "agent")
    .addNode('tools', toolNode)
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent")

    return stateGraph;

};

function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
    // Rules of caching headers for turn-by-turn conversations
    // 1. Cache the first SYSTEM message 
    // 2. Cache the LAST message 
    // 3. Cache the second to last HUMAN message 

    if (!messages.length) return messages;
    // Create a copy of messages to avoid mutating the original 
    const cachedMessages = [...messages];

    // Helper to add cache control
    const addCache = (message: BaseMessage) => {
        message.contect = [
            {
                type: "text",
                text: message.context as string,
                cache_control: { type: "ephemeral" },
            },
        ];
    };

    // Cache the last message
    // console.log("🤑🤑🤑 Caching last message");
    addCache(cachedMessages.at(-1)!);

    // Find and cache the second-to-last human message
    let humanCount = 0;
    for (let i = cachedMessages.length - 1; i >= 0; i--) {
        if (cahcedMessages[i] instanceof HumanMessage) {
            humanCount++;
            if (humanCount === 2) {
                // console.log("🤑🤑🤑 Caching last message");
                addCache(cachedMessages[i]);
                break;
            }
        }
    }

    return cachedMessages;
}

export async function submitQuestion(messages: BaseMessage[], chatID: string) {
    // Add caching headers to messages
    const cachedMessages = addCachingHeaders(messages);
    console.log("🔒🔒🔒 Messages:", cachedMessages);

    const workflow = createworkflow();

    // Create a checkpoint to save the state of the conversation
    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer });

    // Run the graph and stream
    const stream = await app.streamEvents(
        {
            messages: cachedMessages,
        },
        {
            version: "v2",
            configurable: {
                thread_id: chatID,
            },
            streamMode: "messages",
            runID: chatID,
        }
    );

    return stream;
}
