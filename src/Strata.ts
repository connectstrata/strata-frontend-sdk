/**
 * @class OAuthWindow - A wrapper around a popup window that handles OAuth flow window management
 * @internal
 */
class OAuthWindow {
  private window: Window | null = null;

  constructor({ window }: { window: Window | null }) {
    this.window = window;
  }

  /**
   * Calculates the optimal position and dimensions for the popup window
   * @param width - Desired width of the popup
   * @param height - Desired height of the popup
   * @returns Object containing the calculated position and dimensions
   */
  static getLayout({ width, height }: { width: number; height: number }): {
    top: number;
    left: number;
    width: number;
    height: number;
  } {
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    return { left, top, width, height };
  }

  /**
   * Checks if the popup window is currently open
   * @returns true if the window is open, false otherwise
   */
  public isOpen(): boolean {
    return !!this.window && !this.window.closed;
  }

  /**
   * Closes the popup window if it's open
   */
  public close(): void {
    if (this.window && !this.window.closed) {
      this.window.close();
    }
  }
}

/**
 * @interface StrataOptions - Configuration options for the Strata SDK
 */
export type StrataOptions = {
  /** The Strata Connect API host URL. Defaults to sandbox environment if not provided */
  connectApiHost?: string;
  /** Enables debug logging when set to true */
  debug?: boolean;
};

/**
 * @enum StrataErrorCode - Error codes that can be returned by the Strata Connect API
 */
export enum StrataErrorCode {
  /** Fallback error code when the specific error is not recognized */
  AuthorizationFailed = "AuthorizationFailed",
  /** The provided Connect API host URL is invalid */
  InvalidConnectApiHost = "InvalidConnectApiHost",
  /** Browser blocked the popup window */
  PopupBlocked = "PopupBlocked",
  /** User's session has expired. Retrying usually resolves this error. */
  SessionExpired = "SessionExpired",
  /** User's session was not found. Retrying usually resolves this error. */
  SessionNotFound = "SessionNotFound",
  /** The provided Project ID is invalid or missing */
  InvalidProjectId = "InvalidProjectId",
  /** The provided Service Provider ID is invalid or missing */
  InvalidServiceProviderId = "InvalidServiceProviderId",
  /** Authorization code is missing from the callback URL */
  MissingCode = "MissingCode",
  /** State parameter is missing from the callback URL */
  MissingState = "MissingState",
  /** JWT token is missing from the request */
  MissingToken = "MissingToken",
  /** The provided JWT token is invalid */
  InvalidToken = "InvalidToken",
  /** Internal server error occurred */
  InternalServerError = "InternalServerError",
}

/**
 * @enum OAuthResultStatus - The set of possible OAuth result statuses
 */
export enum OAuthResultStatus {
  Success = "Success",
  Error = "Error",
}

/**
 * @interface OAuthResult - The result of a user attempting to authorize via oauth
 */
export interface OAuthResult {
  status: OAuthResultStatus;
  code?: StrataErrorCode;
}

/**
 * @class StrataError - Errors thrown by the SDK
 * @extends Error
 */
export class StrataError extends Error {
  /** The specific error code associated with this error */
  code: StrataErrorCode;

  /**
   * Creates a new StrataError
   * @param message - Human readable error message
   * @param code - Specific error code from StrataErrorCode enum
   */
  constructor(message: string, code: StrataErrorCode) {
    super(message);
    this.code = code;
  }
}

const DefaultConnectApiHost = "https://connect.sandbox.connectstrata.com/";
const OAuthAuthorizePath = "/oauth/authorize";

/**
 * @class Strata - The Strata Frontend SDK
 */
export default class Strata {
  private connectApiBaseUrl: URL;
  private debug: boolean;
  private width: number = 600;
  private height: number = 700;
  private oauthWindow: OAuthWindow | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  /**
   * Creates a new instance of the Strata SDK
   * @param options - Configuration options for the SDK
   * @throws {StrataError} If the connectApiHost is not a valid URL
   */
  constructor(options: StrataOptions = {}) {
    this.debug = options.debug || false;

    try {
      this.connectApiBaseUrl = new URL(
        options.connectApiHost || DefaultConnectApiHost
      );
    } catch (error) {
      throw new StrataError(
        "The connectApiHost provided is not a valid URL",
        StrataErrorCode.InvalidConnectApiHost
      );
    }
  }

