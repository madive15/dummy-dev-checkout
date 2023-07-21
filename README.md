# Checkout JS
MAC OS (리눅스) 환경에서 가능

# Command 
* npm run dev & npm run dev:server
# Process Checkout
 * 클래스 컴포넌트 , 함수형 컴포넌트 이중사용중

## Context API
 * CheckoutProvider.tsx
 * mapToCheckoutProps.ts
 * CheckoutContext.tsx (type)
 

```js
export function mapToDonationProps({
    checkoutService,
    checkoutState,
}: CheckoutContextProps): WithCheckoutShippingProps | null {
    const {
        data: {
            getCart,
            getCheckout,
            getConsignments,
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

export default memo(withCheckout(mapToDonationProps)(ShippingOptionsList));

```
# How to build ?
1.npm run build (build error 시 import만 되고 실제로 코드에 사용하지 않으면 build 오류 발생 , 안쓰는 import 는 지워 줄것)
2.빌드가 완료되면 , webdav 실행 후 content 안에 dist 폴더 업로드 (dist 폴더안에 auto-loader.js 로 돌아감)