import { Router } from 'express';
import { query } from '../prisma/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const products = await query(`
      SELECT
        id,
        "merchantId",
        name,
        description,
        price,
        category,
        stock,
        active,
        "createdAt"
      FROM product
      ORDER BY "createdAt" DESC
    `);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('GET PRODUCTS ERROR:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
    });
  }
});

export default router;