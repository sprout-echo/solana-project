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
import * as splToken from '@solana/spl-token';
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
    // async buildCreateMultiWallet(programId, newAccount) {
    //   const newAccountPublicKey = new PublicKey(newAccount);
    //   const programIDPubkey = new PublicKey(programId);
    //   const [pda, nonce] = PublicKey.findProgramAddressSync([newAccountPublicKey.toBuffer()], programIDPubkey);
    //   const instructions = [];
    //   const obj = {
    //     name: 'createMultiWallet', 
    //     param: { nonce },
    //     programId, 
    //     keys: [{ pubkey: newAccount, isSigner: false, isWritable: true }],
    //   }
    //   instructions.push(obj);
    //   return instructions;
    // },

    // buildInstructions(payload) {
    //   const transaction = new Transaction();
    //   const instructions = [];
    //   let result;
    //   payload.instructions.forEach((item) => {
    //     if (item.name === "createMultiWallet") {
    //       result = new TransactionInstruction({
    //         programId: new PublicKey(item.programId),
    //         keys: item.keys.map(k => {
    //           return {
    //             ...k,
    //             pubkey: new PublicKey(k.pubkey),
    //           };
    //         }),
    //       });
    //     } else if (item.name === 'multiTransferSOL') {
    //       result = new TransactionInstruction({
    //         programId: new PublicKey(payload.address),
    //         keys: [
    //           { pubkey: new PublicKey(payload.address), isSigner: true, isWritable: true },
    //           { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    //           { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    //         ]
    //       });
    //     } else if (item.name === 'addOwners' || item.name === 'removeOwners') {
    //       const bufferWriter = new BufferWriter();
    //       result = new TransactionInstruction({
    //         programId: new PublicKey(payload.address),
    //         keys: [
    //           { pubkey: new PublicKey(payload.address), isSigner: true, isWritable: true },
    //           { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    //           { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    //         ],
    //         data: bufferWriter.toBuffer(),
    //       })
    //     }
    //     instructions.push(result);
    //   });

    //   instructions.forEach((item) => {
    //     transaction.add(item);
    //   });
    //   return transaction;
    // },

    async createMultsigAccount(payer, multisigPubKey, privateKey) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const fromPubKey = new PublicKey(payer);
      const newPubkey = new PublicKey(multisigPubKey);

      const lamports = await splToken.getMinimumBalanceForRentExemptMint(connection);

      const { blockhash } = await connection.getLatestBlockhash("finalized");
      // const transaction = this.buildInstructions(payload);
      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: fromPubKey.PublicKey,
        newAccountPubkey: newPubkey.PublicKey,
        lamports,
        space: splToken.MINT_SIZE,
        programId: splToken.TOKEN_PROGRAM_ID,
      });
      // 初始化多签账户的指令
      const initializeMultisigInstruction = splToken.createInitializeAccountInstruction(
        multisigPubKey,
        [fromPubKey, newPubkey], // 签名列表
        2, // 最小签名数量 
        splToken.TOKEN_PROGRAM_ID,
      )

      const transaction = new Transaction().add(createAccountInstruction, initializeMultisigInstruction);

      transaction.feePayer = fromPubKey;
      // 提交之前，每个交易需要引用一个recent blockhash（最新块哈希）。 块哈希被用于去重，以及移除过期交易
      transaction.recentBlockhash = blockhash;

      const transactionBuffer = transaction.serializeMessage();
      const signature = nacl.sign.detached(transactionBuffer, bs58.decode(privateKey));
  
      transaction.addSignature(fromPubKey, Buffer.from(signature));
      // Sign transaction, broadcast, and confirm
      const result = await sendAndConfirmRawTransaction(transaction.serialize(),);

      return result;
    },

    // 多签转账
    async buildBatchTransfer(source, dest, owner, amount,  privateKey) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const fromKeypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey)));
      const sourcePubkey = new PublicKey(source);
      const destPubkey = new PublicKey(dest);
      const ownerPubkey = new PublicKey(owner);

      const sourceTokenAccount = await splToken.getAssociatedTokenAddress(ownerPubkey, sourcePubkey, false);
      const destTokenAccount = await splToken.getAssociatedTokenAddress(ownerPubkey, destPubkey, false);
      const transferInstruction = splToken.createTransferInstruction(
        sourceTokenAccount,
        destTokenAccount,
        sourcePubkey,
        amount*1e9, 
        [sourcePubkey, ownerPubkey],
        ownerPubkey,
      );

      const memoInstruction = new TransactionInstruction({
        keys: [
          { pubkey: ownerPubkey,  isSigner: true , isWritable:false },
          { pubkey: sourcePubkey, isSigner: true, isWritable: false }
        ],
        programId: ownerPubkey,
      });

      const transaction = new Transaction().add(transferInstruction, memoInstruction);

      const { blockhash } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      const transactionBuffer = transaction.serializeMessage();
      const signature = nacl.sign.detached(transactionBuffer, bs58.decode(privateKey));

      transaction.addSignature(fromKeypair, Buffer.from(signature));
      // Sign transaction, broadcast, and confirm
      const result = await sendAndConfirmRawTransaction(transaction.serialize());

      return result;
    },

    async buildChangeMode(address) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const payload = {
        instructions: [{
          name: 'removeOwners',
        }],
        address,
      }
      const bufferWriter = new BufferWriter();
      const transaction = new Transaction();
      transaction.add([new TransactionInstruction({
        programId: new PublicKey(address),
        keys: [
          { pubkey: new PublicKey(address), isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: bufferWriter.toBuffer(),
      })])

      // const transaction = this.buildInstructions(payload);
      const hash = await sendAndConfirmTransaction(connection, transaction, []);

      return hash;
    }
  } 
}