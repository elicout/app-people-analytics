/**
 * POST /api/ai/chat
 * Body:     { message: string }
 * Response: { response: string } | { error: string }
 * Auth:     requires valid session — email and teamName are read from the server session, never from the request body.
 *
 * Pipeline:
 *   1. classifyMessage() — lightweight LLM classifier (one call, ~300 ms).
 *      "capability_question" → returns topic list; agent never runs.
 *      "out_of_scope"        → returns refusal + topic list; agent never runs.
 *      "in_scope"            → continues to the ReAct agent.
 *   2. createPeopleAnalyticsAgent() — full ReAct agent with sql_query tool.
 */
import { auth } from "@/lib/auth";
import { createPeopleAnalyticsAgent, classifyMessage, getCapabilityText } from "@/lib/ai/agent";
import { NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";

const CAPABILITY_INTRO = "Posso responder perguntas sobre os dados da sua equipe:\n\n";
const CAPABILITY_FOOTER = "\n\nNão faço recomendações sobre pessoas — apresento dados e a decisão é sempre sua.";
const OUT_OF_SCOPE_INTRO = "Só consigo responder perguntas sobre os dados da sua equipe. Posso ajudar com:\n\n";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json() as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const classification = await classifyMessage(message);

    if (classification === "capability_question") {
      return NextResponse.json({
        response: CAPABILITY_INTRO + getCapabilityText() + CAPABILITY_FOOTER,
      });
    }

    if (classification === "out_of_scope") {
      return NextResponse.json({
        response: OUT_OF_SCOPE_INTRO + getCapabilityText(),
      });
    }

    const { email, teamName } = session.user;
    const agent = createPeopleAnalyticsAgent(email!, teamName);

    const result = await agent.invoke({
      messages: [new HumanMessage(message)],
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const content =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return NextResponse.json({ response: content });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: "Falha ao processar sua pergunta. Tente novamente." },
      { status: 500 }
    );
  }
}
