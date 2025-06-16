# strata-frontend-sdk

### Setup

#### 1. Generate a signing key in the Strata UI

Login to the Strata web app and generate a signing key on the [Settings](https://app.connectstrata.com/settings) page.

#### 2. Create signed user JWT tokens in your app backend

**In your app backend**, generate a user [JWT](https://jwt.io/) token for each user and make it available to the frontend. If your frontend is a client-side javascript application, this likely means creating an API endpoint that the frontend can use to get a user JWT token. Never expose the signing key directly to the frontend.

The JWT must include the following claims: `sub`, `iat`, `exp`.

```json
{
    "sub": "user_or_company_id"
    "iat": 1749602274
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

#### 3. Install the frontend SDK

Install the frontend SDK from npm

```
$ npm install @connectstrata/frontend-sdk
```

#### 4. Create an SDK instance and prompt a user to authorize an integration

Call `strata.authorize` with a signed user jwt from your backend. The function call returns a `Promise` that resolves when the user successfully completes the auth flow or closes the auth window. It fails with an error if the authorization fails. You can provide an optional `onClose` handler that's executed when the window is closed.

```typescript
import Strata from "@strata/frontend-sdk";

const strata = new Strata();

strata.authorize(projectId, jwtToken, "slack");
```

Some integrations require additional parameters. For example, Shopfiy requires the merchant's shop subdomain. You can provide additional custom parameters to the authorize call:

```typescript
strata.authorize(projectId, jwtToken, "shopify", {
  shop: "connectstrata.myshopify.com",
});
```
