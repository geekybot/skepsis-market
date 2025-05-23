module skepsis_market::distribution_market_factory {
    use sui::balance::{Self, Balance};
    use skepsis_market::distribution_market::{create_market, initialize_position_registry};
    use sui::coin::Coin;
    use sui::clock::Clock;


    public struct AdminCap has key { id: UID }

    public struct Factory<phantom CoinType> has key {
        id: UID,
        markets: vector<ID>,
        fees_collected: Balance<CoinType>
    }

    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));
        initialize_position_registry(ctx);
    }

    /// Initializes the factory with a creation fee
    public entry fun initialize_factory<CoinType>(
        _: &AdminCap,
        ctx: &mut TxContext
    ) {
        let factory = Factory<CoinType> {
            id: object::new(ctx),
            markets: vector::empty<ID>(),
            fees_collected: balance::zero<CoinType>()
        };
        transfer::transfer(factory, tx_context::sender(ctx));
    }
    
    /// Creates a new market and tracks it in the factory
    public entry fun create_market_and_add_liquidity<CoinType>(
        _: &AdminCap,
        question: vector<u8>,
        resolution_criteria: vector<u8>,
        steps: u64,
        resolution_time: u64,
        bidding_deadline: u64,
        initial_liquidity: Coin<CoinType>,
        clock: &Clock,
        lower_bound: u64,
        upper_bound: u64,
        ctx: &mut TxContext,
    ) {

        
        create_market(
            question,
            resolution_criteria,
            lower_bound,
            upper_bound,
            steps,
            resolution_time,
            bidding_deadline,
            initial_liquidity,
            clock,
            ctx
        );
        
    }
}
    
