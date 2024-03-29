import { CheckoutSelectors, CheckoutService } from '@bigcommerce/checkout-sdk';
import { createContext } from 'react';

export interface CheckoutContextProps {
    checkoutService: CheckoutService;
    checkoutState: CheckoutSelectors;
    test?:any;
}

const CheckoutContext = createContext<CheckoutContextProps | undefined>(undefined);

export default CheckoutContext;
