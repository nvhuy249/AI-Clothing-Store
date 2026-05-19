import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { ensureRolesTable } from '../lib/roles';
import { postgresOptions } from '../lib/db';

const sql = postgres(process.env.POSTGRES_URL!, postgresOptions);

async function seedCategories() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      category_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const categories = [
    { name: 'Men', description: 'Men\'s clothing and accessories' },
    { name: 'Women', description: 'Women\'s clothing and accessories' },
    { name: 'Accessories', description: 'Fashion accessories for all' }
  ];

  const insertedCategories = await Promise.all(
    categories.map(
      (category) => sql`
        INSERT INTO categories (name, description)
        VALUES (${category.name}, ${category.description})
        ON CONFLICT (name) DO NOTHING;
      `,
    ),
  );

  return insertedCategories;
}

async function seedSubCategories() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS sub_categories (
      sub_category_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name)
    );
  `;

  const subCategories = [
    { name: 'Top', description: 'Shirts, blouses, t-shirts' },
    { name: 'Bottoms', description: 'Pants, skirts, shorts' },
    { name: 'Jacket', description: 'Jackets, coats, outerwear' }
  ];

  const insertedSubCategories = await Promise.all(
    subCategories.map(
      (subCategory) => sql`
        INSERT INTO sub_categories (name, description)
        VALUES (${subCategory.name}, ${subCategory.description})
        ON CONFLICT (name) DO NOTHING;
      `,
    ),
  );

  return insertedSubCategories;
}

async function seedBrands() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS brands (
      brand_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      country VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const brands = [
    { name: 'Nike', country: 'USA' },
    { name: 'Adidas', country: 'Germany' },
    { name: 'Zara', country: 'Spain' },
    { name: 'H&M', country: 'Sweden' },
    { name: 'Uniqlo', country: 'Japan' }
  ];

  const insertedBrands = await Promise.all(
    brands.map(
      (brand) => sql`
        INSERT INTO brands (name, country)
        VALUES (${brand.name}, ${brand.country})
        ON CONFLICT (name) DO NOTHING;
      `,
    ),
  );

  return insertedBrands;
}

async function seedProducts() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  // Ensure products table and new columns exist without inserting data
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      product_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
      sub_category_id UUID REFERENCES sub_categories(sub_category_id) ON DELETE SET NULL,
      brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
      stock_quantity INTEGER DEFAULT 0,
      colour VARCHAR(50),
      size VARCHAR(50),
      fit VARCHAR(100),
      material VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      photos TEXT[]
    );
  `;

  // Backfill columns if table pre-exists without them
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS fit VARCHAR(100);`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(100);`;

  const categoryRows = await sql<{ category_id: string; name: string }[]>`SELECT category_id, name FROM categories`;
  const subCategoryRows = await sql<{ sub_category_id: string; name: string }[]>`SELECT sub_category_id, name FROM sub_categories`;
  const brandRows = await sql<{ brand_id: string; name: string }[]>`SELECT brand_id, name FROM brands`;

  const category = (name: string) => categoryRows.find((row) => row.name === name)?.category_id ?? null;
  const subCategory = (name: string) => subCategoryRows.find((row) => row.name === name)?.sub_category_id ?? null;
  const brand = (name: string) => brandRows.find((row) => row.name === name)?.brand_id ?? null;

  const products = [
    {
      name: 'Air Knit Training Tee',
      description: 'Lightweight performance tee with soft stretch and a clean everyday fit.',
      price: 49.95,
      stock: 38,
      category_id: category('Men'),
      sub_category_id: subCategory('Top'),
      brand_id: brand('Nike'),
      colour: 'Black',
      size: 'M',
      fit: 'Athletic',
      material: 'Recycled polyester blend',
      photos: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Relaxed Wide-Leg Denim',
      description: 'Mid-wash denim with a relaxed rise and wide-leg silhouette.',
      price: 119.0,
      stock: 24,
      category_id: category('Women'),
      sub_category_id: subCategory('Bottoms'),
      brand_id: brand('Zara'),
      colour: 'Blue',
      size: 'S',
      fit: 'Relaxed wide leg',
      material: 'Cotton denim',
      photos: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Everyday Oversized Hoodie',
      description: 'Brushed fleece hoodie designed for layering and off-duty styling.',
      price: 89.95,
      stock: 31,
      category_id: category('Men'),
      sub_category_id: subCategory('Top'),
      brand_id: brand('Adidas'),
      colour: 'Grey',
      size: 'L',
      fit: 'Oversized',
      material: 'Cotton fleece',
      photos: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Tailored Crop Jacket',
      description: 'Structured cropped jacket with a minimal collar and polished finish.',
      price: 149.0,
      stock: 16,
      category_id: category('Women'),
      sub_category_id: subCategory('Jacket'),
      brand_id: brand('Uniqlo'),
      colour: 'Cream',
      size: 'M',
      fit: 'Tailored',
      material: 'Twill blend',
      photos: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Minimal Leather Belt',
      description: 'Smooth leather belt with a slim metal buckle for everyday styling.',
      price: 59.0,
      stock: 42,
      category_id: category('Accessories'),
      sub_category_id: null,
      brand_id: brand('H&M'),
      colour: 'Brown',
      size: 'One size',
      fit: 'Adjustable',
      material: 'Leather',
      photos: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Soft Rib Midi Dress',
      description: 'Ribbed midi dress with a gentle stretch, clean neckline, and day-to-night versatility.',
      price: 99.0,
      stock: 19,
      category_id: category('Women'),
      sub_category_id: subCategory('Top'),
      brand_id: brand('Zara'),
      colour: 'Olive',
      size: 'M',
      fit: 'Slim stretch',
      material: 'Viscose blend',
      photos: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=80'],
    },
  ];

  const insertedProducts = await Promise.all(
    products.map((product) => sql`
      INSERT INTO products (name, description, price, stock_quantity, category_id, sub_category_id, brand_id, colour, size, fit, material, photos)
      SELECT
        ${product.name},
        ${product.description},
        ${product.price},
        ${product.stock},
        ${product.category_id},
        ${product.sub_category_id},
        ${product.brand_id},
        ${product.colour},
        ${product.size},
        ${product.fit},
        ${product.material},
        ${product.photos}
      WHERE NOT EXISTS (
        SELECT 1 FROM products WHERE name = ${product.name}
      )
    `),
  );

  await Promise.all(
    products.map((product) => sql`
      UPDATE products
      SET
        description = ${product.description},
        price = ${product.price},
        stock_quantity = ${product.stock},
        category_id = ${product.category_id},
        sub_category_id = ${product.sub_category_id},
        brand_id = ${product.brand_id},
        colour = ${product.colour},
        size = ${product.size},
        fit = ${product.fit},
        material = ${product.material}
      WHERE name = ${product.name}
    `),
  );

  return insertedProducts;
}

