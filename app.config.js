module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
  },
});
