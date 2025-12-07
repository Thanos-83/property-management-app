export function getAurinkoAuthUrl(provider: 'Google' | 'Office365') {
  const clientId = process.env.AURINKO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/aurinko/callback`;
  const scopes = 'Mail.Read Mail.Send Mail.Drafts'; // offline_access gives us the refresh token

  // Construct the URL
  // We pass 'returnUrl' to redirect the user back to settings after success
  return `https://api.aurinko.io/v1/auth/authorize?clientId=${clientId}&serviceType=${provider}&scopes=${scopes}&responseType=code&returnUrl=${redirectUri}`;
}
