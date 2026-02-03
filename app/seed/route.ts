import bcrypt from 'bcrypt';
import { address } from 'framer-motion/client';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

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

  return [];
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
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

  const customers = [
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

  const insertedCustomers = await Promise.all(
    customers.map(
      async (customer) => {
        const hashedPassword = await bcrypt.hash(customer.password, 10);
        return sql`
        INSERT INTO customers (name, email, phone, address, profile_photo_url, password)
        VALUES (${customer.name}, ${customer.email}, ${customer.phone}, ${customer.address}, ${customer.profile_photo_url}, ${hashedPassword})
        ON CONFLICT (email) DO NOTHING;
      `;
    }),
  );

  return insertedCustomers;
}

async function seedOrders() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
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
  const customer1 = await sql`SELECT customer_id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1`;

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
        INSERT INTO orders (customer_id, status, total_amount)
        VALUES (${order.customer_id}, ${order.status}, ${order.total_amount})
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
      customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
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
      customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get customer and product IDs
  const customer1 = await sql`SELECT customer_id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1`;
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
      customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
      image_url TEXT NOT NULL,
      ai_model_version VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get customer and product IDs
  const customer1 = await sql`SELECT customer_id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1`;
  const tshirt = await sql`SELECT product_id FROM products WHERE name LIKE '%T-Shirt%' LIMIT 1`;
  const dress = await sql`SELECT product_id FROM products WHERE name LIKE '%Dress%' LIMIT 1`;

  const aiPhotos = [
    {
      customer_id: customer1[0]?.customer_id,
      product_id: tshirt[0]?.product_id,
      image_url: 'https://example.com/ai/gen_tshirt_1.jpg',
      ai_model_version: 'DALL-E-3'
    },
    {
      customer_id: customer2[0]?.customer_id,
      product_id: dress[0]?.product_id,
      image_url: 'https://example.com/ai/gen_dress_1.jpg',
      ai_model_version: 'Midjourney-v6'
    }
  ];

  const insertedPhotos = await Promise.all(
    aiPhotos.map(
      (photo) => sql`
        INSERT INTO ai_generated_photos (customer_id, product_id, image_url, ai_model_version)
        VALUES (${photo.customer_id}, ${photo.product_id}, ${photo.image_url}, ${photo.ai_model_version})
        ON CONFLICT (photo_id) DO NOTHING;
      `,
    ),
  );

  return insertedPhotos;
}

async function seedChatbotLogs() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_logs (
      log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
      message_text TEXT NOT NULL,
      response_text TEXT,
      intent VARCHAR(255),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Get customer IDs
  const customer1 = await sql`SELECT customer_id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1`;
  const customer2 = await sql`SELECT customer_id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1`;

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
    await sql.begin(async (sql) => {
      await seedCategories();
      await seedSubCategories();
      await seedBrands();
      await seedProducts();
      await seedCustomers();
      await seedOrders();
      await seedOrderItems();
      await ensureWishlistTable();
      await seedUploadedPhotos();
      await seedAIGeneratedPhotos();
      await seedChatbotLogs();
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
