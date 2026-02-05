
export interface Category {
  category_id: string;
  name: string;
  description: string | null;
  created_at: string; // ISO timestamp
}

export interface SubCategory {
  sub_category_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Brand {
  brand_id: string;
  name: string;
  country: string | null;
  created_at: string;
}

export type Product = {
  product_id: string;
  name: string;
//   description: string | null;
  price: number;
  category_id: string | null;
  sub_category_id: string | null;
  brand_id: string | null;
//   stock_quantity: number;
  colour: string | null;
  size: string | null;
  created_at: string;
}

export interface ProductWithRelations {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  sub_category_id?: string | null;
  brand_id: string;
  colour: string;
  size: string;
  created_at: string;
  // Add joined names:
  brand_name?: string;
  category_name?: string;
  subcategory_name?: string;
}

export interface ProductFilters {
  q?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  colour?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string; // price_asc, price_desc, newest, oldest
  page: number;
}

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_photo_url: string | null;
  password: string;
  created_at: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  order_date: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface UploadedPhoto {
  photo_id: string;
  customer_id: string;
  product_id: string | null;
  image_url: string;
  created_at: string;
}

export interface AIGeneratedPhoto {
  photo_id: string;
  customer_id: string;
  product_id: string | null;
  image_url: string;
  ai_model_version: string | null;
  created_at: string;
}

export interface ChatbotLog {
  log_id: string;
  customer_id: string | null;
  message_text: string;
  response_text: string | null;
  intent: string | null;
  timestamp: string;
}

