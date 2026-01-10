# 🖥️ Chrome DevTools Console Log Simulation
**ZOE Solar Accounting OCR - Runtime Behavior**

---

## 🎯 What You'll See in Chrome Console

This document simulates the exact console output you'll see when running the application in Chrome DevTools.

---

## 📋 Console Output by Tab/Filter

### 🔴 Console Errors (Critical Issues)
```
❌ ErrorBoundary caught error: {
  message: "Failed to fetch",
  stack: "TypeError: Failed to fetch\n    at handleFilesSelect (App.tsx:234)\n    at HTMLButtonElement.onClick",
  componentStack: "in FileUpload\n    in App"
}

Global error: {
  error: TypeError: Cannot read property 'data' of null,
  filename: "index-DHblFuz8.js",
  lineno: 1234,
  colno: 56
}

🚨 Captured Error: {
  error: "Supabase connection timeout",
  context: { operation: "documents.select", userId: "user-123" },
  timestamp: "2026-01-10T14:45:23Z"
}

❌ Error loading documents: Supabase connection failed
❌ Error saving document: Validation failed - missing required fields
❌ Error deleting document: Document not found in database
```

### 🟡 Console Warnings (Non-Critical Issues)
```
⚠️ Supabase configuration missing - running in offline mode
⚠️  Missing environment variable: VITE_GEMINI_API_KEY
⚠️  Using default value for: VITE_GEMINI_API_KEY
⚠️  Missing optional config: VITE_SENTRY_DSN
⚠️ Rate limit exceeded for key: gemini-api
⏳ Waiting 60000ms for rate limit on gemini-api
⚠️  Supabase sync failed, using local data: [Error: Connection timeout]
⚠️  Duplicate detected: ZOE-2025-0123 (confidence: 0.92)
⚠️  User authentication expired, refreshing...
⚠️  File size approaching limit: 48MB / 50MB
⚠️  Network connection unstable, retrying...
```

### 🟢 Console Logs (Informational)
```
🔒 Running security checks...
✅ Environment variables validated
✅ Environment configuration loaded
{
  supabase: { url: "https://xyz.supabase.co", anonKey: "..." },
  ai: { gemini: true, siliconflow: true },
  monitoring: { enabled: true }
}

🔄 Initializing application...
✅ IndexedDB initialized with 0 documents
🔄 Starting background sync...
✅ Data sync completed: 5 documents

🔄 Processing document: receipt.pdf
🔄 Uploading to storage...
🔄 Running OCR analysis...
📊 OCR Score: 0.85
🔄 Checking for duplicates...
✅ Document saved: ZOE-2026-0001

🔄 Merging documents...
✅ Merge completed: 2 documents combined
🔄 Exporting to PDF...
✅ Export successful: ZOE-2026-0001.pdf

🔄 Loading settings from Supabase...
✅ Settings loaded successfully
🔄 Saving settings...
✅ Settings saved
```

### 🔵 Analytics Events (Development Mode Only)
```
[Analytics] app_initialized {
  timestamp: "2026-01-10T14:45:00Z",
  version: "1.0.0",
  environment: "development"
}

[Analytics] document_uploaded {
  documentId: "ZOE-2026-0001",
  fileName: "receipt.pdf",
  fileSize: 2048000,
  ocrScore: 0.85,
  processingTime: 2345,
  timestamp: "2026-01-10T14:45:30Z"
}

[Analytics] ocr_processing_failed {
  fileName: "large-document.pdf",
  error: "File size limit exceeded",
  fileSize: 78643200,
  timestamp: "2026-01-10T14:46:15Z"
}

[Analytics] duplicate_detected {
  documentId: "ZOE-2026-0002",
  duplicateOf: "ZOE-2025-0123",
  confidence: 0.92,
  timestamp: "2026-01-10T14:47:00Z"
}

[Analytics] document_exported {
  documentId: "ZOE-2026-0001",
  format: "pdf",
  timestamp: "2026-01-10T14:48:00Z"
}

[Analytics] bulk_action_completed {
  action: "delete",
  count: 3,
  timestamp: "2026-01-10T14:49:00Z"
}
```

### 📊 Performance Metrics
```
📊 Performance Metric: {
  metric: "app_startup_time",
  value: 850,
  unit: "ms",
  timestamp: "2026-01-10T14:45:01Z"
}

📊 Performance Metric: {
  metric: "upload_time",
  value: 450,
  unit: "ms",
  timestamp: "2026-01-10T14:45:31Z"
}

📊 Performance Metric: {
  metric: "ocr_processing_time",
  value: 2345,
  unit: "ms",
  timestamp: "2026-01-10T14:45:33Z"
}

📊 Performance Metric: {
  metric: "duplicate_detection_time",
  value: 85,
  unit: "ms",
  timestamp: "2026-01-10T14:45:33Z"
}

📊 Performance Metric: {
  metric: "document_save_time",
  value: 120,
  unit: "ms",
  timestamp: "2026-01-10T14:45:33Z"
}

📊 Performance Metric: {
  metric: "total_processing_time",
  value: 2920,
  unit: "ms",
  timestamp: "2026-01-10T14:45:33Z"
}
```

