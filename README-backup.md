# Video Converter - Text to Video Conversion AppThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A modern, professional text-to-video converter built with Next.js 15, React 19, and Tailwind CSS v4. This application allows users to convert various document types into video formats with a sleek, responsive interface.## Getting Started



## 🚀 FeaturesFirst, run the development server:



### 📄 **Document Type Support**```bash

- **Word Documents** (.doc, .docx)npm run dev

- **PDF Files** (.pdf)# or

- **PowerPoint Presentations** (.ppt, .pptx)yarn dev

- **Excel Spreadsheets** (.xls, .xlsx, .csv)# or

- **Text Files** (.txt)pnpm dev

- **Google Docs** (via .doc, .docx, .txt)# or

bun dev

### 🎬 **Video Format Options**```

- MP4 (H.264) - Most compatible format

- AVI (DivX) - High quality formatOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- MOV (QuickTime) - Apple ecosystem

- WMV (Windows Media) - Microsoft formatYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.



### 🎨 **Modern UI/UX**This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- Clean, professional interface with blue/green gradient

- Responsive design for all devices## Learn More

- Drag & drop file upload

- Real-time progress trackingTo learn more about Next.js, take a look at the following resources:

- Smooth animations and transitions

- Dark mode compatible- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## 🛠️ Technology Stack

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- **Framework**: Next.js 15.5.5 with App Router

- **React**: 19.1.0 (Latest stable)## Deploy on Vercel

- **Styling**: Tailwind CSS v4.1.14

- **TypeScript**: Full type safetyThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- **UI Components**: Radix UI primitives

- **Icons**: Lucide ReactCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- **Build Tool**: Turbopack (Next.js native bundler)

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or later
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Adarsh380/Video_conversion-.git
   cd Video_conversion-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)

### Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server

## 📁 Project Structure

```
video_converter/
├── app/
│   ├── globals.css      # Global styles with Tailwind CSS v4
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Main video converter page
├── components/
│   └── ui/
│       ├── button.tsx   # Reusable button component
│       └── input.tsx    # Reusable input component
├── lib/
│   └── utils.ts         # Utility functions
├── public/              # Static assets
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── postcss.config.mjs   # PostCSS configuration
└── package.json         # Project dependencies
```

## 🎯 How to Use

1. **Select Document Type**: Choose from the dropdown (Word, PDF, PowerPoint, etc.)
2. **Upload File**: Click "Choose File" or drag & drop your document
3. **Select Output Format**: Choose your preferred video format (MP4, AVI, MOV, WMV)
4. **Convert**: Click "Convert to Video" to start the process
5. **Download**: Once complete, download your converted video

## 🔧 Configuration

### Tailwind CSS v4
This project uses the latest Tailwind CSS v4 with:
- `@tailwindcss/postcss` plugin
- Modern CSS features
- Improved performance
- Enhanced developer experience

### PostCSS Setup
```javascript
// postcss.config.mjs
export default {
  plugins: [
    require('@tailwindcss/postcss')
  ]
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Deploy with zero configuration

### Other Platforms
- **Netlify**: Drag and drop the `out` folder after running `npm run build`
- **Docker**: Use the included Dockerfile for containerized deployment
- **Static Export**: Run `npm run build` and serve the `out` directory

## 🌐 Live Demo

- **Production**: [Deployed on Vercel](https://your-vercel-app.vercel.app)
- **Development**: [http://localhost:3001](http://localhost:3001)
- **Network Access**: [http://192.168.1.5:3001](http://192.168.1.5:3001)
- **HTML Version**: [http://localhost:8080/video-converter.html](http://localhost:8080/video-converter.html)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Adarsh380**
- GitHub: [@Adarsh380](https://github.com/Adarsh380)
- Repository: [Video_conversion-](https://github.com/Adarsh380/Video_conversion-)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Radix UI for accessible component primitives
- Lucide for beautiful icons

---

⭐ **Star this repository if you found it helpful!**