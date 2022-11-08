import { Checkout } from '@bigcommerce/checkout-sdk';

import { OrderSummarySubtotalsProps } from '../order';
import { hasSelectedShippingOptions } from '../shipping';

export default function mapToOrderSummarySubtotalsProps({
    subtotal,
    cart: { discountAmount ,lineItems },
    giftCertificates,
    consignments,
    handlingCostTotal,
    shippingCostBeforeDiscount,
    giftWrappingCostTotal,
    coupons,
    taxes,
}: Checkout): OrderSummarySubtotalsProps {
    return {
        lineitems:lineItems,
        subtotalAmount: subtotal,
        discountAmount,
        giftCertificates,
        giftWrappingAmount: giftWrappingCostTotal,
        shippingAmount: hasSelectedShippingOptions(consignments)
            ? shippingCostBeforeDiscount
            : undefined,
        handlingAmount: handlingCostTotal,
        coupons,
        taxes,
    };
}
