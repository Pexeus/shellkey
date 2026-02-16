# shellkey

Simple CLI to transmit your local SSH public key to a remote host's `authorized_keys`.

Requirements
- Node.js (12+)
- `ssh-keygen` available on PATH
- Network access to the target host (SSH)

Supported platforms
- Windows
- Linux

Install

Clone the repo and install dependencies:

```bash
npm install
```

Usage

Generate or reuse your local keys and transmit the public key to a remote host:

```bash
node index.js user@host
```

Behavior
- If no `~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub` exist locally, `shellkey` will create the `.ssh` directory (if needed) and run `ssh-keygen` to create them.
- The CLI will prompt for the remote user's password to connect and append your public key to `~/.ssh/authorized_keys` on the remote.

Notes & Troubleshooting
- Ensure `ssh-keygen` is installed (OpenSSH client tools).
- The remote host must accept password authentication for initial connection.
- On Windows, the tool uses the current user's home `.ssh` directory. On Linux it uses `~/.ssh`.
- If the tool fails to write remotely, check remote permissions and that `~/.ssh/authorized_keys` exists or is writable.

License
- MIT
# Automated key based SSH Authentication

  

## Usage

    shellkey <user>@<host>