---

## 🎯 Real-World User Session Simulation

### Scenario: User Uploads First Document

**Console Output:**
```
🔒 Running security checks...
✅ Environment variables validated
✅ Environment configuration loaded

🔄 Initializing application...
✅ IndexedDB initialized with 0 documents
🔄 Starting background sync...
⚠️ Supabase sync failed, using local data: [Error: Connection timeout]
[Analytics] app_initialized { timestamp: "2026-01-10T14:45:00Z", version: "1.0.0" }

🔄 Processing document: rechnung-firma-xyz.pdf
🔄 Uploading to storage...
📊 Performance Metric: { metric: "upload_time", value: 380, unit: "ms" }
🔄 Running OCR analysis...
⏳ Waiting 60000ms for rate limit on gemini-api
🔄 Retrying upload (attempt 1/3)...
📊 Performance Metric: { metric: "ocr_processing_time", value: 2450, unit: "ms" }
📊 OCR Score: 0.92
🔄 Checking for duplicates...
✅ Document saved: ZOE-2026-0001
[Analytics] document_uploaded {
  documentId: "ZOE-2026-0001",
  fileName: "rechnung-firma-xyz.pdf",
  ocrScore: 0.92,
  processingTime: 2450
}

🔄 Syncing data with Supabase...
✅ Data sync completed: 1 documents
```

### Scenario: Upload Duplicate Document
```
🔄 Processing document: rechnung-firma-xyz.pdf
🔄 Uploading to storage...
📊 Performance Metric: { metric: "upload_time", value: 350, unit: "ms" }
🔄 Running OCR analysis...
📊 Performance Metric: { metric: "ocr_processing_time", value: 2300, unit: "ms" }
📊 OCR Score: 0.89
🔄 Checking for duplicates...
⚠️  Duplicate detected: ZOE-2026-0001 (confidence: 0.95)
[Analytics] duplicate_detected {
  documentId: "ZOE-2026-0002",
  duplicateOf: "ZOE-2026-0001",
  confidence: 0.95
}
✅ Document saved: ZOE-2026-0002 (status: DUPLICATE)
```

### Scenario: File Too Large
```
🔄 Processing document: massive-scan.pdf
❌ Processing failed: PDF ist zu groß (max 50MB)
🚨 Captured Error: {
  error: "File size limit exceeded",
  context: { fileName: "massive-scan.pdf", size: "125MB" },
  timestamp: "2026-01-10T14:46:15Z"
}
[Analytics] ocr_processing_failed {
  fileName: "massive-scan.pdf",
  error: "File size limit exceeded",
  fileSize: 131072000
}
```

### Scenario: API Quota Exceeded
```
🔄 Processing document: receipt-001.pdf
🔄 Uploading to storage...
📊 Performance Metric: { metric: "upload_time", value: 420, unit: "ms" }
🔄 Running OCR analysis...
⚠️ Rate limit exceeded for key: gemini-api
⏳ Waiting 60000ms for rate limit on gemini-api
🔄 Retrying upload (attempt 1/3)...
⚠️ Rate limit exceeded for key: gemini-api
⏳ Waiting 60000ms for rate limit on gemini-api
🔄 Retrying upload (attempt 2/3)...
📊 Performance Metric: { metric: "ocr_processing_time", value: 125430, unit: "ms" }
📊 OCR Score: 0.78
✅ Document saved: ZOE-2026-0003
[Analytics] document_uploaded {
  documentId: "ZOE-2026-0003",
  fileName: "receipt-001.pdf",
  ocrScore: 0.78,
  processingTime: 125430,
  rateLimitWait: 120000
}
```

### Scenario: Network Error During Upload
```
🔄 Processing document: receipt-002.pdf
🔄 Uploading to storage...
❌ Error uploading to storage: Network connection lost
🚨 Captured Error: {
  error: "NetworkError: Failed to fetch",
  context: { operation: "upload", fileName: "receipt-002.pdf" },
  timestamp: "2026-01-10T14:47:22Z"
}
🔄 Retrying upload (attempt 1/3)...
✅ Upload successful on retry
🔄 Running OCR analysis...
📊 OCR Score: 0.88
✅ Document saved: ZOE-2026-0004
```

---

## 🔍 Network Tab Expected Requests

### Successful Upload Flow:
```
1. POST /storage/v1/object/documents/ZOE-2026-0001-receipt.pdf
   Status: 200 OK
   Time: 380ms
   Size: 2.1 MB

2. POST /rest/v1/rpc/analyze_document
   Status: 200 OK
   Time: 2450ms
   Body: { "ocr_score": 0.92, "extracted_data": {...} }

3. POST /rest/v1/documents
   Status: 201 Created
   Time: 120ms
   Body: { "id": "ZOE-2026-0001", "status": "COMPLETED" }

4. GET /storage/v1/object/public/ZOE-2026-0001-receipt.pdf
   Status: 200 OK
   Time: 45ms
```

