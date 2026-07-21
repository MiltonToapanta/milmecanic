type MilMecanicEnv = ImportMetaEnv & {
  VITE_APP_NAME?: string;
  VITE_API_URL?: string;
};

const viteEnv = import.meta.env as MilMecanicEnv;

export const env = {
  appName: viteEnv.VITE_APP_NAME ?? 'MilMecanic',
  apiUrl: viteEnv.VITE_API_URL ?? 'http://localhost:3000/api/v1'
};
