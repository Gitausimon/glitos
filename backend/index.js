const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS to allow our Vite frontend
app.use(cors());
app.use(express.json());

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Backend is running' });
});

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // Convert buffer to base64 for Cloudinary
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

  cloudinary.uploader.upload(dataURI, {
    resource_type: 'auto',
    folder: 'glitos_products',
  })
  .then((result) => {
    // Send back the optimal URL (similar to user's requested optimization code)
    const optimizeUrl = cloudinary.url(result.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });
    
    res.json({ 
      secure_url: optimizeUrl, 
      original_url: result.secure_url,
      public_id: result.public_id 
    });
  })
  .catch((error) => {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
