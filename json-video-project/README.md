# JSON Video Project

## Overview
The JSON Video Project is designed to parse PDF documents and convert them into a structured JSON format suitable for video generation. This project utilizes various TypeScript files to handle PDF parsing, text extraction, project rebuilding, and movie generation.

## Project Structure
```
json-video-project
├── src
│   ├── index.ts               # Entry point for the application
│   ├── pdfParser.ts           # PDF parsing functionality
│   ├── textExtractor.ts        # Extracts meaningful text from parsed PDF data
│   ├── projectRebuilder.ts     # Rebuilds project JSON structure from extracted text
│   ├── json2video.ts           # Generates JSON2Video Movie object
│   ├── assets
│   │   └── assetsManager.ts    # Manages asset information
│   └── types
│       └── index.ts           # Type definitions and interfaces
├── tests
│   ├── pdfParser.test.ts       # Unit tests for PdfParser
│   └── projectRebuilder.test.ts # Unit tests for ProjectRebuilder
├── package.json                # npm configuration file
├── tsconfig.json               # TypeScript configuration file
└── README.md                   # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the required dependencies by running:
   ```
   npm install
   ```
4. Compile the TypeScript files using:
   ```
   npm run build
   ```

## Usage Guidelines
- To run the application, execute the following command:
  ```
  npm start
  ```
- Ensure that you have a valid PDF file ready for processing. The application will parse the PDF and generate a structured JSON output.

## Functionality
- **PDF Parsing**: The project uses a dedicated PDF parser to extract readable text from PDF files, ensuring that no binary data is included in the output.
- **Text Extraction**: Extracted text is processed to remove any unreadable characters and to ensure meaningful content is retained.
- **Project Rebuilding**: The project structure is rebuilt from the extracted text, maintaining the original scene structure while updating summaries and narration.
- **Movie Generation**: A JSON2Video Movie object is created from the rebuilt scenes, ready for rendering.

## Testing
- Unit tests are provided to ensure the functionality of the PDF parser and project rebuilder. Run the tests using:
  ```
  npm test
  ```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.