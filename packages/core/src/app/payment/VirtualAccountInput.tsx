import React from 'react';
import CJPaymentValidation from './CJPaymentValidation';

interface VirtualAccoutInputProps {
  title: string;
  inputValue: string;
  inputName: string;
  inputID: string;
  placeholder:string;
  validationType: boolean;
  validationString: string;
  onChangeP(event:React.ChangeEvent<HTMLInputElement>):void;
}


const VirtualAccountInput = ({
  title,
  inputID,
  inputValue,
  inputName,
  placeholder,
  validationType,
  validationString,
  onChangeP
}: VirtualAccoutInputProps) => {
  return (
    <div className="form-group">
      <label className="col-sm-2 control-label" htmlFor={inputID}>{title}</label>
      <input
        id={inputID}
        className="form-control"
        type="text"
        name={inputName}
        placeholder={placeholder}
        value={inputValue}
        onChange={onChangeP}
        required
      />
      {validationType && <CJPaymentValidation validation={validationString} />}
    </div>
  );
};

export default VirtualAccountInput;