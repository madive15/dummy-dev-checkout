import { Coupon, GiftCertificate, Tax, LineItemMap } from '@bigcommerce/checkout-sdk';
import React, { FunctionComponent, memo } from 'react';
import { TranslatedString } from '../locale';
import OrderSummaryDiscount from './OrderSummaryDiscount';
import OrderSummaryPrice from './OrderSummaryPrice';
import OrderSummaryTest from './OrderSummaryTest';
import { findIndex } from 'lodash';



export interface OrderSummarySubtotalsProps {
    lineitems: LineItemMap;
    coupons: Coupon[];
    giftCertificates?: GiftCertificate[];
    discountAmount?: number;
    taxes?: Tax[];
    giftWrappingAmount?: number;
    shippingAmount?: number;
    handlingAmount?: number;
    storeCreditAmount?: number;
    subtotalAmount: number;
    onRemovedGiftCertificate?(code: string): void;
    onRemovedCoupon?(code: string): void;
}

interface IDisplayCoupon {
    coupon?: string;
    displayName: string;
}

const OrderSummarySubtotals: FunctionComponent<OrderSummarySubtotalsProps> = ({
    lineitems,
    discountAmount,
    giftCertificates,
    taxes,
    giftWrappingAmount,
    shippingAmount,
    subtotalAmount,
    handlingAmount,
    storeCreditAmount,
    coupons,
    onRemovedGiftCertificate,
    onRemovedCoupon,
}) => {

    const index = findIndex(lineitems!.physicalItems!, { sku: "COD1" });
    const index2 = findIndex(lineitems!.physicalItems!, { sku: "COD2" });
    const index3 = findIndex(lineitems!.physicalItems!, { sku: "COD3" });
    const index4 = findIndex(lineitems!.physicalItems!, { sku: "COD4" });

    const displayCouponName = (coupon: IDisplayCoupon) => {
        let displayName = coupon.displayName;

        switch (true) {
            case displayName.includes('off the order total'):
                displayName = displayName.replace('off the order total', '割引');
                break;
            case displayName.includes('Free shipping'):
                displayName = displayName.replace('Free shipping', '送料無料');
                break;
            case displayName.includes('off each item'):
                displayName = displayName.replace('off each item', '各アイテム当');
                break;
            case displayName.includes('off the shipping total'):
                displayName = displayName.replace('off the shipping total', '送料割引');
                break;
            default:
                break;
        }

        return displayName;
    }

    const getListPrice = (index: number, index2: number, index3: number, index4: number, lineitems: any) => {
        return index > -1 ? lineitems!.physicalItems[index]!.listPrice
            : (index2 > -1 ?
                lineitems.physicalItems[index2]!.listPrice
                :
                index3 > -1 ?
                    lineitems.physicalItems[index3]!.listPrice
                    :
                    index4 > -1 ?
                        lineitems.physicalItems[index4]!.listPrice
                        : 0
            );
    };

    const listPrice = getListPrice(index, index2, index3, index4, lineitems);

    return (
        <>
            <OrderSummaryPrice
                amount={subtotalAmount}
                className="cart-priceItem--subtotal"
                label={<TranslatedString id="cart.subtotal_text" />}
                testId="cart-subtotal"
            />

            {/* 
                Test Component 
                amount 같은 경우 lineitem.physicalitems[sku값 갖고있는 인덱스]의 listPrice 호출
             */}

            <OrderSummaryTest
                amount={listPrice}
                label={<TranslatedString id="cart.cash_on_delivery" />}
                testId="cart-cod"
            />

            {(coupons || []).map((coupon, index) => (
                <OrderSummaryDiscount
                    amount={coupon.discountedAmount}
                    code={coupon.code}
                    couponType={coupon.couponType}
                    key={index}
                    label={displayCouponName(coupon)}
                    onRemoved={onRemovedCoupon}
                    testId="cart-coupon"
                />
            ))}

            {!!discountAmount && (
                <OrderSummaryDiscount
                    amount={discountAmount}
                    label={<TranslatedString id="cart.discount_text" />}
                    testId="cart-discount"
                />
            )}

            {(giftCertificates || []).map((giftCertificate, index) => (
                <OrderSummaryDiscount
                    amount={giftCertificate.used}
                    code={giftCertificate.code}
                    key={index}
                    label={<TranslatedString id="cart.gift_certificate_text" />}
                    onRemoved={onRemovedGiftCertificate}
                    remaining={giftCertificate.remaining}
                    testId="cart-gift-certificate"
                />
            ))}

            {!!giftWrappingAmount && (
                <OrderSummaryPrice
                    amount={giftWrappingAmount}
                    label={<TranslatedString id="cart.gift_wrapping_text" />}
                    testId="cart-gift-wrapping"
                />
            )}

            <OrderSummaryPrice
                amount={shippingAmount}
                label={<TranslatedString id="cart.shipping_text" />}
                testId="cart-shipping"
                zeroLabel={<TranslatedString id="cart.free_text" />}
            />

            {!!handlingAmount && (
                <OrderSummaryPrice
                    amount={handlingAmount}
                    label={<TranslatedString id="cart.handling_text" />}
                    testId="cart-handling"
                />
            )}

            {(taxes || []).map((tax, index) => (
                <OrderSummaryPrice
                    amount={tax.amount}
                    key={index}
                    label={tax.name}
                    testId="cart-taxes"
                />
            ))}

            {!!storeCreditAmount && (
                <OrderSummaryDiscount
                    amount={storeCreditAmount}
                    label={<TranslatedString id="cart.store_credit_text" />}
                    testId="cart-store-credit"
                />
            )}
        </>
    );
};

export default memo(OrderSummarySubtotals);
