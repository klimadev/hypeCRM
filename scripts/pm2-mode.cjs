#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { execFileSync } = require('node:child_process');

const mode = (process.argv[2] || '').trim();

if (!['prod', 'dev'].includes(mode)) {
  console.error('Usage: node scripts/pm2-mode.cjs <prod|dev>');
  process.exit(1);
}

const apps = {
  prod: ['hypecrm-web-prod', 'hypecrm-chat-scheduler-prod'],
  dev: ['hypecrm-web-dev', 'hypecrm-chat-scheduler-dev'],
};

const legacyNames = ['hypecrm-web', 'hypecrm-chat-scheduler'];

const target = apps[mode];
const opposite = apps[mode === 'prod' ? 'dev' : 'prod'];

function runPm2(args, allowFailure = false) {
  try {
    return execFileSync('pm2', args, {
      cwd: '/var/www/hypeCRM',
      stdio: 'inherit',
    });
  } catch (error) {
    if (allowFailure) {
      return null;
    }

    throw error;
  }
}

function listProcesses() {
  try {
    const output = execFileSync('pm2', ['jlist'], {
      cwd: '/var/www/hypeCRM',
      encoding: 'utf8',
    });

    return JSON.parse(output);
  } catch {
    return [];
  }
}

const processes = listProcesses();
const targetExists = target.filter((name) =>
  processes.some((process) => process?.name === name),
);
const oppositeExists = opposite.filter((name) =>
  processes.some((process) => process?.name === name),
);
const legacyExists = legacyNames.filter((name) =>
  processes.some((process) => process?.name === name),
);

for (const oppositeName of oppositeExists) {
  runPm2(['delete', oppositeName], true);
}

for (const legacyName of legacyExists) {
  runPm2(['delete', legacyName], true);
}

for (const targetName of target) {
  if (targetExists.includes(targetName)) {
    runPm2(['restart', 'ecosystem.config.cjs', '--only', targetName, '--update-env']);
  } else {
    runPm2(['start', 'ecosystem.config.cjs', '--only', targetName, '--update-env']);
  }
}
