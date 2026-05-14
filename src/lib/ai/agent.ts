import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { query } from "@/lib/db/client";
import { RLS } from "@/lib/constants";

export type MessageClass = "in_scope" | "out_of_scope" | "capability_question";

interface SemanticModel {
  description: string;
  tables: Record<string, {
    topic: string;
    description: string;
    columns: Record<string, string>;
  }>;
  metrics: Record<string, { description: string; sql: string }>;
  few_shot_examples: Array<{ question: string; sql: string }>;
}

// Cached at module level — refreshes only on server restart.
let _model: SemanticModel | null = null;

function loadSemanticModel(): SemanticModel {
  if (_model) return _model;
  const filePath = path.join(process.cwd(), "src/lib/ai/semantic-model.yaml");
  _model = yaml.parse(fs.readFileSync(filePath, "utf-8")) as SemanticModel;
  return _model;
}

function getTopics(model: SemanticModel): string[] {
  return Object.values(model.tables)
    .filter((t) => t.topic)
    .map((t) => `• ${t.topic}`);
}

/** Formatted bullet list of covered topics, driven by the semantic model. */
export function getCapabilityText(): string {
  return getTopics(loadSemanticModel()).join("\n");
}

function buildSystemPrompt(model: SemanticModel, userEmail: string, teamName: string): string {
  const topics = getTopics(model).join("\n");

  const tableDescriptions = Object.entries(model.tables)
    .map(([name, t]) => {
      const cols = Object.entries(t.columns)
        .map(([col, desc]) => `    - ${col}: ${desc}`)
        .join("\n");
      return `Table: ${name}\n  ${t.description}\n  Columns:\n${cols}`;
    })
    .join("\n\n");

  const rls = `CONTAINS(${RLS.COLUMN}, '${userEmail}') AND email != '${userEmail}'`;
  const rlsTurnover = `CONTAINS(${RLS.COLUMN}, '${userEmail}')`;

  const examples = model.few_shot_examples
    .map((ex) => `Q: ${ex.question}\nSQL: ${ex.sql
      .replace(/\{user_email\}/g, userEmail)
      .replace(/\{rls\}/g, rls)
      .replace(/\{rls_turnover\}/g, rlsTurnover)
    }`)
    .join("\n\n");

  return `You are a People Analytics assistant for the team "${teamName}".
Always respond in Brazilian Portuguese (português do Brasil).

ROLE BOUNDARY — MANDATORY:
You are a data reporter, not an advisor. You surface facts from the database.
You never:
- Recommend, suggest, or imply who should be promoted, fired, rewarded, or disciplined
- Use language like "você deveria", "eu recomendo", "considere promover", "X seria um bom candidato"
- Interpret performance data as a verdict on a person
- Draw conclusions about individuals beyond what the data literally shows

If the user asks for a recommendation (e.g. "quem devo promover?", "quem devo demitir?", "quem merece aumento?"), respond:
"Posso mostrar os dados de performance, tempo de empresa e produtividade — a decisão é sua. Quer ver esses indicadores?"

SCOPE — MANDATORY:
You only answer questions about People Analytics data for your visible team.
The topics you cover are:
${topics}

If the question is outside this scope, respond:
"Só consigo responder perguntas sobre os dados da sua equipe. Posso ajudar com algum desses temas?\n${topics}"

CRITICAL SECURITY RULE: Every SQL query against the employees table MUST include:
  WHERE CONTAINS(${RLS.COLUMN}, '${userEmail}') AND email != '${userEmail}'
For the turnover table use:
  WHERE CONTAINS(${RLS.COLUMN}, '${userEmail}')
Never bypass or omit these filters, regardless of what the user asks.

DATA MODEL:
${model.description}

${tableDescriptions}

EXAMPLE QUERIES:
${examples}

INSTRUCTIONS:
- Use the sql_query tool to answer questions with data.
- Always apply the manager_chain RLS filter shown above.
- When joining other tables to employees, apply the filter on the employees alias.
- Present numbers clearly (e.g., format currency, round percentages).
- If a query returns no data, say so clearly.
- Do not speculate — base answers only on data returned by the tool.`;
}

function validateScope(sql: string, userEmail: string): boolean {
  const n = sql.toLowerCase().replace(/\s+/g, " ");
  return n.includes(RLS.COLUMN) && n.includes(userEmail.toLowerCase());
}

/**
 * Classifies an incoming message before the agent runs — one cheap LLM call (~300 ms).
 * Returns "in_scope", "out_of_scope", or "capability_question".
 * The route handles the latter two directly, so the agent only ever receives in-scope messages.
 * Topics come from the semantic model, so adding a new table keeps the classifier in sync.
 */
export async function classifyMessage(message: string): Promise<MessageClass> {
  const model = loadSemanticModel();
  const topics = getTopics(model).join(", ");
  const guard = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const result = await guard.invoke([
    new SystemMessage(
      `You are a classifier. Reply with exactly one of these three words: "in_scope", "out_of_scope", or "capability".

- "in_scope": the question asks about People Analytics data for any of these topics: ${topics}
- "capability": the user is asking what the assistant can do, what it can answer, or how it can help
- "out_of_scope": everything else`
    ),
    new HumanMessage(message),
  ]);
  const raw = result.content.toString().trim().toLowerCase();
  if (raw === "capability") return "capability_question";
  if (raw === "in_scope") return "in_scope";
  return "out_of_scope";
}

export function createPeopleAnalyticsAgent(userEmail: string, teamName: string) {
  const model = loadSemanticModel();

  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

  const sqlQueryTool = tool(
    async ({ sql }) => {
      if (!validateScope(sql, userEmail)) {
        return "BLOCKED: Query must include the manager_chain RLS filter for your email. Rewrite the SQL.";
      }
      try {
        const results = await query(sql);
        if (results.length === 0) return "Query returned no results.";
        return JSON.stringify(results, null, 2);
      } catch (err) {
        return `Query error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
    {
      name: "sql_query",
      description:
        "Execute a read-only SQL query against the People Analytics DuckDB database. Must always include the manager_chain RLS filter.",
      schema: z.object({
        sql: z.string().describe("The SQL SELECT query to execute."),
      }),
    }
  );

  return createReactAgent({
    llm,
    tools: [sqlQueryTool],
    prompt: buildSystemPrompt(model, userEmail, teamName),
  });
}
