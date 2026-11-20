ALTER TABLE billing_orders
    RENAME COLUMN momo_transaction_id TO payment_transaction_id;

ALTER TABLE billing_invoices
    ALTER COLUMN payment_method SET DEFAULT 'VNPAY';
