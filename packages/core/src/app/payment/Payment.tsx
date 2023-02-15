import {
    CartChangedError,
    CheckoutSelectors,
    CheckoutSettings,
    OrderRequestBody,
    PaymentMethod
} from '@bigcommerce/checkout-sdk';
import { memoizeOne } from '@bigcommerce/memoize';
import { compact, find, isEmpty, noop } from 'lodash';
import React, { Component, ReactNode } from 'react';
import { ObjectSchema } from 'yup';

import { PaymentFormValues } from '@bigcommerce/checkout/payment-integration-api';

import { CheckoutContextProps, withCheckout } from '../checkout';
import {
    ErrorLogger,
    ErrorModal,
    ErrorModalOnCloseProps,
    isCartChangedError,
    isErrorWithType,
} from '../common/error';
import { EMPTY_ARRAY } from '../common/utility';
import { withLanguage, WithLanguageProps } from '../locale';
import { TermsConditionsType } from '../termsConditions';
import { LoadingOverlay } from '../ui/loading';

import mapSubmitOrderErrorMessage, { mapSubmitOrderErrorTitle } from './mapSubmitOrderErrorMessage';
import mapToOrderRequestBody from './mapToOrderRequestBody';
import PaymentContext from './PaymentContext';
import PaymentForm from './PaymentForm';
import {
    getUniquePaymentMethodId,
    PaymentMethodId,
    PaymentMethodProviderType,
} from './paymentMethod';
import KoreaPayment from './KoreaPayment';
import './cj-payment.scss';
import KoreaVirtualAcocout from './KoreaVirtualAccount';


export interface PaymentProps {
    errorLogger: ErrorLogger;
    isEmbedded?: boolean;
    isUsingMultiShipping?: boolean;
    checkEmbeddedSupport?(methodIds: string[]): void; // TODO: We're currently doing this check in multiple places, perhaps we should move it up so this check get be done in a single place instead.
    onCartChangedError?(error: CartChangedError): void;
    onFinalize?(): void;
    onFinalizeError?(error: Error): void;
    onReady?(): void;
    onSubmit?(): void;
    onSubmitError?(error: Error): void;
    onUnhandledError?(error: Error): void;
    customizeCheckout: string;
    customzieCart: any;
}

interface WithCheckoutPaymentProps {
    availableStoreCredit: number;
    cartUrl: string;
    defaultMethod?: PaymentMethod;
    finalizeOrderError?: Error;
    isInitializingPayment: boolean;
    isSubmittingOrder: boolean;
    isStoreCreditApplied: boolean;
    isTermsConditionsRequired: boolean;
    methods: PaymentMethod[];
    shouldExecuteSpamCheck: boolean;
    shouldLocaliseErrorMessages: boolean;
    submitOrderError?: Error;
    termsConditionsText?: string;
    termsConditionsUrl?: string;
    usableStoreCredit: number;
    storeHash: string;
    applyStoreCredit(useStoreCredit: boolean): Promise<CheckoutSelectors>;
    clearError(error: Error): void;
    finalizeOrderIfNeeded(): Promise<CheckoutSelectors>;
    isPaymentDataRequired(): boolean;
    loadCheckout(): Promise<CheckoutSelectors>;
    loadPaymentMethods(): Promise<CheckoutSelectors>;
    submitOrder(values: OrderRequestBody): Promise<CheckoutSelectors>;
}

interface PaymentState {
    didExceedSpamLimit: boolean;
    isReady: boolean;
    selectedMethod?: PaymentMethod;
    shouldDisableSubmit: { [key: string]: boolean };
    shouldHidePaymentSubmitButton: { [key: string]: boolean };
    submitFunctions: { [key: string]: ((values: PaymentFormValues) => void) | null };
    validationSchemas: { [key: string]: ObjectSchema<Partial<PaymentFormValues>> | null };
    showVirtualMethod: boolean;
}

interface KoreaPaymentMethodsProps {
    params: string;
    imgName: string;
    id:number;
}
export interface IVirtualAccout {
    id: number;
    value: string;
    bank: string;
}

export interface ICashRecive {
    id: number;
    method: "미발행" | "소득공제" | "지출증빙";
    value: string;
    tagId: string;
    checked: boolean;
}



class Payment extends Component<
    PaymentProps & WithCheckoutPaymentProps & WithLanguageProps,
    PaymentState
