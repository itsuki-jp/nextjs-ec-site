'use client';

import ProductCard, { type ProductCardProps } from "./ProductCard";

interface ProductListProps {
  products: ProductCardProps[];
}

const ProductList = ({ products }: ProductListProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {products.length === 0 ? (
        <p className="col-span-full py-10 text-center text-lg text-gray-500">
          表示する商品がありません。
        </p>
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            imageSize={300}
            showCartButton
          />
        ))
      )}
    </div>
  );
};

export default ProductList;
