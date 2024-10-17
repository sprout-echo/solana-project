<template>
  <div>
    <h3>SOLANA</h3>
    <el-button type="primary" @click="generateM()">随机生成助记词</el-button>
    <div style="color:#5E6773; padding: 12px;">{{ obj.mnemonic }}</div>
    <el-button type="primary" style="margin-top: 12px;" @click="generateKeyAddress()">生成公私钥</el-button>
    <div style="margin-top:10px;"><el-button type="primary" @click="airdrop">空投</el-button></div>
    <div style="margin-top:10px;"><el-button type="primary" @click="onCreate">创建钱包</el-button></div>
    <div style="margin-top:10px;"><el-button type="primary" @click="onSearch">查询钱包信息</el-button></div>
    <div style="margin-top:10px;">
      <el-button type="primary" @click="onMultSignTransfer">发送多签交易</el-button>
    </div>
    <div style="margin-top:10px;">
      <el-button type="primary" @click="onChangeMult">修改多签成员交易</el-button>
    </div>
  </div>
</template>
<script setup>
import { generateMnemonic, generateKeyAndAddress, getMultiAccountInfo } from "~/utils/tools";
const nuxtApp = useNuxtApp();
const obj = reactive({
  mnemonic: '',
  privateKey: '3zvNHfEsiCC6tnM4ckDWW2UxPzcr8QsHGS6zTRzF1rpptDtwhDtnM1a7Txen2xL7Zcaq4n2MbvA24ukVwTpqq7Gs',
  address: '53MHh2B21cYWovDAHZayPK8awXGc8pdzRXx3hZaY668o', // 即钱包地址 7JXKVj3MBNSwL39wPxNiRr1jGnsS8ARtu8fotazFRLeP
})

const generateM = () => {
  obj.mnemonic = generateMnemonic();
};

const generateKeyAddress = () => {
  const res = generateKeyAndAddress(obj.mnemonic);
  obj.address = res.address;
  obj.privateKey = res.secretKey;
  console.log('address:', res.address);
  console.log('secretKey:', res.secretKey);
}

const airdrop = () => {
  useInstruction().airdropToken(obj.address);
}

const onCreate = async() => {
  const payer = '7JXKVj3MBNSwL39wPxNiRr1jGnsS8ARtu8fotazFRLeP';
  await useInstruction().createMultsigAccount(payer, obj.address, obj.privateKey);
  // const contract = 'H7yqXZaYmAFKv9GinkNT9ZKwkELDicGXEig2wPaTGJ33';  // 工厂合约地址，在sol公链上，此地址就是ProgramID
  // // 创建多签钱包参数
  // const payload = await useInstruction().buildCreateMultiWallet(contract, obj.address);
  
  // const params = {
  //   instructions: payload,
  //   fee: '0',
  //   unitPrice: "200",    // gas费用
  //   unitLimit: 200000,
  //   from: obj.address,
  // };
  // const result = await useInstruction().sendTransaction(params, obj.privateKey);
  // console.log('result:', result);
} 

const onSearch = async () => {
  // BsqgwbPxz9zrYdbniU8jnwhhgj6HEx92Ecg8n3WCv8Dx
  const data = await getMultiAccountInfo(obj.address);
  console.log('wallet data:', data);
}

const onMultSignTransfer = async() => {
  // 构建合约对应的签名消息
  const source = '7JXKVj3MBNSwL39wPxNiRr1jGnsS8ARtu8fotazFRLeP';
  const dest = '53MHh2B21cYWovDAHZayPK8awXGc8pdzRXx3hZaY668o';
  const amount = 1; // 1 SOL = 10^9 lamports
  const data = await useInstruction().buildBatchTransfer(source, dest, obj.address, amount, obj.privateKey);
  console.log('transfer data:', data);
}

const onChangeMult = async() => {
  // 构建合约对应的签名消息
  // addOwners  removeOwners  replaceOwners
  const signData = await useInstruction().buildChangeMode();
  console.log('change sign data:', signData);
}
</script>
