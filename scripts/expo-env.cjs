const { spawnSync } = require('child_process');

const mode = process.argv[2] || 'local';
const expoArgs = process.argv.slice(3);

const result = spawnSync('npx', ['expo', 'start', ...expoArgs], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ENJOY_ENV: mode === 'prod' ? 'prod' : 'local' },
});

process.exit(result.status ?? 1);
