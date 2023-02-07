# Checkout JS
MAC OS (리눅스) 환경에서 가능

# Process Checkout
클래스 컴포넌트 , 함수형 컴포넌트 이중사용중
상태관리는 context api 로 사용중이라 별개의 컴포넌트에서 checkout context를 이용할시 아래 코드 처럼 import 해와서 사용 하려고 하는 컴포넌트에서 props 이용하면 됨.
기존 컴포넌트가 memoziation 으로 감싸져있으면 아래와 같이 감싸줘야함. (컴포넌트 성능개선)
Typescript로 되어있어서 항상 최상단에 interface 로 type 선언을 해줘야함.

----------

클래스형 컴포넌트에선 react hook 사용 불가 , useState , useEffect 등 리액트 훅들을 클래스형 컴포넌트 맞게끔 써야함. ex) setState: "value " , componentDidMount() , componentWillMount()

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