import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'hello':
      // Get the account before returning the dialog
      const account = await getAccount();

      // Use the retrieved address in the dialog
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This is me saying hi.'),
            text(`Here's a dogecoin account: ${account.address}`),
          ]),
        },
      });
    default:
      throw new Error('Method not found.');
  }
};

async function getAccount() {
  // Get the Dogecoin node, corresponding to the path m/44'/3'.
  const dogecoinNode = await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 3,
    },
  });

  /**
   * Create a function that takes an index and returns an extended private key for m/44'/3'/0'/0/address_index.
   * The second parameter to getBIP44AddressKeyDeriver isn't passed. This sets account and changes to 0.
   */
  const deriveDogecoinAddress = await getBIP44AddressKeyDeriver(dogecoinNode);

  // Derive the second Dogecoin address, which has index 1.
  const secondAccount = deriveDogecoinAddress(1);
  return secondAccount;
}
