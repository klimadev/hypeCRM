#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const mode = (process.argv[2] || '').trim();

if (!['prod', 'dev'].includes(mode)) {
  console.error('Usage: node scripts/pm2-mode.cjs <prod|dev>');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const ecosystem = path.join(root, 'ecosystem.config.cjs');
const apps = {
  prod: ['hypecrm-web-prod', 'hypecrm-chat-scheduler-prod'],
  dev: ['hypecrm-web-dev', 'hypecrm-chat-scheduler-dev'],
};
const legacyNames = ['hypecrm-web', 'hypecrm-chat-scheduler'];

function runPm2(args, allowFailure = false) {
  try {
    return execFileSync('pm2', args, {
      cwd: root,
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
      cwd: root,
      encoding: 'utf8',
    });
    return JSON.parse(output);
  } catch {
    return [];
  }
}

const processes = listProcesses();
const processNames = new Set(processes.map((process) => process?.name).filter(Boolean));
const target = apps[mode];
const opposite = apps[mode === 'prod' ? 'dev' : 'prod'];

for (const name of [...opposite, ...legacyNames]) {
  if (processNames.has(name)) {
    runPm2(['delete', name], true);
  }
}

for (const name of target) {
  const action = processNames.has(name) ? 'restart' : 'start';
  runPm2([action, ecosystem, '--only', name, '--update-env']);
}
