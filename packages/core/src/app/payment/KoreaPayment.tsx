import React from 'react';
import { TranslatedString } from '../locale';
import { Button, ButtonSize, ButtonVariant } from '../ui/button';
interface KoreaPaymentProps {
  params: string,
  imgName: string,
  krPaymentMethods(payName: string): void
}

const KoreaPayment = ({
  params,
  imgName,
  krPaymentMethods
}: KoreaPaymentProps) => {

  return (
    <>
      <Button
        className={`button--slab korea-btn ${imgName}`}
        size={ButtonSize.Large}
        variant={ButtonVariant.Primary}
        onClick={() => { krPaymentMethods(params) }}
      >
        <TranslatedString
          id={`payment.korea_payment_${params}`}
        />
      </Button>
    </>
    
  );
};

export default KoreaPayment;