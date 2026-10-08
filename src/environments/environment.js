export const environment = {
  production: import.meta.env.VITE_USE_FAKE_API === 'false',
  platformProviderApiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  platformProviderSignInEndpointPath: '/authentication/sign-in',
  platformProviderSignUpEndpointPath: '/authentication/sign-up',
  platformProviderProfilesEndpointPath: '/profiles',
};
