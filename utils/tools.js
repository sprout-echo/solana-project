import * as bip39 from "bip39";
import { PublicKey, Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { HDKey } from "micro-ed25519-hdkey";

export function generateMnemonic() {
  return bip39.generateMnemonic();
}

export function generateKeyAndAddress(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic, "");
  // 恢复 bip39 格式
  // const keypair = Keypair.fromSeed(seed.slice(0, 32));
  // 恢复 bip44 格式
  const hd = HDKey.fromMasterSeed(seed.toString("hex"));
  const derivePath = "m/44'/501'/0'/0'";
  const keypair = Keypair.fromSeed(hd.derive(derivePath).privateKey);

  return {
    address: keypair.publicKey.toBase58(),
    secretKey: bs58.encode(keypair.secretKey),
  }
}

export async function getMultiAccountInfo(address) {
  const addressPublicKey = new PublicKey(address);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  return connection.getAccountInfo(addressPublicKey);
}