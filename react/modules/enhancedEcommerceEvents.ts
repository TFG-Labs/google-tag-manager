import updateEcommerce from './updateEcommerce'
import {
  PixelMessage,
  ProductOrder,
  AddToCartData,
  RemoveToCartData,
  Seller,
  ProductViewReferenceId,
} from '../typings/events'
import { MaybePrice } from '../typings/gtm'
import { getCategory, getStoreName, getPurchaseObjectData, getProductObjectData, getProductImpressionObjectData, getCheckoutProductObjectData } from '../utils'

function getSeller(sellers: Seller[]) {
  const defaultSeller = sellers.find(seller => seller.sellerDefault)

  if (!defaultSeller) {
    return sellers[0]
  }

  return defaultSeller
}

const defaultReference = { Value: '' }

export async function sendEnhancedEcommerceEvents(e: PixelMessage) {
  switch (e.data.eventName) {
    case 'vtex:productView': {
      const {
        productId,
        productReference,
        selectedSku,
        productName,
        brand,
        categories,
      } = e.data.product
      
      const productAvailableQuantity = getSeller(selectedSku.sellers)
        .commertialOffer.AvailableQuantity

      const isAvailable =
        productAvailableQuantity > 0 ? 'available' : 'unavailable'

      // Product summary list title. Ex: 'List of products'
      const list = e.data.list ? { actionField: { list: e.data.list } } : {}
      
      // This type conversion is needed because vtex.store does not normalize the SKU Reference Id
      // Doing that there could possibly break some apps or stores, so it's better doing it here
      const skuReferenceId = (
        ((selectedSku.referenceId as unknown) as ProductViewReferenceId)?.[0] ??
        defaultReference
      ).Value

      let price

      try {
        price = getSeller(selectedSku.sellers).commertialOffer.Price
      } catch {
        price = undefined
      }

      const includePrice: MaybePrice = {}

      if (typeof price === 'number') {
        includePrice.price = price
      }

      const data = {
        ecommerce: {
          detail: {
            ...list,
            products: [
              {
                brand,
                category: getCategory(categories),
                id: productId,
                variant: selectedSku.itemId,
                name: productName,
                dimension1: productReference ?? '',
                dimension2: skuReferenceId ?? '',
                dimension3: selectedSku.name,
                dimension4: isAvailable,
                ...includePrice,
              },
            ],
          },
        },
        event: 'productDetail',
      }

      updateEcommerce('productDetail', data)

      return
    }

    case 'vtex:productClick': {
      const { product, position } = e.data

      const {
        productName,
        brand,
        categories,
        sku,
        productId,
        productReference,
        properties
      } = product
      
      // Product summary list title. Ex: 'List of products'
      const list = e.data.list ? { actionField: { list: e.data.list } } : {}

      let price

      try {
        price = getSeller(sku?.sellers ?? product.items[0].sellers)
          .commertialOffer.Price
      } catch {
        price = undefined
      }
      
      const includePrice: MaybePrice = {}

      if (typeof price === 'number') {
        includePrice.price = price
      }

      const data = {
        event: 'productClick',
        ecommerce: {
          click: {
            ...list,
            products: [
              {
                brand,
                affiliation: getStoreName(properties)?.values[0],
                category: getCategory(categories),
                id: productId,
                variant: sku.itemId,
                name: productName,
                dimension1: productReference ?? '',
                dimension2: sku.referenceId?.Value ?? '',
                dimension3: sku.name,

                position,
                ...includePrice,
              },
            ],
          },
        },
      }

      updateEcommerce('productClick', data)

      return
    }

    case 'vtex:addToCart': {
      const { items } = e.data as AddToCartData
      
      const data = {
        ecommerce: {
          add: {
            products: items.map((item: any) => ({
              affiliation: item.affiliation,
              brand: item.brand,
              category: item.category,
              id: item.productId,
              variant: item.skuId,
              name: item.name, // Product name
              price: item.priceIsInt === true ? item.price / 100.0 : item.price,
              quantity: item.quantity,
              dimension1: item.productRefId ?? '',
              dimension2: item.referenceId ?? '', // SKU reference id
              dimension3: item.variant, // SKU name (variant)
            })),
          },
          currencyCode: e.data.currency,
        },
        event: 'addToCart',
      }

      updateEcommerce('addToCart', data)
      
      return
    }

    case 'vtex:removeFromCart': {
      const { items } = e.data as RemoveToCartData

      const data = {
        ecommerce: {
          currencyCode: e.data.currency,
          remove: {
            products: items.map(item => ({
              affiliation: item.affiliation,
              brand: item.brand,
              category: item.category,
              id: item.productId,
              variant: item.skuId,
              name: item.name, // Product name
              price: item.priceIsInt === true ? item.price / 100.0 : item.price,
              quantity: item.quantity,
              dimension1: item.productRefId ?? '',
              dimension2: item.referenceId ?? '', // SKU reference id
              dimension3: item.variant, // SKU name (variant)
            })),
          },
        },
        event: 'removeFromCart',
      }

      updateEcommerce('removeFromCart', data)

      return
    }

    case 'vtex:orderPlaced': {
      const order = e.data

      const ecommerce = {
        purchase: {
          actionField: getPurchaseObjectData(order),
          products: order.transactionProducts.map((product: ProductOrder) =>
            getProductObjectData(product)
          ),
        },
      }

      const data = {
        // @ts-ignore
        event: 'orderPlaced',
        ...order,
        // The name ecommerceV2 was introduced as a fix, so it is possible that some clients
        // were using this as it was called before (ecommerce). For that reason,
        // it will also be sent as ecommerce to the dataLayer.
        ecommerce,
        // This variable is called ecommerceV2 so it matches the variable name present on the checkout
        // This way, users can have one single tag for checkout and orderPlaced events
        ecommerceV2: {
          ecommerce,
        },
      }

      updateEcommerce('orderPlaced', data)

      return
    }

    case 'vtex:productImpression': {
      const { currency, list, impressions } = e.data

      const parsedImpressions = (impressions || []).map(
        getProductImpressionObjectData(list)
      )

      const data = {
        event: 'productImpression',
        ecommerce: {
          currencyCode: currency,
          impressions: parsedImpressions,
        },
      }

      updateEcommerce('productImpression', data)

      return
    }

    case 'vtex:cartLoaded': {
      const { orderForm } = e.data
      
      const data = {
        event: 'checkout',
        ecommerce: {
          checkout: {
            actionField: {
              step: 1,
            },
            products: orderForm.items.map(getCheckoutProductObjectData),
          },
        },
      }

      updateEcommerce('checkout', data)

      break
    }

    case 'vtex:promoView': {
      const { promotions } = e.data

      const data = {
        event: 'promoView',
        ecommerce: {
          promoView: {
            promotions,
          },
        },
      }

      updateEcommerce('promoView', data)

      break
    }

    case 'vtex:promotionClick': {
      const { promotions } = e.data

      const data = {
        event: 'promotionClick',
        ecommerce: {
          promoClick: {
            promotions,
          },
        },
      }

      updateEcommerce('promotionClick', data)

      break
    }

    default: {
      break
    }
  }
}
