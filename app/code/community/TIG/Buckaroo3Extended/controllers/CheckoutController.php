<?php

/**
 *                  ___________       __            __
 *                  \__    ___/____ _/  |_ _____   |  |
 *                    |    |  /  _ \\   __\\__  \  |  |
 *                    |    | |  |_| ||  |   / __ \_|  |__
 *                    |____|  \____/ |__|  (____  /|____/
 *                                              \/
 *          ___          __                                   __
 *         |   |  ____ _/  |_   ____ _______   ____    ____ _/  |_
 *         |   | /    \\   __\_/ __ \\_  __ \ /    \ _/ __ \\   __\
 *         |   ||   |  \|  |  \  ___/ |  | \/|   |  \\  ___/ |  |
 *         |___||___|  /|__|   \_____>|__|   |___|  / \_____>|__|
 *                  \/                           \/
 *                  ________
 *                 /  _____/_______   ____   __ __ ______
 *                /   \  ___\_  __ \ /  _ \ |  |  \\____ \
 *                \    \_\  \|  | \/|  |_| ||  |  /|  |_| |
 *                 \______  /|__|    \____/ |____/ |   __/
 *                        \/                       |__|
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 * If you are unable to obtain it through the world-wide-web, please send an email
 * to servicedesk@tig.nl so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this module to newer
 * versions in the future. If you wish to customize this module for your
 * needs please contact servicedesk@tig.nl for more information.
 *
 * @copyright   Copyright (c) Total Internet Group B.V. https://tig.nl/copyright
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 */
class TIG_Buckaroo3Extended_CheckoutController extends Mage_Core_Controller_Front_Action
{
    public function checkoutAction()
    {
        /**
         * @var TIG_Buckaroo3Extended_Model_Request_Abstract $request
         */
        $request = Mage::getModel('buckaroo3extended/request_abstract');
        $request->sendRequest();
    }

