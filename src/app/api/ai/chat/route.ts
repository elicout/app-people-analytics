import { auth } from "@/lib/auth";
import { createPeopleAnalyticsAgent } from "@/lib/ai/agent";
import { NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json() as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const { teamId, teamName } = session.user;
  const agent = createPeopleAnalyticsAgent(teamId, teamName);

  try {
    const result = await agent.invoke({
      messages: [new HumanMessage(message)],
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const content = typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

    return NextResponse.json({ response: content });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json({ error: "Agent failed to respond" }, { status: 500 });
  }
}
