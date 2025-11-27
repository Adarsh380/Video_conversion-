"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Upload, FileText, Zap, Sparkles, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function VideoConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("text");
  const [outputFormat, setOutputFormat] = useState("mp4");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConvert = () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }
    // Add conversion logic here
    alert("Converting... This is a demo interface");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-pink-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-pink-600" />
              <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VideoConverter Pro</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center">
              <Video className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Video Converter</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your text documents into engaging videos with our AI-powered converter
          </p>
        </div>

        {/* Main Converter Interface */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Document Type
              </label>
              <select 
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="text">Select Text Document</option>
                <option value="pdf">PDF Document</option>
                <option value="docx">Word Document</option>
                <option value="pptx">PowerPoint</option>
                <option value="txt">Text File</option>
              </select>

              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".txt,.pdf,.doc,.docx,.ppt,.pptx"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {selectedFile ? (
                    <p className="text-gray-900 font-medium">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT, PPT, PPTX</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Output Video Format
              </label>
              <select 
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="mp4">MP4 (H.264)</option>
                <option value="mp4-h265">MP4 (H.265)</option>
                <option value="webm">WebM</option>
                <option value="gif">GIF</option>
                <option value="mov">MOV ProRes</option>
              </select>

              <div className="bg-pink-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Preview Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolution:</span>
                    <span className="text-sm font-medium">1920x1080</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">Auto-detect</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality:</span>
                    <span className="text-sm font-medium">High</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConvert}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 text-lg"
                size="lg"
              >
                <Video className="w-5 h-5 mr-2" />
                Convert to Video
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 text-sm">Quick and efficient video processing with optimized algorithms for the best performance</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Processing</h3>
            <p className="text-gray-600 text-sm">AI analyzes your document type and creates optimized video content with proper formatting</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Output</h3>
            <p className="text-gray-600 text-sm">Generate high-quality videos with proper pacing, transitions, and visual elements</p>
          </div>
        </div>
      </div>
    </div>
  );
}