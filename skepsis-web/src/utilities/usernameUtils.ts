// Utility functions for username management
export const clearUsernamePromptHistory = (walletAddress: string) => {
  // Clear any old localStorage entries that might prevent username prompts
  localStorage.removeItem(`username-prompt-${walletAddress}`);
  localStorage.removeItem(`username-declined-${walletAddress}`);
};

export const hasDeclinedUsername = (walletAddress: string): boolean => {
  return localStorage.getItem(`username-declined-${walletAddress}`) === 'true';
};

export const markUsernameDeclined = (walletAddress: string) => {
  localStorage.setItem(`username-declined-${walletAddress}`, 'true');
};
