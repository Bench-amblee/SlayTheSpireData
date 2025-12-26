import { useState, useEffect } from 'react';
import axios from 'axios';

function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [password, setPassword] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState(null);
  const [checkingSupabase, setCheckingSupabase] = useState(true);
  const [waking, setWaking] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Check Supabase status on mount
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/supabase/status');
        setSupabaseStatus(response.data);
      } catch (err) {
        console.error('Failed to check Supabase status:', err);
        setSupabaseStatus({ configured: false, connected: false });
      } finally {
        setCheckingSupabase(false);
      }
    };

    checkSupabase();
  }, []);

  const handleWakeDatabase = async () => {
    setWaking(true);
    setError(null);

    try {
      await axios.post('http://localhost:5000/api/supabase/wake');

      // Check status again after waking
      const response = await axios.get('http://localhost:5000/api/supabase/status');
      setSupabaseStatus(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to wake database');
    } finally {
      setWaking(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(f => f.name.endsWith('.run') || f.name.endsWith('.zip'));

      if (validFiles.length > 0) {
        setFiles(validFiles);
        setError(null);
      } else {
        setError('Please upload .run or .zip files');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => f.name.endsWith('.run') || f.name.endsWith('.zip'));

      if (validFiles.length > 0) {
        setFiles(validFiles);
        setError(null);
      } else {
        setError('Please upload .run or .zip files');
        setFiles([]);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files first');
      return;
    }

    if (!password) {
      setError('Please enter the upload password');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();

    // Add password to form data
    formData.append('password', password);

    // Add all files
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/upload-runs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      setFiles([]);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Upload Runs</h1>

      {/* Supabase Status */}
      {!checkingSupabase && supabaseStatus && (
        <div style={{
          background: supabaseStatus.connected ? 'rgba(72, 187, 120, 0.15)' : 'rgba(237, 137, 54, 0.15)',
          padding: '15px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `1px solid ${supabaseStatus.connected ? 'var(--success)' : 'var(--warning)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{supabaseStatus.connected ? '✓' : '⚠'}</span>
              <div>
                <strong style={{ color: supabaseStatus.connected ? 'var(--success)' : 'var(--warning)' }}>
                  {supabaseStatus.connected ? 'Database Connected' : supabaseStatus.asleep ? 'Database Sleeping' : 'Database Not Connected'}
                </strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {supabaseStatus.asleep ? 'The database has been paused due to inactivity' : supabaseStatus.message}
                </p>
              </div>
            </div>
            {supabaseStatus.asleep && (
              <button
                onClick={handleWakeDatabase}
                disabled={waking}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: waking ? 'var(--bg-tertiary)' : 'var(--accent-sapphire)',
                  color: waking ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: waking ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {waking ? 'Waking...' : 'Wake Database'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Password Input */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)',
      }}>
        <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: '600' }}>
          Upload Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter upload password"
          disabled={uploading || !supabaseStatus?.connected}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '2px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            boxSizing: 'border-box'
          }}
        />
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Contact the site admin for the upload password
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Instructions</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          <strong>What to upload:</strong> ZIP files containing your Slay the Spire run files, or individual .run files. You can upload multiple files at once.
        </p>

        <div style={{ marginTop: '15px' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>Expected ZIP structure:</h4>
          <pre style={{
            background: 'var(--bg-tertiary)',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            overflowX: 'auto',
            color: 'var(--text-primary)'
          }}>
{`SlayTheSpire_Runs.zip
└── runs/
    ├── IRONCLAD/
    │   ├── 1745096322.run
    │   └── ...
    ├── THE_SILENT/
    ├── DEFECT/
    ├── WATCHER/
    └── DAILY/`}
          </pre>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>How to create the ZIP file:</h4>

          <div style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Windows (Steam):</strong>
            <ol style={{ marginTop: '5px', marginBottom: 0 }}>
              <li>Navigate to: <code>C:\Users\[YourUsername]\AppData\LocalLow\Megacrit\SlayTheSpire\runs</code></li>
              <li>Right-click the <code>runs</code> folder</li>
              <li>Select "Send to" → "Compressed (zipped) folder"</li>
            </ol>
          </div>

          <div style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Steam Deck / Linux:</strong>
            <ol style={{ marginTop: '5px', marginBottom: 0 }}>
              <li>Find the runs folder in your Steam user data directory</li>
              <li>Right-click and compress to ZIP</li>
            </ol>
          </div>

          <div style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Android (Samsung/Google Play):</strong>
            <ol style={{ marginTop: '5px', marginBottom: 0 }}>
              <li>Open "My Files" or "Files by Google"</li>
              <li>Navigate to: <code>Internal Storage/Android/data/com.humble.SlayTheSpire/files/runs/</code></li>
              <li>Long-press the <code>runs</code> folder</li>
              <li>Tap menu → "Compress" or "Zip"</li>
            </ol>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: 'rgba(237, 137, 54, 0.15)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          color: 'var(--text-secondary)'
        }}>
          <strong style={{ color: 'var(--warning)' }}>Note:</strong> Duplicate runs (same filename) will be skipped automatically. You can safely upload multiple times.
        </div>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '3px dashed var(--success)' : '2px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          background: dragActive ? 'rgba(72, 187, 120, 0.1)' : 'var(--bg-card)',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke={dragActive ? 'var(--success)' : 'var(--text-muted)'}
            strokeWidth="2"
            style={{ margin: '0 auto', display: 'block' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          {dragActive
            ? 'Drop your files here'
            : 'Drag and drop your .run or .zip files here'}
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>or</p>

        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'var(--accent-sapphire)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Choose Files
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".run,.zip"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {files.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: 'rgba(65, 105, 225, 0.15)',
            borderRadius: '8px',
            border: '1px solid var(--accent-sapphire)',
            color: 'var(--text-primary)'
          }}>
            <strong>Selected {files.length === 1 ? 'file' : 'files'}:</strong>
            {files.length === 1 ? (
              <span> {files[0].name} ({(files[0].size / 1024).toFixed(2)} KB)</span>
            ) : (
              <div style={{ marginTop: '5px', maxHeight: '150px', overflowY: 'auto' }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ fontSize: '14px', marginTop: '3px' }}>
                    • {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                ))}
                <div style={{ marginTop: '8px', fontWeight: '600' }}>
                  Total: {files.length} files ({(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB)
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || !password || !supabaseStatus?.connected}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            background: (files.length === 0 || uploading || !password || !supabaseStatus?.connected) ? 'var(--bg-tertiary)' : 'var(--success)',
            color: (files.length === 0 || uploading || !password || !supabaseStatus?.connected) ? 'var(--text-muted)' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (files.length === 0 || uploading || !password || !supabaseStatus?.connected) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseOver={(e) => {
            if (files.length > 0 && !uploading && password && supabaseStatus?.connected) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 0 20px rgba(72, 187, 120, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {uploading ? 'Uploading...' : 'Upload to Database'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(245, 101, 101, 0.15)',
          border: '1px solid var(--danger)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <strong style={{ color: 'var(--danger)' }}>Error:</strong> <span style={{ color: 'var(--text-secondary)' }}>{error}</span>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'rgba(72, 187, 120, 0.15)',
          border: '1px solid var(--success)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--success)' }}>Upload Successful! ✓</h3>
          <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
            {result.total_files && (
              <p><strong style={{ color: 'var(--text-primary)' }}>Files processed:</strong> {result.total_files}</p>
            )}
            {result.parsed_runs !== undefined && (
              <p><strong style={{ color: 'var(--text-primary)' }}>Runs parsed:</strong> {result.parsed_runs}</p>
            )}
            <p><strong style={{ color: 'var(--text-primary)' }}>New runs added:</strong> {result.new_runs}</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Duplicate runs skipped:</strong> {result.duplicate_runs || 0}</p>
            {result.errors && result.errors.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: 'var(--warning)' }}>Errors:</strong>
                <ul style={{ marginTop: '5px' }}>
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p style={{ marginTop: '15px', marginBottom: 0, color: 'var(--text-muted)' }}>
            <em>Your runs have been uploaded to the database! Refresh the page to see updated statistics.</em>
          </p>
        </div>
      )}
    </div>
  );
}

export default Upload;
