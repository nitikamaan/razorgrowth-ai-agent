import 'dotenv/config';
import { query, pool } from './prisma/db.js';

async function seed() {
  console.log('Seeding database...');

  const merchantId = 'merchant_demo_001';

  try {
    // Create merchant if it doesn't exist
    await query(
      `
      INSERT INTO merchant (id, name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO NOTHING
      `,
      [merchantId, 'Demo Store']
    );

    console.log('Merchant ready.');

    // Create products if they don't exist
    const products = [
      {
        id: 'product_001',
        merchantId,
        name: 'Wireless Headphones',
        description:
          'Premium wireless headphones with noise cancellation',
        price: 299900,
        category: 'headphones',
        stock: 25,
        active: true,
      },
      {
        id: 'product_002',
        merchantId,
        name: 'Headphone Case',
        description:
          'Protective hard case for wireless headphones',
        price: 49900,
        category: 'accessories',
        stock: 50,
        active: true,
      },
      {
        id: 'product_003',
        merchantId,
        name: 'USB-C Charging Cable',
        description:
          'Fast charging USB-C cable',
        price: 29900,
        category: 'accessories',
        stock: 100,
        active: true,
      },
    ];

    for (const product of products) {
      await query(
        `
        INSERT INTO product
        (
          id,
          "merchantId",
          name,
          description,
          price,
          category,
          stock,
          active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          product.id,
          product.merchantId,
          product.name,
          product.description,
          product.price,
          product.category,
          product.stock,
          product.active,
        ]
      );

      console.log(`Ready: ${product.name}`);
    }

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();