import React from 'react';

interface ValidationProps {
  validation:string;
}

const CJPaymentValidation = ({validation}:ValidationProps) => {
  return (
    <p style={{color:'red',fontSize:'12px',marginBottom:'0'}}>{validation}</p>
  );
};

export default CJPaymentValidation;