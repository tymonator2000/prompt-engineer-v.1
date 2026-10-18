// Provider-specific prompting guidance, distilled from each provider's official guide.
// The guide is picked by the provider of the selected model (Claude -> Anthropic, GPT -> OpenAI, ...).
// Guides change rarely: refresh them by hand when shipping a new extension version.

export const GUIDES = {
  anthropic: {
    name: "Anthropic",
    title: "Prompting best practices",
    url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
    retrieved: "2026-10-18",
    target: "Claude models",
    rules: [
      "Be clear and direct. Treat the model as a brilliant new employee with no context on the user's norms: state the desired output, format and constraints explicitly. If the user wants above-and-beyond effort, ask for it explicitly.",
      "Explain the why. Give the motivation behind instructions (e.g. 'this will be read aloud, so avoid ellipses') instead of bare rules; Claude generalizes from the reason.",
      "Use numbered steps when the order or completeness of steps matters.",
      "Use examples to steer format, tone and structure: relevant, diverse (cover edge cases), wrapped in <example> tags (several in <examples>). 3-5 examples work best.",
      "Structure prompts that mix instructions, context, examples and inputs with consistent, descriptive XML tags (<instructions>, <context>, <input>), nested when content is hierarchical.",
      "Set a role in one sentence when it focuses behaviour and tone.",
      "For long inputs (documents, data), put the data at the top, wrapped in <document> tags with <source> metadata, and put the question/instructions at the end.",
      "Control output format positively: say what to do instead of what not to do ('write flowing prose paragraphs' rather than 'no markdown'). Match the prompt's own style to the desired output style.",
      "Current Claude models are concise by default; if the user needs detail, summaries or progress updates, ask for them explicitly.",
      "Avoid over-prompting: dial back aggressive language ('CRITICAL: You MUST...' -> 'Use X when...') and blanket 'if in doubt, do X' rules; current models are very responsive to instructions and over-trigger on them.",
      "For complex reasoning, ask the model to think through the problem before answering, or to choose an approach and commit to it rather than revisiting decisions."
    ]
  },

  openai: {
    name: "OpenAI",
    title: "Prompt engineering",
    url: "https://developers.openai.com/api/docs/guides/prompt-engineering",
    retrieved: "2026-10-18",
    target: "OpenAI GPT and reasoning models",
    rules: [
      "Separate high-level rules from the request: put identity, tone, goals and business rules in developer/instructions; put the end-user's input in the user message. Think of the developer message as a function definition and the user message as its arguments.",
      "Structure the developer message in this order: Identity (purpose, style, goals) -> Instructions (rules, what to do and what never to do) -> Examples -> Context.",
      "Use Markdown headers and lists to mark sections and hierarchy; use XML tags to delimit reference material, with attributes for metadata the instructions can refer to.",
      "State explicitly what the model should and should not do.",
      "Add a handful of diverse input/output examples (few-shot) when the desired output is easier to show than to describe.",
      "Put context and reference data that changes between requests near the end; put stable, reused content at the beginning (better for prompt caching).",
      "Match the style to the model type: GPT models are like a junior coworker and need precise, explicit, step-by-step instructions; reasoning models are like a senior coworker and work best with a high-level goal and success criteria rather than micro-steps.",
      "For agentic tasks, tell the model to plan, keep going until the whole request is resolved, briefly explain notable actions, and track progress (TODO list or rubric).",
      "If the prompt relies on proprietary or recent facts, include them in the prompt or restrict the answer to the provided sources."
    ]
  },

  google: {
    name: "Google",
    title: "Prompt design strategies",
    url: "https://ai.google.dev/gemini-api/docs/prompting-strategies",
    retrieved: "2026-10-18",
    target: "Gemini models",
    rules: [
      "Give clear, specific instructions: phrase the input as a question, a task, an entity to operate on, or a partial input to complete.",
      "Be precise and direct; avoid unnecessary or overly persuasive wording. Define ambiguous terms and parameters.",
      "Set explicit constraints (what to do and not do, length limits) and specify the response format (table, bullet list, paragraph, keywords, JSON).",
      "Always include few-shot examples when possible: specific, varied, consistently formatted (same tags, whitespace, separators). Don't use so many that the model overfits; with clear examples, instructions can be shorter.",
      "Use a response prefix or start the output yourself (e.g. 'Output:', an opening '{', 'I. Introduction') to force a structure.",
      "Provide the context the model needs and, when relevant, tell it to answer only from the supplied information.",
      "Use one consistent delimiter style per prompt (XML tags or Markdown headings) to separate role, instructions, constraints, context and task.",
      "Put persona, critical constraints and output format at the start (or in the system instruction). For long contexts, put all the data first and the instructions/question at the end, bridged by a phrase like 'Based on the information above...'.",
      "Gemini answers concisely by default: ask explicitly for a detailed or conversational answer when needed.",
      "Don't ask for visible step-by-step reasoning; for hard problems, a short request to think carefully is enough.",
      "Break complex tasks into simpler prompts (one instruction per prompt, chained steps) when a single prompt tries to do too much.",
      "For time-sensitive tasks, state the current date and that answers must be grounded in provided or searched sources."
    ]
  },

  mistral: {
    name: "Mistral AI",
    title: "Prompting",
    url: "https://docs.mistral.ai/inference/prompting",
    retrieved: "2026-10-18",
    target: "Mistral models",
    rules: [
      "Use two levels of instructions: general context and behaviour in the system prompt, per-turn instructions in the user prompt. If the user can't set a system prompt, put the general instructions at the start of the user message.",
      "Open with a clear role and task: 'You are a <role>, your task is to <task>.'",
      "Organize instructions hierarchically, with clear sections and subsections.",
      "Make the prompt complete: write it so someone with no prior context could do the task from the prompt alone.",
      "Delimit sections with Markdown and/or XML-style tags.",
      "Use few-shot examples to improve understanding, accuracy and especially output format; embed them in the prompt or as user/assistant turns.",
      "When the output will be parsed, ask for a specific JSON format.",
      "Replace vague quantities and terms ('too long', 'many', 'few', 'better', 'interesting') with objective, explicit definitions.",
      "Remove contradictions; express conditional logic as an explicit decision tree.",
      "Don't make the model count (characters, words); provide counts as input instead.",
      "Ask only for the output that's needed (e.g. only changes or a NO_OP marker, not full records).",
      "Prefer worded rating scales ('Very Low' ... 'Very Good') over numeric scales.",
      "For classification, list the categories, add a catch-all category, and include examples."
    ]
  }
};

export function guideBlock(provider) {
  const g = GUIDES[provider];
  return `<provider_guide>
The improved prompt will run on ${g.target}. Apply ${g.name}'s official guidance ("${g.title}", ${g.url}) where it genuinely helps this prompt:
${g.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}
</provider_guide>`;
}
