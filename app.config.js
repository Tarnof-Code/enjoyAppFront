module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googleApiKey:
      process.env.GOOGLE_API_KEY ?? 'AIzaSyBZXkEFqMLe991haSx1XOJcA3oqPaJlI-Y',
  },
});
