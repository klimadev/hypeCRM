module.exports = {
  apps: [
    {
      name: 'hypecrm-web',
      cwd: '/var/www/hypeCRM',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3434',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
