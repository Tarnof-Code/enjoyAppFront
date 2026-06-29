const fs = require('fs');
const path = require('path');

const ENV_DIR = path.join(__dirname, '..', '.env');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const result = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

/** Charge .env.local puis .env.prod si mode prod (même logique que enjoyWebApp). */
function loadEnjoyEnv(mode) {
  Object.assign(process.env, parseEnvFile(path.join(ENV_DIR, '.env.local')));
  if (mode === 'prod') {
    Object.assign(process.env, parseEnvFile(path.join(ENV_DIR, '.env.prod')));
  }
}

module.exports = { loadEnjoyEnv };
