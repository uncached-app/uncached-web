/**
 * Build-time gates for the two things that are wired but not ready to open:
 * downloads wait on an Apple Developer certificate, checkout waits on live
 * Paddle price IDs.
 *
 * Absent means closed. A gate that opened because a variable was missing would
 * be the wrong failure direction — it would publish unsigned bundles or a
 * checkout that errors in front of a buyer.
 */
function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export const downloadsEnabled = isEnabled(import.meta.env.PUBLIC_DOWNLOADS_ENABLED);
export const checkoutEnabled = isEnabled(import.meta.env.PUBLIC_CHECKOUT_ENABLED);
