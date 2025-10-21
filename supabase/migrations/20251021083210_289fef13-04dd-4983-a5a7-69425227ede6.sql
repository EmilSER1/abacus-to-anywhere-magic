-- Add currency column to equipment table
ALTER TABLE public.equipment 
ADD COLUMN purchase_currency text CHECK (purchase_currency IN ('USD', 'RUB', 'KZT', 'EUR'));