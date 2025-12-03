# strata-frontend-sdk

### Installing from npm

Install the frontend SDK with your favorite package manager:

```bash
$ npm install @connectstrata/frontend-sdk
```

### Setup

#### 1. Generate a signing key in the Strata dashboard

In the Strata dashboard, navigate to the [Settings](https://app.connectstrata.com/settings) page by selecting `Settings` in the sidebar. Click `Generate New Keypair` to get a new signing key. Save the private key somewhere secure. You will not be able to see it again.

#### 2. Create signed user JWT tokens in your app backend

**In your app backend**, generate a user [JWT](https://jwt.io/) token for each user and make it available to the frontend. If your frontend is a client-side javascript application, this likely means creating an API endpoint that the frontend can use to fetch a user JWT token. Never expose the signing key directly to the frontend.

Use the following JWT header claims:
- alg: The algorithm used to sign the JWT. Must be `RS256`.
- typ: The type of token. Must be `JWT`.

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

Use the following JWT payload claims `sub`, `iat`, `exp`, `project_id`.
- project_id: Your Strata project ID. This can be found on the [Settings](https://app.connectstrata.com/settings) page
- sub: The JWT subject. This is your primary identifier for the user.
- iat: The JWT issued at timestamp in seconds since the Unix epoch. Typically the current time.
- exp: The JWT expiration timestamp in seconds since the Unix epoch (must be later than the iat claim).

```json
{
  "project_id": "your_project_id",
  "sub": "user_or_company_id",
  "iat": 1749602274,
  "exp": 1749602290
}
```

You can optionally include an `external_id` claim. If provided, it will be used as the user / company identifier and takes precedence over the `sub` claim.

Here is a sample implementation with a Next.js API endpoint:

```typescript
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/*
 * Generates a user JWT token for the Strata SDK
 */
export async function POST() {
  const projectId = process.env.STRATA_PROJECT_ID;
  const currentTime = Math.floor(Date.now() / 1000);
  const payload: jwt.JwtPayload = {
    sub: "user_or_company_id",
    project_id: process.env.STRATA_PROJECT_ID,
    iat: currentTime,
  };

  const privateKey = process.env.PRIVATE_KEY;
  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });

  return NextResponse.json({ token });
}
```

### 3. Prompt a user to authorize your integration

To start the authorization flow for your integration, call `strata.authorize` with a signed user jwt. The function call returns a `Promise` that resolves when the user successfully completes the auth flow. It fails with an error if the authorization fails or the user closes the window without authorizing your app.

```typescript
import Strata from "@strata/frontend-sdk";

const strata = new Strata();

strata.authorize(jwtToken, "slack");
```

Some integrations require additional parameters. For example, Shopfiy requires the merchant's shop subdomain. You can provide additional custom parameters to the authorize call:

```typescript
strata.authorize(jwtToken, "shopify", {
  customParams: {
    shop: "connectstrata.myshopify.com",
  },
});
```
