export type ProductStatus = "public" | "beta" | "alpha" | "coming-soon"

export type Product = {
  slug: string
  name: string
  tagline: string
  description: string
  status: ProductStatus
  features: string[]
  href: string
}

export const products: Product[] = []

export const statusLabels: Record<ProductStatus, string> = {
  public: "Public",
  beta: "Beta",
  alpha: "Alpha",
  "coming-soon": "Coming soon",
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}