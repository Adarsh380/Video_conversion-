"use client";

import { Button } from "@/components/ui/button";
import { Video, ExternalLink, Sparkles, Zap, FileText, Download, ArrowRight, Play, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-pink-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-pink-600" />
              <span className="text-xl font-bold text-gray-900">VideoConverter Pro</span>
            </div>
            <Button asChild variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50">
              <Link href="/video-converter.html">
                <Play className="w-4 h-4 mr-2" />
                Launch App
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-pink-100 rounded-full text-pink-800 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Advanced Document-to-Video Pipeline v2.0
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Documents into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600"> Professional Videos</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered scene generation, stock video integration, and multi-format export. 
            Convert any document into engaging video content with our comprehensive pipeline.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-lg">
              <Link href="/video-converter.html">
                <Video className="w-5 h-5 mr-2" />
                Start Converting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="border-pink-300 text-pink-700 hover:bg-pink-50 px-8 py-3 text-lg">
              <ExternalLink className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Adaptive Scene Generation</h3>
            <p className="text-gray-600">Smart 5-20 scene generation based on content length and complexity. AI analyzes your document to create optimal video segments.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Universal Document Support</h3>
            <p className="text-gray-600">Process PDFs, Word docs, PowerPoint, Excel, text files, and images with OCR. Supports all major document formats.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Format Export</h3>
            <p className="text-gray-600">Export to MP4 H.264/H.265, WebM, GIF, and MOV ProRes. Optimized for web, social media, and professional editing.</p>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-pink-100 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Professional 10-Stage Pipeline
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { stage: "A", title: "Document Parsing", desc: "Text extraction" },
              { stage: "B", title: "Scene Generation", desc: "AI-powered segmentation" },
              { stage: "C", title: "Visual Keywords", desc: "Content optimization" },
              { stage: "D", title: "Asset Fetching", desc: "Stock video APIs" },
              { stage: "E", title: "Asset Ranking", desc: "AI selection" },
              { stage: "F", title: "TTS Generation", desc: "Voice narration" },
              { stage: "G", title: "Video Assembly", desc: "Scene compilation" },
              { stage: "H", title: "Master Mix", desc: "Final concatenation" },
              { stage: "I", title: "Optimization", desc: "Quality enhancement" },
              { stage: "J", title: "Export", desc: "Multi-format delivery" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2">
                  {item.stage}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Formats */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Supported Document Types</h2>
            <div className="space-y-3">
              {[
                "Word Documents (.doc, .docx)",
                "PDF Files (.pdf)",
                "PowerPoint Presentations (.ppt, .pptx)",
                "Excel Spreadsheets (.xls, .xlsx)",
                "Text Files (.txt, .md, .csv)",
                "Images with OCR (.jpg, .png, .gif)"
              ].map((format, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{format}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Export Formats</h2>
            <div className="space-y-3">
              {[
                "MP4 H.264 - Universal compatibility",
                "MP4 H.265 - High compression, 4K ready",
                "WebM - Web-native format",
                "GIF - Social media animations",
                "MOV ProRes - Professional editing"
              ].map((format, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{format}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Documents?</h2>
          <p className="text-xl text-pink-100 mb-6">
            Join thousands of users creating professional videos from their documents
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-pink-600 hover:bg-pink-50">
            <Link href="/video-converter.html">
              <Video className="w-5 h-5 mr-2" />
              Launch Video Converter
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-pink-200/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 VideoConverter Pro. Built with Next.js and modern web technologies.</p>
            <div className="mt-2">
              <Link href="https://github.com/Adarsh380/Video_conversion-" className="text-pink-600 hover:text-pink-700">
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}