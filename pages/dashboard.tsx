import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import Head from "next/head";

// Function to get and log auth tokens
function logAuthTokens() {
  // Parse cookies
  let privyToken = 'Not found';
  const cookieString = document.cookie;
  
  if (cookieString) {
    const cookieArray = cookieString.split(';');
    for (const cookie of cookieArray) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'privy-token' && value) {
        privyToken = value;
        break;
      }
    }
  }
  
  console.log('Client-side Cookie Auth Token:', privyToken);
  
  // Get authorization header token using Privy's getAccessToken
  getAccessToken().then(token => {
    console.log('Authorization Header Token:', token || 'Not found');
  });
}

// Function to log the user object being sent to custom endpoint
function logBody(user: any) {
  console.log('Request Body - User Object:');
  
  // Log important user properties
  console.log('- User ID:', user?.id || 'Not available');
  console.log('- Email:', user?.email?.address || 'Not available');
  console.log('- Wallet Address:', user?.wallet?.address || 'Not available');
  
  // Log linked accounts
  console.log('- Linked Accounts:', user?.linkedAccounts?.length || 0);
  if (user?.linkedAccounts?.length > 0) {
    user.linkedAccounts.forEach((account: any, index: number) => {
      console.log(`  Account ${index + 1}:`, account.type);
    });
  }
  
  // Log complete user object with pretty-print
  console.log('- Complete User Object:');
  console.log(JSON.stringify(user, null, 2));
}

async function verifyToken() {
  const url = "/api/verify";
  const accessToken = await getAccessToken();
  console.log('Access token:', accessToken);
  console.log('Authorization header:', `Bearer ${accessToken}`);
  
  // Create headers object to log
  const headers = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
  };
  console.log('Request headers:', headers);
  
  const result = await fetch(url, {
    headers,
  });

  const responseData = await result.json();
  console.log('Token verification response:', responseData);
  return responseData;
}

// Function to send auth data to custom endpoint
async function sendToPrivyAuthEndpoint(user: any) {
  try {
    const accessToken = await getAccessToken();
    console.log('Sending to custom endpoint - Access Token:', accessToken);
    
    // Log the request body contents
    console.log('Logging request body before sending:');
    logBody(user);
    
    // From your server code: "if (!bodyAuthToken) return res.status(401)..."
    // It seems bodyAuthToken is expected to be the actual user data
    const requestBody = {
      bodyAuthToken: user  // The actual user data from usePrivy()
    };
    
    console.log('Sending request body:', requestBody);
    
    const response = await fetch('http://localhost:8000/api/v1/auth/privyAuth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('Response from custom endpoint:', data);
    return data;
  } catch (error) {
    console.error('Error sending data to custom endpoint:', error);
    return { error: 'Failed to send data to custom endpoint' };
  }
}

export default function DashboardPage() {
  const [verifyResult, setVerifyResult] = useState();
  const [customEndpointResult, setCustomEndpointResult] = useState();
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
    
    if (ready && authenticated && user) {
      console.log('User authenticated on dashboard:', user);
      
      // Log auth tokens
      logAuthTokens();
      
      // Automatically send to custom endpoint
      sendToPrivyAuthEndpoint(user).then(setCustomEndpointResult);
    }
  }, [ready, authenticated, router, user]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  return (
    <>
      <Head>
        <title>Privy Auth Demo</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
          <>
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-12 flex gap-4 flex-wrap">
              {googleSubject ? (
                <button
                  onClick={() => {
                    unlinkGoogle(googleSubject);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink Google
                </button>
              ) : (
                <button
                  onClick={() => {
                    linkGoogle();
                  }}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                >
                  Link Google
                </button>
              )}

              {twitterSubject ? (
                <button
                  onClick={() => {
                    unlinkTwitter(twitterSubject);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink Twitter
                </button>
              ) : (
                <button
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                  onClick={() => {
                    linkTwitter();
                  }}
                >
                  Link Twitter
                </button>
              )}

              {discordSubject ? (
                <button
                  onClick={() => {
                    unlinkDiscord(discordSubject);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink Discord
                </button>
              ) : (
                <button
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                  onClick={() => {
                    linkDiscord();
                  }}
                >
                  Link Discord
                </button>
              )}

              {email ? (
                <button
                  onClick={() => {
                    unlinkEmail(email.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink email
                </button>
              ) : (
                <button
                  onClick={linkEmail}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                >
                  Connect email
                </button>
              )}
              {wallet ? (
                <button
                  onClick={() => {
                    unlinkWallet(wallet.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink wallet
                </button>
              ) : (
                <button
                  onClick={linkWallet}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect wallet
                </button>
              )}
              {phone ? (
                <button
                  onClick={() => {
                    unlinkPhone(phone.number);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink phone
                </button>
              ) : (
                <button
                  onClick={linkPhone}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect phone
                </button>
              )}

              <button
                onClick={() => verifyToken().then(setVerifyResult)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Verify token on server
              </button>

              <button
                onClick={() => logAuthTokens()}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Log Auth Tokens
              </button>

              <button
                onClick={() => logBody(user)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Log Request Body
              </button>

              <button
                onClick={() => sendToPrivyAuthEndpoint(user).then(setCustomEndpointResult)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Send to Custom Endpoint
              </button>

              {Boolean(verifyResult) && (
                <details className="w-full">
                  <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Server verify result
                  </summary>
                  <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                    {JSON.stringify(verifyResult, null, 2)}
                  </pre>
                </details>
              )}

              {Boolean(customEndpointResult) && (
                <details className="w-full">
                  <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Custom endpoint result
                  </summary>
                  <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                    {JSON.stringify(customEndpointResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : null}
      </main>
    </>
  );
}
