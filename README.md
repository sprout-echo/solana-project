## 助记词 私钥 地址
> 助记词 -> 私钥 -> 地址

Solana 区块链上的每个公共地址都使用长度介于 32 到 44 个字符之间的字符串  
私钥无法派生出自己的助记词，这也是一种单向关系，也是区块链加密完整性的关键。  
1. bip39 单个钱包
2. bip44 多个钱包，也叫HD钱包  
派生路径（m/44'/501'/0'/0'）  
`m/<PURPOSE>/<COIN_TYPE>/<ACCOUNT>/<CHANGE>`
- m 表示跟密钥/主密钥
- m 之后的每个其他元素都应该是零或正整数
- 允许从同一私钥派生多个公钥,账户从索引0开始按顺序递增的方式编号
- 最后一位 0表示外部链 1表示内部链

## 交易
交易包括两部分  
1. 签名（64字节）  
2. 消息（32字节）  
消息结构包括： 
- 消息头
- 账户地址
- 最新的 blockhash，可以通过 getLatestBlockhash RPC方法获取
- 指令
  - keys: 包括每个指令所需的账户元数据
    - pubkey: 账户的链上数据
    - is_signer: 指定帐户是否在交易中作为签名者
    - is_writable: 指定帐户数据是否被修改
  - programId: 程序地址
  - data 指令数据，作为字节缓冲区

<img width="554" alt="image" src="https://github.com/user-attachments/assets/5c6dd34f-ea00-4cf1-b6be-79c065845b89">

```
// 示例交易结构
"transaction": {
    "message": {
      "header": {
        "numReadonlySignedAccounts": 0,
        "numReadonlyUnsignedAccounts": 1,
        "numRequiredSignatures": 1
      },
      "accountKeys": [
        "3z9vL1zjN6qyAFHhHQdWYRTFAcy69pJydkZmSFBKHg1R",
        "5snoUseZG8s8CDFHrXY2ZHaCrJYsW457piktDmhyb5Jd",
        "11111111111111111111111111111111"
      ],
      "recentBlockhash": "DzfXchZJoLMG3cNftcf2sw7qatkkuwQf4xH15N5wkKAb",
      "instructions": [
        {
          "accounts": [
            0,
            1
          ],
          "data": "3Bxs4NN8M2Yn4TLb",
          "programIdIndex": 2,
          "stackHeight": null
        }
      ],
      "indexToProgramIds": {}
    },
    "signatures": [
      "5LrcE2f6uvydKRquEJ8xp19heGxSvqsVbcqUeFoiWbXe8JNip7ftPQNTAVPyTK7ijVdpkzmKKaAQR7MWMmujAhXD"
    ]
  }
```
