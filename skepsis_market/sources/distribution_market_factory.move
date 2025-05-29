module skepsis_market::distribution_market_factory {
    use skepsis_market::distribution_market::{create_market, initialize_position_registry};
    use sui::coin::Coin;
    use sui::clock::Clock;

    use sui::event;
    

    // Event structs
    public struct FactoryInitializedEvent has copy, drop {
        factory_id: ID,
    }

    public struct MarketCreatedEvent has copy, drop {
        factory_id: ID,
        market_id: ID,
        question: vector<u8>,
        steps: u64,
        resolution_time: u64,
        bidding_deadline: u64,
        initial_liquidity: u64,
        lower_bound: u64,
        upper_bound: u64
    }

    public struct Factory<phantom CoinType> has key {
        id: UID,
        markets: vector<ID>,
    }

    fun init(ctx: &mut TxContext) {
        initialize_position_registry(ctx);
    }

    /// Initializes the factory
    public entry fun initialize_factory<CoinType>(
        ctx: &mut TxContext
    ) {
        let factory = Factory<CoinType> {
            id: object::new(ctx),
            markets: vector::empty<ID>(),
        };
        
        // Emit factory initialization event
        event::emit(FactoryInitializedEvent {
            factory_id: object::uid_to_inner(&factory.id)
        });
        
        transfer::share_object(factory);
    }
    
    /// Creates a new market and tracks it in the factory
    public entry fun create_market_and_add_liquidity<CoinType>(
        factory: &mut Factory<CoinType>,
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
        let init_liqidity_amount = sui::coin::value(&initial_liquidity);
        let market_id = create_market(
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
        
        // Store the market ID in the factory
        vector::push_back(&mut factory.markets, market_id);
        
        // Emit market creation event
        event::emit(MarketCreatedEvent {
            factory_id: object::uid_to_inner(&factory.id),
            market_id: market_id,
            question: question,
            steps: steps,
            resolution_time: resolution_time,
            bidding_deadline: bidding_deadline,
            initial_liquidity: init_liqidity_amount,
            lower_bound: lower_bound,
            upper_bound: upper_bound
        });
    }
}

