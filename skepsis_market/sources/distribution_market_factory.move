module skepsis_market::distribution_market_factory {
    use sui::balance::{Self, Balance};
    use skepsis_market::distribution_market::{create_market, initialize_position_registry};
    use sui::coin::Coin;
    use sui::clock::Clock;

    use sui::event;
    

    // Constants
    const BASIS_POINTS_DENOMINATOR: u64 = 10000;
    const DEFAULT_FEE_BPS: u64 = 3; // 0.03%

    // Event structs
    public struct FactoryInitializedEvent has copy, drop {
        factory_id: ID,
        initial_fee_bps: u64
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

    public struct FeeCollectedEvent has copy, drop {
        factory_id: ID,
        amount: u64
    }

    public struct FeeWithdrawnEvent has copy, drop {
        factory_id: ID,
        amount: u64,
        recipient: address
    }

    

    public struct AdminCap has key { id: UID }

    public struct Factory<phantom CoinType> has key {
        id: UID,
        markets: vector<ID>,
        fees_collected: Balance<CoinType>,
        fee_bps: u64 // Basis points for the fee (0.03% = 3 basis points)
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
            fees_collected: balance::zero<CoinType>(),
            fee_bps: DEFAULT_FEE_BPS
        };
        
        // Emit factory initialization event
        event::emit(FactoryInitializedEvent {
            factory_id: object::uid_to_inner(&factory.id),
            initial_fee_bps: DEFAULT_FEE_BPS
        });
        
        transfer::share_object(factory);
    }
    
    /// Creates a new market and tracks it in the factory
    public entry fun create_market_and_add_liquidity<CoinType>(
        _: &AdminCap,
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
    
    /// Calculates the fee amount based on the input amount and the fee basis points
    public fun calculate_fee_amount<CoinType>(
        factory: &Factory<CoinType>, 
        amount: u64
    ): u64 {
        (amount * factory.fee_bps) / BASIS_POINTS_DENOMINATOR
    }
    
    /// Collects fee from a transaction and adds it to the factory's collected fees
    public fun collect_fee<CoinType>(
        factory: &mut Factory<CoinType>,
        fee_balance: &mut Balance<CoinType>
    ) {
        let fee_amount = balance::value(fee_balance);
        if (fee_amount > 0) {
            let fee = balance::split(fee_balance, fee_amount);
            balance::join(&mut factory.fees_collected, fee);
        }
    }
   
    /// Allows the admin to withdraw collected fees
    public entry fun withdraw_fees<CoinType>(
        _: &AdminCap,
        factory: &mut Factory<CoinType>,
        ctx: &mut TxContext
    ) {
        let amount = balance::value(&factory.fees_collected);
        if (amount > 0) {
            let fees = balance::split(&mut factory.fees_collected, amount);
            let coin = sui::coin::from_balance(fees, ctx);
            transfer::public_transfer(coin, tx_context::sender(ctx));
        }
    }
    
    /// Updates the fee basis points (only admin can call)
    public entry fun update_fee_bps<CoinType>(
        _: &AdminCap,
        factory: &mut Factory<CoinType>,
        new_fee_bps: u64
    ) {
        factory.fee_bps = new_fee_bps;
    }
}

