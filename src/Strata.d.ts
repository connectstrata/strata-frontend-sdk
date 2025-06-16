export type StrataOptions = {
  connectApiHost?: string;
  debugMode?: boolean;
};

export enum StrataErrorCode {
  AuthorizationFailed = "AuthorizationFailed",
  InvalidConnectApiHost = "InvalidConnectApiHost",
  PopupBlocked = "PopupBlocked",
  SessionExpired = "SessionExpired",
  SessionNotFound = "SessionNotFound",
  InvalidProjectId = "InvalidProjectId",
  InvalidServiceProviderId = "InvalidServiceProviderId",
  MissingCode = "MissingCode",
  MissingState = "MissingState",
  MissingToken = "MissingToken",
  InvalidToken = "InvalidToken",
  InternalServerError = "InternalServerError",
}

export enum OAuthResultStatus {
  Success = "Success",
  Error = "Error",
}

export interface OAuthResult {
  status: OAuthResultStatus;
  code?: StrataErrorCode;
}

export class StrataError extends Error {
  code: StrataErrorCode;
  constructor(message: string, code: StrataErrorCode);
}

declare class Strata {
  constructor(options?: StrataOptions);

  /**
   * Start an oauth flow for a user to authorize an integration
   * @param projectId - The Strata project id
   * @param jwtToken - A signed user JWT token
   * @param serviceProviderId - The service provider id
   * @param options - Optional parameters
   * @returns A promise that resolves when the OAuth flow completes (success, error, or the user closes the popup)
   */
  authorize(
    projectId: string,
    jwtToken: string,
    serviceProviderId: string,
    options?: {
      customParams?: Record<string, string>;
      onClose?: () => void;
    }
  ): Promise<void>;
}

export default Strata;
