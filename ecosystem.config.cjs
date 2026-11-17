const path = require('node:path');

const root = __dirname;
const prodPort = process.env.PM2_PROD_PORT || '3434';
const devPort = process.env.PM2_DEV_PORT || '3434';

const common = {
  cwd: root,
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  watch: false,
  min_uptime: '5s',
  max_restarts: 30,
  restart_delay: 2000,
  kill_timeout: 5000,
  time: true,
  merge_logs: true,
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'hypecrm-web-prod',
      script: path.join(root, 'node_modules/next/dist/bin/next'),
      args: 'start -H 0.0.0.0',
      max_memory_restart: process.env.PM2_PROD_MEMORY || '1G',
      env: {
        NODE_ENV: 'production',
        PORT: prodPort,
        UNDICI_SOCKET_FAMILY: 'ipv4',
        ...(process.env.PM2_PROD_NODE_ARGS
          ? { NODE_OPTIONS: process.env.PM2_PROD_NODE_ARGS }
          : {}),
      },
    },
    {
      ...common,
      name: 'hypecrm-web-dev',
      script: path.join(root, 'node_modules/next/dist/bin/next'),
      args: 'dev -H 0.0.0.0',
      max_memory_restart: process.env.PM2_DEV_MEMORY || '1G',
      env: {
        NODE_ENV: 'development',
        PORT: devPort,
        UNDICI_SOCKET_FAMILY: 'ipv4',
      },
    },
    {
      ...common,
      name: 'hypecrm-chat-scheduler-prod',
      script: path.join(root, 'node_modules/tsx/dist/cli.mjs'),
      args: 'scripts/chat-scheduled-messages-worker.ts',
      max_memory_restart: process.env.PM2_PROD_MEMORY || '256M',
      env: {
        NODE_ENV: 'production',
        UNDICI_SOCKET_FAMILY: 'ipv4',
      },
    },
    {
      ...common,
      name: 'hypecrm-chat-scheduler-dev',
      script: path.join(root, 'node_modules/tsx/dist/cli.mjs'),
      args: 'watch scripts/chat-scheduled-messages-worker.ts',
      max_memory_restart: process.env.PM2_DEV_MEMORY || '256M',
      env: {
        NODE_ENV: 'development',
        UNDICI_SOCKET_FAMILY: 'ipv4',
      },
    },
  ],
};
