import { LineItemMap } from '@bigcommerce/checkout-sdk';
import React, { ReactNode } from 'react';
import { findIndex } from 'lodash';
import { TranslatedString } from '../locale';
import { IconChevronDown, IconChevronUp } from '../ui/icon';

import getItemsCount from './getItemsCount';
import mapFromCustom from './mapFromCustom';
import mapFromDigital from './mapFromDigital';
import mapFromGiftCertificate from './mapFromGiftCertificate';
import mapFromPhysical from './mapFromPhysical';
import OrderSummaryItem from './OrderSummaryItem';


const COLLAPSED_ITEMS_LIMIT = 4;

export interface OrderSummaryItemsProps {
    items: LineItemMap;
}

interface OrderSummaryItemsState {
    isExpanded: boolean;
}


class OrderSummaryItems extends React.Component<OrderSummaryItemsProps, OrderSummaryItemsState> {
    constructor(props: OrderSummaryItemsProps) {
        super(props);

        this.state = {
            isExpanded: false,
        };
    }

    
    render(): ReactNode {
        const { items } = this.props;
        const { isExpanded } = this.state;
        const index = findIndex(items!.physicalItems!, { sku: 'COD1' });
        const index2 = findIndex(items!.physicalItems!, { sku: 'COD2' });
        const index3 = findIndex(items!.physicalItems!, { sku: 'COD3' });
        const index4 = findIndex(items!.physicalItems!, { sku: 'COD4' });

        return (
            <>
                <h3
                    className="cart-section-heading optimizedCheckout-contentPrimary"
                    data-test="cart-count-total"
                >
                    <TranslatedString
                             data={ { 
                                count: 
                                index > -1 ? getItemsCount(items) - items!.physicalItems[index]!.quantity 
                                :(index2 > -1 ?
                                    getItemsCount(items) - items!.physicalItems[index2]!.quantity     
                                    :
                                    index3 > -1 ?
                                    getItemsCount(items) - items!.physicalItems[index3]!.quantity   
                                    :
                                    index4 > -1 ?
                                    getItemsCount(items) - items!.physicalItems[index4]!.quantity   
                                    : getItemsCount(items) 
                                )
                                 } }
                        id="cart.item_count_text"
                    />
                </h3>

                <ul aria-live="polite" className="productList">
                    {[
                        ...items.physicalItems
                            .slice()
                            .sort((item) => item.variantId)
                            // .filter(item => item.sku !== 'COD1')
                            // sku값중 cod 라는 문자열 포함시 모든 필터처리
                            .filter(item => !item.sku.includes('COD'))
                            .map(mapFromPhysical),
                        ...items.giftCertificates.slice().map(mapFromGiftCertificate),
                        ...items.digitalItems
                            .slice()
                            .sort((item) => item.variantId)
                            .map(mapFromDigital),
                        ...(items.customItems || []).map(mapFromCustom),
                    ]
                        .slice(0, isExpanded ? undefined : COLLAPSED_ITEMS_LIMIT)
                        .map((summaryItemProps) => (
                            <li className="productList-item is-visible" key={summaryItemProps.id}>
                                <OrderSummaryItem {...summaryItemProps} />
                            </li>
                        ))}
                </ul>

                {this.renderActions()}
            </>
        );
    }

    private renderActions(): ReactNode {
        const { isExpanded } = this.state;

        if (this.getLineItemCount() < 5) {
            return;
        }

        return (
            <div className="cart-actions">
                <button
                    className="button button--tertiary button--tiny optimizedCheckout-buttonSecondary"
                    onClick={this.handleToggle}
                    type="button"
                >
                    {isExpanded ? (
                        <>
                            <TranslatedString id="cart.see_less_action" />
                            <IconChevronUp />
                        </>
                    ) : (
                        <>
                            <TranslatedString id="cart.see_all_action" />
                            <IconChevronDown />
                        </>
                    )}
                </button>
            </div>
        );
    }

    private getLineItemCount(): number {
        const { items } = this.props;

        return (
            (items.customItems || []).length +
            items.physicalItems.length +
            items.digitalItems.length +
            items.giftCertificates.length
        );
    }

    private handleToggle: () => void = () => {
        const { isExpanded } = this.state;

        this.setState({ isExpanded: !isExpanded });
    };
}

export default OrderSummaryItems;
