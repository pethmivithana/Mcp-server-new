// pages/api/upload-cv.js
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parseCVToJSON, saveCVJson } from '../../cv-praser.js';
import fs from 'fs/promises';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({
    multiples: false,
    keepExtensions: true,
    // No uploadDir; files will be handled in memory or temp
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable parse error:', err);
      return res.status(500).json({ error: 'Error parsing upload' });
    }

    let file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (Array.isArray(file)) file = file[0];

    try {
      let rawText = '';
      const filename = file.originalFilename || '';
      const ext = filename.split('.').pop().toLowerCase();

      // Read file buffer from temporary path
      const buffer = await fs.readFile(file.filepath);

      if (ext === 'pdf') {
        const data = await pdfParse(buffer);
        rawText = data.text;
      } else if (ext === 'docx') {
        const data = await mammoth.extractRawText({ buffer });
        rawText = data.value;
      } else if (ext === 'txt') {
        rawText = buffer.toString('utf-8');
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
