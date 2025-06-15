import { StrataAuth } from "./components/StrataAuth";
import "./App.css";

function App() {
  // These are example values - in a real app, you would get these from your backend
  const projectId = "your-project-id";
  const serviceProviderId = "your-service-provider-id";
  const jwtToken = "your-jwt-token";

  return (
    <div className="app">
      <h1>Strata SDK Example</h1>
      <p>Click the button below to start the OAuth flow:</p>

      <StrataAuth
        projectId={projectId}
        serviceProviderId={serviceProviderId}
        jwtToken={jwtToken}
      />
    </div>
  );
}

export default App;
