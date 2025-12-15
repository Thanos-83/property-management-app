
export function getAurinkoAuthUrl(provider: 'Google' | 'Office365', loginHint?: string | null) {
  const clientId = process.env.AURINKO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/aurinko/callback`;
  
  // Aurinko scopes
  let scopes = 'Mail.Read Mail.Send Mail.Drafts';
  let nativeScopes = '';

  if (provider === 'Office365') {
    nativeScopes = 'offline_access';
  }

  // Common params
  const params = new URLSearchParams({
    clientId: clientId as string,
    serviceType: provider,
    scopes: scopes,
    responseType: 'code',
    returnUrl: redirectUri,
    recycle: 'true',
  });

  // Add nativeScopes if not empty
  if (nativeScopes) {
    params.append('nativeScopes', nativeScopes);
  }

  // Provider specific params
  if (provider === 'Google') {
    params.set('access_type', 'offline');
    params.set('accessType', 'offline'); // Try camelCase as well
    params.set('prompt', 'consent'); // Force refresh token
  }

  if (loginHint) {
    params.append('loginHint', loginHint);
  }

  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
}
