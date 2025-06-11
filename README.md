# strata-frontend-sdk

## Setup

1. Generate a signing key

Login to the Strata web app and generate a signing key

2. Create signed user JWT tokens

**In your application backend**, generate a user [JWT](https://jwt.io/) token for each user and make it available to your frontend. If your frontend is a client-side javascript application, this likely means creating an API endpoint that the frontend can use to get a user JWT token. Never expose the signing key directly to your application frontend.

The JWT must include the following claims: `sub`, `iat`, `exp`

```json
{
    "sub": "user-or-company-id"
    "iat": 1749602274
    "exp": 1749602290
}
```

You can optionally include an `external-id` claim. If provided, it will be used as the user / company identifier and takes precedence over the `sub` claim.

3. Install the frontend SDK

Install the frontend SDK from npm

`npm install @connectstrata/frontend-sdk`

4. Authenticate your user

```typescript
import Strata from "@strata/frontend-sdk";

const Strata = new Strata();
await strata.authenticate("<your_project_id>", "<signed_user_token");
```

5. Get current user integration state

```typescript
strata.getUser();
```

6. Display the Connect UI for an integration

```typescript
strata.connect("service_provider_id", {
  customParams: {
    // additional metadata needed to setup the connection (i.e. some integrations require the user's subdomain)
  },
  onSuccess: () => {
    // handle successful auth flow
  },
  onError: () => {
    // handle auth flow error
  },
  onClose: () => {
    // handle window closed before auth completed
  },
});
```
