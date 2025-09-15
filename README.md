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

The JWT must include the following claims: `sub`, `iat`, `exp`.

```json
{
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
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates a JWT token for Strata integration user auth
 */
export async function POST() {
  const currentTime = Math.floor(Date.now() / 1000);
  const payload: jwt.JwtPayload = {
    sub: "my_user_id",
    iat: currentTime,
  };

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set");
  }

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

strata.authorize(projectId, jwtToken, "slack");
```

Some integrations require additional parameters. For example, Shopfiy requires the merchant's shop subdomain. You can provide additional custom parameters to the authorize call:

```typescript
strata.authorize(projectId, jwtToken, "shopify", {
  customParams: {
    shop: "connectstrata.myshopify.com",
  },
});
```
