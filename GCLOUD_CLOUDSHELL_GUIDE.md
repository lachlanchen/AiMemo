# gcloud CLI + Cloud Shell Guide

This doc captures your Cloud Shell session snippet and provides a step-by-step gcloud CLI tutorial, plus Gemini CLI usage.

## Session snapshot (from your Cloud Shell)

```
Welcome to Cloud Shell! Type "help" to get started, or type "gemini" to try prompting with Gemini CLI.
To set your Cloud Platform project in this session use `gcloud config set project [PROJECT_ID]`.
You can view your projects by running `gcloud projects list`.

lachlan_mia_chan@cloudshell:~$ gemini

 ███            █████████  ██████████ ██████   ██████ █████ ██████   █████ █████
░░░███         ███░░░░░███░░███░░░░░█░░██████ ██████ ░░███ ░░██████ ░░███ ░░███
  ░░░███      ███     ░░░  ░███  █ ░  ░███░█████░███  ░███  ░███░███ ░███  ░███
    ░░░███   ░███          ░██████    ░███░░███ ░███  ░███  ░███░░███░███  ░███
     ███░    ░███    █████ ░███░░█    ░███ ░░░  ░███  ░███  ░███ ░░██████  ░███
   ███░      ░░███  ░░███  ░███ ░   █ ░███      ░███  ░███  ░███  ░░█████  ░███
 ███░         ░░█████████  ██████████ █████     █████ █████ █████  ░░█████ █████
░░░            ░░░░░░░░░░  ░░░░░░░░░░ ░░░░░     ░░░░░ ░░░░░ ░░░░░    ░░░░░ ░░░░░

Tips for getting started:
1. Ask questions, edit files, or run commands.
2. Be specific for the best results.
3. /help for more information.

You are running Gemini CLI in your home directory. It is recommended to run in a project-specific directory.
```

## Can I use Gemini in Cloud Shell?

Yes. Gemini CLI is already available in Cloud Shell. Start it with:

```bash
gemini
```

Tip: `cd` into a project directory before you run Gemini, so it can read files and give better guidance.

## Gemini prompt to plan next steps

Use this prompt to have Gemini propose your next actions:

```
You are my Cloud Shell assistant. Ask 3 clarifying questions about my goal, then produce a numbered plan with exact gcloud commands, Console links, and validation checks. Keep it focused on OAuth (Google/Apple) + backend setup for AiMemo.
```

## Step-by-step gcloud CLI tutorial

### 1) Login and verify account

```bash
gcloud auth login

gcloud auth list
```

### 2) Pick a project

List projects and set the active one:

```bash
gcloud projects list

gcloud config set project PROJECT_ID

gcloud config list
```

### 3) Enable APIs (example)

Enable commonly used APIs (adjust to your needs):

```bash
gcloud services enable \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com
```

### 4) Create a service account (optional)

```bash
gcloud iam service-accounts create aimemo-backend \
  --description="AiMemo backend service account" \
  --display-name="AiMemo Backend"
```

Assign a role (example: Viewer):

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:aimemo-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/viewer"
```

### 5) Application Default Credentials (local dev)

For local development (not server production):

```bash
gcloud auth application-default login
```

### 6) OAuth Client IDs (manual in Console)

OAuth consent screen and OAuth Client IDs are created in the **Google Cloud Console** (not via gcloud):

- Console -> APIs & Services -> OAuth consent screen
- Console -> APIs & Services -> Credentials -> Create OAuth client ID

You will need:
- Web client ID for the PWA (JavaScript origin)
- Android client ID (package + SHA-1)
- iOS client ID (bundle ID)

Then copy the Web client ID into:
- `backend/.env` -> `GOOGLE_CLIENT_ID`
- `pwa/config.js` -> `GOOGLE_CLIENT_ID`

## Local vs Cloud Shell workflow

### Cloud Shell
- Best for quick checks and lightweight admin tasks.
- Use `gcloud` + `gemini` for planning.
- Keep small files under the Cloud Shell home directory.

### Local machine
- Best for development and running AiMemo (backend/PWA/iOS/Android).
- Use `gcloud auth login` to authorize.
- Use `gcloud auth application-default login` for local SDKs.

## Verification checklist

- `gcloud auth list` shows the correct account.
- `gcloud config list` shows the correct project.
- APIs enabled via `gcloud services list --enabled`.
- OAuth client IDs created in Console.
- `backend/.env` updated with `GOOGLE_CLIENT_ID` and `JWT_SECRET`.
