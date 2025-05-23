module usdc::faucet {
    use sui::coin::{Self, TreasuryCap};

    public struct Faucet<phantom T> has key, store {
        id: UID,
        airdrop_amount: u64,
        cap: TreasuryCap<T>,
        owner: address
    }

    public fun new<T>(
        cap: TreasuryCap<T>,
        airdrop_amount: u64,
        _owner: address,
        ctx: &mut TxContext,
    ): Faucet<T> {
        Faucet {
            id: object::new(ctx),
            airdrop_amount,
            cap,
            owner: _owner,   
        }
    }

    public entry fun mint_for_owner<T>(faucet: &mut Faucet<T>, ctx: &mut TxContext) {
        transfer::public_transfer(
            coin::mint(&mut faucet.cap, 1_000_000_000_000_000, ctx),
            faucet.owner,
        );
    }

    public entry fun airdrop<T>(faucet: &mut Faucet<T>, ctx: &mut TxContext) {
        transfer::public_transfer(
            coin::mint(&mut faucet.cap, faucet.airdrop_amount, ctx),
            tx_context::sender(ctx),
        );
    }
}