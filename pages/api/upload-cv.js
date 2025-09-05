// pages/api/upload-cv.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parseCVToJSON, saveCVJson } from '../../cv-praser.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const uploadDir = './uploads';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    multiples: false,
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable parse error:', err);
      return res.status(500).json({ error: 'Error parsing upload' });
    }

    // Formidable may return file as array if multiples=false? Ensure object
    let file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (Array.isArray(file)) file = file[0];

    try {
      let rawText = '';
      const filename = file.originalFilename || file.newFilename || 'unknown';
      const ext = path.extname(filename).toLowerCase();

      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(file.filepath);
        const data = await pdfParse(dataBuffer);
        rawText = data.text;
      } else if (ext === '.docx') {
        const data = await mammoth.extractRawText({ path: file.filepath });
        rawText = data.value;
      } else if (ext === '.txt') {
        rawText = fs.readFileSync(file.filepath, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type: ' + ext });
      }

      const cvJson = parseCVToJSON(rawText);
      await saveCVJson(cvJson);

      return res.status(200).json({ success: true, parsed: cvJson });
    } catch (e) {
      console.error('CV parse/save error:', e);
      return res.status(500).json({ error: 'Failed to process CV' });
    }
  });
}
