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
  
  // Log complete user object with pretty-print
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
    
    // The actual user data from usePrivy()
    const requestBody = {
      bodyAuthToken: user  
    };
    
    console.log('Sending request body:', requestBody);
    
    const response = await fetch('http://localhost:8000/api/v1/auth/privyAuth', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('Response from custom endpoint:', data);
    
    // Store the authentication token result
    if (data.status === 'success') {
      console.log('JWT Token received:', data.data.token);
      // Store the JWT token in localStorage
      localStorage.setItem('harvestia_token', data.data.token);
      console.log('JWT Token stored in localStorage');
      return data;
    } else {
      console.error('Failed to retrieve token:', data.message);
      // Clear the token from localStorage if authentication failed
      localStorage.removeItem('harvestia_token');
      return { error: data.message };
    }
  } catch (error) {
    console.error('Error sending data to custom endpoint:', error);
    return { error: 'Failed to send data to custom endpoint' };
  }
}

// Function to fetch character profile
async function fetchCharacterProfile(jwtToken: string) {
  try {
    console.log('Fetching character profile with JWT token:', jwtToken);
    
    const response = await fetch('http://localhost:8000/api/v1/character/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    const data = await response.json();
    console.log('Character profile response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching character profile:', error);
    return { error: 'Failed to fetch character profile' };
  }
}

// Add a function to get the token from localStorage
function getStoredJwtToken() {
  return localStorage.getItem('jwt_token');
}

export default function DashboardPage() {
  const [verifyResult, setVerifyResult] = useState();
  const [customEndpointResult, setCustomEndpointResult] = useState();
  const [authTokenResult, setAuthTokenResult] = useState<any>();
  const [characterProfile, setCharacterProfile] = useState<any>();
  const [tokenCopied, setTokenCopied] = useState(false);
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

  // Function to copy token to clipboard
  const copyTokenToClipboard = () => {
    if (authTokenResult?.data?.token) {
      navigator.clipboard.writeText(authTokenResult.data.token)
        .then(() => {
          setTokenCopied(true);
          setTimeout(() => setTokenCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy token:', err);
        });
    }
  };

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
                onClick={() => sendToPrivyAuthEndpoint(user).then(result => {
                  setCustomEndpointResult(result);
                  // Store the auth token result when we get a successful response
                  if (result.status === 'success') {
                    setAuthTokenResult(result);
                  }
                })}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                POST for authentication
              </button>

              <button
                onClick={() => {
                  // First try to get token from authTokenResult, then fallback to localStorage
                  const token = authTokenResult?.data?.token || getStoredJwtToken();
                  if (token) {
                    fetchCharacterProfile(token).then(setCharacterProfile);
                  } else {
                    console.error('No JWT token available. Please get auth token first.');
                    alert('Please get auth token first by clicking "POST for authentication"');
                  }
                }}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                GET Character Profile
              </button>

              <button
                onClick={() => {
                  window.open('/game/index.html', '_blank');
                }}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Start Game Now
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

              {Boolean(authTokenResult) && (
                <details className="w-full" open>
                  <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Auth Token
                  </summary>
                  
                  {authTokenResult?.data?.token && (
                    <div className="mt-4 mb-4">
                      <div className="flex items-center">
                        <h3 className="text-md font-semibold">JWT Token:</h3>
                        <button
                          onClick={copyTokenToClipboard}
                          className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          {tokenCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-x-auto">
                        <code className="text-sm break-all">{authTokenResult.data.token}</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        This token has been set as cookies: 'auth_token' (HTTP-only).
                      </p>
                    </div>
                  )}
                  
                  <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                    {JSON.stringify(authTokenResult, null, 2)}
                  </pre>
                </details>
              )}

              {Boolean(characterProfile) && (
                <details className="w-full">
                  <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Character Profile
                  </summary>
                  <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                    {JSON.stringify(characterProfile, null, 2)}
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
