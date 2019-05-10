<?php
class TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_ApplepayCart
    extends Mage_Adminhtml_Block_Abstract
{
    public function __construct()
    {
        $this->setTemplate('buckaroo3extended/applepay/button.phtml');
        parent::_construct();
    }

    public function getCurrency()
    {
        $currency = Mage::app()->getStore()->getCurrentCurrencyCode();

        return $currency;
    }

    public function getCountryCode()
    {
        $countryCode = substr(Mage::getStoreConfig('general/locale/code'), 3);

        return $countryCode;
    }

    public function getStoreName()
    {
        $storeName = Mage::app()->getStore()->getFrontendName();

        return $storeName;
    }

    public function getProductPrice()
    {
        $taxHelper  = $this->helper('tax');
        $product = $this->getProduct();
        $productPrice = $taxHelper->getPrice($product, $product->getFinalPrice());

        return $productPrice;
    }
}
