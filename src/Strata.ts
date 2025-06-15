/**
 * A wrapper around a popup window that starts an oauth flow
 */
class OAuthWindow {
  private window: Window | null = null;

  constructor({ window }: { window: Window | null }) {
    this.window = window;
  }

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

  public isOpen(): boolean {
    return !!this.window && !this.window.closed;
  }

  public close(): void {
    if (this.window && !this.window.closed) {
      this.window.close();
    }
  }
}

/**
 * @interface StrataOptions - SDK configuration options
 * @param connectApiHost - The Strata Connect API host
 * @param debugMode - Whether to enable debug mode
 */
export type StrataOptions = {
  connectApiHost?: string;
  debugMode?: boolean;
};

/**
 * @enum StrataErrorCode - The set of possible error codes returned by the Strata Connect API
 */
export enum StrataErrorCode {
  // fallback if error code isn't recognized
  AuthorizationFailed = "AuthorizationFailed",
  // frontend errors
  InvalidConnectApiHost = "InvalidConnectApiHost",
  PopupBlocked = "PopupBlocked",
  // session errors
  SessionExpired = "SessionExpired",
  SessionNotFound = "SessionNotFound",
  // invalid request
  MissingProjectId = "MissingProjectId",
  InvalidProjectId = "InvalidProjectId",
  InvalidServiceProviderId = "InvalidServiceProviderId",
  MissingCode = "MissingCode",
  MissingState = "MissingState",
  MissingToken = "MissingToken",
  InvalidToken = "InvalidToken",
  // dreaded 500 error
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
 */
export class StrataError extends Error {
  code: StrataErrorCode;

  constructor(message: string, code: StrataErrorCode) {
    super(message);
    this.code = code;
  }
}

const DefaultConnectApiHost = "https://connect.connectstrata.com/";
const OAuthAuthorizePath = "/oauth/authorize";

/**
 * The Strata Frontend SDK
 */
export default class Strata {
  private connectApiBaseUrl: URL;
  private debug: boolean;
  private width: number = 600;
  private height: number = 700;
  private oauthWindow: OAuthWindow | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  /**
   * @param {Object} [options] - SDK configuration options
   * @param {string} [options.connectApiHost] - The Strata Connect API host
   * @param {boolean} [options.debugMode] - Whether to enable debug mode
   */
  constructor(options: StrataOptions = {}) {
    this.debug = options.debugMode || false;

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
   * Start an oauth flow for a user to authorize an integration
   * @param {string} projectId - The Strata project id
   * @param {string} jwtToken - A signed user JWT token
   * @param {string} serviceProviderId - The service provider id
   * @param {Object} [options] - Optional parameters
   * @param {Object} [options.customParams] - Custom parameters to add to the OAuth URL
   * @param {Function} [options.onClose] - Callback when the popup is closed
   * @returns {Promise<void>} A promise that resolves when the OAuth flow completes
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

  private isOAuthResult(data: unknown): data is OAuthResult {
    return typeof data === "object" && data !== null && "status" in data;
  }

  private cleanup(closeWindow: boolean = true) {
    closeWindow && this.oauthWindow?.close();
    this.oauthWindow = null;

    if (this.messageListener) {
      window.removeEventListener("message", this.messageListener);
      this.messageListener = null;
    }
  }
}
