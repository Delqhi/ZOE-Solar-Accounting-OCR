---
active: true
iteration: 1
max_iterations: 500
completion_promise: "COMPLETE"
started_at: "2026-01-03T04:17:15Z"
---

erweitere die Google OAuth Implementierung um Google Contacts: 1) Füge Google Contacts Types zu lib/google-oauth/types.ts hinzu (GoogleContact, GoogleContactsListResponse), 2) Füge Google Contacts API-Funktionen zu lib/google-oauth/client.ts hinzu (listContacts, getContact, searchContacts, createContact, updateContact, deleteContact), 3) Erweitere app/google-apps/page.tsx mit neuem Contacts-Tab (Kontakt-Liste, Suche, Detailansicht), 4) Füge Contacts-Scope zu den OAuth-Scopes hinzu (https://www.googleapis.com/auth/contacts.readonly, https://www.googleapis.com/auth/contacts), 5) Erstelle neue API-Route /api/oauth/cloud/google-drive/contacts wenn nötig
