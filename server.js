// server.js
import 'dotenv/config';
import express from 'express';
import next from 'next';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import { parseCVToJSON, saveCVJson, loadCVJson, answerQuestion } from './cv-parser.js';
import { sendEmail } from './email-service.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();


const upload = multer({ dest: path.join(__dirname, 'uploads') });


async function readUploadedFileAsText(file) {
if (!file) throw new Error('No file');
if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
const data = await fs.readFile(file.path);
const pdf = await pdfParse(data);
return pdf.text;
}
// assume UTF-8 text for others (.txt, .md)
return await fs.readFile(file.path, 'utf-8');
}


async function main() {
await app.prepare();
const server = express();
server.use(express.json({ limit: '2mb' }));


// Upload CV (multipart/form-data: file field named "file")
server.post('/upload-cv', upload.single('file'), async (req, res) => {
try {
const text = await readUploadedFileAsText(req.file);
const parsed = parseCVToJSON(text);
await saveCVJson(parsed);
res.json({ ok: true, employmentCount: parsed.employment.length, hasLastRole: !!parsed.lastRole });
} catch (e) {
res.status(400).json({ ok: false, error: e.message });
} finally {
if (req.file) {
try { await fs.unlink(req.file.path); } catch {}
}
}
});


// Ask MCP-like question against stored CV
server.post('/mcp/ask', async (req, res) => {
const { question } = req.body || {};
if (!question) return res.status(400).json({ ok: false, error: 'Missing question' });
const cv = await loadCVJson();
const answer = answerQuestion(question, cv);
res.json({ ok: true, answer });
});


// Send email endpoint
server.post('/send-email', async (req, res) => {
const { to, subject, body, html } = req.body || {};
if (!to || !subject || !(body || html)) return res.status(400).json({ ok: false, error: 'to, subject, and body/html are required' });
try {
const info = await sendEmail({ to, subject, text: body, html });
res.json({ ok: true, info });
} catch (e) {
res.status(400).json({ ok: false, error: e.message });
}
});
main();
}