> {
    state: PaymentState = {
        didExceedSpamLimit: false,
        isReady: false,
        shouldDisableSubmit: {},
        shouldHidePaymentSubmitButton: {},
        validationSchemas: {},
        submitFunctions: {},
        showVirtualMethod: false,
    };

    private getContextValue = memoizeOne(() => {
        return {
            disableSubmit: this.disableSubmit,
            setSubmit: this.setSubmit,
            setValidationSchema: this.setValidationSchema,
            hidePaymentSubmitButton: this.hidePaymentSubmitButton,
        };
    });

    async componentDidMount(): Promise<void> {
        const {
            finalizeOrderIfNeeded,
            loadPaymentMethods,
            onFinalize = noop,
            onFinalizeError = noop,
            onReady = noop,
            onUnhandledError = noop,
            usableStoreCredit,
        } = this.props;

        if (usableStoreCredit) {
            this.handleStoreCreditChange(true);
        }

        try {
            await loadPaymentMethods();
        } catch (error) {
            onUnhandledError(error);
        }

        try {
            const state = await finalizeOrderIfNeeded();
            const order = state.data.getOrder();

            onFinalize(order?.orderId);
        } catch (error) {
            if (isErrorWithType(error) && error.type !== 'order_finalization_not_required') {
                onFinalizeError(error);
            }
        }

        window.addEventListener('beforeunload', this.handleBeforeUnload);
        this.setState({ isReady: true });
        onReady();
    }

    componentDidUpdate(): void {
        const { checkEmbeddedSupport = noop, methods } = this.props;

        checkEmbeddedSupport(methods.map(({ id }) => id));
    }

    componentWillUnmount(): void {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    render(): ReactNode {
        const {
            defaultMethod,
            finalizeOrderError,
            isInitializingPayment,
            isUsingMultiShipping,
            methods,
            applyStoreCredit,
            customizeCheckout,
            customzieCart,
            storeHash,
            ...rest
        } = this.props;

        const {
            didExceedSpamLimit,
            isReady,
            selectedMethod = defaultMethod,
            shouldDisableSubmit,
            validationSchemas,
            shouldHidePaymentSubmitButton,
            showVirtualMethod,
        } = this.state;


        const uniqueSelectedMethodId =
            selectedMethod && getUniquePaymentMethodId(selectedMethod.id, selectedMethod.gateway);


        // CJ payment mapping(ID, parameter, imgsrcName)
        const krPaymentMethodsString: KoreaPaymentMethodsProps[] = [
            {
                id: 0,
                params: "Creditcard",
                imgName: "credit"
            },
            {
                id: 1,
                params: "PCO",
                imgName: "pco"
            },
            {
                id: 2,
                params: "Account",
                imgName: "account"
            },
            {
                id: 3,
                params: "VirtualAccount",
                imgName: "virtualAccount"
            },
            {
                id: 4,
                params: "NVP",
                imgName: "nvp"
            },
            {
                id: 5,
                params: "KKO",
                imgName: "kakao"
            },
            {
                id: 6,
                params: "HPP",
                imgName: "hpp"
            }
        ]


        const virtualAccoutValues: IVirtualAccout[] = [
            {
                id: 0,
                value: "003",
                bank: "기업"
            },
            {
                id: 1,
                value: "004",
                bank: "국민"
            },
            {
                id: 2,
                value: "007",
                bank: "수협"
            },
            {
                id: 3,
                value: "011",
                bank: "농협"
            },
            {
                id: 4,
                value: "020",
                bank: "우리"
            },
            {
                id: 5,
                value: "031",
                bank: "대구"
            },
            {
                id: 6,
                value: "032",
                bank: "부산"
            },
            {
                id: 7,
                value: "039",
                bank: "경남"
            },
            {
                id: 8,
                value: "071",
                bank: "우체국"
            },
            {
                id: 9,
                value: "081",
                bank: "하나"
            },
            {
                id: 10,
                value: "088",
                bank: "신한"
            },
        ]

        const methodsCashRecive: ICashRecive[] = [
            {
                id: 0,
                method: "미발행",
                value: "00",
                tagId: "CashReceiptUse1",
                checked: true
            },
            {
                id: 1,
                method: "소득공제",
                value: "01",
                tagId: "CashReceiptUse2",
                checked: false
            },
            {
                id: 2,
                method: "지출증빙",
                value: "02",
                tagId: "CashReceiptUse3",
                checked: false
            }
        ]

        // CJ payment window popup open
        const krPaymentMethods = (payName: string) => {
            const VIRTUAL_ACCOUNT_PARAMS = payName === 'VirtualAccount';
            let PAY_URL;
            let width = 600;
            let height = 700;
            let top = (window.innerHeight - height) / 2 + screenY;
            let left = (window.innerWidth - width) / 2 + screenX;
            let spec = 'status=no, menubar=no, toolbar=no, resizable=no';
            spec += ', width=' + width + ', height=' + height;
            spec += ', top=' + top + ', left=' + left;

            // payName이 가상계좌가 아닐때 logic , confirm창 
            if (!VIRTUAL_ACCOUNT_PARAMS && window.confirm('확인 -> localhost:3000\n취소 -> payment.madive.co.kr')) {
                PAY_URL = `http://localhost/openPayment?id=${customizeCheckout}&cid=${customzieCart.customerId}&payCd=${payName}&storeHash=${storeHash}`;
            } else {
                PAY_URL = `https://payment.madive.co.kr/openPayment?id=${customizeCheckout}&cid=${customzieCart.customerId}&payCd=${payName}&storeHash=${storeHash}`;
            }
            // payName이 가상계좌 일때 logic
            if (VIRTUAL_ACCOUNT_PARAMS) {
                this.setState({
                    showVirtualMethod: true
                });
                setTimeout(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                }, 300);
                // payName 파라미터가 아닐떄 virtual state logic
            } else if (!VIRTUAL_ACCOUNT_PARAMS) {
                this.setState({
                    showVirtualMethod: false
                })
                window.open(PAY_URL, 'popup', spec);
            }
        }


        return (
            <PaymentContext.Provider value={this.getContextValue()}>
                <LoadingOverlay isLoading={!isReady} unmountContentWhenLoading>
                    {!isEmpty(methods) && defaultMethod && (
                        <PaymentForm
                            {...rest}
                            defaultGatewayId={defaultMethod.gateway}
                            defaultMethodId={defaultMethod.id}
                            didExceedSpamLimit={didExceedSpamLimit}
                            isInitializingPayment={isInitializingPayment}
                            isUsingMultiShipping={isUsingMultiShipping}
                            methods={methods}
                            onMethodSelect={this.setSelectedMethod}
                            onStoreCreditChange={this.handleStoreCreditChange}
                            onSubmit={this.handleSubmit}
                            onUnhandledError={this.handleError}
                            selectedMethod={selectedMethod}
                            shouldDisableSubmit={
                                (uniqueSelectedMethodId &&
                                    shouldDisableSubmit[uniqueSelectedMethodId]) ||
                                undefined
                            }
                            shouldHidePaymentSubmitButton={
                                (uniqueSelectedMethodId &&
                                    shouldHidePaymentSubmitButton[uniqueSelectedMethodId]) ||
                                undefined
                            }
                            validationSchema={
                                (uniqueSelectedMethodId &&
                                    validationSchemas[uniqueSelectedMethodId]) ||
                                undefined
                            }
                        />
                    )}
                    {/* KoreaCJ Payment Mapping */}
                    <div className="payment-wrap checkout-form">
                        {krPaymentMethodsString.map((item: KoreaPaymentMethodsProps) => {
                            return (
                                <KoreaPayment
                                    krPaymentMethods={krPaymentMethods}
                                    params={item.params}
                                    imgName={item.imgName}
                                    key={item.id}
                                />
                            )
                        })}
                    </div>
                    {showVirtualMethod &&
                        <KoreaVirtualAcocout
                            virtualAccoutValues={virtualAccoutValues}
                            methodsCashRecive={methodsCashRecive}
                            krPaymentMethods={krPaymentMethods}
                            customizeCheckout={customizeCheckout}
                            customerId={customzieCart.customerId}
                            storeHash={storeHash}
                        />
                    }
                </LoadingOverlay>

                {this.renderOrderErrorModal()}
                {this.renderEmbeddedSupportErrorModal()}
            </PaymentContext.Provider>
        );
    }

    private renderOrderErrorModal(): ReactNode {
        const { finalizeOrderError, language, shouldLocaliseErrorMessages, submitOrderError } =
            this.props;

        // FIXME: Export correct TS interface
        const error: any = submitOrderError || finalizeOrderError;

        if (
            !error ||
            error.type === 'order_finalization_not_required' ||
            error.type === 'payment_cancelled' ||
            error.type === 'payment_invalid_form' ||
            error.type === 'spam_protection_not_completed' ||
            error.type === 'invalid_hosted_form_value'
        ) {
            return null;
        }

        return (
            <ErrorModal
                error={error}
                message={mapSubmitOrderErrorMessage(
                    error,
                    language.translate.bind(language),
                    shouldLocaliseErrorMessages,
                )}
                onClose={this.handleCloseModal}
                title={mapSubmitOrderErrorTitle(error, language.translate.bind(language))}
            />
        );
    }

    private renderEmbeddedSupportErrorModal(): ReactNode {
        const { checkEmbeddedSupport = noop, methods } = this.props;

        try {
            checkEmbeddedSupport(methods.map(({ id }) => id));
        } catch (error) {
            if (error instanceof Error) {
                return <ErrorModal error={error} onClose={this.handleCloseModal} />;
            }
        }

        return null;
    }

    private disableSubmit: (method: PaymentMethod, disabled?: boolean) => void = (
        method,
        disabled = true,
    ) => {
        const uniqueId = getUniquePaymentMethodId(method.id, method.gateway);
        const { shouldDisableSubmit } = this.state;

        if (shouldDisableSubmit[uniqueId] === disabled) {
            return;
        }

        this.setState({
            shouldDisableSubmit: {
                ...shouldDisableSubmit,
                [uniqueId]: disabled,
            },
        });
    };

    private hidePaymentSubmitButton: (method: PaymentMethod, disabled?: boolean) => void = (
        method,
        disabled = true,
    ) => {
        const uniqueId = getUniquePaymentMethodId(method.id, method.gateway);
        const { shouldHidePaymentSubmitButton } = this.state;

        if (shouldHidePaymentSubmitButton[uniqueId] === disabled) {
            return;
        }


        this.setState({
            shouldHidePaymentSubmitButton: {
                ...shouldHidePaymentSubmitButton,
                [uniqueId]: disabled,
            },
        });
    };

    // tslint:disable:cyclomatic-complexity
    private handleBeforeUnload: (event: BeforeUnloadEvent) => string | undefined = (event) => {
        const { defaultMethod, isSubmittingOrder, language } = this.props;
        const { selectedMethod = defaultMethod } = this.state;

        // TODO: Perhaps there is a better way to handle `adyen`, `afterpay`, `amazon`,
        // `checkout.com`, `converge`, `sagepay`, `stripev3` and `sezzle`. They require
        //  a redirection to another website during the payment flow but are not
        //  categorised as hosted payment methods.
        if (
            !isSubmittingOrder ||
            !selectedMethod ||
            selectedMethod.type === PaymentMethodProviderType.Hosted ||
            selectedMethod.type === PaymentMethodProviderType.PPSDK ||
            selectedMethod.id === PaymentMethodId.Amazon ||
            selectedMethod.id === PaymentMethodId.AmazonPay ||
            selectedMethod.id === PaymentMethodId.CBAMPGS ||
            selectedMethod.id === PaymentMethodId.Checkoutcom ||
            selectedMethod.id === PaymentMethodId.CheckoutcomGooglePay ||
            selectedMethod.id === PaymentMethodId.Converge ||
            selectedMethod.id === PaymentMethodId.Humm ||
            selectedMethod.id === PaymentMethodId.Laybuy ||
            selectedMethod.id === PaymentMethodId.Opy ||
            selectedMethod.id === PaymentMethodId.Quadpay ||
            selectedMethod.id === PaymentMethodId.SagePay ||
            selectedMethod.id === PaymentMethodId.Sezzle ||
            selectedMethod.id === PaymentMethodId.WorldpayAccess ||
            selectedMethod.id === PaymentMethodId.Zip ||
            selectedMethod.gateway === PaymentMethodId.AdyenV2 ||
            selectedMethod.gateway === PaymentMethodId.AdyenV2GooglePay ||
            selectedMethod.gateway === PaymentMethodId.AdyenV3 ||
            selectedMethod.gateway === PaymentMethodId.AdyenV3GooglePay ||
            selectedMethod.gateway === PaymentMethodId.Afterpay ||
            selectedMethod.gateway === PaymentMethodId.Clearpay ||
            selectedMethod.gateway === PaymentMethodId.Checkoutcom ||
            selectedMethod.gateway === PaymentMethodId.Mollie ||
            selectedMethod.gateway === PaymentMethodId.StripeV3
        ) {
            return;
        }

        const message = language.translate('common.leave_warning');

        event.returnValue = message;

        return message;
    };

    private handleCloseModal: (event: Event, props: ErrorModalOnCloseProps) => Promise<void> =
        async (_, { error }) => {
            if (!error) {
                return;
            }

            const { cartUrl, clearError, loadCheckout } = this.props;
            const { type: errorType } = error as any; // FIXME: Export correct TS interface

            if (
                errorType === 'provider_fatal_error' ||
                errorType === 'order_could_not_be_finalized_error'
            ) {
                window.location.replace(cartUrl || '/');
            }

            if (errorType === 'tax_provider_unavailable') {
                window.location.reload();
            }

            if (isErrorWithType(error)) {
                const { body, headers, status } = error;

                if (body.type === 'provider_error' && headers.location) {
                    window.top?.location.assign(headers.location);
                }

                // Reload the checkout object to get the latest `shouldExecuteSpamCheck` value,
                // which will in turn make `SpamProtectionField` visible again.
                // NOTE: As a temporary fix, we're checking the status code instead of the error
                // type because of an issue with Nginx config, which causes the server to return
                // HTML page instead of JSON response when there is a 429 error.
                if (
                    status === 429 ||
                    body.type === 'spam_protection_expired' ||
                    body.type === 'spam_protection_failed'
                ) {
                    this.setState({ didExceedSpamLimit: true });

                    await loadCheckout();
                }
            }

            clearError(error);
        };

    private handleStoreCreditChange: (useStoreCredit: boolean) => void = async (useStoreCredit) => {
        const { applyStoreCredit, onUnhandledError = noop } = this.props;

        try {
            await applyStoreCredit(useStoreCredit);
        } catch (e) {
            onUnhandledError(e);
        }
    };

    private handleError: (error: Error) => void = (error: Error) => {
        const { onUnhandledError = noop, errorLogger } = this.props;

        const { type } = error as any;

        if (type === 'unexpected_detachment') {
            errorLogger.log(error);

            return;
        }

        return onUnhandledError(error);
    };

    private handleSubmit: (values: PaymentFormValues) => void = async (values) => {
        const {
            defaultMethod,
            loadPaymentMethods,
            isPaymentDataRequired,
            onCartChangedError = noop,
            onSubmit = noop,
            onSubmitError = noop,
            submitOrder,
        } = this.props;
        console.log(this.props);
        const { selectedMethod = defaultMethod, submitFunctions } = this.state;

        const customSubmit =
            selectedMethod &&
            submitFunctions[getUniquePaymentMethodId(selectedMethod.id, selectedMethod.gateway)];

        if (customSubmit) {
            return customSubmit(values);
        }

        try {
            const state = await submitOrder(mapToOrderRequestBody(values, isPaymentDataRequired()));
            const order = state.data.getOrder();

            onSubmit(order?.orderId);
        } catch (error) {
            if (isErrorWithType(error) && error.type === 'payment_method_invalid') {
                return loadPaymentMethods();
            }

            if (isCartChangedError(error)) {
                return onCartChangedError(error);
            }

            onSubmitError(error);
        }
    };

    private setSelectedMethod: (method?: PaymentMethod) => void = (method) => {
        const { selectedMethod } = this.state;

        if (selectedMethod === method) {
            return;
        }

        this.setState({ selectedMethod: method });
    };

    private setSubmit: (
        method: PaymentMethod,
        fn: (values: PaymentFormValues) => void | null,
    ) => void = (method, fn) => {
        const uniqueId = getUniquePaymentMethodId(method.id, method.gateway);
        const { submitFunctions } = this.state;

        if (submitFunctions[uniqueId] === fn) {
            return;
        }

        this.setState({
            submitFunctions: {
                ...submitFunctions,
                [uniqueId]: fn,
            },
        });
    };

    private setValidationSchema: (
        method: PaymentMethod,
        schema: ObjectSchema<Partial<PaymentFormValues>> | null,
    ) => void = (method, schema) => {
        const uniqueId = getUniquePaymentMethodId(method.id, method.gateway);
        const { validationSchemas } = this.state;

        if (validationSchemas[uniqueId] === schema) {
            return;
        }

        this.setState({
            validationSchemas: {
                ...validationSchemas,
                [uniqueId]: schema,
            },
        });
    };
}

