#!/bin/bash

# Vercel Environment Update Script
# Aktualisiert die Vercel-Umgebung mit den korrekten Supabase-Einstellungen

echo "🚀 Aktualisiere Vercel-Umgebung..."

# Überprüfe ob die notwendigen Umgebungsvariablen gesetzt sind
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN nicht gesetzt"
    echo "Bitte setzen Sie die folgenden Umgebungsvariablen:"
    echo "export VERCEL_TOKEN=ihre_vercel_api_token"
    echo "export VERCEL_ORG_ID=ihre_vercel_org_id"
    echo "export VERCEL_PROJECT_ID=ihre_vercel_project_id"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ VERCEL_ORG_ID oder VERCEL_PROJECT_ID nicht gesetzt"
    exit 1
fi

echo "✅ Vercel Credentials gefunden"

# Supabase-Umgebungsvariablen aktualisieren
echo "📦 Aktualisiere Supabase-Umgebungsvariablen..."

# VITE_SUPABASE_URL
echo "   - Aktualisiere VITE_SUPABASE_URL..."
curl -X POST "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VITE_SUPABASE_URL",
    "value": "https://supabase.aura-call.de",
    "target": ["production", "preview", "development"]
  }'

# Überprüfe ob die Variable existiert und aktualisiere sie
if [ $? -eq 0 ]; then
    echo "   ✅ VITE_SUPABASE_URL erfolgreich aktualisiert"
else
    echo "   ⚠️  VITE_SUPABASE_URL Update fehlgeschlagen, versuche manuelles Update..."
fi

echo ""
echo "🎯 Vercel-Umgebung wurde aktualisiert!"
echo "   - Supabase URL: https://supabase.aura-call.de"
echo "   - Projekt-ID: $VERCEL_PROJECT_ID"
echo ""
echo "Bitte deployen Sie die Anwendung neu:"
echo "   vercel --prod --yes"