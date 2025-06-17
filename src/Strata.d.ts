import { StrataErrorCode } from "./Strata";

export type StrataOptions = {
  connectApiHost?: string;
  debugMode?: boolean;
};

export interface AuthorizeOptions {
  customParams?: Record<string, string>;
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
   * @param options - Optional parameters for the authorization flow
   * @returns A promise that resolves when the OAuth flow completes (success, error, or the user closes the popup)
   */
  authorize(
    projectId: string,
    jwtToken: string,
    serviceProviderId: string,
    options?: AuthorizeOptions
  ): Promise<void>;
}

export default Strata;