    public function applepayAction()
    {
        $quote        = Mage::getModel('checkout/cart')->getQuote();
        $store        = $quote->getStore();
        $shippingData = $quote->getShippingAddress()->getData();
        $localeCode   = Mage::app()->getLocale()->getLocaleCode();
        $shortLocale  = explode('_', $localeCode)[0];

        $storeName    = $store->getFrontendName();
        $currencyCode = $quote->getStoreCurrencyCode();
        $guid         = Mage::getStoreConfig('buckaroo/buckaroo3extended/guid', $store->getId());

        $shippingData['culture_code']  = $shortLocale;
        $shippingData['currency_code'] = $currencyCode;
        $shippingData['guid']          = $guid;
        $shippingData['store_name']    = $storeName;

        $this->getResponse()->clearHeaders()->setHeader('Content-type', 'application/json', true);
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($shippingData));
    }

    public function loadShippingMethodsAction()
    {
        $postData  = Mage::app()->getRequest()->getPost();
        $wallet    = array();
        if ($postData['wallet']) {
            $wallet = $postData['wallet'];
        }
        /** @var Mage_Sales_Model_Quote $quote */
        $quote   = Mage::getModel('checkout/session')->getQuote();
        /** @var Mage_Sales_Model_Quote_Address $address */
        $address = $quote->getShippingAddress();

        $shippingAddress = array(
            'prefix'     => '',
            'firstname'  => '',
            'middlename' => '',
            'lastname'   => '',
            'street'     => array(
                '0' => '',
                '1' => ''
            ),
            'city'       => $wallet['locality'],
            'country_id' => $wallet['countryCode'],
            'region'     => $wallet['administrativeArea'],
            'region_id'  => '',
            'postcode'   => $wallet['postalCode'],
            'telephone'  => '',
            'fax'        => '',
            'vat_id'     => ''
        );

        $address->addData($shippingAddress);
        $address->setCollectShippingRates(true);
        $quote->setShippingAddress($address);
        $quote->save();
        $shippingMethods = Mage::getModel('checkout/cart_shipping_api')->getShippingMethodsList($quote->getId());

        foreach ($shippingMethods as &$shippingMethod) {
            $shippingMethod['price'] = round($shippingMethod['price'], 2);
        }

        $this->getResponse()->clearHeaders()->setHeader('Content-type', 'application/json', true);
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($shippingMethods));
    }

    public function saveOrderAction()
    {
        /** @var Mage_Sales_Model_Quote $quote */
        $quote = Mage::getModel('checkout/session')->getQuote();
        $postData  = Mage::app()->getRequest()->getPost();

        if (!$postData['payment']) {
            return;
        }

        $shippingData = $postData['payment']['shippingContact'];
        $walletShippingAddress = array(
            'email'      => $shippingData['emailAddress'],
            'prefix'     => '',
            'firstname'  => $shippingData['givenName'],
            'middlename' => '',
            'lastname'   => $shippingData['familyName'],
            'street'     => array(
                '0' => $shippingData['addressLines'][0],
                '1' => isset($shippingData['addressLines'][1]) ? $shippingData['addressLines'][1] : null
            ),
            'city'       => $shippingData['locality'],
            'country_id' => $shippingData['countryCode'],
            'region'     => $shippingData['administrativeArea'],
            'region_id'  => '',
            'postcode'   => $shippingData['postalCode'],
            'telephone'  => '0000000000',
            'fax'        => '',
            'vat_id'     => ''
        );

        $billingData = $postData['payment']['billingContact'];
        $walletBillingAddress = array(
            'prefix'     => '',
            'firstname'  => $billingData['givenName'],
            'middlename' => '',
            'lastname'   => $billingData['familyName'],
            'street'     => array(
                '0' => $billingData['addressLines'][0],
                '1' => isset($billingData['addressLines'][1]) ? $billingData['addressLines'][1] : null
            ),
            'city'       => $billingData['locality'],
            'country_id' => $billingData['countryCode'],
            'region'     => $billingData['administrativeArea'],
            'region_id'  => '',
            'postcode'   => $billingData['postalCode'],
            'telephone'  => '0000000000',
            'fax'        => '',
            'vat_id'     => ''
        );

        /** @var Mage_Sales_Model_Quote_Address $shippingAddress */
        $shippingAddress = $quote->getShippingAddress();
        $shippingAddress->addData($walletShippingAddress);
        /** @var Mage_Sales_Model_Quote_Address $billingAddress */
        $billingAddress  = $quote->getBillingAddress();
        $billingAddress->addData($walletBillingAddress);

        $customer = $quote->getCustomer();
        if (!$customer->getId()) {
            $quote->setCheckoutMethod('guest')
                ->setCustomerId(null)
                ->setCustomerEmail($quote->getShippingAddress()->getEmail())
                ->setCustomerIsGuest(true)
                ->setCustomerGroupId(Mage_Customer_Model_Group::NOT_LOGGED_IN_ID);
        }

        $quote->getPayment()->importData(array('method' => 'buckaroo3extended_applepay'));
        $quote->setCurrency(Mage::app()->getStore()->getBaseCurrencyCode());
        $quote->collectTotals();
        $quote->save();

        $service = Mage::getModel('sales/service_quote', $quote);
        $order = $service->submitOrder();
        $order->save();

        $request = Mage::getModel('buckaroo3extended/request_abstract');
        $request->setOrder($order)->setOrderBillingInfo();
        $request->sendRequest();

        Mage::getSingleton('checkout/session')
            ->setLastQuoteId($quote->getId())
            ->setLastSuccessQuoteId($quote->getId())
            ->clearHelperData();
    }

    public function saveDataAction()
    {
        $data = $this->getRequest()->getPost();

        if (!is_array($data) || !isset($data['name']) || !isset($data['value'])
            || strpos($data['name'], 'buckaroo') === false
        ) {
            return;
        }

        $name  = $data['name'];
        $value = $data['value'];

        $session = Mage::getSingleton('checkout/session');
        $session->setData($name, $value);
    }

    public function pospaymentPendingAction()
    {
        $this->loadLayout();
        $this->getLayout();
        $this->renderLayout();
    }

    public function pospaymentCheckStateAction()
    {
        $response = array(
            'status' => 'new',
            'returnUrl' => null
        );

        /** @var TIG_Buckaroo3Extended_Model_Response_Abstract $responseHandler */
        $responseHandler = Mage::getModel('buckaroo3extended/response_abstract');

        /** @var Mage_Sales_Model_Order $order */
        $order              = $responseHandler->getOrder();
        $response['status'] = $order->getState();

        switch ($response['status']) {
            case 'processing':
                $responseHandler->emptyCart();
                Mage::getSingleton('core/session')->addSuccess(
                    Mage::helper('buckaroo3extended')->__('Your order has been placed succesfully.')
                );
                $response['returnUrl'] = $this->getSuccessUrl($order->getStoreId());
                break;
            case 'canceled':
                $responseHandler->restoreQuote();

                $config       = Mage::getStoreConfig($responseHandler::BUCK_RESPONSE_DEFAUL_MESSAGE, $order->getStoreId());
                $errorMessage = Mage::helper('buckaroo3extended')->__($config);
                Mage::getSingleton('core/session')->addError($errorMessage);

                $response['returnUrl'] = $this->getFailedUrl($order->getStoreId());
                break;
        }

        $jsonResponse = Mage::helper('core')->jsonEncode($response);

        $this->getResponse()->clearHeaders()->setHeader('Content-type', 'application/json');;
        $this->getResponse()->setBody($jsonResponse);
    }

    /**
     * @param $storeId
     *
     * @return string
     */
    protected function getSuccessUrl($storeId)
    {
        $returnLocation = Mage::getStoreConfig('buckaroo/buckaroo3extended_advanced/success_redirect', $storeId);
        $succesUrl      = Mage::getUrl($returnLocation, array('_secure' => true));

        return $succesUrl;
    }

    /**
     * @param $storeId
     *
     * @return string
     */
    protected function getFailedUrl($storeId)
    {
        $returnLocation = Mage::getStoreConfig('buckaroo/buckaroo3extended_advanced/failure_redirect', $storeId);
        $failedUrl      = Mage::getUrl($returnLocation, array('_secure' => true));

        return $failedUrl;
    }
}
