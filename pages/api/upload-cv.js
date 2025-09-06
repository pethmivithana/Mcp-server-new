// pages/api/upload-cv.js
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parseCVToJSON, saveCVJson } from '../../cv-praser.js';

export const config = { api: { bodyParser: false } };

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable parse error:', err);
      return res.status(500).json({ error: 'Error parsing upload' });
    }

    let file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (Array.isArray(file)) file = file[0];

    try {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.filepath, {
        resource_type: 'raw', // important for PDFs/DOCX
        folder: 'cv_uploads',
      });

      const fileUrl = uploadResult.secure_url;
      const ext = file.originalFilename
        ? file.originalFilename.split('.').pop().toLowerCase()
        : '';

      // Get file buffer from Cloudinary URL
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Parse text depending on type
      let rawText = '';
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

      // Convert to JSON & save
      const cvJson = parseCVToJSON(rawText);
      await saveCVJson(cvJson);

      return res.status(200).json({ success: true, fileUrl, parsed: cvJson });
    } catch (e) {
      console.error('CV parse/save error:', e);
      return res.status(500).json({ error: 'Failed to process CV' });
    }
  });
}
