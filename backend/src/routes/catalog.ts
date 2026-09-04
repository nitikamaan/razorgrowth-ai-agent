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
        active
      FROM "Product"
      WHERE active = true
      ORDER BY name
    `);

    res.json({
      merchant: {
        id: 'merchant_demo_001',
        name: 'Demo Store',
      },
      catalog: products,
    });
  } catch (error) {
    console.error('CATALOG ERROR:', error);

    res.status(500).json({
      success: false,
      error: 'Unable to load catalog',
    });
  }
});

export default router;