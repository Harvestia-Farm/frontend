import type { NextApiRequest, NextApiResponse } from "next";

import { PrivyClient, AuthTokenClaims } from "@privy-io/server-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

export type AuthenticateSuccessResponse = {
  claims: AuthTokenClaims;
};

export type AuthenticationErrorResponse = {
  error: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    AuthenticateSuccessResponse | AuthenticationErrorResponse
  >,
) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];

  console.log('API - Header Auth Token:', headerAuthToken || 'Not provided');
  console.log('API - Cookie Auth Token:', cookieAuthToken || 'Not provided');

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) return res.status(401).json({ error: "Missing auth token" });

  try {
    const claims = await client.verifyAuthToken(authToken);
    console.log('API - Verified Claims:', claims);
    return res.status(200).json({ claims });
  } catch (e: any) {
    console.error('API - Token verification error:', e.message);
    return res.status(401).json({ error: e.message });
  }
}

export default handler;
