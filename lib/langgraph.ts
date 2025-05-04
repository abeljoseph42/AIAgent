import { ChatAnthropic } from "@langchain/anthropic";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";


//customers: https://introspection.apis.stepzen.com/customers
//comments: https://dummyjson.com/comments

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


