import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';
import { getBIP44AddressKeyDeriver, SLIP10Node } from '@metamask/key-tree';

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
    case 'call API':
      console.log('about to call getUnreadCountFromAPI');

      // let callresponse = getUnreadCountFromAPI("$2a$10$fmgYRwXNLz6SPnIo.F/IEe90NwCIFOEdUUN9vr0w5J.O50o3ceCCy", "6522aef112a5d3765988dfe2")
      // return callresponse
      const callresponse = await getResponseFromAPI(
        '$2a$10$fmgYRwXNLz6SPnIo.F/IEe90NwCIFOEdUUN9vr0w5J.O50o3ceCCy',
        '6522aef112a5d3765988dfe2',
      );

      // getUnreadCountFromAPI("$2a$10$fmgYRwXNLz6SPnIo.F/IEe90NwCIFOEdUUN9vr0w5J.O50o3ceCCy", "6522aef112a5d3765988dfe2").then(callresponse => {
      console.log('callresponse=' + callresponse);
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('Call response: ' + callresponse),
          ]),
        },
      });

    case 'get Bip44 account':
      // Get the account before returning the dialog
      const account44 = await getBip44Account();

      // Use the retrieved address in the dialog
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text(
              `Here's a coinType 966 (Polygon) Bip44 account Public key: ${account44.address}`,
            ),
            text(`And the corresponding private key: ${account44.privateKey}`),
          ]),
        },
      });

    case 'get Bip32 account':
      // Get the account before returning the dialog
      const account32s = await getBip32Account();

      // Generate a list of text messages for each address and key
      const accountTexts = [];
      for (const path in account32s) {
        const publicKey = await (account32s as { [key: string]: SLIP10Node })[
          path
        ].address; // assuming getPublicKey is a method
        const privateKey = await (account32s as { [key: string]: SLIP10Node })[
          path
        ].privateKey; // assuming getPrivateKey is a method

        accountTexts.push(
          text(`Path: ${path}`),
          text(`Public Key: ${publicKey}`), // assuming the key is a Buffer and you want to display it as a hex string
          text(`Private Key: ${privateKey}`),
        );
      }

      // Use the retrieved address in the dialog
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([text(`Hello, **${origin}**!`), ...accountTexts]),
        },
      });

    case 'get MM account':
      // Get the account before returning the dialog
      const accountMM = await getMmAccount();

      // Use the retrieved address in the dialog
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text(
              `Here's a coinType 966 (Polygon) Bip32 account Public Key: ${accountMM.address}`,
            ),
            text(`And the corresponding Private Key: ${accountMM.privateKey}`),
          ]),
        },
      });

    // case 'newSecret':
    //   newSecret(state, website, neverSave);
    //   return 'OK';

    // case 'createId':
    //   createId(state, website, neverSave);
    //   return 'OK';
    // default:
    //   throw new Error('Method not found.');
  }
};