async function ensureUsersTableName() {
  await sql`
    DO $$
    BEGIN
      IF to_regclass('public.users') IS NULL AND to_regclass('public.customers') IS NOT NULL THEN
        ALTER TABLE customers RENAME TO users;
      END IF;
    END $$;
  `;
}

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await ensureUsersTableName();
  
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      customer_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      address TEXT,
      profile_photo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      password TEXT NOT NULL
    );
  `;

  const users = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: '123 Main St, New York, NY',
      profile_photo_url: 'https://example.com/photos/john.jpg',
      password: '1234567890'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
      address: '456 Oak Ave, Los Angeles, CA',
      profile_photo_url: 'https://example.com/photos/jane.jpg',
      password: '0987654321'
    },
    {
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      phone: '+1122334455',
      address: '789 Pine Rd, Chicago, IL',
      profile_photo_url: null,
      password: '1122334455'
    }
  ];

  const insertedUsers = await Promise.all(
    users.map(
      async (customer) => {
        const hashedPassword = await bcrypt.hash(customer.password, 10);
        return sql`
        INSERT INTO users (name, email, phone, address, profile_photo_url, password)
        VALUES (${customer.name}, ${customer.email}, ${customer.phone}, ${customer.address}, ${customer.profile_photo_url}, ${hashedPassword})
        ON CONFLICT (email) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedOrders() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID REFERENCES users(customer_id) ON DELETE CASCADE,
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      total_amount DECIMAL(10, 2) NOT NULL,
      address TEXT NOT NULL,
      note TEXT,
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get customer IDs
  const customer1 = await sql`SELECT customer_id FROM users WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM users WHERE email = 'jane.smith@example.com' LIMIT 1`;

  const orders = [
    {
      customer_id: customer1[0]?.customer_id,
      status: 'completed',
      total_amount: 109.98,
      address: '123 Main St, New York, NY'
    },
    {
      customer_id: customer2[0]?.customer_id,
      status: 'pending',
      total_amount: 199.99,
      address: '456 Oak Ave, Los Angeles, CA'
    }
  ];

  const insertedOrders = await Promise.all(
    orders.map(
      (order) => sql`
        INSERT INTO orders (customer_id, status, total_amount, address)
        VALUES (${order.customer_id}, ${order.status}, ${order.total_amount}, ${order.address})
        ON CONFLICT (order_id) DO NOTHING;
      `,
    ),
  );

  return insertedOrders;
}