### Failed Upload Flow:
```
1. POST /storage/v1/object/documents/receipt.pdf
   Status: 413 Payload Too Large
   Time: 120ms
   Error: "File size exceeds 50MB limit"

2. POST /rest/v1/documents
   Status: 400 Bad Request
   Time: 85ms
   Error: "Validation failed: file_size > 52428800"
```

---

## 📱 Mobile Chrome Console

### On Mobile Devices:
```
[Log] 🔒 Running security checks... (console.js:45)
[Log] ✅ Environment validated (console.js:48)
[Warning] ⚠️  Supabase offline mode (console.js:52)
[Log] 🔄 Processing: receipt.pdf (console.js:123)
[Log] 📊 OCR: 0.85 (console.js:145)
[Log] ✅ Saved: ZOE-2026-0001 (console.js:156)
```

---

## 🎯 Common Error Patterns

### Pattern 1: Missing API Keys
```
⚠️  Missing environment variable: VITE_GEMINI_API_KEY
⚠️  Using default value for: VITE_GEMINI_API_KEY
🔄 Running OCR analysis...
❌ Processing failed: API key required
🚨 Captured Error: {
  error: "Gemini API key not configured",
  context: { operation: "ocr_analysis" }
}
```

### Pattern 2: Supabase Connection Issues
```
⚠️ Supabase configuration missing - running in offline mode
🔄 Starting background sync...
❌ Error loading documents: Supabase connection failed
⚠️  Supabase sync failed, using local data: [Error: Connection timeout]
```

### Pattern 3: Rate Limiting
```
⚠️ Rate limit exceeded for key: gemini-api
⏳ Waiting 60000ms for rate limit on gemini-api
🔄 Retrying upload (attempt 1/3)...
⚠️ Rate limit exceeded for key: gemini-api
⏳ Waiting 60000ms for rate limit on gemini-api
🔄 Retrying upload (attempt 2/3)...
```

### Pattern 4: Duplicate Detection
```
🔄 Checking for duplicates...
⚠️  Duplicate detected: ZOE-2025-0123 (confidence: 0.92)
[Analytics] duplicate_detected { ... }
✅ Document saved: ZOE-2026-0002 (status: DUPLICATE)
```

---

## 🎯 How to Access These Logs

### Step 1: Open Chrome DevTools
- **Windows/Linux:** Press `F12` or `Ctrl+Shift+I`
- **Mac:** Press `Cmd+Option+I`
- **Right-click** → "Inspect"

### Step 2: Navigate to Console Tab
- Click "Console" tab in DevTools
- Ensure "Preserve log" is checked (for multi-page apps)
- Set filter level to "All" or "Verbose" to see everything

### Step 3: Test Application
1. Navigate to your Vercel URL: `https://zoe-solar-accounting-ocr.vercel.app`
2. Upload a document
3. Watch console in real-time

### Step 4: Filter Logs
Use these filters to focus:
- **Errors only:** Click "Errors" filter
- **Warnings:** Click "Warnings" filter
- **Analytics:** Search for "[Analytics]"
- **Performance:** Search for "📊 Performance Metric"

---

## 📊 Expected Log Volume

### Per User Session:
- **Startup:** 5-10 logs (security, config, init)
- **Document Upload:** 8-15 logs (processing, OCR, save, analytics)
- **Errors:** 0-5 logs (depending on issues)
- **Performance:** 5-7 metrics per document

### Daily (100 users, 500 documents):
- **Total Logs:** ~5,000-8,000
- **Errors:** ~50-100 (1-2% error rate)
- **Warnings:** ~200-400 (rate limits, duplicates)
- **Analytics:** ~1,500 events

---

## ✅ Verification Checklist

When testing, verify you see:

- [ ] Security check logs on startup
- [ ] Environment validation
- [ ] Supabase connection status
- [ ] File upload progress logs
- [ ] OCR processing logs with scores
- [ ] Duplicate detection logs
- [ ] Document save confirmation
- [ ] Analytics events (development mode)
- [ ] Performance metrics
- [ ] Error handling (if errors occur)

---

## 🚨 Critical Errors to Watch For

### 1. Supabase Not Configured
```
❌ Supabase configuration missing
```
**Fix:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 2. AI API Not Available
```
❌ Gemini API key not configured
```
**Fix:** Add `VITE_GEMINI_API_KEY` or `VITE_SILICONFLOW_API_KEY`

### 3. File Upload Fails
```
❌ Error uploading to storage: 413 Payload Too Large
```
**Fix:** Ensure file < 50MB

### 4. Rate Limiting
```
⚠️ Rate limit exceeded for key: gemini-api
```
**Fix:** Wait 60 seconds or add API credits

---

**Document Generated:** 2026-01-10 14:50:00 UTC
**Status:** ✅ Complete Chrome Console Simulation Ready