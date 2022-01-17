# Twitter clone on Solana

This is just a repo of me learning solana dev through [this tutorial](https://lorisleiva.com/create-a-solana-dapp-from-scratch)

---

## General solana dev learnings

- Everything is an account on Solana
- User accounts and program accounts are owned by the "System Program"
- Programs are also accounts. They're labeled as 'executable'
- Unlike smart contracts on Ethereum, programs on solana are stateless
- All accounts on Solana must pay rent to occupy space on the blockchain. This rent is collected at every epoch unless the account holds enough lamports for 2yrs worth of rent, in which case it is rent-exempt.

## Structure of this "Solana Twitter" dApp

- `solana_twitter` program owns a bunch of `Tweet` accounts
- Every `Tweet` is stored in its own account
- the `author` of the tweet is a user account
- Rent for each `Tweet` is paid by the `author` of the tweet
- If / when the `author` deletes a tweet, the remaining lamports are returned to them (- gas fees)
