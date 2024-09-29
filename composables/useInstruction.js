import { Buffer } from 'buffer';
import { PublicKey, Keypair, Transaction, Connection, clusterApiUrl, sendAndConfirmTransaction, TransactionInstruction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import bs58 from "bs58";

export default function () {
  return {
    async buildCreateMultiWallet(programId, newAccount) {
      const newAccountPublicKey = new PublicKey(newAccount);
      const programIDPubkey = new PublicKey(programId);
      const [pda, nonce] = PublicKey.findProgramAddressSync([newAccountPublicKey.toBuffer()], programIDPubkey);
      const instructions = [];
      const obj = {
        name: 'createMultiWallet', 
        param: { nonce },
        programId, 
        keys: [{ pubkey: newAccount, isSigner: false, isWritable: true }],
      }
      instructions.push(obj);
      return instructions;
    },

    buildInstructions(payload) {
      const transaction = new Transaction();
      const instructions = [];
      let result;
      payload.instructions.forEach((item) => {
        if (item.name === "createMultiWallet") {
          result = new TransactionInstruction({
            programId: new PublicKey(item.programId),
            keys: item.keys.map(k => {
              return {
                ...k,
                pubkey: new PublicKey(k.pubkey),
              };
            }),
          });
        } else if (item.name === 'multiTransferSOL') {
          result = new TransactionInstruction({
            programId: new PublicKey(payload.address),
            keys: [
              { pubkey: new PublicKey(payload.address), isSigner: true, isWritable: true },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
              { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
            ]
          });
        }
        instructions.push(result);
      });

      instructions.forEach((item) => {
        transaction.add(item);
      });
      return transaction;
    },

    async sendTransaction(payload, privateKey) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      // 创建从密钥的unit8array派生的新密钥对
      const from = Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey)));
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      const transaction = this.buildInstructions(payload);

      transaction.feePayer = payload.from;
      transaction.recentBlockhash = blockhash;
      // Sign transaction, broadcast, and confirm
      const txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [from],
      );

      return txHash;
    },

    // 多签转账
    async buildBatchTransfer(address, privateKey) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const from = Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey)));
      const payload = {
        instructions: [{
          name: 'multiTransferSOL',
        }],
        address,
      }
      const transaction = this.buildInstructions(payload);
    
      const hash = await sendAndConfirmTransaction(connection, transaction, [
        from,
      ]);

      return hash;
    },

    async buildChangeMode() {
      
    }
  } 
}