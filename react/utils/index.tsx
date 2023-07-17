import { Order, ProductOrder, Impression, CartItem, ProductSummary } from "../typings/events"
import { AnalyticsEcommerceProduct } from "../typings/gtm"


export function getPurchaseObjectData(order: Order) {
  return {
    affiliation: order.transactionAffiliation,
    coupon: order.coupon ? order.coupon : null,
    id: order.orderGroup,
    revenue: order.transactionTotal,
    shipping: order.transactionShipping,
    tax: order.transactionTax,
  }
}

export function getProductObjectData(product: ProductOrder) {
  const productName = getProductNameWithoutVariant(
    product.name,
    product.skuName
  )

  return {
    brand: product.brand,
    category: product.categoryTree?.join('/'),
    id: product.id, // Product id
    variant: product.sku, // SKU id
    name: productName, // Product name
    price: product.price,
    quantity: product.quantity,
    dimension1: product.productRefId ?? '',
    dimension2: product.skuRefId ?? '',
    dimension3: product.skuName, // SKU name (only variant)
  }
}

export function getCategory(rawCategories: string[]) {
  if (!rawCategories || !rawCategories.length) {
    return
  }

  return removeStartAndEndSlash(rawCategories[0])
}

// Transform this: "/Apparel & Accessories/Clothing/Tops/"
// To this: "Apparel & Accessories/Clothing/Tops"
export function removeStartAndEndSlash(category?: string) {
  return category?.replace(/^\/|\/$/g, '')
}

export function getProductImpressionObjectData(list: string) {
  return ({ product, position }: Impression) => ({
    affiliation: getStoreName(product?.properties)?.values[0],
    brand: product.brand,
    category: getCategory(product.categories),
    id: product.productId, // Product id
    variant: product.sku.itemId, // SKU id
    list,
    name: product.productName,
    position,
    price: product.sku.seller.commertialOffer.Price,
    dimension1: product.productReference ?? '',
    dimension2: product.sku.referenceId?.Value ?? '',
    dimension3: product.sku.name, // SKU name (variation only)
  })
}

export function getCheckoutProductObjectData(
  item: CartItem
): AnalyticsEcommerceProduct {
  const productName = getProductNameWithoutVariant(item.name, item.skuName)

  return {
    id: item.productId, // Product id
    variant: item.id, // SKU id
    name: productName, // Product name without variant
    category: Object.keys(item.productCategories ?? {}).reduce(
      (categories, category) =>
        categories ? `${categories}/${category}` : category,
      ''
    ),
    brand: item.additionalInfo?.brandName ?? '',
    price: item.sellingPrice / 100,
    quantity: item.quantity,
    dimension1: item.productRefId ?? '',
    dimension2: item.referenceId ?? '', // SKU reference id
    dimension3: item.skuName,
  }
}

export function getProductNameWithoutVariant(
  productNameWithVariant: string,
  variant: string
) {
  const indexOfVariant = productNameWithVariant.lastIndexOf(variant)

  if (indexOfVariant === -1 || indexOfVariant === 0) {
    return productNameWithVariant
  }

  return productNameWithVariant.substring(0, indexOfVariant - 1) // Removes the variant and the whitespace
}

export function getStoreName(properties: ProductSummary['properties']) {
  return properties.find((property) => property.name === "Store")
}
