# NTU EEE Final Year Project: Blockchain-based Relayer Services: Batching and Submitting Multiple Energy Transactions in a Meta-Transaction

Submitted by: Ma Siteng (U1923700D)
Supervisor: [Prof. Gooi Hoay Beng](https://blogs.ntu.edu.sg/gooihoaybeng/)
Co-supervisor: [Dr. Yang Jiawei](https://www.linkedin.com/in/jiawei-yang-clyde/?originalSubdomain=sg)
Examiner: [Prof. Amer Mohammad Yusuf Mohammad Ghias](https://www.ntu.edu.sg/erian/about-us/our-people/cluster-directors/amer-mohammad-yusuf-mohammad-ghias)

Peer-to-peer energy trading has seen an increase of popularity with the adoption of smart grid and distributed energy resources in current days. Blockchain, a distributed ledger governed by consensus protocol, is deemed as a solid foundation to build the peer-to-peer energy trading network on top of it, where traceable and verifiable transaction logs become feasible.

However, even if public blockchain is permissionless, meaning everyone can join the blockchain, it is still a closed ecosystem where everything must be settled in the crypto-native way. One typical example is that users need to pay ‘gas fee’ in the blockchain’s native token to launch a transaction on it. This may not be the problem for the crypto adopters, but it causes significant onboarding issues for users without prior experience. So does it to the users of blockchain-based Peer-to-peer energy trading network.

Moreover, even if the energy trading system is built based on private or consortium blockchain instead of public blockchain, which means users do not need to pay ‘gas fee’, the trading efficiency still requires improvement.

To tackle these problems mentioned above, this project presents a full-stack relayer service that eliminates prosumers’ need to pay gas fee by themselves during the settlement stage in the trading process, and greatly improves the trading efficiency by batching multiple payment requests in one transaction. Prosumers can handle the payment requests to the relayer, which launches the payment transactions for the prosumers.
