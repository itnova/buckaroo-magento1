<?php
class TIG_Buckaroo3Extended_Model_Observer_ApplepayAfterSuccess extends Mage_Core_Model_Abstract
{
    public function afterSuccessAction(Varien_Event_Observer $observer)
    {
        /** @var TIG_Buckaroo3Extended_Model_PaymentMethods_Applepay_Process $process */
        $process  = Mage::getModel(' buckaroo3extended/paymentMethods_applepay_process');
        
        $process->restoreCart();
    }
}