export function mapToPaymentProps({ checkoutService, checkoutState, }: CheckoutContextProps): WithCheckoutPaymentProps | null {
    const {
        data: {
            getCheckout,
            getConfig,
            getCustomer,
            getConsignments,
            getOrder,
            getPaymentMethod,
            getPaymentMethods,
            isPaymentDataRequired,
        },
        errors: { getFinalizeOrderError, getSubmitOrderError },
        statuses: { isInitializingPayment, isSubmittingOrder },
    } = checkoutState;

    console.log(checkoutState)

    const checkout = getCheckout();
    const config = getConfig();
    const customer = getCustomer();
    const consignments = getConsignments();
    const { isComplete = false } = getOrder() || {};
    let methods = getPaymentMethods() || EMPTY_ARRAY;

    //TODO: In accordance with the checkout team, this functionality is temporary and will be implemented in the backend instead.
    if (customer?.isStripeLinkAuthenticated) {
        const stripeUpePaymentMethod = methods.filter(method =>
            method.id === 'card' && method.gateway === PaymentMethodId.StripeUPE
        );

        methods = stripeUpePaymentMethod.length ? stripeUpePaymentMethod : methods;
    }


    if (!checkout || !config || !customer || isComplete) {
        return null;
    }

    const {
        enableTermsAndConditions: isTermsConditionsEnabled,
        features,
        orderTermsAndConditionsType: termsConditionsType,
        orderTermsAndConditions: termsCondtitionsText,
        orderTermsAndConditionsLink: termsCondtitionsUrl,
    } = config.checkoutSettings as CheckoutSettings & { orderTermsAndConditionsLocation: string };

    const isTermsConditionsRequired = isTermsConditionsEnabled;
    const selectedPayment = find(checkout.payments, {
        providerType: PaymentMethodProviderType.Hosted,
    });

    const { isStoreCreditApplied } = checkout;

    let selectedPaymentMethod;
    let filteredMethods;

    filteredMethods = methods.filter((method: PaymentMethod) => {
        if (method.id === PaymentMethodId.Bolt && method.initializationData) {
            return !!method.initializationData.showInCheckout;
        }

        return true;
    });

    if (consignments && consignments.length > 1) {
        const multiShippingIncompatibleMethodIds: string[] = [
            PaymentMethodId.AmazonPay,
            PaymentMethodId.Amazon,
        ];

        filteredMethods = methods.filter((method: PaymentMethod) => {
            return multiShippingIncompatibleMethodIds.indexOf(method.id) === -1;
        });
    }

    if (selectedPayment) {
        selectedPaymentMethod = getPaymentMethod(
            selectedPayment.providerId,
            selectedPayment.gatewayId,
        );
        filteredMethods = selectedPaymentMethod
            ? compact([selectedPaymentMethod])
            : filteredMethods;
    } else {
        selectedPaymentMethod = find(filteredMethods, {
            config: { hasDefaultStoredInstrument: true },
        });
        // eslint-disable-next-line no-self-assign
        filteredMethods = filteredMethods;
    }

    return {
        applyStoreCredit: checkoutService.applyStoreCredit,
        availableStoreCredit: customer.storeCredit,
        cartUrl: config.links.cartLink,
        //Added storeahs props 
        storeHash: config.storeProfile.storeHash,
        clearError: checkoutService.clearError,
        defaultMethod: selectedPaymentMethod || filteredMethods[0],
        finalizeOrderError: getFinalizeOrderError(),
        finalizeOrderIfNeeded: checkoutService.finalizeOrderIfNeeded,
        loadCheckout: checkoutService.loadCheckout,
        isInitializingPayment: isInitializingPayment(),
        isPaymentDataRequired,
        isStoreCreditApplied,
        isSubmittingOrder: isSubmittingOrder(),
        isTermsConditionsRequired,
        loadPaymentMethods: checkoutService.loadPaymentMethods,
        methods: filteredMethods,
        shouldExecuteSpamCheck: checkout.shouldExecuteSpamCheck,
        shouldLocaliseErrorMessages:
            features['PAYMENTS-6799.localise_checkout_payment_error_messages'],
        submitOrder: checkoutService.submitOrder,
        submitOrderError: getSubmitOrderError(),
        termsConditionsText:
            isTermsConditionsRequired && termsConditionsType === TermsConditionsType.TextArea
                ? termsCondtitionsText
                : undefined,
        termsConditionsUrl:
            isTermsConditionsRequired && termsConditionsType === TermsConditionsType.Link
                ? termsCondtitionsUrl
                : undefined,
        usableStoreCredit:
            checkout.grandTotal > 0 ? Math.min(checkout.grandTotal, customer.storeCredit || 0) : 0,
    };
}

export default withLanguage(withCheckout(mapToPaymentProps)(Payment));


