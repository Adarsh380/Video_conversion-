"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, Download } from "lucide-react";

export default function Home() {
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [outputFormat, setOutputFormat] = useState("mp4");

  // Document type mapping
  const documentFileTypes: { [key: string]: string } = {
    word: '.doc,.docx',
    pdf: '.pdf',
    notepad: '.txt',
    googledoc: '.doc,.docx,.txt',
    powerpoint: '.ppt,.pptx',
    excel: '.xls,.xlsx,.csv'
  };

  const handleDocTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const docType = event.target.value;
    setSelectedDocType(docType);
    setSelectedFile(null);
    setShowResult(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedDocType) {
      setSelectedFile(file);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile || !selectedDocType) return;
    
    setIsConverting(true);
    setProgress(0);
    setShowResult(false);

    // Simulate conversion progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10 + 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsConverting(false);
            setShowResult(true);
          }, 800);
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #4ca2b1 0%, #409ba7 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111827'
    }}>
      <div className="container mx-auto px-4 py-16" style={{ maxWidth: '1200px' }}>
        <div className="max-w-3xl mx-auto text-center">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <Video className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900" style={{ margin: 0 }}>
              Video Converter
            </h1>
          </div>
          
          <p className="text-lg mb-12" style={{ 
            color: '#000307',
            lineHeight: '1.6'
          }}>
            Transform your text documents into engaging videos with our AI-powered converter
          </p>

          {/* Main Converter Card */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-12">
            <div className="space-y-6">
              
              {/* Document Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={handleDocTypeChange}
                  className="w-full p-3 border-2 rounded-md bg-gray-100 text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:shadow-md"
                  style={{
                    borderColor: '#dbcbd5',
                    backgroundColor: '#e6dce3'
                  }}
                >
                  <option value="">Select Document Type</option>
                  <option value="word">Word Document</option>
                  <option value="pdf">PDF</option>
                  <option value="notepad">Notepad</option>
                  <option value="googledoc">Google Doc</option>
                  <option value="powerpoint">PowerPoint</option>
                  <option value="excel">Excel Sheet</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Select Text Document
                </label>
                <input
                  type="file"
                  accept={selectedDocType ? documentFileTypes[selectedDocType] : ''}
                  disabled={!selectedDocType}
                  onChange={handleFileSelect}
                  className="w-full border-2 border-gray-300 bg-white p-3 text-sm rounded-md outline-none cursor-pointer transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-500 text-center italic">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB) - {selectedDocType.charAt(0).toUpperCase() + selectedDocType.slice(1)}
                  </p>
                )}
              </div>

              {/* Video Format Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Output Video Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full p-3 border-2 rounded-md bg-gray-100 text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:shadow-md"
                  style={{
                    borderColor: '#dbcbd5',
                    backgroundColor: '#e6dce3'
                  }}
                >
                  <option value="mp4">MP4 (H.264) - General purpose, YouTube, social media</option>
                  <option value="mp4h265">MP4 (H.265) - High quality at lower file size</option>
                  <option value="mov">MOV (ProRes) - Professional video editing workflow</option>
                  <option value="mkv">MKV - Archiving large video libraries</option>
                  <option value="avi">AVI - Legacy Windows workflows</option>
                  <option value="webm">WebM - Web browser playback and streaming</option>
                  <option value="gif">GIF - Short looping animations</option>
                </select>
              </div>

              {/* Convert Button */}
              <div className="pt-4">
                <Button
                  onClick={handleConvert}
                  disabled={!selectedFile || !selectedDocType || isConverting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConverting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Video...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Video className="w-4 h-4" />
                      Convert to Video
                    </div>
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              {isConverting && (
                <div className="w-full">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Result Section */}
            {showResult && (
              <div className="mt-8 p-6 bg-green-50 border-2 border-green-500 rounded-md">
                <h3 className="text-green-800 font-semibold mb-2">Video Creation Complete!</h3>
                <p className="text-green-700 mb-4">Your text document has been successfully converted to video.</p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md font-medium transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download {selectedFile?.name.split('.')[0]}_video.{outputFormat}
                </a>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 text-blue-600 mx-auto mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Lightning Fast</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quick and efficient video processing with optimized algorithms for the best performance</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 text-blue-600 mx-auto mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Smart Processing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">AI analyzes your document type and creates optimized video content with proper formatting</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 text-blue-600 mx-auto mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Professional Output</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Generate high-quality videos with proper pacing, transitions, and visual elements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}