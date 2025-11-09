"use client";

import { useState } from "react";
import "./video-converter.css";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    
    setIsConverting(true);
    // TODO: Add actual video conversion logic here
    setTimeout(() => {
      setIsConverting(false);
      alert(`Converting ${selectedFile.name}...`);
    }, 2000);
  };

  return (
    <div className="video-converter-container">
      <main className="main-content">
        <div className="content-wrapper">
          <div className="header-section">
            <svg className="video-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h1 className="main-title">
              Video Converter
            </h1>
          </div>
          
          <p className="subtitle">
            Convert your videos to different formats quickly and easily
          </p>

          <div className="converter-card">
            <div className="form-section">
              {/* File Input */}
              <div className="input-group">
                <label htmlFor="video-file" className="input-label">
                  Select Video File
                </label>
                <input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                {selectedFile && (
                  <p className="file-info">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Convert Button */}
              <div className="button-section">
                <button
                  onClick={handleConvert}
                  disabled={!selectedFile || isConverting}
                  className="convert-button"
                >
                  {isConverting ? (
                    <>
                      <div className="loading-spinner"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Convert Video
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="features-grid">
            <div>
              <div className="feature-card">
                <h3 className="feature-title">Fast Conversion</h3>
                <p className="feature-description">Quick and efficient video processing</p>
              </div>
            </div>
            <div>
              <div className="feature-card">
                <h3 className="feature-title">Multiple Formats</h3>
                <p className="feature-description">Support for various video formats</p>
              </div>
            </div>
            <div>
              <div className="feature-card">
                <h3 className="feature-title">High Quality</h3>
                <p className="feature-description">Maintain video quality during conversion</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
