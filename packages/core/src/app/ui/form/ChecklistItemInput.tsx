import React, { FunctionComponent, InputHTMLAttributes } from 'react';
import Input from './Input';
import Label from './Label';


export interface ChecklistItemInputProps extends InputHTMLAttributes<HTMLInputElement> {
    isSelected: boolean;
    value: any;
}


const ChecklistItemInput: FunctionComponent<ChecklistItemInputProps> = ({
    id,
    isSelected,
    children,
    value,
    ...props
}) => {

    return (
        <>
            <Input
                {...props}
                checked={isSelected}
                className="form-checklist-checkbox optimizedCheckout-form-checklist-checkbox"
                id={id}
                type="radio"
                value={value}
            />
            <Label htmlFor={id}>{children}</Label>
        </>
    );
}


export default ChecklistItemInput;

