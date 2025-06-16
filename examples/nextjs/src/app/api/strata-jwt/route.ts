import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Generates a user JWT token for the Strata SDK
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
