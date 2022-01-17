use anchor_lang::prelude::*;

declare_id!("47MTrjTLBt2iYcceMi8gtCVWCsFAn1Yt84Y6LdBNpVxX");

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

#[program]
pub mod solana_twitter {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> ProgramResult {
        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }

        ctx.accounts.tweet.topic = topic;
        ctx.accounts.tweet.content = content;
        ctx.accounts.tweet.author = ctx.accounts.author.key();
        ctx.accounts.tweet.timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendTweet<'info> {
    #[account(init, payer = author, space = Tweet::LEN)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_TOPIC_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_CONTENT_LENGTH;
}

#[error]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
