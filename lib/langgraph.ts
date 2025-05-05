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
