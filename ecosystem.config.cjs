module.exports = {
  apps: [
    {
      name: 'hypecrm-web',
      cwd: '/var/www/hypeCRM',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3434',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', '.next', '*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      max_memory_restart: '1G',
      min_uptime: '5s',
      max_restarts: 30,
      restart_delay: 2000,
      kill_timeout: 5000,
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
