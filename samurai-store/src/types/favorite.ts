export type FavoriteProduct = {
  id: number;
  product_id: number;
  user_id: number;
  created_at: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
};
