import { CheckoutSelectors, CheckoutService } from '@bigcommerce/checkout-sdk';
import { memoizeOne } from '@bigcommerce/memoize';
import React, { Component, ReactNode } from 'react';

import CheckoutContext from './CheckoutContext';

export interface CheckoutProviderProps {
    checkoutService: CheckoutService;
}

export interface CheckoutProviderState {
    checkoutState: CheckoutSelectors;
    packageData:any;
}

export default class CheckoutProvider extends Component<
    CheckoutProviderProps,
    CheckoutProviderState
> {
    state: Readonly<CheckoutProviderState>;

    private unsubscribe?: () => void;

    private getContextValue = memoizeOne((checkoutService, checkoutState) => {
        return {
            checkoutService,
            checkoutState,
        };
    });

    constructor(props: Readonly<CheckoutProviderProps>) {
        super(props);

        this.state = {
            checkoutState: props.checkoutService.getState(),
            packageData:[]
        };
    }

    componentDidMount(): void {
        const { checkoutService } = this.props;
        const {packageData} = this.state;
        fetch('https://jsonplaceholder.typicode.com/todos')
        .then(response => response.json())
        .then(json => this.setState({
            packageData:json
        }))
        console.log(packageData);
        this.unsubscribe = checkoutService.subscribe((checkoutState) =>
            this.setState({ checkoutState }),
        );
    }

    componentWillUnmount(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = undefined;
        }
    }

    render(): ReactNode {
        const { checkoutService, children } = this.props;
        const { checkoutState , packageData } = this.state;
        console.log(packageData);

        return (
            <CheckoutContext.Provider value={{
                ...this.getContextValue(checkoutService, checkoutState),
                test:'hello'
            }}>
                {children}
            </CheckoutContext.Provider>
        );
    }
}
