<?php
class TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Cart_Button
    extends Mage_Adminhtml_Block_Abstract
{
    /** @var bool $isProductPage */
    protected $isProductPage = false;

    /**
     * TIG_Buckaroo3Extended_Block_PaymentMethods_Applepay_Cart_Button constructor.
     */
    public function __construct()
    {
        parent::_construct();
    }

    /**
     * @return string
     * @throws Mage_Core_Model_Store_Exception
     */
    public function getCurrency()
    {
        return Mage::app()->getStore()->getCurrentCurrencyCode();
    }

    /**
     * @return string
     */
    public function getCountryCode()
    {
        return 'NL';
    }

    /**
     * @return string
     * @throws Mage_Core_Model_Store_Exception
     */
    public function getStoreName()
    {
        return Mage::app()->getStore()->getFrontendName();
    }

    /**
     * @return string
     */
    public function getSubtotalText()
    {
        $config = Mage::getStoreConfig('tax/cart_display/subtotal');

        if ($config == 1) {
            return $this->__('Subtotal excl. tax');
        }

        return $this->__('Subtotal');
    }

    /**
     * @return float
     */
    public function getSubtotal()
    {
        return round(Mage::getModel('checkout/cart')->getQuote()->getBaseGrandTotal(), 2);
    }

    /**
     * @return float
     */
    public function getGrandTotal()
    {
        return round(Mage::getModel('checkout/cart')->getQuote()->getGrandTotal(),2);
    }

    /**
     * @return mixed
     */
    public function getCultureCode()
    {
        $localeCode   = Mage::app()->getLocale()->getLocaleCode();
        $shortLocale  = explode('_', $localeCode)[0];

        return $shortLocale;
    }

    /**
     * @return mixed
     */
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

    /**
     * @return string
     */
    public function getControllerUrl()
    {
        $this->setProductPage();

        if ($this->isProductPage) {
            return $this->getUrl('buckaroo3extended/checkout/addToCart');
        }

        return $this->getUrl('buckaroo3extended/checkout/loadShippingMethods');
    }
}
