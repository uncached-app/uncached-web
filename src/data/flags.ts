/**
 * Build-time gate for checkout, which waits on live Paddle price IDs.
 *
 * Absent means closed: a gate that opened because a variable was missing would
 * put a checkout that errors in front of a buyer.
 */
function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export const checkoutEnabled = isEnabled(import.meta.env.PUBLIC_CHECKOUT_ENABLED);
