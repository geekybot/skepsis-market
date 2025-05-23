module usdc::usdc {
    use sui::url;
    use sui::coin;
    // use sui::tx_context::TxContext;
    use usdc::faucet;

    public struct USDC has drop {}

    const AIRDROP_AMOUNT: u64 = 50_000000;
    #[allow(lint(share_owned))]
    fun init(otw: USDC, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency<USDC>(
            otw,
            6,
            b"USDC",
            b"Circle USD",
            b"fake USDC on testnet",
            option::some(url::new_unsafe_from_bytes(
                b"https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png"),
            ),
            ctx,
        );
        
        transfer::public_freeze_object(metadata);
        
        transfer::public_share_object(
            faucet::new(treasury_cap, AIRDROP_AMOUNT, tx_context::sender(ctx), ctx)
        );
    }
}