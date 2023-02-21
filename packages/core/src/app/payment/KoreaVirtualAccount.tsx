import React, { useEffect, useState } from 'react';
import CJPaymentValidation from './CJPaymentValidation';
import { ICashRecive, IVirtualAccout } from './Payment';
import './cj-payment.scss';

interface VirtualProps {
  virtualAccoutValues: any;
  methodsCashRecive: any;
  customizeCheckout: string;
  customerId: string;
  storeHash: string;
  krPaymentMethods(payName: string, ...rest: string[]): void;
}

interface PaymentParmsProps {
  payName: string,
  bankCd: string,
  accountOwner: string,
  cashReceiptUse: string,
  cashReceiptInfo: string,
}

const KoreaVirtualAccout = ({ virtualAccoutValues, customizeCheckout, customerId, storeHash }: VirtualProps) => {

  // This variables are for prevent to confuse with function(virtualOpenLink) parameter.
  const customizeCheckoutProps = customizeCheckout;
  const customerIdProps = customerId;
  const storeHashProps = storeHash;

  // Select options state
  const [selected, setSelected] = useState('003');

  // Radio input state
  const [radio, setRadio] = useState<ICashRecive[]>([{
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
  }]);

  // Text input states
  const [textInputs, setTextInputs ] = useState({
    AccountOwner:'',
    CashReceiptInfo:''
  })

//  validation state
  const [validation , setValidation] = useState({
    AccountOwner:false,
    CashReceiptInfo:false
  })

  // Destructuring Assignmen
  const {AccountOwner,CashReceiptInfo} = textInputs;
  const {AccountOwner:AccountOwnerValidation ,CashReceiptInfo:CashReceiptInfoValidation} = validation;

  const onChangeText = (e:React.ChangeEvent<HTMLInputElement>) => {
    const {target:{name,value}} = e;
    setTextInputs({
      ...textInputs,
      [name]:value
    });
    const nameRegex = /^[가-힣]{2,4}$/;
    const numberRegex = /^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$/;

    setValidation({
      ...validation,
      AccountOwner: !nameRegex.test(value) && name ==='AccountOwner',
      CashReceiptInfo: !numberRegex.test(value) && name ==='CashReceiptInfo'
    })

  }

  // Radio display state
  const [radioValue, setRadioValue] = useState('00');

  const radioOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = radio.map((item: ICashRecive) => {
      if (item.value === e.target.value) {
        item.checked = true;
        setRadioValue(e.target.value);
        localStorage.setItem('selectdRadio', e.target.value);
      } else {
        item.checked = false;
      }
      return item;
    })
    setRadio(newValue);
  }

  useEffect(() => {
    const storedValue = localStorage.getItem('selectdRadio');
    if (storedValue) {
      setRadioValue(storedValue);
    }
  }, []);

  const virtualOpenLink = (params:PaymentParmsProps) => {
    let width = 600;
    let height = 700;
    let top = (window.innerHeight - height) / 2 + screenY;
    let left = (window.innerWidth - width) / 2 + screenX;
    let spec = 'status=no, menubar=no, toolbar=no, resizable=no';
    spec += ', width=' + width + ', height=' + height;
    spec += ', top=' + top + ', left=' + left;

    
    const confirmAlert = window.confirm('확인 -> localhost:\n취소 -> payment.madive.co.kr');

    const {payName,bankCd,accountOwner,cashReceiptUse,cashReceiptInfo} = params;

    const arr = ['http://localhost','https://payment.madive.co.kr'];

    if (confirmAlert) {
      window.open(`${arr[0]}/openPayment?id=${customizeCheckoutProps}&cid=${customerIdProps}&payCd=${payName}&storeHash=${storeHashProps}&bankCd=${bankCd}&accountOwner=${accountOwner}&cashReceiptUse=${cashReceiptUse}&cashReceiptInfo=${cashReceiptInfo}`, 'popup', spec);
    } else {
      window.open(`${[arr[1]]}]/openPayment?id=${customizeCheckoutProps}&cid=${customerIdProps}&payCd=${payName}&storeHash=${storeHashProps}&bankCd=${bankCd}&accountOwner=${accountOwner}&cashReceiptUse=${cashReceiptUse}&cashReceiptInfo=${cashReceiptInfo}`, 'popup', spec);
    }
  }

  // Remove radio value(localstorage) when browser reloaded.
  useEffect(() => {
    window.onbeforeunload = () => {
      localStorage.removeItem('selectdRadio');
    }
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params: PaymentParmsProps = {
      payName: 'VirtualAccount',
      bankCd: selected,
      accountOwner: AccountOwner,
      cashReceiptUse: radioValue,
      cashReceiptInfo: CashReceiptInfo
      ,
    };
    virtualOpenLink(params);
  }

  return (
    <form onSubmit={handleSubmit} className='virtual-method-form checkout-form'>
      <label className="col-sm-2 control-label" htmlFor=''>카드코드(CardCode)</label>

      {/* Select options */}
      <select id="selBankCode" className="form-control" name="BankCd" value={selected} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSelected(e.target.value) }}>
        {virtualAccoutValues.map((item: IVirtualAccout) => {
          return <option key={item.id} value={item.value}>{item.bank}</option>
        })}
      </select>

      {/* Name text input */}
      <div className="form-text-wrap">
        <div className="form-group">
          <label className="col-sm-2 control-label" htmlFor="AccountOwner">가상계좌 입금자성명 :</label>
          <input
            id="AccountOwner"
            className="form-control"
            type="text"
            name="AccountOwner"
            placeholder='ex:홍길동'
            value={AccountOwner}
            onChange={onChangeText}
            required
          />
          {AccountOwnerValidation && <CJPaymentValidation validation='* 이름을 제대로 입력해주세요.' />}
        </div>

        {/* Customer PhoneNubmer Text Inputs */}
        <div className="form-group">
          <label className="col-sm-2 control-label" htmlFor="CashReceiptInfo">현금영수증 발급 번호 :</label>
          <input
            id="CashReceiptInfo"
            className="form-control"
            type="text"
            name="CashReceiptInfo"
            placeholder='ex:01012341234'
            value={CashReceiptInfo}
            onChange={onChangeText}
            required
          />
          {CashReceiptInfoValidation && <CJPaymentValidation validation='* "-"를 제외하고 번호만 입력해주세요.' />}
        </div>
      </div>

      <div id="cashreceiptDiv">
        <div className="form-group">
          {/* Radio Inputs */}
          <label className="col-sm-2 control-label" htmlFor="CashReceiptUse">현금영수증 발행 구분</label>
          <div className="col-sm-10">
            {radio.map((item: ICashRecive) => {
              return (
                <React.Fragment key={item.id}>
                  <input
                    type="radio"
                    name="CashReceiptUse"
                    id={item.tagId}
                    value={item.value}
                    checked={item.checked}
                    onChange={radioOnchange}
                    required
                  />
                  <label htmlFor={item.tagId}>{item.method}</label>
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
      <button className='go-to-submit'>가상계좌로 결제하기</button>
    </form>
  );
};

export default KoreaVirtualAccout;