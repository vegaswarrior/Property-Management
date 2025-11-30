import ProductList from '@/components/shared/product/product-list';
import { getLatestProducts, getLatestProductsByCategory } from '@/lib/actions/product.actions';

interface LatestProductSectionProps {
  title?: string;
  /**
   * Optional category name to filter products by, e.g. "Faith", "Funny", "Deals", "Christmas".
   * If omitted, the section will show the latest products from all categories.
   */
  category?: string;
  /**
   * Maximum number of products to show in this section.
   */
  limit?: number;
}

const LatestProductSection = async ({
  title = 'Faith Based',
  category,
  limit = 10,
}: LatestProductSectionProps) => {
  const products = category
    ? await getLatestProductsByCategory(category, limit)
    : await getLatestProducts();

  if (!products || products.length === 0) return null;

  return <ProductList data={products} title={title} limit={limit} />;
};

export default LatestProductSection;
