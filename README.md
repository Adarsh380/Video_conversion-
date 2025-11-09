# Video Converter - Text to Video Conversion App# Video Converter - Text to Video Conversion AppThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A modern, professional text-to-video converter built with Next.js 15, React 19, and Tailwind CSS v4. This application allows users to convert various document types into video formats with a sleek, responsive interface.



## 🚀 FeaturesA modern, professional text-to-video converter built with Next.js 15, React 19, and Tailwind CSS v4. This application allows users to convert various document types into video formats with a sleek, responsive interface.## Getting Started



### 📄 **Document Type Support**

- **Word Documents** (.doc, .docx)

- **PDF Files** (.pdf)## 🚀 FeaturesFirst, run the development server:

- **PowerPoint Presentations** (.ppt, .pptx)

- **Excel Spreadsheets** (.xls, .xlsx, .csv)

- **Text Files** (.txt)

- **Google Docs** (via .doc, .docx, .txt)### 📄 **Document Type Support**```bash



### 🎬 **Video Format Options**- **Word Documents** (.doc, .docx)npm run dev

- MP4 (H.264) - Most compatible format

- AVI (DivX) - High quality format- **PDF Files** (.pdf)# or

- MOV (QuickTime) - Apple ecosystem

- WMV (Windows Media) - Microsoft format- **PowerPoint Presentations** (.ppt, .pptx)yarn dev



### 🎨 **Modern UI/UX**- **Excel Spreadsheets** (.xls, .xlsx, .csv)# or

- Clean, professional interface with blue/green gradient

- Responsive design for all devices- **Text Files** (.txt)pnpm dev

- Drag & drop file upload

- Real-time progress tracking- **Google Docs** (via .doc, .docx, .txt)# or

- Smooth animations and transitions

- Dark mode compatiblebun dev



## 🛠️ Technology Stack### 🎬 **Video Format Options**```



- **Framework**: Next.js 15.5.5 with App Router- MP4 (H.264) - Most compatible format

- **React**: 19.1.0 (Latest stable)

- **Styling**: Tailwind CSS v4.1.14- AVI (DivX) - High quality formatOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **TypeScript**: Full type safety

- **UI Components**: Radix UI primitives- MOV (QuickTime) - Apple ecosystem

- **Icons**: Lucide React

- **Development Port**: 3001 (optimized for stability)- WMV (Windows Media) - Microsoft formatYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **Build Tool**: Standard Next.js bundler



## 🚀 Getting Started

### 🎨 **Modern UI/UX**This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Prerequisites

- Node.js 18.0 or later- Clean, professional interface with blue/green gradient

- npm, yarn, pnpm, or bun

- Responsive design for all devices## Learn More

### Installation

- Drag & drop file upload

1. **Clone the repository**:

   ```bash- Real-time progress trackingTo learn more about Next.js, take a look at the following resources:

   git clone https://github.com/Adarsh380/Video_conversion-.git

   cd Video_conversion-- Smooth animations and transitions

   ```

- Dark mode compatible- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

2. **Install dependencies**:

   ```bash- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

   npm install

   # or## 🛠️ Technology Stack

   yarn install

   # orYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

   pnpm install

   ```- **Framework**: Next.js 15.5.5 with App Router



3. **Run the development server**:- **React**: 19.1.0 (Latest stable)## Deploy on Vercel

   ```bash

   npm run dev- **Styling**: Tailwind CSS v4.1.14

   # or

   yarn dev- **TypeScript**: Full type safetyThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

   # or

   pnpm dev- **UI Components**: Radix UI primitives

   ```

- **Icons**: Lucide ReactCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

