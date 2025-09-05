
// pages/api/mcp/ask.js
import { loadCVJson, answerQuestion } from '../../../cv-praser.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const cv = await loadCVJson();
    const answer = answerQuestion(question, cv);

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('MCP ask error:', err);
    return res.status(500).json({ error: 'Failed to answer question' });
  }
}