async function seedOrderItems() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get order and product IDs
  const orders = await sql`SELECT order_id FROM orders LIMIT 2`;
  const tshirt = await sql`SELECT product_id FROM products WHERE name LIKE '%T-Shirt%' LIMIT 1`;
  const jeans = await sql`SELECT product_id FROM products WHERE name LIKE '%Jeans%' LIMIT 1`;
  const jacket = await sql`SELECT product_id FROM products WHERE name LIKE '%Leather Jacket%' LIMIT 1`;

  if (orders.length >= 2 && tshirt.length > 0) {
    const orderItems = [
      {
        order_id: orders[0].order_id,
        product_id: tshirt[0].product_id,
        quantity: 2,
        unit_price: 29.99
      },
      {
        order_id: orders[0].order_id,
        product_id: jeans[0]?.product_id,
        quantity: 1,
        unit_price: 79.99
      },
      {
        order_id: orders[1].order_id,
        product_id: jacket[0]?.product_id,
        quantity: 1,
        unit_price: 199.99
      }
    ];

    const insertedOrderItems = await Promise.all(
      orderItems.map(
        (item) => sql`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES (${item.order_id}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
          ON CONFLICT (order_item_id) DO NOTHING;
        `,
      ),
    );

    return insertedOrderItems;
  }

  return [];
}

async function ensureWishlistTable() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS wishlist (
      customer_id UUID REFERENCES users(customer_id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (customer_id, product_id)
    );
  `;
}

async function seedUploadedPhotos() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS uploaded_photos (
      photo_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID REFERENCES users(customer_id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get customer and product IDs
  const customer1 = await sql`SELECT customer_id FROM users WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM users WHERE email = 'jane.smith@example.com' LIMIT 1`;
  const product1 = await sql`SELECT product_id FROM products WHERE name LIKE '%T-Shirt%' LIMIT 1`;

  const uploadedPhotos = [
    {
      customer_id: customer1[0]?.customer_id,
      product_id: product1[0]?.product_id,
      image_url: 'https://example.com/uploads/user1_tshirt.jpg'
    },
    {
      customer_id: customer2[0]?.customer_id,
      product_id: null,
      image_url: 'https://example.com/uploads/user2_profile.jpg'
    }
  ];

  const insertedPhotos = await Promise.all(
    uploadedPhotos.map(
      (photo) => sql`
        INSERT INTO uploaded_photos (customer_id, product_id, image_url)
        VALUES (${photo.customer_id}, ${photo.product_id}, ${photo.image_url})
        ON CONFLICT (photo_id) DO NOTHING;
      `,
    ),
  );

  return insertedPhotos;
}

async function seedAIGeneratedPhotos() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS ai_generated_photos (
      photo_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID REFERENCES users(customer_id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
      image_url TEXT NOT NULL,
      ai_model_version VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    DELETE FROM ai_generated_photos
    WHERE ai_model_version = 'seed-model-wearing-image'
  `;

  return [];
}

