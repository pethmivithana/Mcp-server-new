import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const CV_JSON = path.join(DATA_DIR, 'cv.json');

/**
 * CV parser: extracts sections, employment, education, skills, projects, certifications.
 */
export function parseCVToJSON(rawText) {
  const text = (rawText || '').replace(/\r/g, '').trim();
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

  // Segment sections by common headings
  const sections = {};
  let current = 'summary';
  for (const line of lines) {
    const h = line.toLowerCase();
    if (/^(experience|work experience|employment)$/.test(h)) current = 'experience';
    else if (/^(education)$/.test(h)) current = 'education';
    else if (/^(skills|technical skills)$/.test(h)) current = 'skills';
    else if (/^(projects)$/.test(h)) current = 'projects';
    else if (/^(certifications)$/.test(h)) current = 'certifications';

    sections[current] = sections[current] || [];
    sections[current].push(line);
  }

  // Employment extraction
  const employment = [];
  const exp = sections.experience || [];
  for (const line of exp) {
    const m1 = line.match(/^(.*?)[\s–-]+(.*?)[\s]*\(([^)]*)\)$/); // Company - Role (Dates)
    const m2 = line.match(/^(.*?)\s+at\s+(.*?)\s*(\(([^)]*)\))?$/i); // Role at Company

    if (m1) {
      const company = m1[1].trim();
      const role = m1[2].trim();
      const dates = m1[3].trim();
      employment.push({ company, role, dates, source: line });
    } else if (m2) {
      const role = m2[1].trim();
      const company = m2[2].trim();
      const dates = (m2[4] || '').trim();
      employment.push({ company, role, dates, source: line });
    }
  }

  const lastRole = employment[employment.length - 1] || null;

  return { rawText: text, sections, employment, lastRole };
}

export async function saveCVJson(cvObj) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CV_JSON, JSON.stringify(cvObj, null, 2), 'utf-8');
}

export async function loadCVJson() {
  try {
    const raw = await fs.readFile(CV_JSON, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Q&A over the parsed CV: searches sections and sentences.
 */
export function answerQuestion(question, cv) {
  if (!cv) return "I don't have your CV yet. Please upload it first.";

  const q = (question || '').toLowerCase().trim();

  // --- Special case: last role ---
  if (/last position|most recent role|last role|previous role|latest role/.test(q)) {
    const lr = cv.lastRole;
    if (lr) {
      const parts = [
        `Your last role was ${lr.role}`,
        lr.company ? `at ${lr.company}` : '',
        lr.dates ? `(${lr.dates})` : ''
      ].filter(Boolean).join(' ');
      return parts + '.';
    }
  }

  // --- Section-aware search ---
  const sectionKeywords = {
    education: ['education', 'degree', 'university', 'school', 'college'],
    skills: ['skills', 'technologies', 'stack', 'languages'],
    projects: ['project', 'application', 'app', 'portfolio'],
    certifications: ['certification', 'certificate', 'aws', 'google', 'microsoft'],
    experience: ['experience', 'work', 'role', 'position', 'company', 'employer']
  };

  for (const [section, keywords] of Object.entries(sectionKeywords)) {
    if (keywords.some(k => q.includes(k))) {
      const lines = cv.sections[section] || [];
      if (lines.length) return lines.join('. ');
    }
  }

  // --- Keyword search in all sentences ---
  const sentences = cv.rawText.split(/(?<=\.)\s+/);
  const keywords = q.split(/\W+/).filter(Boolean);
  let bestMatch = { score: 0, sentence: '' };

  for (const sentence of sentences) {
    let score = 0;
    const sLower = sentence.toLowerCase();
    for (const kw of keywords) {
      if (sLower.includes(kw)) score++;
    }
    if (score > bestMatch.score) bestMatch = { score, sentence };
  }

  if (bestMatch.score > 0) return bestMatch.sentence;

  return "I couldn't find an answer in your CV. Try rephrasing your question.";
}
