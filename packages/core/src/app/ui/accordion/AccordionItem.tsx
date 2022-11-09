import classNames from 'classnames';
import React, { FunctionComponent, ReactNode, useCallback, useContext  } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Cart,Consignment, } from '@bigcommerce/checkout-sdk';
import { CheckoutContextProps, withCheckout } from '../../checkout';
import AccordionContext from './AccordionContext';

export interface AccordionItemProps {
    bodyClassName?: string;
    children?: ReactNode;
    className?: string;
    classNameSelected?: string;
    headerClassName?: string;
    headerClassNameSelected?: string;
    itemId: string;
    headerContent(props: AccordionItemHeaderProps): ReactNode;
}


export interface WithCheckoutCODProps {
    cart: Cart;
    consignments: Consignment[];
    isInitializing: boolean;
    isLoading?: boolean;
}

export interface AccordionItemHeaderProps {
    isSelected: boolean;
    onToggle(id: string): void;
}

const AccordionItem: FunctionComponent<AccordionItemProps & WithCheckoutCODProps> = ({
    bodyClassName = 'accordion-item-body',
    children,
    className = 'accordion-item',
    classNameSelected = 'accordion-item--selected',
    headerClassName = 'accordion-item-header',
    headerClassNameSelected = 'accordion-item-header--selected',
    headerContent,
    cart,
    itemId,
}) => {
    const { onToggle, selectedItemId } = useContext(AccordionContext);
    const isSelected = selectedItemId === itemId;

    const transitionEndListener = useCallback((node, done) => {
        node.addEventListener('transitionend', ({ target }: Event) => {
            if (target === node) {
                done();
            }
        });
    }, []);
    
    
    const hasDigitalItem = cart.lineItems.digitalItems;
    
    if(hasDigitalItem.length >= 1){
        if(itemId === 'cod'){
            return null;
        }
    }

    // if(itemId === 'cod'){
    //     return null;
    // }

    return (
        <li
            className={classNames(className, { [classNameSelected]: isSelected })}
            data-test={`accordion-item_${itemId}`}
        >
            <div className={classNames(headerClassName, { [headerClassNameSelected]: isSelected })}>
                {headerContent({ isSelected, onToggle })}
            </div>

            {children && (
                <CSSTransition
                    addEndListener={transitionEndListener}
                    classNames={bodyClassName}
                    in={isSelected}
                    mountOnEnter
                    timeout={{}}
                    unmountOnExit
                >
                    <div className={bodyClassName}>{children}</div>
                </CSSTransition>
            )}
        </li>
    );
};


export function mapToDonationProps({
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
    };
}

export default withCheckout(mapToDonationProps)(AccordionItem);
// export default memo(AccordionItem);
