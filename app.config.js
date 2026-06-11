module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
    googleApiKey:
      process.env.GOOGLE_API_KEY ?? 'AIzaSyBZXkEFqMLe991haSx1XOJcA3oqPaJlI-Y',
  },
});
