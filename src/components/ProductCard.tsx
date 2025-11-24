import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const statusBadge = {
    SALE: { text: '판매중', color: 'bg-green-500' },
    RESERVED: { text: '예약중', color: 'bg-yellow-500' },
    SOLD: { text: '판매완료', color: 'bg-gray-500' },
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-square bg-gray-200">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0].url}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <span className={`absolute top-2 left-2 ${statusBadge[product.status].color} text-white text-xs px-2 py-1 rounded`}>
            {statusBadge[product.status].text}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
          <p className="text-lg font-bold text-orange-500 mt-1">
            {product.price.toLocaleString()}원
          </p>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
            <span>{product.category}</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{product.wishCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
