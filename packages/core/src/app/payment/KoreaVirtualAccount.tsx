import React, { useEffect, useState } from 'react';
import './cj-payment.scss';
import VirtualAccountInput from './VirtualAccountInput';
interface VirtualProps {
  customizeCheckout: string;
  customerId: string;
  storeHash: string;
}
interface PaymentParamsProps {
  payName: string;
  bankCd: string;
  accountOwner: string;
  cashReceiptUse: string | any;
  cashReceiptInfo?: string;
  UserPhone: string;
}
interface TextStateTypes {
  AccountOwner: string;
  CashReceiptInfo: string;
  UserPhone: string;
}

interface ValidateStateTypes {
  AccountOwnerVal: boolean;
  CashReceiptInfoVal: boolean;
  UserPhoneVal: boolean;
}
interface VirtualInputTypes {
  title: string;
  inputID: string;
  inputValue: string;
  inputName: string;
  placeholder: string;
  validationType: boolean;
  validationString: string;
}

interface IVirtualAccout {
  id: number;
  value: string;
  bank: string;
}
interface CashReceipts {
  id: number;
  method: "미발행" | "소득공제" | "지출증빙";
  value: string;
  tagId: string;
  checked: boolean;
}

const KoreaVirtualAccout = ({ customizeCheckout, customerId, storeHash }: VirtualProps) => {

  const methodsCashRecive: CashReceipts[] = [
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
    }
  ]

  // This variables are for prevent to confuse with "function(virtualOpenLink)" parameter.
  const customizeCheckoutProps = customizeCheckout;
  const customerIdProps = customerId;
  const storeHashProps = storeHash;

  const [showPopUp, setShowPopUp] = useState(false);

  // Select options state
  const [selected, setSelected] = useState(virtualAccoutValues[0].value);
  console.log("STOREHASH:" + storeHashProps);
  // Radio input state
  const [radio, setRadio] = useState<CashReceipts[]>(methodsCashRecive);

  // const [radioValue, setRadioValue] = useState('00');

  const radioOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target: { value } } = e;
    const newValue = radio.map((item: CashReceipts) => {
      if (item.value === value) {
        item.checked = true;
        setRadio(prev => ({ ...prev, value: value }));
        localStorage.setItem('selectdRadio', value);
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
      setRadio(prev => ({ ...prev, value: storedValue }));
    }
  }, []);

  // Text input states
  const [textInputs, setTextInputs] = useState<TextStateTypes>({
    AccountOwner: '',
    CashReceiptInfo: '',
    UserPhone: ''
  })

  //  Validation state
  const [validation, setValidation] = useState<ValidateStateTypes>({
    AccountOwnerVal: false,
    CashReceiptInfoVal: false,
    UserPhoneVal: false,
  })

  // Destructuring Assignment Text inputs
  const { AccountOwner, CashReceiptInfo, UserPhone } = textInputs;

  // Destructuring Assignment Valiation states
  const { AccountOwnerVal: AccountOwnerValidation, CashReceiptInfoVal: CashReceiptInfoValidation, UserPhoneVal: UserPhoneValidation } = validation;

  const onChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target: { name, value } } = e;
    setTextInputs({
      ...textInputs,
      [name]: value
    });
    const nameRegex = /^[가-힣]{2,4}$/;
    const numberRegex = /^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$/;

    setValidation({
      ...validation,
      AccountOwnerVal: !nameRegex.test(value) && name === 'AccountOwner',
      CashReceiptInfoVal: !numberRegex.test(value) && name === 'CashReceiptInfo',
      UserPhoneVal: !numberRegex.test(value) && name === 'UserPhone',
    })
  }

  // const onChangeText = useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
  //   const { target: { name, value } } = e;
  //   setTextInputs({
  //     ...textInputs,
  //     [name]: value
  //   });
  //   const nameRegex = /^[가-힣]{2,4}$/;
  //   const numberRegex = /^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$/;

  //   setValidation({
  //     ...validation,
  //     AccountOwner: !nameRegex.test(value) && name === 'AccountOwner',
  //     CashReceiptInfo: !numberRegex.test(value) && name === 'CashReceiptInfo',
  //     UserPhone: !numberRegex.test(value) && name === 'UserPhone'
  //   })
  // },[])


  // Radio display state

  const virtualOpenLink = (params: PaymentParamsProps) => {
    const { payName, bankCd, accountOwner, cashReceiptUse, cashReceiptInfo } = params;
    let width = 600;
    let height = 700;
    let top = (window.innerHeight - height) / 2 + screenY;
    let left = (window.innerWidth - width) / 2 + screenX;
    let spec = 'status=no, menubar=no, toolbar=no, resizable=no';
    spec += ', width=' + width + ', height=' + height;
    spec += ', top=' + top + ', left=' + left;
    const confirmAlert = window.confirm('확인 -> localhost:\n취소 -> payment.madive.co.kr');
    const LOCAL_HOST = "http://localhost";
    const PAYMENT_DOMAIN = 'https://payment.madive.co.kr';
    const PARAMETER_URL = `openPayment?id=${customizeCheckoutProps}&cid=${customerIdProps}&payCd=${payName}&storeHash=${storeHashProps}&bankCd=${bankCd}&accountOwner=${accountOwner}&cashReceiptUse=${cashReceiptUse}&cashReceiptInfo=${cashReceiptInfo}&UserPhone=${UserPhone}`;
  
    // Check Validation state
    if (AccountOwnerValidation || CashReceiptInfoValidation || UserPhoneValidation) {
      alert(`가상계좌 이름:${AccountOwner} ,현금영수증 번호 :${CashReceiptInfo} , 고객번호 :${UserPhone} \n Check the input value!`);
      return;
    }
    setShowPopUp(true);
  
    let popup:any;
  
    if (confirmAlert) {
      popup = window.open(`${LOCAL_HOST}/${PARAMETER_URL}`, 'localPopup', spec);
    } else {
      popup = window.open(`${PAYMENT_DOMAIN}/${PARAMETER_URL}`, 'CJpopup', spec);
    }
  
    const checkPopupClosed = () => {
      if (popup && popup.closed) {
        setShowPopUp(false);
      } else {
        setTimeout(checkPopupClosed, 100); // 일정 간격으로 팝업 창이 닫히는지 확인
      }
    };
  
    checkPopupClosed();
  };
  
  
  // Remove radio value(localstorage) when browser reloaded.
  useEffect(() => {
    window.onbeforeunload = () => {
      localStorage.removeItem('selectdRadio');
    }
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedValue = radio.find(item => item.checked);
    const params: PaymentParamsProps = {
      payName: 'VirtualAccount',
      bankCd: selected,
      accountOwner: AccountOwner,
      cashReceiptUse: selectedValue?.value,
      cashReceiptInfo: CashReceiptInfo,
      UserPhone: UserPhone
    };
    virtualOpenLink(params);
  }

  const virtualInputInfo: VirtualInputTypes[] = [
    { title: '가상계좌 입금자성명 :', inputID: 'AccountOwner', inputValue: AccountOwner, inputName: 'AccountOwner', placeholder: 'ex:홍길동', validationType: AccountOwnerValidation, validationString: '* 이름을 제대로 입력해주세요.' },
    { title: '현금영수증 발급 번호 :', inputID: 'CashReceiptInfo', inputValue: CashReceiptInfo, inputName: 'CashReceiptInfo', placeholder: '"-" 를 제외 하고 입력해주세요!!.', validationType: CashReceiptInfoValidation, validationString: '* "-"를 제외하고 번호만 입력해주세요.' },
    { title: '현금연영수증 발급 받을 번호:', inputID: 'UserPhone', inputValue: UserPhone, inputName: 'UserPhone', placeholder: '"-" 를 제외 하고 입력해주세요!!.', validationType: UserPhoneValidation, validationString: '* "-"를 제외하고 번호만 입력해주세요.' }
  ]
  return (
    <>
      {showPopUp && <div className='dimmed'></div>}
      <form onSubmit={handleSubmit} className='virtual-method-form checkout-form'>
        <label className="col-sm-2 control-label" htmlFor='selBankCode'>은행 선택</label>
        {/* Select options */}
        <select id="selBankCode" className="form-control form-select" name="BankCd" value={selected} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSelected(e.target.value) }}>
          {virtualAccoutValues.map((item: IVirtualAccout) => {
            return <option key={item.id} value={item.value}>{item.bank}</option>
          })}
        </select>

        {/* Name text input */}
        <div className="form-text-wrap">
          {virtualInputInfo.map(({ title, inputID, inputValue, inputName, placeholder, validationType, validationString }: VirtualInputTypes) => (
            <VirtualAccountInput
              title={title}
              inputID={inputID}
              inputValue={inputValue}
              inputName={inputName}
              onChangeP={onChangeText}
              placeholder={placeholder}
              validationType={validationType}
              validationString={validationString}
              key={title}
            />
          ))}
        </div>

        <div id="cashreceiptDiv">
          <div className="form-group">
            {/* Radio Inputs */}
            <label className="col-sm-2 control-label" htmlFor="CashReceiptUse">현금영수증 발행 구분</label>
            <div className="col-sm-10">
              {radio.map((item: CashReceipts) => {
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
    </>
  );
};

export default KoreaVirtualAccout;