  /**
   * Authorize an integration for a user
   * @param projectId - The Strata project id
   * @param jwtToken - A signed user JWT token
   * @param serviceProviderId - The service provider id
   * @param options - Optional parameters
   * @param options.customParams - Additional parameters for the server to use when setting up the connection
   * @param options.onClose - Callback function when the auth window is closed
   * @returns Promise that resolves when the OAuth flow completes
   * @throws {StrataError} If the popup is blocked or authorization fails
   * @example
   * ```typescript
   * try {
   *   await strata.authorize('project-123', 'jwt-token', 'shopify', {
   *     customParams: { shop: 'my-shop.myshopify.com' },
   *     onClose: () => console.log('Auth window closed')
   *   });
   *   console.log('Authorization successful');
   * } catch (error) {
   *   if (error instanceof StrataError) {
   *     console.error(`Authorization failed: ${error.code}`);
   *   }
   * }
   * ```
   */
  public authorize(
    projectId: string,
    jwtToken: string,
    serviceProviderId: string,
    options?: {
      customParams?: Record<string, string>;
      onClose?: () => void;
    }
  ): Promise<void> {
    this.cleanup();

    const { onClose, customParams } = options ?? {};

    // https://www.ryanthomson.net/articles/you-shouldnt-call-window-open-asynchronously/
    // how to avoid browser blocking popup:
    // - open popup outside of async context
    // - open popup with a user click in the call stack
    const layout = OAuthWindow.getLayout({
      width: this.width,
      height: this.height,
    });

    const authorizeUrl = new URL(OAuthAuthorizePath, this.connectApiBaseUrl);
    authorizeUrl.searchParams.append("serviceProviderId", serviceProviderId);
    authorizeUrl.searchParams.append("projectId", projectId);
    authorizeUrl.searchParams.append("token", jwtToken);

    if (customParams) {
      Object.entries(customParams).forEach(([k, v]) =>
        authorizeUrl.searchParams.append(k, v)
      );
    }

    if (this.debug) {
      console.log("opening authorize url:", authorizeUrl.href);
    }

    const popup = window.open(
      authorizeUrl.href,
      "_blank",
      `width=${layout.width},height=${layout.height},left=${layout.left},top=${layout.top}`
    );

    return new Promise((resolve, reject) => {
      this.oauthWindow = new OAuthWindow({ window: popup });
      if (!this.oauthWindow.isOpen()) {
        reject(
          new StrataError(
            "Unable to open auth window",
            StrataErrorCode.PopupBlocked
          )
        );
      }

      this.messageListener = (event: MessageEvent) => {
        if (
          event.source !== popup ||
          event.origin !== this.connectApiBaseUrl.origin
        ) {
          return;
        }

        if (this.debug) {
          console.log("received message from auth window", event);
        }

        if (this.isOAuthResult(event.data)) {
          const { status, code } = event.data;
          if (status === OAuthResultStatus.Success) {
            if (this.debug) {
              console.log("authentication successful");
            }
            this.cleanup();
            resolve();
          } else if (status === OAuthResultStatus.Error) {
            if (this.debug) {
              console.log("authentication failed");
            }
            this.cleanup(false);
            // todo - add a better error message for each code
            reject(
              new StrataError(
                "Authorization failed",
                code || StrataErrorCode.AuthorizationFailed
              )
            );
          }
        } else {
          if (this.debug) {
            console.log(
              "received invalid message from auth window",
              event.data
            );
          }
          this.cleanup(false);
          return;
        }
      };

      window.addEventListener("message", this.messageListener);

      const checkPopupClosed = setInterval(() => {
        if (!this.oauthWindow || !this.oauthWindow.isOpen()) {
          if (this.debug) {
            console.log("auth window closed");
          }
          clearInterval(checkPopupClosed);
          this.cleanup();
          onClose?.();
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Type guard to check if an unknown value is an OAuthResult
   * @internal
   */
  private isOAuthResult(data: unknown): data is OAuthResult {
    return typeof data === "object" && data !== null && "status" in data;
  }

  /**
   * Cleans up resources used by the OAuth flow
   * @internal
   * @param closeWindow - Whether to close the popup window
   */
  private cleanup(closeWindow: boolean = true) {
    closeWindow && this.oauthWindow?.close();
    this.oauthWindow = null;

    if (this.messageListener) {
      window.removeEventListener("message", this.messageListener);
      this.messageListener = null;
    }
  }
}
