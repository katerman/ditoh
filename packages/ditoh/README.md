# Ditoh

**Ditoh** is a lightweight tool designed for monorepos (Turborepo, etc.) to run centralized meta-scripts from within subpackages.

It solves the problem of needing to access root-level scripts or configurations while working inside a nested package directory. Ditoh recursively searches up the directory tree for a `ditoh.config.json` file and executes the defined commands from the context of where you called it.

## Features

- 🔍 **Recursive Config Search**: Automatically finds `ditoh.config.json` in parent directories.
- 🚀 **Context-Aware Execution**: Runs scripts with the current working directory preserved.
- 🛠️ **Simple Configuration**: Define scripts in a simple JSON file.

## Installation

```bash
pnpm add -Dw ditoh
# or
npm install -D --save-workspace-root ditoh
# or
yarn add -D -W ditoh
```

## Usage

1. Create a `ditoh.config.json` in your repository root:

```json
{
  "scripts": {
    "my-script": "echo 'Running my shared script!'"
  }
}
```

2. Run the script from any subpackage:

```bash
cd packages/my-app
pnpm exec ditoh my-script
```

Or add it to your package's `package.json` scripts:

```json
{
  "scripts": {
    "echo": "ditoh my-script"
  }
}
```

## CLI Reference

```bash
ditoh <script-name> [flags]

Flags:
  --debug   Enable verbose logging to debug config resolution and execution.
```

## License

MIT © [Kevin Reynolds](https://github.com/katerman)
