// mcp-server.js
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadCVJson, answerQuestion } from './cv-parser.js';
import { sendEmail } from './email-service.js';


const server = new Server(
{ name: 'cv-chat-email-mcp', version: '1.0.0' },
{ capabilities: { tools: {} } }
);


server.setRequestHandler(ListToolsRequestSchema, async () => {
return {
tools: [
{
name: 'cv_ask',
description: 'Ask a question about the uploaded CV',
inputSchema: {
type: 'object',
properties: { question: { type: 'string' } },
required: ['question']
}
},
{
name: 'send_email',
description: 'Send an email using configured SMTP',
inputSchema: {
type: 'object',
properties: {
to: { type: 'string' },
subject: { type: 'string' },
body: { type: 'string' },
html: { type: 'string' }
},
 required: ['to', 'subject']
 }
 }
 ]
 };
 });
 server.setRequestHandler(CallToolRequestSchema, async (req) => {
 const name = req.params.name;
 const args = req.params.arguments || {};
 if (name === 'cv_ask') {
 const { question } = args;
 const cv = await loadCVJson();
 const answer = answerQuestion(question, cv);
 return { content: [{ type: 'text', text: answer }] };
 }
 if (name === 'send_email') {
 const { to, subject, body, html } = args;
 if (!to || !subject) throw new Error('to and subject are required');
 const info = await sendEmail({ to, subject, text: body, html });
 return { content: [{ type: 'text', text: JSON.stringify(info) }] };
 }
 throw new Error(`Unknown tool: ${name}`);
 });
 const transport = new StdioServerTransport();
 server.connect(transport);