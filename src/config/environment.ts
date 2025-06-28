
export const getAlphaVantageApiKey = (): string | undefined => {
  return import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
};

export const isAlphaVantageConfigured = (): boolean => {
  return !!getAlphaVantageApiKey();
};

export const getEnvironmentInfo = () => {
  return {
    alphaVantageConfigured: isAlphaVantageConfigured(),
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV
  };
};
