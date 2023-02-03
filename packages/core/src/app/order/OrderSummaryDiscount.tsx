import React, { FunctionComponent, memo, useEffect, useState } from 'react';
import { ShopperCurrency } from '../currency';
import { TranslatedString } from '../locale';
import OrderSummaryPrice, { OrderSummaryPriceProps } from './OrderSummaryPrice';
import { Cart, Consignment, RequestOptions, CheckoutParams, CheckoutSelectors } from '@bigcommerce/checkout-sdk';
import { CheckoutContextProps, withCheckout } from '../checkout';
import { Modal } from '../ui/modal';
import ModalContents from '../ui/modal/ModalContents';


export interface OrderSummaryDiscountProps extends OrderSummaryPriceProps {
    remaining?: number;
    code?: string | any;
    couponType?: string;
    onRemoved?(code: string): void;
}

export interface WithCheckoutShippingProps {
    cart: Cart;
    consignments: Consignment[];
    loadCheckout(id: any, options?: RequestOptions<CheckoutParams>): Promise<CheckoutSelectors>;
}

const OrderSummaryDiscount: FunctionComponent<OrderSummaryDiscountProps & WithCheckoutShippingProps> = ({
    code,
    remaining,
    amount,
    consignments,
    couponType,
    onRemoved,
    ...rest
}) => {

    const [modal, setModal] = useState(false);
    const closeModal = () => {
        onRemoved && onRemoved(code);
        setModal(false);
    }

    useEffect(() => {
        if (consignments.some(item => item.shippingCost === 0) && couponType === 'free_shipping') {
            setModal(true);
        }
    }, [])

    return (
        <>
            <Modal isOpen={modal} shouldShowCloseButton>
                <ModalContents
                    clickable={closeModal}
                    modalText="배송비가 이미 무료배송 이오니 다른 쿠폰을 선택하세요!"
                />
            </Modal>
            <OrderSummaryPrice
                {...rest}
                {...(onRemoved && {
                    onActionTriggered: () => code && onRemoved(code),
                    actionLabel: <TranslatedString id="cart.remove_action" />,
                })}
                amount={-1 * (amount || 0)}
            >
                {!!remaining && remaining > 0 && (
                    <span
                        className="cart-priceItem-postFix optimizedCheckout-contentSecondary"
                        data-test="cart-price-remaining"
                    >
                        <TranslatedString id="cart.remaining_text" />
                        {': '}
                        <ShopperCurrency amount={remaining} />
                    </span>
                )}

                {code && (
                    <span
                        className="cart-priceItem-postFix optimizedCheckout-contentSecondary"
                        data-test="cart-price-code"
                    >
                        {code}
                    </span>
                )}
            </OrderSummaryPrice>
        </>
    )
};

export function mapToCheckoutCtx({
    checkoutService,
    checkoutState,
}: CheckoutContextProps): WithCheckoutShippingProps | null {
    const {
        data: {
            getCart,
            getCheckout,
            getConsignments
        }
    } = checkoutState;

    const checkout = getCheckout();
    const cart = getCart();
    const consignments = getConsignments() || [];

    if (!checkout || !cart) {
        return null;
    }

    return {
        cart,
        consignments,
        loadCheckout: checkoutService.loadCheckout
    };
}


// export default memo(OrderSummaryDiscount);
export default memo(withCheckout(mapToCheckoutCtx)(OrderSummaryDiscount));
