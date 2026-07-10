'use strict';

var stellarSdk = require('@stellar/stellar-sdk');
var sha2_js = require('@noble/hashes/sha2.js');

// src/stellar/venue.ts

// src/chains.ts
var COORDINATES = {
  STARKNET: {
    rpcUrl: "https://rpc.starknet.lava.build",
    marketplace721: "0x03eda9a2b6ad90845a43591bac8083ebaf677d51fdf20f503b2c01889e3131fc",
    marketplace721ClassHash: "0x0700d9230d07e5203e27778c0dc70f9134d2b25bf319f7cf8348dc66a6923e90",
    marketplace721StartBlock: 11198146,
    marketplace1155: "0x07c4ce1c19ea48cc11135ed22b19ff745f5aec508c3828593002e4f76fdb1b38",
    marketplace1155ClassHash: "0x0242f5c388da7cee2d99e2a69453c8159bf927fbec4e797a3cfdcbbcb5b68328",
    marketplace1155StartBlock: 11198267,
    collection721: "0x0225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea",
    collection721StartBlock: 11198496,
    ipNftClassHash: "0x012d3ae40ba35c7e2be0946532dac60e48932447912fdf96b674da67c029b9cc",
    ipCollectionClassHash: "0x022155a1a130a40e57aac4b89c07fab3f616bc351b1270fc40f756b963afe8b4",
    collection1155: "0x015368976d46fae5bfa1c58600f641d5aa5dbbf53ebc6b78aa3922194aad3551",
    collection1155FactoryClassHash: "0x04eb6b419770f13bd191f120b9fc9ee624c0613ad4490062d293ca2016b3b1d2",
    collection1155ClassHash: "0x06cf3f5a2322dac35e07a6064a5b8802f19fda8aa3f4726f0cb7bc05dea1bd78",
    collection1155StartBlock: 11199527,
    popFactory: "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111",
    popCollectionClassHash: "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f",
    dropFactory: "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800",
    dropCollectionClassHash: "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282",
    nftComments: "0x02cdac70c94447189af0389dfea63f4d5e4154ea8a563de288a5ab1c39e37843",
    creatorCoinFactory: "0x50fa807b5274079fb19374673d7bab6d2dc3af7e1032ea43eb6e44bcbde4c3c",
    creatorCoinEkuboLauncher: "0x4f7fceb5ac10f12f9544a09580592e5bdf1b7f04f48765eecf12286d8ccb7b4",
    creatorCoinClassHash: "0x743e4c8a5b96bb83bbf4af04edbbb482d5ece89eed9b729a79fb7df0cd0b6b6",
    creatorCoinFactoryClassHash: "0x51765926b1344c9a20b8cd4b5abe7b7d47375ae97cf6804db3ea5d4b05a9b55",
    creatorCoinStartBlock: 10474544,
    ekuboCore: "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
    ipTicketsFactory: "0x0664c2d6a4da9ee3ff053ceeba7579c01f2fedfd9d2b57b4c07af3734bd4acab",
    ipTicketCollectionClassHash: "0x086f59c416e365e2bee4ceff9f1dcb96198f2342d50ba4621f60b831863adb6",
    ipTicketsStartBlock: 11404656,
    ipClubRegistry: "0x00e189c619b6bb07d78973a149641c59c37eb0716f8584d7520bce12d303eede",
    ipClubNftClassHash: "0x02bc9b20cca21b04245e9215bf7121f4d7295b195890e449b472b573017fb889",
    ipClubStartBlock: 11404776,
    ipClubFactory: "0x010726346c264d1832a7303afaf5692dbd2b05446fecc6da30d958d0227c36d0",
    ipClubFactoryClassHash: "0x07197062578375d962b2d42d3e91560770b11b1c97a9defb74c706a2c5299473",
    ipClubCollectionClassHash: "0x049dc5e5ff00e67d5d457c6991ee70822f36a979b76cefd1b617aeccd7051d4b",
    ipClubFactoryStartBlock: 11652766,
    ipSponsorship: "0x044d9b9c3bb29b94685b0a3fe27a5e2dfa30a3637ab55979c718ebcd3268bc2f",
    ipSponsorshipStartBlock: 11405085,
    // Dedicated ip-erc721/MIP instance for sponsorship receipts (class hash
    // 0x01bd7e39c5135b32b664e34cbbb4eafbd707a0fbc3ec2ef28657f52577d277d7) —
    // never the genesis-mint instance.
    ipSponsorshipLicense: "0x06bcfc4e97758a2abf95af4bd49596efdbfd88ccd740caddc56ad0a4bd095839"
  }
};
function getCoordinates(chain) {
  const c = COORDINATES[chain];
  if (!c) throw new Error(`No coordinates configured for chain "${chain}"`);
  return c;
}

