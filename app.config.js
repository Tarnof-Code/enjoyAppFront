const { loadEnjoyEnv } = require('./config/loadEnv.cjs');

const enjoyEnv = process.env.ENJOY_ENV === 'prod' ? 'prod' : 'local';
loadEnjoyEnv(enjoyEnv);

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
    enjoyEnv,
  },
});
