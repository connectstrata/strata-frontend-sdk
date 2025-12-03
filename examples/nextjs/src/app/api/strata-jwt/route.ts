import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Generates a user JWT token for the Strata SDK
 */
export async function POST() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set");
  }

  const projectId = process.env.STRATA_PROJECT_ID;
  if (!projectId) {
    throw new Error("STRATA_PROJECT_ID is not set");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const payload: jwt.JwtPayload = {
    sub: "my_user_id",
    project_id: process.env.STRATA_PROJECT_ID,
    iat: currentTime,
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });

  return NextResponse.json({ token });
}
