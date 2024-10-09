import { Buffer } from 'buffer';
import { 
  PublicKey, 
  Keypair, 
  Transaction, 
  Connection, 
  clusterApiUrl, 
  sendAndConfirmTransaction,
  sendAndConfirmRawTransaction,
  TransactionInstruction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import bs58 from "bs58";
import bitcore from 'bitcore-lib-cash';
import nacl from 'tweetnacl';
const BufferWriter = bitcore.encoding.BufferWriter;

export default function () {
  return {
    // 空投
    async airdropToken(address) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const airdropSignature = await connection.requestAirdrop(
        new PublicKey(address),
        LAMPORTS_PER_SOL,
      );
     
      await connection.confirmTransaction(airdropSignature);
    },
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
        } else if (item.name === 'addOwners' || item.name === 'removeOwners') {
          const bufferWriter = new BufferWriter();
          result = new TransactionInstruction({
            programId: new PublicKey(payload.address),
            keys: [
              { pubkey: new PublicKey(payload.address), isSigner: true, isWritable: true },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
              { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
            ],
            data: bufferWriter.toBuffer(),
          })
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
      const fromPubKey = new PublicKey(payload.from);

      const { blockhash } = await connection.getLatestBlockhash("finalized");
      const transaction = this.buildInstructions(payload);

      transaction.feePayer = fromPubKey;
      // 提交之前，每个交易需要引用一个recent blockhash（最新块哈希）。 块哈希被用于去重，以及移除过期交易
      transaction.recentBlockhash = blockhash;

      let transactionBuffer = transaction.serializeMessage();
      let signature = nacl.sign.detached(transactionBuffer, bs58.decode(privateKey));
  
      transaction.addSignature(fromPubKey, signature);
      const rawTransaction = transaction.serialize();
      // Sign transaction, broadcast, and confirm
      const result = await sendAndConfirmRawTransaction(
        connection,
        rawTransaction,
      );

      return result;
    },

    // 多签转账
    async buildBatchTransfer(address, privateKey) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const from = Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey)));
      // 生成一个随机地址转账
      const to = web3.Keypair.generate();

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

    async buildChangeMode(address) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const payload = {
        instructions: [{
          name: 'removeOwners',
        }],
        address,
      }
      const transaction = this.buildInstructions(payload);
      const hash = await sendAndConfirmTransaction(connection, transaction, []);

      return hash;
    }
  } 
}