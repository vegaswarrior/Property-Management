import ProductList from '@/components/shared/product/product-list';
import { getLatestProductsByCategory } from '@/lib/actions/product.actions';
import ViewAllProductsButton from '@/components/view-all-products-button';
import DealCountdown from '@/components/deal-countdown';
import Hero from '@/components/hero/hero';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import type { Product } from '@/types';

type RawProduct = {
  subCategory?: unknown;
  salePercent?: unknown;
  saleUntil?: unknown;
  [key: string]: unknown;
};

const normalizeProducts = (products: RawProduct[]): Product[] =>
  products.map((product) => {
    const rawSaleUntil = product.saleUntil;
    const normalizedSaleUntil = rawSaleUntil
      ? new Date(rawSaleUntil as string | number | Date)
      : undefined;

    const rawSalePercent = product.salePercent;
    const normalizedSalePercent =
      rawSalePercent !== null && rawSalePercent !== undefined
        ? Number(rawSalePercent as number | string)
        : undefined;

    return {
      ...product,
      subCategory: (product.subCategory as string | null | undefined) ?? undefined,
      salePercent: normalizedSalePercent,
      saleUntil:
        normalizedSaleUntil && !Number.isNaN(normalizedSaleUntil.getTime())
          ? normalizedSaleUntil.toISOString()
          : undefined,
    } as Product;
  });

const Homepage = async () => {
  // Themed sections: make sure your products use these category names (e.g. "Faith", "Funny", "Deals", "Christmas")
  const faithBasedProductsRaw = await getLatestProductsByCategory('Faith', 20);
  const funnyProductsRaw = await getLatestProductsByCategory('Funny', 20);
  const dealsProductsRaw = await getLatestProductsByCategory('Deals', 20);
  const christmasProductsRaw = await getLatestProductsByCategory('Christmas', 20);

  const faithBasedProducts = normalizeProducts(faithBasedProductsRaw);
  const funnyProducts = normalizeProducts(funnyProductsRaw);
  const dealsProducts = normalizeProducts(dealsProductsRaw);
  const christmasProducts = normalizeProducts(christmasProductsRaw);

  return (
    <>
      <Hero />

      {/* <ProductList data={latestProducts} title='Newest Arrivals' /> */}

      {/* {featuredProducts.length > 0 && (
        <ProductCarousel data={featuredProducts} />
      )} */}

      {/* Themed collections as simple entry points */}
      {faithBasedProducts.length > 0 && (
        <ProductList data={faithBasedProducts} title='Faith Based Vibes' />
      )}

      {funnyProducts.length > 0 && (
        <ProductList data={funnyProducts} title='Funny & Bold' />
      )}

      {dealsProducts.length > 0 && (
        <ProductList data={dealsProducts} title="Positive Vibes" />
      )}

      {christmasProducts.length > 0 && (
        <ProductList data={christmasProducts} title='Holiday & Christmas' />
      )}

      <ViewAllProductsButton />

      {/* Trust & contact */}
      <DealCountdown />
      <CustomerReviews />
      <HomeContactCard />
    </>
  );
};

export default Homepage;
