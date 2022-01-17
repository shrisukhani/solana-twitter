import * as anchor from "@project-serum/anchor"
import assert from "assert"
import { Program } from "@project-serum/anchor"
import { SolanaTwitter } from "../target/types/solana_twitter"

describe("solana-twitter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env()
  anchor.setProvider(provider)

  const program = (anchor as any).workspace
    .SolanaTwitter as Program<SolanaTwitter>

  it("Send Tweet", async () => {
    const tweetAccount = anchor.web3.Keypair.generate()
    const tx = await program.rpc.sendTweet(
      "Solana",
      "This is my first tweet on solana-twitter",
      {
        accounts: {
          tweet: tweetAccount.publicKey,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweetAccount],
      }
    )
    console.log("Your transaction signature", tx)

    const account = await program.account.tweet.fetch(tweetAccount.publicKey)

    assert.equal(
      account.author.toBase58(),
      provider.wallet.publicKey.toBase58()
    )
    assert.equal(account.topic, "Solana")
    assert.equal(account.content, "This is my first tweet on solana-twitter")
    assert.ok(account.timestamp)
  })

  it("can send a new tweet without a topic", async () => {
    // Call the "SendTweet" instruction.
    const tweet = anchor.web3.Keypair.generate()
    await program.rpc.sendTweet("", "gm", {
      accounts: {
        tweet: tweet.publicKey,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweet],
    })

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey)

    // Ensure it has the right data.
    assert.equal(
      tweetAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    )
    assert.equal(tweetAccount.topic, "")
    assert.equal(tweetAccount.content, "gm")
    assert.ok(tweetAccount.timestamp)
  })

  it("can send a new tweet from a different author", async () => {
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate()

    const signature = await provider.connection.requestAirdrop(
      otherUser.publicKey,
      100 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(signature)

    // Call the "SendTweet" instruction on behalf of this other user.
    const tweet = anchor.web3.Keypair.generate()
    await program.rpc.sendTweet("veganism", "Yay Tofu!", {
      accounts: {
        tweet: tweet.publicKey,
        author: otherUser.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [otherUser, tweet],
    })

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey)

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), otherUser.publicKey.toBase58())
    assert.equal(tweetAccount.topic, "veganism")
    assert.equal(tweetAccount.content, "Yay Tofu!")
    assert.ok(tweetAccount.timestamp)
  })

  it("cannot provide a topic with more than 50 characters", async () => {
    const tweet = anchor.web3.Keypair.generate()
    await program.rpc.sendTweet("veganism", "Hummus, am I right?", {
      accounts: {
        tweet: tweet.publicKey,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweet],
    })
  })

  it("cannot provide a content with more than 280 characters", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate()
      const contentWith281Chars = "x".repeat(281)
      await program.rpc.sendTweet("veganism", contentWith281Chars, {
        accounts: {
          tweet: tweet.publicKey,
          author: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
      })
    } catch (error) {
      assert.equal(
        error.msg,
        "The provided content should be 280 characters long maximum."
      )
      assert.ok(true)
      return
    }

    assert.fail(
      "The instruction should have failed with a 281-character content."
    )
  })

  it("can fetch all tweets", async () => {
    const allTweets = await program.account.tweet.all()
    assert.equal(allTweets.length, 4)
  })

  it("can filter tweets by author", async () => {
    const authorPublicKey = program.provider.wallet.publicKey
    const tweetAccounts = await program.account.tweet.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: authorPublicKey.toBase58(),
        },
      },
    ])

    assert.equal(tweetAccounts.length, 2)
  })
})
