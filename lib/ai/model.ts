import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";

const DEFAULT_PROVIDER = "xai";

const DEFAULT_MODEL_BY_PROVIDER = {
  openai: "gpt-4.1-mini",
  xai: "grok-4-fast-non-reasoning-latest",
} as const;

type ChatModelProvider = keyof typeof DEFAULT_MODEL_BY_PROVIDER;

const isChatModelProvider = (
  value: string,
): value is ChatModelProvider => value in DEFAULT_MODEL_BY_PROVIDER;

export function getChatModel() {
  const provider =
    process.env.AI_MODEL_PROVIDER?.trim().toLowerCase() ?? DEFAULT_PROVIDER;

  if (!isChatModelProvider(provider)) {
    throw new Error(
      `Unsupported AI_MODEL_PROVIDER "${provider}". Expected one of: ${Object.keys(
        DEFAULT_MODEL_BY_PROVIDER,
      ).join(", ")}`,
    );
  }

  const modelId =
    process.env.AI_MODEL_ID?.trim() || DEFAULT_MODEL_BY_PROVIDER[provider];

  switch (provider) {
    case "openai":
      return openai(modelId);
    case "xai":
      return xai(modelId);
  }
}
