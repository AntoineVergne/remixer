export const AI_API_BASE_PATH = "/ai/v1";

export type AiProviderId = "anthropic" | "openai" | "kimi";

export type AiTier = "anonymous" | "free" | "trusted" | "admin";

export type AiViewerRole =
  | "anonymous"
  | "subscriber"
  | "editor"
  | "administrator"
  | string;

export type AiUseCaseId =
  | "manifesto_remix"
  | "homepage_chat"
  | "policy_summary"
  | string;

export type AiAccessTokenClaims = {
  iss: string;
  aud: "3dpolitics-ai";
  sub: string;
  sid: string;
  role: AiViewerRole;
  tier: AiTier;
  use_cases: AiUseCaseId[];
  page_id?: number;
  iat: number;
  exp: number;
};

export type AiBootstrapResponse = {
  ai_base_url: string;
  access_token: string;
  expires_at: string;
  viewer: {
    is_logged_in: boolean;
    user_id: string | null;
    role: AiViewerRole;
  };
  use_case: {
    id: AiUseCaseId;
    display_name: string;
    requires_login: boolean;
    max_input_chars?: number;
    remaining_today?: number | null;
  };
};

export type ManifestoRemixInput = {
  style_id: string;
  custom_author?: string;
};

export type ChatMessageInput = {
  conversation_id?: string;
  message: string;
};

export type AiExecuteRequest<TInput = unknown> = {
  use_case: AiUseCaseId;
  input: TInput;
  context?: {
    page_id?: number;
    page_slug?: string;
    locale?: string;
    referrer_path?: string;
  };
};

export type AiExecuteResponse<TOutput = unknown> = {
  request_id: string;
  use_case: AiUseCaseId;
  output: TOutput;
  usage: {
    provider: AiProviderId;
    model: string;
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
  };
  limits?: {
    remaining_today?: number;
  };
};

export type AiErrorResponse = {
  error:
    | "invalid_request"
    | "unauthorized"
    | "forbidden"
    | "rate_limit_exceeded"
    | "quota_exceeded"
    | "request_blocked"
    | "provider_error"
    | "service_unavailable"
    | "internal_error"
    | string;
  message: string;
  request_id?: string;
};

export type AiPublicUseCaseConfig = {
  id: AiUseCaseId;
  display_name: string;
  requires_login: boolean;
  input_schema?: Record<string, string>;
};
