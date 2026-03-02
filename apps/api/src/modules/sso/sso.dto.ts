export type SsoLoginResponse = {
  authorizationUrl: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
};

export type SsoCallbackResponse = {
  status: "ok" | "disabled" | "missing_code";
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    workspaceId: string;
    role: string;
  };
};

export type SsoRefreshInput = {
  refreshToken: string;
  workspaceId: string;
};

export type SsoRefreshResponse = {
  status: "ok" | "disabled" | "missing_refresh";
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type SsoLogoutInput = {
  idToken: string;
  postLogoutRedirectUri?: string;
};

export type SsoLogoutResponse = {
  status: "ok" | "unsupported" | "disabled" | "missing_id_token";
  logoutUrl?: string;
};
