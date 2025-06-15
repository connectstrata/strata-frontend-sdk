import { useState } from "react";
import Strata from "strata-frontend-sdk";

interface StrataAuthProps {
  projectId: string;
  serviceProviderId: string;
  jwtToken: string;
}

export function StrataAuth({
  projectId,
  serviceProviderId,
  jwtToken,
}: StrataAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const strata = new Strata({
        debugMode: true, // Enable debug mode for development
      });

      await strata.authorize(projectId, jwtToken, serviceProviderId, {
        onClose: () => {
          console.log("Auth window closed");
        },
      });

      console.log("Authorization successful!");
    } catch (err) {
      console.error("Authorization failed:", err);
      setError(err instanceof Error ? err.message : "Authorization failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="strata-auth">
      <button onClick={handleAuthorize} disabled={isLoading}>
        {isLoading ? "Authorizing..." : "Connect with Strata"}
      </button>

      {error && <div className="error">Error: {error}</div>}
    </div>
  );
}
