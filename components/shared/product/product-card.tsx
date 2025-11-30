import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ProductPrice from './product-price';
import { Product } from '@/types';
import Rating from './rating';

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="bg-transparent border-white rounded-xl overflow-hidden shadow-sm">
      <CardHeader className="p-0 items-center">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            height={300}
            width={300}
            priority={true}
            className="object-cover"
          />
        </Link>
      </CardHeader>

      <CardContent className="p-3 flex flex-col gap-2">
        <div className="text-xs opacity-80">{product.brand}</div>

        <Link href={`/product/${product.slug}`}>
          <h2 className="text-sm font-medium">{product.name}</h2>
        </Link>

        <div className="flex items-center justify-between">
          <Rating value={Number(product.rating)} />

          {product.stock > 0 ? (
            <ProductPrice value={Number(product.price)} />
          ) : (
            <p className="text-destructive text-xs">Out Of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
