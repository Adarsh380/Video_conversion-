"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Video } from "lucide-react";

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
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <Video className="h-12 w-12 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Video Converter
            </h1>
          </div>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            Convert your videos to different formats quickly and easily
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              {/* File Input */}
              <div className="space-y-2">
                <label htmlFor="video-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Video File
                </label>
                <div className="relative">
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Convert Button */}
              <div className="pt-4">
                <Button
                  onClick={handleConvert}
                  disabled={!selectedFile || isConverting}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isConverting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Convert Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Conversion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Quick and efficient video processing</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Formats</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Support for various video formats</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">High Quality</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Maintain video quality during conversion</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