async function ensureProductReviewsTable() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS product_reviews (
      review_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
      customer_id UUID REFERENCES users(customer_id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title VARCHAR(120),
      body TEXT NOT NULL,
      fit_feedback VARCHAR(80),
      is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(20) NOT NULL DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, customer_id)
    );
  `;
}

async function seedProductReviews() {
  const reviewTargets = await sql<
    {
      product_id: string;
      name: string;
      customer_id: string;
      customer_name: string;
      rn: number;
    }[]
  >`
    SELECT
      p.product_id,
      p.name,
      u.customer_id,
      u.name AS customer_name,
      row_number() OVER (ORDER BY p.name, u.email) AS rn
    FROM products p
    CROSS JOIN users u
    WHERE p.name IN (
      'Air Knit Training Tee',
      'Relaxed Wide-Leg Denim',
      'Everyday Oversized Hoodie',
      'Tailored Crop Jacket',
      'Minimal Leather Belt',
      'Soft Rib Midi Dress'
    )
    AND u.email IN (
      'john.doe@example.com',
      'jane.smith@example.com',
      'mike.j@example.com'
    )
    ORDER BY p.name, u.email
    LIMIT 12
  `;

  const reviewCopy = [
    {
      rating: 5,
      title: 'Looks better in person',
      body: 'The fabric feels premium and the product photos matched what arrived. Easy piece to style.',
      fit: 'True to size',
      flagged: false,
      status: 'published',
    },
    {
      rating: 4,
      title: 'Clean fit for daily wear',
      body: 'Good quality for the price. I would size up if you want a more relaxed silhouette.',
      fit: 'Slightly small',
      flagged: false,
      status: 'published',
    },
    {
      rating: 5,
      title: 'Exactly what I wanted',
      body: 'Comfortable, sharp looking, and the checkout flow was straightforward. Would buy another color.',
      fit: 'True to size',
      flagged: false,
      status: 'published',
    },
    {
      rating: 3,
      title: 'Nice item, fit runs wide',
      body: 'The material is solid, but the cut was wider than expected on me. Still wearable with layers.',
      fit: 'Runs large',
      flagged: false,
      status: 'published',
    },
    {
      rating: 2,
      title: 'Needs moderation check',
      body: 'Sample flagged review used to demonstrate the admin moderation workflow.',
      fit: 'Not sure',
      flagged: true,
      status: 'pending',
    },
  ];

  return Promise.all(
    reviewTargets.map((target, index) => {
      const copy = reviewCopy[index % reviewCopy.length];
      return sql`
        INSERT INTO product_reviews (
          product_id,
          customer_id,
          rating,
          title,
          body,
          fit_feedback,
          is_flagged,
          status
        )
        SELECT
          ${target.product_id},
          ${target.customer_id},
          ${copy.rating},
          ${copy.title},
          ${copy.body},
          ${copy.fit},
          ${copy.flagged},
          ${copy.status}
        WHERE NOT EXISTS (
          SELECT 1
          FROM product_reviews
          WHERE product_id = ${target.product_id}
          AND customer_id = ${target.customer_id}
        )
      `;
    }),
  );
}

async function seedChatbotLogs() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_logs (
      log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID REFERENCES users(customer_id) ON DELETE CASCADE,
      message_text TEXT NOT NULL,
      response_text TEXT,
      intent VARCHAR(255),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get customer IDs
  const customer1 = await sql`SELECT customer_id FROM users WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM users WHERE email = 'jane.smith@example.com' LIMIT 1`;

  const chatbotLogs = [
    {
      customer_id: customer1[0]?.customer_id,
      message_text: 'What size is this t-shirt?',
      response_text: 'This t-shirt is available in size M.',
      intent: 'product_inquiry'
    },
    {
      customer_id: customer2[0]?.customer_id,
      message_text: 'Track my order',
      response_text: 'Your order is currently pending and will ship within 2-3 business days.',
      intent: 'order_tracking'
    }
  ];

  const insertedLogs = await Promise.all(
    chatbotLogs.map(
      (log) => sql`
        INSERT INTO chatbot_logs (customer_id, message_text, response_text, intent)
        VALUES (${log.customer_id}, ${log.message_text}, ${log.response_text}, ${log.intent})
        ON CONFLICT (log_id) DO NOTHING;
      `,
    ),
  );

  return insertedLogs;
}

export async function GET() {
  try {
    await sql.begin(async () => {
      await seedCategories();
      await seedSubCategories();
      await seedBrands();
      await seedProducts();
      await seedUsers();
      await seedOrders();
      await seedOrderItems();
      await ensureWishlistTable();
      await seedUploadedPhotos();
      await seedAIGeneratedPhotos();
      await ensureProductReviewsTable();
      await seedProductReviews();
      await ensureRolesTable();
      await seedChatbotLogs();
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}








