<?php
/**
 * Created by PhpStorm.
 * User: robert.grundeken
 * Date: 26/05/2019
 * Time: 14:18
 */

class TIG_Buckaroo3Extended_Model_RefundManager extends Mage_Core_Model_Abstract
{

    public   $transactionArray = [
        'transaction'  => [],
        'history'      => [],
        'total_in'     => 0.00,
        'total_out'    => 0.00
    ];

    /**
     * RefundManager constructor.
     * @param null $array
     */
    public function _construct($array = null)
    {
        $this->_init('buckaroo3extended/refundManager');

        if (isset($array) && is_array($array)) {
            $this->setTransactionArray($array);
        }
    }

    public function setTransactionArray($array)
    {
        $this->transactionArray = $array;
    }

    public function getTransactionArray()
    {
        return $this->transactionArray;
    }

    public function getPossibleRefundAmount()
    {
        return $this->transactionArray['total_in'] - $this->transactionArray['total_out'];
    }

    /**
     * @param float $amount
     * @return bool
     */
    public function refundTransaction($amount = 0.00)
    {
        //possible
        $possibleRefundAmount = $this->getPossibleRefundAmount();

        if ($amount > $possibleRefundAmount) {
            return false;
        }

        //suggested
        $calculatedTransactions = $this->calculateRefundTransaction($amount);

        return $calculatedTransactions;
    }

    public function addHistory($transactionkey, $amount, $type, $status)
    {
        $this->transactionArray['history'][] = ['transactionkey' => $transactionkey,
            'refund_amount' => $amount,
            'type' => $type,
            'status' => $status];
    }

    public function addTransaction($inOut, $transactionkey, $amount, $type = null)
    {
        $amount = round($amount,2);

        if ($type) {
            $this->transactionArray['transaction'][$transactionkey]['type'] = $type;
        }

        if ($inOut == 'in') {
            $this->transactionArray['transaction'][$transactionkey]['amount'] = $amount;
        } else {
            //add refund
            if (!isset($this->transactionArray['transaction'][$transactionkey]['refunded'])) {
                $this->transactionArray['transaction'][$transactionkey]['refunded'] = $amount;
            }
            else {
                $this->transactionArray['transaction'][$transactionkey]['refunded'] += $amount;
            }
        }

        $this->transactionArray['total_'. $inOut] += $amount;

        return $this->transactionArray;
    }

    public function calculateRefundTransaction($refundRequestAmount = 0.00)
    {
        $calculatedRefundTransactions = [];

        // loop through transactions, most recent first
        foreach (array_reverse($this->transactionArray['transaction']) as $transactionkey => $transactionValue ) {

            //already fully refundend
            if (isset($transactionValue['refunded']) &&
                $transactionValue['refunded'] == $transactionValue['amount']) {
                continue;
            }

            //not refunded amount = amount - already refunded
            $notRefundedAmount = $transactionValue['amount'];
            if (isset($transactionValue['refunded'])) {
                $notRefundedAmount = $transactionValue['amount'] - $transactionValue['refunded'];
            }

            //fits within this refund total which is left on the transaction
            if ($refundRequestAmount <= $notRefundedAmount) {
                $calculatedRefundTransactions[$transactionkey] = $refundRequestAmount;
                break;
            }

            //decrease wanted amount and do next loop
            if ($refundRequestAmount > $notRefundedAmount) {
                $calculatedRefundTransactions[$transactionkey] = $notRefundedAmount;
                $refundRequestAmount -= $notRefundedAmount;
            }
        }

        return $calculatedRefundTransactions;
    }
}