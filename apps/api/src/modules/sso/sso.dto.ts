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
  user?: {
    id: string;
    email: string;
    name: string;
    workspaceId: string;
    role: string;
  };
};
