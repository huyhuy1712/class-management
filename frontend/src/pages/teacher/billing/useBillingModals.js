import { useState } from 'react'

function useBillingModals() {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentProduct, setPaymentProduct] = useState(null)

  return {
    invoiceModalOpen,
    paymentProduct,
    openInvoiceModal: () => setInvoiceModalOpen(true),
    closeInvoiceModal: () => setInvoiceModalOpen(false),
    openPaymentModal: (product) => setPaymentProduct(product),
    closePaymentModal: () => setPaymentProduct(null),
  }
}

export default useBillingModals
