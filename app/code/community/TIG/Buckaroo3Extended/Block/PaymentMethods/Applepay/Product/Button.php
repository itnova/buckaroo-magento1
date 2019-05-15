<?php
class TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Product_Button
    extends TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Cart_Button
{
    public function getProductId()
    {
        return Mage::registry('current_product');
    }

    /**
     * Overwrites Block/Cart/Button.php to see if we're on the product page or the shopping cart page.
     *
     * @return bool
     */
    public function isProductPage()
    {
        return false;
    }
}
