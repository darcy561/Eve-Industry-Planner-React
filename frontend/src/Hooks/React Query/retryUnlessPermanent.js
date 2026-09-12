/**
 * The retry rule for a query backed by an ESI lookup.
 *
 * A failure is worth asking about again — ESI was unwell, a token could not be acquired, the
 * network dropped — unless ESI refused the request itself rather than the thing it asked about. A
 * refused request is refused identically every time, and each attempt costs five times what an
 * answer does against the error budget.
 *
 * @param {number} attempts - how many times to ask again before giving up
 * @returns {(failureCount: number, error: unknown) => boolean}
 */
export default function retryUnlessPermanent(attempts) {
  return (failureCount, error) => !error?.permanent && failureCount < attempts;
}
