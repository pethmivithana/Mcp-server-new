import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState('What role did I have at my last position?');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // --- Upload CV ---
  const uploadCV = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload-cv', { method: 'POST', body: fd });
      const json = await res.json();

      if (res.ok) {
        setUploadStatus({ 
          success: true, 
          message: 'CV uploaded and processed successfully!', 
          parsed: json.parsed 
        });
      } else {
        setUploadStatus({ 
          success: false, 
          error: json.error || 'Upload failed' 
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus({ 
        success: false, 
        error: 'Network error: ' + err.message 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Ask about CV ---
  const ask = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    setAnswer('');

    try {
      const res = await fetch('/api/mcp/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();

      if (res.ok) {
        setAnswer(json.answer || 'No answer received');
      } else {
        setAnswer('Error: ' + (json.error || 'Request failed'));
      }
    } catch (err) {
      console.error('Ask error:', err);
      setAnswer('Network Error: ' + err.message);
    } finally {
      setIsAsking(false);
    }
  };

  // --- Send Email ---
  const sendEmail = async () => {
    if (!to.trim() || !subject.trim()) return;
    setIsSending(true);
    setEmailStatus(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });
      const json = await res.json();

      if (res.ok) {
        setEmailStatus({ 
          success: true, 
          message: 'Email sent successfully!' 
        });
        setTo('');
        setSubject('');
        setBody('');
      } else {
        setEmailStatus({ 
          success: false, 
          error: json.error || 'Failed to send email' 
        });
      }
    } catch (err) {
      console.error('Email error:', err);
      setEmailStatus({ 
        success: false, 
        error: 'Network error: ' + err.message 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (uploadStatus) setUploadStatus(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isAsking) ask();
  };

  return (
    <>
      <Head>
        <title>CV Intelligence Platform</title>
        <meta name="description" content="Upload, analyze, and communicate with your CV data seamlessly" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>CV Intelligence Platform</h1>
          <p style={styles.subtitle}>Upload, analyze, and communicate with your CV data seamlessly</p>
        </header>

        {/* --- Upload CV Section --- */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={{...styles.stepNumber, ...styles.stepNumberUpload}}>1</span>
              Upload Your CV
            </h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.formRow}>
              <input 
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
                style={{...styles.fileInput, ...(isUploading ? styles.disabled : {})}}
              />
              <button
                onClick={uploadCV}
                disabled={!file || isUploading}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  ...(!file || isUploading ? styles.btnDisabled : {})
                }}
              >
                {isUploading && <div style={styles.spinner}></div>}
                {isUploading ? 'Processing...' : 'Upload & Parse'}
              </button>
            </div>

            {file && (
              <div style={styles.fileInfo}>
                <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}

            {uploadStatus && (
              <div style={{
                ...styles.statusMessage,
                ...(uploadStatus.success ? styles.statusSuccess : styles.statusError)
              }}>
                <div style={styles.statusTitle}>
                  <span>{uploadStatus.success ? '✅' : '❌'}</span>
                  {uploadStatus.success ? 'Upload Successful' : 'Upload Failed'}
                </div>
                <div style={styles.statusText}>
                  {uploadStatus.message || uploadStatus.error}
                </div>
                {uploadStatus.parsed && (
                  <details style={styles.details}>
                    <summary style={styles.summary}>View parsed CV data</summary>
                    <pre style={styles.codePreview}>
                      {JSON.stringify(uploadStatus.parsed, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </section>

        {/* --- Chat Section --- */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={{...styles.stepNumber, ...styles.stepNumberChat}}>2</span>
              AI-Powered CV Analysis
            </h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.formRow}>
              <input
                style={{...styles.input, ...styles.inputFlex, ...(isAsking ? styles.disabled : {})}}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAsking}
                placeholder="Ask me anything about your CV..."
              />
              <button
                onClick={ask}
                disabled={!question.trim() || isAsking}
                style={{
                  ...styles.btn,
                  ...styles.btnSuccess,
                  ...(!question.trim() || isAsking ? styles.btnDisabled : {})
                }}
              >
                {isAsking && <div style={styles.spinner}></div>}
                {isAsking ? 'Analyzing...' : 'Ask AI'}
              </button>
            </div>

            {answer && (
              <div style={styles.responseBox}>
                {answer}
              </div>
            )}
          </div>
        </section>

        {/* --- Email Section --- */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={{...styles.stepNumber, ...styles.stepNumberEmail}}>3</span>
              Professional Email Composer
            </h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.formGrid}>
              <input
                type="email"
                placeholder="Recipient email address"
                value={to}
                onChange={e => setTo(e.target.value)}
                disabled={isSending}
                style={{...styles.input, ...(isSending ? styles.disabled : {})}}
              />
              
              <input
                placeholder="Email subject line"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={isSending}
                style={{...styles.input, ...(isSending ? styles.disabled : {})}}
              />
              
              <textarea
                placeholder="Compose your professional email message here..."
                value={body}
                onChange={e => setBody(e.target.value)}
                disabled={isSending}
                style={{...styles.textarea, ...(isSending ? styles.disabled : {})}}
                rows={6}
              />
              
              <button
                onClick={sendEmail}
                disabled={!to.trim() || !subject.trim() || isSending}
                style={{
                  ...styles.btn,
                  ...styles.btnPurple,
                  ...(!to.trim() || !subject.trim() || isSending ? styles.btnDisabled : {})
                }}
              >
                {isSending && <div style={styles.spinner}></div>}
                {isSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>

            {emailStatus && (
              <div style={{
                ...styles.statusMessage,
                ...(emailStatus.success ? styles.statusSuccess : styles.statusError)
              }}>
                <div style={styles.statusTitle}>
                  <span>{emailStatus.success ? '✅' : '❌'}</span>
                  {emailStatus.success ? 'Email Sent Successfully' : 'Email Delivery Failed'}
                </div>
                <div style={styles.statusText}>
                  {emailStatus.message || emailStatus.error}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          line-height: 1.6;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
    animation: 'fadeIn 0.6s ease-out'
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem'
  },
  
  subtitle: {
    fontSize: '1.1rem',
    color: '#718096',
    fontWeight: '400'
  },
  
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    marginBottom: '2rem',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  },
  
  cardHeader: {
    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e2e8f0'
  },
  
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  
  cardContent: {
    padding: '2rem'
  },
  
  stepNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    color: 'white',
    borderRadius: '50%',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  
  stepNumberUpload: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  
  stepNumberChat: {
    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
  },
  
  stepNumberEmail: {
    background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)'
  },
  
  formRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  
  formGrid: {
    display: 'grid',
    gap: '1rem'
  },
  
  input: {
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '400',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit'
  },
  
  inputFlex: {
    flex: '1'
  },
  
  textarea: {
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '400',
    resize: 'vertical',
    minHeight: '120px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  },
  
  fileInput: {
    flex: '1',
    padding: '0.5rem',
    border: '2px dashed #cbd5e0',
    borderRadius: '8px',
    backgroundColor: '#f7fafc',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  
  fileInfo: {
    fontSize: '0.875rem',
    color: '#718096',
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
    borderLeft: '3px solid #667eea'
  },
  
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '44px',
    color: 'white'
  },
  
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  
  btnSuccess: {
    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
  },
  
  btnPurple: {
    background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)'
  },
  
  btnDisabled: {
    background: '#cbd5e0',
    cursor: 'not-allowed',
    opacity: '0.6'
  },
  
  disabled: {
    backgroundColor: '#f7fafc',
    cursor: 'not-allowed',
    opacity: '0.6'
  },
  
  spinner: {
    width: '1rem',
    height: '1rem',
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  statusMessage: {
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1rem',
    borderLeft: '4px solid'
  },
  
  statusSuccess: {
    backgroundColor: '#f0fff4',
    borderColor: '#38a169',
    color: '#22543d'
  },
  
  statusError: {
    backgroundColor: '#fed7d7',
    borderColor: '#e53e3e',
    color: '#742a2a'
  },
  
  statusTitle: {
    fontWeight: '600',
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  statusText: {
    fontSize: '0.875rem',
    opacity: '0.9'
  },
  
  responseBox: {
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
    whiteSpace: 'pre-wrap',
    fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  
  details: {
    marginTop: '0.75rem'
  },
  
  summary: {
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#667eea',
    fontWeight: '500',
    padding: '0.25rem 0'
  },
  
  codePreview: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '1rem',
    fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
    fontSize: '0.75rem',
    lineHeight: '1.4',
    overflowX: 'auto',
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: '0.5rem'
  }
};