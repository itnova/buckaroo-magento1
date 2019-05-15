<?php
class TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Cart_Button
    extends Mage_Adminhtml_Block_Abstract
{
    protected $isProductPage = false;

    public function __construct()
    {
        parent::_construct();
    }

    public function getCurrency()
    {
        return Mage::app()->getStore()->getCurrentCurrencyCode();
    }

    public function getCountryCode()
    {
        return 'NL';
    }

    public function getStoreName()
    {
        return Mage::app()->getStore()->getFrontendName();
    }

    public function getSubtotal()
    {
        return round(Mage::getModel('checkout/cart')->getQuote()->getBaseGrandTotal(), 2);
    }

    public function getGrandTotal()
    {
        return round(Mage::getModel('checkout/cart')->getQuote()->getGrandTotal(),2);
    }

    public function getCultureCode()
    {
        $localeCode   = Mage::app()->getLocale()->getLocaleCode();
        $shortLocale  = explode('_', $localeCode)[0];

        return $shortLocale;
    }

    public function getGuid()
    {
        $quote = Mage::getModel('checkout/cart')->getQuote();
        $store = $quote->getStore();
        $guid = Mage::getStoreConfig('buckaroo/buckaroo3extended/guid', $store->getId());

        return $guid;
    }

    /**
     * Is overwritten in the Block/Product/Button.php to see if we're on the product page or the shopping cart page.
     *
     * @return bool
     */
    public function setProductPage()
    {
        $this->isProductPage = false;
    }

    public function getControllerUrl()
    {
        $this->setProductPage();

        if ($this->isProductPage) {
            return $this->getUrl('buckaroo3extended/checkout/addToCart');
        }

        return $this->getUrl('buckaroo3extended/checkout/loadShippingMethods');
    }
}