//get unread count from WalletChat API
const getResponseFromAPI = async (apiKey: string, address: string) => {
  let retVal = 0;

  console.log('in getUnreadCountFromAPI');

  await fetch(
    //` https://api.v2.walletchat.fun/v1/get_unread_cnt/${address}`,
    `https://api.jsonbin.io/v3/b/${address}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': apiKey,
        // Authorization: `Bearer ${apiKey}`,
      },
    },
  )
    .then((response) => response.json())
    .then((json) => {
      retVal = json.record.responseStatus;
    })
    .catch((error) => {
      console.log('🚨[GET][bin] Error:', error);
    });

  return retVal;
};

async function getBip44Account() {
  // Get the Dogecoin node, corresponding to the path m/44'/3'.
  const addressNode = await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 966,
    },
  });

  /**
   * Create a function that takes an index and returns an extended private key for m/44'/3'/0'/0/address_index.
   * The second parameter to getBIP44AddressKeyDeriver isn't passed. This sets account and changes to 0.
   */
  const deriveAddress = await getBIP44AddressKeyDeriver(addressNode);

  // Derive the second Dogecoin address, which has index 1.
  const secondAccount = deriveAddress(0);
  return secondAccount;
}

async function getBip32Account() {
  // Get the Dogecoin node, corresponding to the path m/44'/3'.
  // xref coinType/ curves: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  const addressNode = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: ['m', "44'", "60'"],
      curve: 'secp256k1',
    },
  });

  // Next, create an instance of a SLIP-10 node for the Dogecoin node.
  const slip10Node = await SLIP10Node.fromJSON(addressNode);

  // m / 44' / 966' / 0'
  const accountKey0 = await slip10Node.derive(["bip32:0'"]);
  const accountKey00 = await accountKey0.derive(['bip32:0']);
  const accountKey00_ = await accountKey0.derive(["bip32:0'"]);
  const accountKey000 = await accountKey00.derive(['bip32:0']);
  const accountKey000_ = await accountKey00.derive(["bip32:0'"]);
  const accountKey0000 = await accountKey000.derive(['bip32:0']);

  // m / 44' / 966' / 1'
  // const accountKey1 = await dogecoinSlip10Node.derive(["bip32:1'"]);
  const accounts = {
    "m/44'/966'/0'": accountKey0,
    "m/44'/966'/0'/0": accountKey00,
    "m/44'/966'/0'/0'": accountKey00_,
    "m/44'/966'/0'/0/0": accountKey000,
    "m/44'/966'/0'/0/0'": accountKey000_,
    "m/44'/966'/0'/0/0/0": accountKey0000,
  };
  return accounts;
}

async function getMmAccount() {
  const entropy = await snap.request({
    method: 'snap_getEntropy',
    params: {
      version: 1,
      salt: 'foo', // Optional
    },
  });
  const deriveAddress = await getBIP44AddressKeyDeriver(entropy);

  // These are BIP-44 nodes containing the extended private keys for
  // the respective derivation paths.

  // m / 44' / 3' / 0' / 0 / 0
  const addressKey0 = await deriveAddress(0);

  return addressKey0;
}

function newSecret(
  description: string,
  bytesToProtect: Uint8Array,
  helperIds: Array<DeRecId>,
): DeRecSecret {
  throw new Error('not implemented yet');
}

function createId(name: string, contact: string, address?: string): DeRecId {
  return new DeRecId(name, contact, address);
}

class DeRecId {
  name: string; // human-readable identification
  contact: URL; // how to contact me outside the protocol, an email address, for example
  address?: URL; // my transport address

  constructor(name: string, contact: string, address?: string) {
    this.name = name;
    this.contact = new URL(contact);
    this.address = address ? new URL(address) : undefined;
  }

  getName(): string {
    return this.name;
  }

  getContact(): URL {
    return this.contact;
  }

  getAddress(): URL | undefined {
    return this.address;
  }

  equals(o: any): boolean {
    if (this === o) return true;
    if (!(o instanceof DeRecId)) return false;
    return (
      this.name === o.name &&
      this.contact.toString() === o.contact.toString() &&
      this.address?.toString() === o.address?.toString()
    );
  }

  hashCode(): number {
    let hash = this.name + this.contact.toString() + this.address?.toString();
    // Simple string hash code function. You may replace this with your desired hash function.
    return Array.from(hash).reduce(
      (hashAccumulator, charVal) =>
        charVal.charCodeAt(0) + ((hashAccumulator << 5) - hashAccumulator),
      0,
    );
  }
}

export interface DeRecPairable {
  // Your DeRecPairable method signatures here
}

export interface DeRecVersion {
  // Your DeRecVersion method signatures here
}

export interface DeRecSecret {
  /**
   * Add helpers to this secret and block till the outcome of adding them is known
   *
   * @param helperIds a list of helper IDs to add
   */
  addHelpers(helperIds: DeRecId[]): void;

  /**
   * Add helpers to this secret asynchronously
   *
   * @param helperIds a list of futures for each of the helpers
   */
  addHelpersAsync(helperIds: DeRecId[]): Promise<DeRecPairable[]>;

  /**
   * List the helpers
   *
   * @return a list of helpers
   */
  getHelpers(): DeRecPairable[];

  /**
   * Remove each of the helperIds in the list, if a helperId in the list does not refer to a helper for this secret
   * then it is ignored. Block till each of the removals has succeeded, or failed.
   *
   * @param helperIds a list of helper IDs
   */
  removeHelpers(helperIds: DeRecId[]): void;

  /**
   * Update a secret synchronously blocking till the outcome (success or fail) is known.
   *
   * @param bytesToProtect the bytes of the update
   * @return the new Version
   */
  update(bytesToProtect: Uint8Array): DeRecVersion;

  /**
   * Update a secret asynchronously, cancelling any in-progress updates
   *
   * @param bytesToProtect the bytes of the update
   * @return a Future which completes when the update is safe or when it is known to have failed
   */
  updateAsync(bytesToProtect: Uint8Array): Promise<DeRecVersion>;

  /**
   * get a list of versions of the secret
   *
   * @return a {@link Map} of versions
   */
  getVersions(): Map<number, DeRecVersion>;

  /**
   * Is the secret in a state where updates can safely be made and if it is not closed
   *
   * @return true if it is safe
   */
  isAvailable(): boolean;

  /**
   * Is the secret shut down
   *
   * @return true if it is shut down
   */
  isClosed(): boolean;

  /**
   * The unique id of the secret
   *
   * @return the id
   */
  getSecretId(): string;

  /**
   * A secret has a human-readable description as a memo for what the secret is for etc.
   *
   * @return the description
   */
  getDescription(): string;

  /**
   * Gracefully shut down the secret, i.e., unpair from all helpers.
   */
  close(): void;
}
