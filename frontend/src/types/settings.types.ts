export type ApiFieldKey =
  | 'e2b_api_key'
  | 'github_personal_access_token'
  | 'claude_code_oauth_token'
  | 'z_ai_api_key'
  | 'openrouter_api_key';

export interface HelperTextLink {
  prefix: string;
  anchorText: string;
  href: string;
}

export interface HelperTextCode {
  prefix: string;
  code: string;
  suffix: string;
}

export interface GeneralSecretFieldConfig {
  key: ApiFieldKey;
  label: string;
  description: string;
  placeholder: string;
  helperText?: HelperTextLink | HelperTextCode;
}
