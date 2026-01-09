# AiMemo Build Guide

## Sync & Workflow
- Always run `git pull --ff-only` before edits, then `git commit` + `git push` after each change set.
- Keep Ubuntu and macOS in sync; after pushing on one machine, pull on the other before continuing work.
- macOS-only sync details and simulator commands live in `macOS_config.md` (gitignored).
- Record run commands for each service (backend, PWA, iOS, Android) and the active conda env in `references/run-notes.md`.
- Keep a root conda export up to date: `conda env export -n ai > environment.yml`.

## Platform Strategy
- Design the backend and PWA first, then mirror those features to iOS and Android.
- Keep PWA, iOS, and Android behavior aligned by reusing the same API contracts and data models.
- Maintain clear, top-level folders for each target to ease development: `backend/`, `pwa/`, `ios/`, `android/`.

## Core Product Requirements
- A memo app with chat-based conversations and shared collaboration.
- Users can create conversations, invite others, and see history.
- Backend AI summarizes chats into tables, documents, calendar items, and reminders.
- Use `EchoMind/` (chat.lazying.art) as the reference implementation; copy/port submodules (LLM, TTS/STT, chat) when needed.

## Auth, Subscription, and Data
- Provide login, registration, logout, and password reset flows.
- Support Google and Apple sign-in.
- Use PostgreSQL as the system of record, plus local/offline storage where needed.
- Subscription and access control should be consistent across PWA, iOS, and Android.
