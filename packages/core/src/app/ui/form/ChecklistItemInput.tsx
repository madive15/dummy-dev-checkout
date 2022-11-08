import React, { FunctionComponent, InputHTMLAttributes, useEffect, useState } from 'react';
import { Cart, CheckoutParams, CheckoutRequestBody, CheckoutSelectors, Consignment, RequestOptions } from '@bigcommerce/checkout-sdk';
import Input from './Input';
import Label from './Label';
import { CheckoutContextProps, withCheckout } from '../../checkout';
import { findIndex } from 'lodash';
import { Modal } from '../modal';



export interface ManageInstrumentsModalProps {
    isOpen?: boolean;
}

export interface ChecklistItemInputProps extends InputHTMLAttributes<HTMLInputElement> {
    isSelected: boolean;
    value: any;
}

export interface WithCheckoutCODProps {
    cart: Cart;
    consignments: Consignment[];
    isInitializing: boolean;
    isLoading?: boolean;
    loadCheckout(id: any, options?: RequestOptions<CheckoutParams>): Promise<CheckoutSelectors>;
    loadShippingOptions?(): Promise<CheckoutSelectors>;
    updateCheckout?(payload: CheckoutRequestBody): Promise<CheckoutSelectors>;
}

const ChecklistItemInput: FunctionComponent<ChecklistItemInputProps & WithCheckoutCODProps & ManageInstrumentsModalProps> = ({
    id,
    isSelected,
    children,
    value,
    loadCheckout,
    cart,
    consignments,
    updateCheckout,
    isOpen,
    ...props
}) => {


    let index = findIndex(cart!.lineItems.physicalItems, { sku: "COD1" });
    const cartId = cart.id;
    // const testt = cart.lineItems.digitalItems;


    const _updateShippingCostTotal = () => {
        return new Promise(async (resolve, reject) => {
            const arrConsignments = consignments.map(consignment => {
                return {
                    consignmentId: consignment.id,
                    selectedShippingOptionId: (consignment.selectedShippingOption ? consignment.selectedShippingOption.id : null)
                }
            })
            for (let i = 0; i < arrConsignments.length; i++) {
                const consignmentId = arrConsignments[i].consignmentId
                const shippingOptionId = arrConsignments[i].selectedShippingOptionId

                // if (!shippingOptionId) return

                await fetch(`/api/storefront/checkouts/${cart.id}/consignments/${consignmentId}?include=consignments.availableShippingOptions%2Ccart.lineItems.physicalItems.options%2Ccart.lineItems.digitalItems.options%2Ccustomer%2Cpromotions.banners`, {
                    method: 'PUT',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        shippingOptionId
                    })
                }).then(resp => {
                    return resp.json()
                })
                    .catch(err => {
                        console.log(err);
                        reject(true);
                    });
            }
            resolve(true)
        })
    }

    const [modal, setModal] = useState<boolean>(false)
    const closeModal = () => {setModal(false);}
    // Add to cart
    useEffect(() => {
        if (value === 'cod' && isSelected === true && index === -1 || index === null || index === undefined) {
            setModal(true);
            fetch('/cart.php?action=add&sku=COD1&qty=1').then(res => {
                console.log(res);
                _updateShippingCostTotal().then(data => {
                    console.log(data);
                    loadCheckout(cartId, {
                        params: {
                            include: [
                                'cart.lineItems.physicalItems.categoryNames',
                                'cart.lineItems.digitalItems.categoryNames',
                            ] as any,
                        },
                    });
                    // setInput((prev:any)=>{
                    //     return prev.target.value
                    // })
                })
            })
        }
    }, [isSelected]);

    // Remvoe the FEE product when a customer select \
    useEffect(() => {
        let index = findIndex(cart.lineItems.physicalItems, { sku: "COD1" });

        if (index === -1 || index === undefined || index === null) {
            return
        }
        if (value !== 'cod' && isSelected === true) {
            const cartId = cart.id;
            const itemId = cart.lineItems.physicalItems[index].id!;
            fetch(`/api/storefront/carts/${cartId}/items/${itemId}`, {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    console.log(response);
                    _updateShippingCostTotal().then(data => {
                        console.log(data);
                        loadCheckout(cartId, {
                            params: {
                                include: [
                                    'cart.lineItems.physicalItems.categoryNames',
                                    'cart.lineItems.digitalItems.categoryNames',
                                ] as any,
                            },
                        });
                    })
                })
        }
    }, [isSelected])

    return (
        <>
            <Modal
                isOpen={modal}
            >
                <div className="btn-wrap" style={{ display: "flex", flexDirection: "column" }}>
                    <p style={{ textAlign: "center", fontSize: "20px" }}>代金引換でお支払いする際、440円の手数料が追加されます。</p>
                    <button
                        type='button'
                        className='button button--small'
                        onClick={closeModal}>
                        確認
                    </button>
                </div>
            </Modal>
            <Input
                {...props}
                checked={isSelected}
                className="form-checklist-checkbox optimizedCheckout-form-checklist-checkbox"
                id={id}
                type="radio"
                value={value}
            />
            <Label htmlFor={id}>{children}</Label>
        </>
    );
}

export function mapToDonationProps({
    checkoutService,
    checkoutState,
}: CheckoutContextProps): WithCheckoutCODProps | null {
    const {
        data: {
            getCart,
            getCheckout,
            getConsignments,
        },
        statuses: {
            isLoadingShippingOptions,
            isUpdatingConsignment,
            isUpdatingCheckout,
        },
    } = checkoutState;

    const checkout = getCheckout();
    const cart = getCart();
    const consignments = getConsignments() || [];

    if (!checkout || !cart) {
        return null;
    }

    const isLoading = (
        isLoadingShippingOptions() ||
        isUpdatingConsignment() ||
        isUpdatingCheckout()
    );


    return {
        cart,
        consignments,
        isInitializing: isUpdatingCheckout(),
        isLoading,
        loadCheckout: checkoutService.loadCheckout,
        loadShippingOptions: checkoutService.loadShippingOptions,
        updateCheckout: checkoutService.updateCheckout,
    };
}

export default withCheckout(mapToDonationProps)(ChecklistItemInput);

