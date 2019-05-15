<?php
class TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Product_Button
    extends TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Cart_Button
{
    public function getProductId()
    {
        return Mage::registry('current_product');
    }
}