// src/stellar/venue.ts
function stellarOrderRef(contractId, offerer, salt) {
  const payload = new TextEncoder().encode(`${contractId}:${offerer}:${salt.toString()}`);
  return "0x" + Buffer.from(sha2_js.sha256(payload)).toString("hex");
}
var StellarVenue = class {
  constructor(opts) {
    this.chain = "STELLAR";
    this.server = opts.server;
    this.passphrase = opts.networkPassphrase;
    const contractId = opts.contractId ?? maybeCoords()?.marketplace;
    if (!contractId) throw new Error("No Stellar venue contract configured");
    this.contractId = contractId;
    this.contract = new stellarSdk.Contract(contractId);
    this.baseFee = opts.baseFee ?? "100";
  }
  async registerOrder(signer, params) {
    const salt = BigInt(params.salt);
    const counter = await this.getCounter(signer.publicKey);
    const op = this.contract.call(
      "register_order",
      stellarSdk.nativeToScVal(signer.publicKey, { type: "address" }),
      stellarSdk.nativeToScVal(salt, { type: "u64" }),
      stellarSdk.nativeToScVal([params.side === "listing" ? "Listing" : "Bid"], { type: "symbol" }),
      stellarSdk.nativeToScVal(params.asset.contract, { type: "address" }),
      stellarSdk.nativeToScVal(Number(params.asset.tokenId), { type: "u32" }),
      stellarSdk.nativeToScVal(params.paymentToken, { type: "address" }),
      stellarSdk.nativeToScVal(BigInt(params.amount), { type: "i128" }),
      stellarSdk.nativeToScVal(params.royaltyMaxBps, { type: "u32" }),
      stellarSdk.nativeToScVal(BigInt(params.startTime), { type: "u64" }),
      stellarSdk.nativeToScVal(BigInt(params.endTime), { type: "u64" }),
      stellarSdk.nativeToScVal(counter, { type: "u64" })
    );
    const txHash = await this.invoke(signer, op);
    return { txHash, orderRef: stellarOrderRef(this.contractId, signer.publicKey, salt) };
  }
  async fulfillOrder(signer, _orderRef, opts) {
    if (!opts?.offerer || opts.salt === void 0) {
      throw new Error("Stellar fulfillment needs { offerer, salt } (orders are storage-keyed)");
    }
    const op = this.contract.call(
      "fulfill_order",
      stellarSdk.nativeToScVal(signer.publicKey, { type: "address" }),
      stellarSdk.nativeToScVal(opts.offerer, { type: "address" }),
      stellarSdk.nativeToScVal(BigInt(opts.salt), { type: "u64" })
    );
    return { txHash: await this.invoke(signer, op) };
  }
  async cancelOrder(signer, _orderRef, opts) {
    if (opts?.salt === void 0) throw new Error("Stellar cancel needs { salt }");
    const op = this.contract.call(
      "cancel_order",
      stellarSdk.nativeToScVal(signer.publicKey, { type: "address" }),
      stellarSdk.nativeToScVal(BigInt(opts.salt), { type: "u64" })
    );
    return { txHash: await this.invoke(signer, op) };
  }
  async incrementCounter(signer) {
    const op = this.contract.call(
      "increment_counter",
      stellarSdk.nativeToScVal(signer.publicKey, { type: "address" })
    );
    return { txHash: await this.invoke(signer, op) };
  }
  async getOrderDetails(_orderRef) {
    throw new Error("Use getOrder(offerer, salt) \u2014 Stellar orders are storage-keyed");
  }
  async getOrder(offerer, salt) {
    return this.view("get_order", [
      stellarSdk.nativeToScVal(offerer, { type: "address" }),
      stellarSdk.nativeToScVal(salt, { type: "u64" })
    ]);
  }
  async getCounter(address) {
    const value = await this.view("get_counter", [stellarSdk.nativeToScVal(address, { type: "address" })]);
    return BigInt(value ?? 0);
  }
  async view(method, args) {
    const account = await this.server.getAccount(PLACEHOLDER_SOURCE);
    const tx = new stellarSdk.TransactionBuilder(account, { fee: this.baseFee, networkPassphrase: this.passphrase }).addOperation(this.contract.call(method, ...args)).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if (stellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return stellarSdk.scValToNative(sim.result.retval);
    }
    return void 0;
  }
  async invoke(signer, op) {
    const account = await this.server.getAccount(signer.publicKey);
    const tx = new stellarSdk.TransactionBuilder(account, { fee: this.baseFee, networkPassphrase: this.passphrase }).addOperation(op).setTimeout(60).build();
    const prepared = await this.server.prepareTransaction(tx);
    const signedXdr = await signer.signTransaction(prepared.toXDR(), this.passphrase);
    const signed = stellarSdk.TransactionBuilder.fromXDR(signedXdr, this.passphrase);
    const sent = await this.server.sendTransaction(signed);
    return sent.hash;
  }
};
var PLACEHOLDER_SOURCE = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
function maybeCoords() {
  try {
    return getCoordinates("STELLAR");
  } catch {
    return void 0;
  }
}

exports.StellarVenue = StellarVenue;
exports.stellarOrderRef = stellarOrderRef;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map