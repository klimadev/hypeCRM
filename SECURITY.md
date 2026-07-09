# Security Policy

## Reporting a Vulnerability

We take the security of hypeCRM seriously. If you discover a security vulnerability, please report it privately.

**Do not** report security issues through public GitHub issues, discussions, or pull requests.

Instead, send a detailed report to the maintainers via one of these channels:

- **GitHub Security Advisory**: Use the [Report a Vulnerability](https://github.com/klimadev/hypeCRM/security/advisories/new) tab
- **Email**: kr2dev@proton.me

Please include:

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Any potential impact

We aim to acknowledge reports within 48 hours and release a fix as soon as possible.

## Scope

- The `main` branch and latest stable release
- Production deployments using the provided Docker/PM2 configuration

Out of scope: development environments, forks, or custom deployments not using the recommended setup.

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅ Yes    |
| older   | ❌ No     |
