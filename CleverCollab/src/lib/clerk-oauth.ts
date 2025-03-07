/**
 * This file contains configuration for Clerk OAuth providers.
 * It's used to ensure proper initialization of OAuth clients.
 */

export const oauthProviders = {
  // Configure Atlassian OAuth provider
  atlassian: {
    // The name of the OAuth provider
    name: "atlassian",
    
    // The scopes required for Jira API access
    scopes: [
      "read:jira-user",
      "read:jira-work",
      "read:me",
      "offline_access"
    ],
    
    // The strategy to use for token refresh
    strategy: "oauth_refresh_token"
  }
};

// Export the OAuth provider configuration
export default oauthProviders; 