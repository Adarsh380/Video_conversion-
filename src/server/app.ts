import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import previewRoutes from './previewRoutes';

// Set up storage for uploaded files (in /tmp for demo)
const upload = multer({ dest: '/tmp/' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../public')));

// Mount preview routes
app.use('/', previewRoutes);

// Extend Request type for multer
interface MulterRequest extends Request {
  file: Express.Multer.File;
}

// Main conversion endpoint
app.post('/api/convert', upload.single('file'), async (req: MulterRequest, res: Response) => {
  const { outputFormat, documentType } = req.body;
  const file = req.file;

  // TODO: Validate input, handle errors, and pass all needed data to your pipeline
  try {
    // Example: Call your pipeline function (implement this in your pipeline)
    // await runPipeline({ outputFormat, documentType, filePath: file?.path });
    // For demo, just log and respond
    console.log('Received conversion request:', { outputFormat, documentType, file: file?.originalname });

    // Respond to client
    res.json({ success: true, message: 'Conversion started.' });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline failed', details: err });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});