import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router: Router = Router();

type GumletUploadResponse = {
  upload_url?: string;
  asset_id?: string;
  [key: string]: unknown;
};

/**
 * POST /api/gumlet/upload-url
 * Generates a signed direct upload URL from Gumlet API
 */
router.post(
  '/upload-url',
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiKey = process.env.GUMLET_API_KEY;
      const collectionId = process.env.GUMLET_COLLECTION_ID;

      if (!apiKey || !collectionId) {
        res.status(500).json({ success: false, error: 'Gumlet API Key or Collection ID is not configured.' });
        return;
      }

      // See Gumlet API Reference for creating a video asset direct upload
      const response = await fetch('https://api.gumlet.com/v1/video/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'MP4', // Requesting mp4 upload
          collection_id: collectionId
        })
      });

      const data: GumletUploadResponse = await response.json();

      if (!response.ok) {
        console.error('Gumlet API Error:', data);
        res.status(response.status).json({ success: false, error: 'Failed to generate Gumlet upload URL' });
        return;
      }

      // Return the upload URL and asset ID so the frontend can securely upload the file to it
      res.json({
        success: true,
        upload_url: data.upload_url,
        asset_id: data.asset_id
      });
    } catch (error) {
      console.error('Gumlet Upload URL Route Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error while generating upload URL' });
    }
  }
);

export default router;