4. **Open your browser**:

   Navigate to [http://localhost:3001](http://localhost:3001)- **Build Tool**: Turbopack (Next.js native bundler)



### Available Scripts## 🚀 Getting Started



- `npm run dev` - Start development server on port 3001### Prerequisites

- `npm run build` - Build for production- Node.js 18.0 or later

- `npm run start` - Start production server- npm, yarn, pnpm, or bun



## 📁 Project Structure### Installation



```1. **Clone the repository**:

video_converter/   ```bash

├── app/   git clone https://github.com/Adarsh380/Video_conversion-.git

│   ├── globals.css      # Global styles with Tailwind CSS v4   cd Video_conversion-

│   ├── layout.tsx       # Root layout component   ```

│   └── page.tsx         # Main video converter page

├── components/2. **Install dependencies**:

│   └── ui/   ```bash

│       ├── button.tsx   # Reusable button component   npm install

│       └── input.tsx    # Reusable input component   # or

├── lib/   yarn install

│   └── utils.ts         # Utility functions   # or

├── public/              # Static assets   pnpm install

├── next.config.ts       # Next.js configuration   ```

├── tailwind.config.ts   # Tailwind CSS configuration

├── postcss.config.mjs   # PostCSS configuration3. **Run the development server**:

└── package.json         # Project dependencies   ```bash

```   npm run dev

   # or

## 🎯 How to Use   yarn dev

   # or

1. **Select Document Type**: Choose from the dropdown (Word, PDF, PowerPoint, etc.)   pnpm dev

2. **Upload File**: Click "Choose File" or drag & drop your document   ```

3. **Select Output Format**: Choose your preferred video format (MP4, AVI, MOV, WMV)

4. **Convert**: Click "Convert to Video" to start the process4. **Open your browser**:

5. **Download**: Once complete, download your converted video   Navigate to [http://localhost:3001](http://localhost:3001)



## 🔧 Configuration### Available Scripts



### Tailwind CSS v4- `npm run dev` - Start development server on port 3001

This project uses the latest Tailwind CSS v4 with:- `npm run build` - Build for production

- `@tailwindcss/postcss` plugin- `npm run start` - Start production server

- Modern CSS features

- Improved performance## 📁 Project Structure

- Enhanced developer experience

```

### PostCSS Setupvideo_converter/

```javascript├── app/

// postcss.config.mjs│   ├── globals.css      # Global styles with Tailwind CSS v4

export default {│   ├── layout.tsx       # Root layout component

  plugins: [│   └── page.tsx         # Main video converter page

    require('@tailwindcss/postcss')├── components/

  ]│   └── ui/

}│       ├── button.tsx   # Reusable button component

```│       └── input.tsx    # Reusable input component

├── lib/

## 🚀 Deployment│   └── utils.ts         # Utility functions

├── public/              # Static assets

### Vercel (Recommended)├── next.config.ts       # Next.js configuration

1. Push your code to GitHub├── tailwind.config.ts   # Tailwind CSS configuration

2. Import your repository on [Vercel](https://vercel.com)├── postcss.config.mjs   # PostCSS configuration

3. Deploy with zero configuration└── package.json         # Project dependencies

```

### Other Platforms

- **Netlify**: Drag and drop the `out` folder after running `npm run build`## 🎯 How to Use

- **Docker**: Use the included Dockerfile for containerized deployment

- **Static Export**: Run `npm run build` and serve the `out` directory1. **Select Document Type**: Choose from the dropdown (Word, PDF, PowerPoint, etc.)

2. **Upload File**: Click "Choose File" or drag & drop your document

## 🌐 Live Demo3. **Select Output Format**: Choose your preferred video format (MP4, AVI, MOV, WMV)

4. **Convert**: Click "Convert to Video" to start the process

- **Development**: [http://localhost:3001](http://localhost:3001)5. **Download**: Once complete, download your converted video

- **Network Access**: [http://192.168.1.5:3001](http://192.168.1.5:3001)

- **HTML Version**: [http://localhost:8080/video-converter.html](http://localhost:8080/video-converter.html)## 🔧 Configuration

- **Production**: [Deployed on Vercel](https://your-vercel-app.vercel.app)

### Tailwind CSS v4

## ✅ Working ConfigurationThis project uses the latest Tailwind CSS v4 with:

- `@tailwindcss/postcss` plugin

### Current Setup (Tested & Working)- Modern CSS features

- **Next.js Server**: Port 3001 (stable, no conflicts)- Improved performance

- **Python Server**: Port 8080 (for HTML version)- Enhanced developer experience

- **Build Status**: ✅ Successful compilation

- **Dependencies**: ✅ All packages up-to-date### PostCSS Setup

- **Tailwind CSS**: ✅ v4 with PostCSS configured```javascript

// postcss.config.mjs

### Access Pointsexport default {

1. **Primary App**: http://localhost:3001 (Next.js React)  plugins: [

2. **HTML Fallback**: http://localhost:8080/video-converter.html    require('@tailwindcss/postcss')

3. **Network**: http://192.168.1.5:3001 (for other devices)  ]

}

## 🤝 Contributing```



1. Fork the repository## 🚀 Deployment

2. Create your feature branch (`git checkout -b feature/AmazingFeature`)

3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)### Vercel (Recommended)

4. Push to the branch (`git push origin feature/AmazingFeature`)1. Push your code to GitHub

5. Open a Pull Request2. Import your repository on [Vercel](https://vercel.com)

3. Deploy with zero configuration

## 📝 License

### Other Platforms

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.- **Netlify**: Drag and drop the `out` folder after running `npm run build`

- **Docker**: Use the included Dockerfile for containerized deployment

## 👤 Author- **Static Export**: Run `npm run build` and serve the `out` directory



**Adarsh380**## 🌐 Live Demo

- GitHub: [@Adarsh380](https://github.com/Adarsh380)

- Repository: [Video_conversion-](https://github.com/Adarsh380/Video_conversion-)- **Production**: [Deployed on Vercel](https://your-vercel-app.vercel.app)

- **Development**: [http://localhost:3001](http://localhost:3001)

## 🙏 Acknowledgments- **Network Access**: [http://192.168.1.5:3001](http://192.168.1.5:3001)

- **HTML Version**: [http://localhost:8080/video-converter.html](http://localhost:8080/video-converter.html)

- Next.js team for the amazing framework

- Tailwind CSS for the utility-first CSS framework## 🤝 Contributing

- Radix UI for accessible component primitives

- Lucide for beautiful icons1. Fork the repository

2. Create your feature branch (`git checkout -b feature/AmazingFeature`)

---3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)

4. Push to the branch (`git push origin feature/AmazingFeature`)

⭐ **Star this repository if you found it helpful!**5. Open a Pull Request

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