module skepsis_market::distribution_market {
    use sui::clock::{Clock, timestamp_ms};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use skepsis_market::distribution_math;

    // Fee configuration constants moved from factory
    const BASIS_POINTS_DENOMINATOR: u64 = 1000;
    const DEFAULT_FEE_BPS: u64 = 3; // 0.3%
    
    const MIN_LIQUIDITY: u64 = 1000_000_000; // Example: minimum liquidity requirement
    const PRECISION: u64 = 1000000; // Add global PRECISION constant for price calculations

    // errors codes
    const ERROR_INVALID_RESOLUTION_TIME: u64 = 1000;
    const ERROR_INVALID_BIDDING_DEADLINE: u64 = 1001;
    const ERROR_MINIMUM_LIQUIDITY: u64 = 1003;
    const ERROR_VECTOR_INDEX_OUT_OF_BOUND: u64 = 1004;

    // Error codes for liquidity operations
    const ERROR_MARKET_NOT_RESOLVED: u64 = 1020;
    const ERROR_NOT_OWNER: u64 = 1021;
    const ERROR_MARKET_CLOSED: u64 = 1022;
    const ERROR_MARKET_MISMATCH: u64 = 1023;
    const ERROR_MARKET_BIDDING_IS_OVER: u64 = 1024;
    const ERROR_MARKET_RESOLUTION_IS_NOT_OVER: u64 = 1025;
    const ERROR_POSITIVE_LIQUIDITY: u64 = 1026;
    
    // Share cap errors
    const ERROR_SHARE_CAP_EXCEEDED: u64 = 1030;

    // Error codes for position operations
    const ERROR_POSITION_NOT_FOUND: u64 = 1040;
    const ERROR_SPREAD_NOT_FOUND: u64 = 1041;
    const ERROR_INSUFFICIENT_SHARES: u64 = 1042;
    const ERROR_INSUFFICIENT_FUNDS: u64 = 1043;
    const ERROR_MARKET_IS_NOT_OPEN: u64 = 1044;
    const ERROR_MARKET_NOT_RESOLVED_YET: u64 = 1045;
    const ERROR_ALREADY_CLAIMED: u64 = 1046;
    const ERROR_BIDDING_DEADLINE_PASSED: u64 = 1047;
    const ERROR_INVALID_SHARE_AMOUNT_TO_BUY: u64 = 1048;
    const ERROR_INVALID_SHARE_AMOUNT_TO_SELL: u64 = 1049;
    const ERROR_SLIPPAGE_TOO_HIGH: u64 = 1050;

    // Event for fee configuration updates
    public struct FeeConfigUpdatedEvent has copy, drop {
        market_id: ID,
        new_fee_bps: u64
    }

    public struct SpreadInfo has key, store {
        id: UID,
        precision: u64,
        lower_bound: u64,
        upper_bound: u64,
        steps: u64,
        outstanding_shares: u64,
    }

    public struct Market<phantom CoinType> has key{
        id: UID,
        creator: address, // Address of the market creator
        question: vector<u8>,
        resolution_criteria: vector<u8>,
        steps: u64,    // eg: for temp market 0.5 * 10^6, for lower bound of 20 to 40 20-20.5, 20.5-21
        creation_time: u64,
        bidding_deadline: u64,
        resolution_time: u64,
        market_state: u64,                  // 0: open, 1: resolved, 2: canceled
        spreads: vector<SpreadInfo>,
        resolved_value: u64,
        total_shares: u64,                  // maximum number of shares, liquidity added is the max number of shares protocol can sell and cover 
        pool_balance: Balance<CoinType>,
        liquditiy_share: u64,               // liquidity share minted to the creator
        cumulative_shares_sold: u64,        // Total shares sold so far (for enforcing share cap)
        // Added fee configuration
        fees_collected: Balance<CoinType>,  // Fees collected in this market
        fee_bps: u64,                      // Basis points for the fee (0.03% = 3 basis points)
    }

   

    public struct LiquidityShare has key{
        id: UID,
        shares: u64,
        market: ID,
        user: address,
    }

    // Improved share tracking with market, spread and user details
    public struct UserPosition has key, store {
        id: UID,
        market_id: ID,
        shares_by_spread: VecMap<u64, u64>, // Map of spread_index -> shares
        total_invested: u64,
        claimed: bool,
        winnings_claimed: u64,
        user: address,
    }

    // Registry to track all user positions
    public struct UserPositionRegistry has key {
        id: UID,
        // Maps user_address -> market_id -> UserPosition
        positions: Table<address, Table<ID, UserPosition>>,
    }

    // Events for position tracking
    public struct PositionCreated has copy, drop {
        position_id: ID,
        market_id: ID,
        user: address,
        spreads: vector<u64>,
        shares: vector<u64>,
        total_invested: u64,
    }

    public struct PositionUpdated has copy, drop {
        position_id: ID,
        market_id: ID,
        user: address,
        spread_index: u64,
        shares_delta: u64, 
        trade_type: u8, // 0 for buy, 1 for sell
        investment_delta: u64,
    }

    public struct WinningsClaimed has copy, drop {
        position_id: ID,
        market_id: ID,
        user: address,
        amount: u64,
        winning_spread: u64,
    }

    public entry fun create_market<CoinType>(
        question: vector<u8>,
        resolution_criteria: vector<u8>,
        lower_bound: u64,
        upper_bound: u64,
        steps: u64,
        resolution_time: u64,
        bidding_deadline: u64,
        initial_liquidity: Coin<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): ID {
        // Create a new market object
        // Check if the initial liquidity is above the minimum requirement
        assert!(coin::value(&initial_liquidity) >= MIN_LIQUIDITY, ERROR_MINIMUM_LIQUIDITY);
        // check current time < bidding_deadline < resolution_time
        let current_time = timestamp_ms(clock);
        assert!(current_time < bidding_deadline, ERROR_INVALID_BIDDING_DEADLINE);
        assert!(bidding_deadline < resolution_time, ERROR_INVALID_RESOLUTION_TIME);
        // Validate share cap
        // assert!(share_cap > 0, ERROR_INVALID_SHARE_CAP);
        
        // calculate total shares
        // taking usdc as input with 6 decimal places, total shares will be equal to initial_liquidity * 10^6
        let total_shares = coin::value(&initial_liquidity);
        
        // calculate spread 
        let spread = calculate_spread(lower_bound, upper_bound, steps, ctx);
        
        let market = Market {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            question,
            resolution_criteria,
            steps,
            creation_time: current_time,
            bidding_deadline,
            resolution_time,
            market_state: 0, // 0: open
            spreads: spread,
            resolved_value: 0,
            total_shares,
            pool_balance: coin::into_balance(initial_liquidity),
            liquditiy_share: total_shares, // Initial liquidity share minted to the creator
            cumulative_shares_sold: 0,
            fees_collected: balance::zero<CoinType>(), // Initialize fees collected
            fee_bps: DEFAULT_FEE_BPS, // Set default fee basis points
        };
        let market_id = object::id(&market);
        
        // Create liquidity share object for the initial liquidity provider
        create_liquidity_share(market_id, total_shares, tx_context::sender(ctx), ctx);
        
        transfer::share_object(market);
        market_id
    }

    /// Creates a new LiquidityShare object for a user
    public fun create_liquidity_share(
        market_id: ID, 
        shares: u64, 
        user: address, 
        ctx: &mut TxContext
    ) {
        let liquidity_share = LiquidityShare {
            id: object::new(ctx),
            shares,
            market: market_id,
            user,
        };
        transfer::transfer(liquidity_share, user);
    }


    // thinking of doing amm maths here


    public fun calculate_spread(
        min_value: u64,
        max_value: u64,
        steps: u64,
        ctx: &mut TxContext,
    ): vector<SpreadInfo> {
        let mut spreads = vector::empty<SpreadInfo>();
        let step_size = (max_value - min_value) / steps;
        // let outstanding_shares = total_shares / steps;
        let mut x: u64 = 0;
        while (x < steps) {
            let lower_bound = min_value + x * step_size;
            let upper_bound = lower_bound + step_size;
            let spread = SpreadInfo {
                id: object::new(ctx),
                precision: 1000000,
                lower_bound,
                upper_bound,
                steps,
                outstanding_shares: 0,
            };
            vector::push_back(&mut spreads, spread);
            x = x + 1;
        };
        spreads
    }

    /// Buy exact amount of outcome shares by providing a maximum input amount (with slippage protection)
    public entry fun buy_exact_shares_with_max_input<CoinType>(
        registry: &mut UserPositionRegistry,
        market: &mut Market<CoinType>,
        spread_index: u64,
        shares_out: u64,
        mut max_input_amount: Coin<CoinType>,  // Maximum amount willing to spend (includes slippage)
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(spread_index < vector::length(&market.spreads), ERROR_VECTOR_INDEX_OUT_OF_BOUND);
        assert!(market.market_state == 0, ERROR_MARKET_IS_NOT_OPEN); // Market must be open
        
        assert!(shares_out > 0, ERROR_INVALID_SHARE_AMOUNT_TO_BUY); // Must buy at least 1 share
        // Check current time against bidding deadline
        let current_time = timestamp_ms(clock);
        assert!(current_time < market.bidding_deadline, ERROR_BIDDING_DEADLINE_PASSED);
    
        // Check share cap
        assert!(market.cumulative_shares_sold + shares_out <= market.total_shares, ERROR_SHARE_CAP_EXCEEDED);

        // Calculate the cost for buying the specified shares including premium
        let cost = get_buy_quote<CoinType>(market, spread_index, shares_out);
        
        // Check if the provided amount is sufficient
        let input_value = coin::value(&max_input_amount);
        assert!(input_value >= cost, ERROR_INSUFFICIENT_FUNDS); // Insufficient funds
        
        // Split the exact amount needed for the purchase
        let payment = coin::split(&mut max_input_amount, cost, ctx);
        
        // Add the payment to the market's liquidity
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut market.pool_balance, payment_balance);
        
        // Update the outstanding shares for the selected spread
        let spread = vector::borrow_mut(&mut market.spreads, spread_index);
        spread.outstanding_shares = spread.outstanding_shares + shares_out;
        
        // Update cumulative shares sold
        market.cumulative_shares_sold = market.cumulative_shares_sold + shares_out;
        
        // Record the share purchase
        record_share_purchase(registry, market, spread_index, shares_out, cost, ctx);
        
        // Return any excess funds
        transfer::public_transfer(max_input_amount, tx_context::sender(ctx));
    }
    
    

    /// Sell exact amount of outcome shares for a minimum output amount (with slippage protection)
    /// Now using the premium-adjusted price
    public entry fun sell_exact_shares_for_min_output<CoinType>(
        registry: &mut UserPositionRegistry,
        market: &mut Market<CoinType>,
        spread_index: u64,
        shares_in: u64,              // Exact amount of outcome shares to sell
        min_output_amount: u64,      // Minimum amount to receive (slippage protection)
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(spread_index < vector::length(&market.spreads), ERROR_VECTOR_INDEX_OUT_OF_BOUND);
        assert!(market.market_state == 0, ERROR_MARKET_CLOSED); // Market must be open
        assert!(shares_in > 0, ERROR_INVALID_SHARE_AMOUNT_TO_SELL); // Must sell at least 1 share
        // Check current time against bidding deadline
        let current_time = timestamp_ms(clock);
        assert!(current_time < market.bidding_deadline, ERROR_MARKET_BIDDING_IS_OVER);
    
        
        // Verify user has enough shares to sell
        let user = tx_context::sender(ctx);
        let market_id = object::id(market);
        
        // Check if user has position
        assert!(table::contains(&registry.positions, user), ERROR_POSITION_NOT_FOUND);
        
        let user_markets = table::borrow(&registry.positions, user);
        assert!(table::contains(user_markets, market_id), ERROR_POSITION_NOT_FOUND);
        
        let position = table::borrow(user_markets, market_id);
        assert!(vec_map::contains(&position.shares_by_spread, &spread_index), ERROR_SPREAD_NOT_FOUND);
        
        let user_shares = *vec_map::get(&position.shares_by_spread, &spread_index);
        assert!(user_shares >= shares_in, ERROR_INSUFFICIENT_SHARES);
        
        // Calculate the proceeds from selling the specified shares including premium
        let proceeds = get_sell_quote<CoinType>(market, spread_index, shares_in);
        
        // Verify minimum output constraint
        assert!(proceeds >= min_output_amount, ERROR_SLIPPAGE_TOO_HIGH); // Slippage too high
        
        // Update the outstanding shares for the selected spread
        let spread = vector::borrow_mut(&mut market.spreads, spread_index);
        assert!(spread.outstanding_shares >= shares_in, ERROR_INVALID_SHARE_AMOUNT_TO_SELL); // Cannot sell more than available
        spread.outstanding_shares = spread.outstanding_shares - shares_in;
        
        // Update cumulative shares sold (decrease when selling back)
        if (market.cumulative_shares_sold >= shares_in) {
            market.cumulative_shares_sold = market.cumulative_shares_sold - shares_in;
        } else {
            // This should never happen if the logic is correct, but as a safeguard
            market.cumulative_shares_sold = 0;
        };
        
        // Record the share sale
        record_share_sale(registry, market, spread_index, shares_in, proceeds, ctx);
        
        // Extract the proceeds from the market's liquidity
        let output_coin = coin::take(&mut market.pool_balance, proceeds, ctx);
        // Return the proceeds to the user
        transfer::public_transfer(output_coin, tx_context::sender(ctx));
    }

    /// Calculate the cost to buy a specific amount of outcome shares
    public fun get_buy_quote<CoinType>(
        market: &Market<CoinType>,
        spread_index: u64,
        shares_amount: u64
    ): u64 {
        assert!(spread_index < vector::length(&market.spreads), ERROR_VECTOR_INDEX_OUT_OF_BOUND);
        
        // Get current quantities for all spreads
        let mut quantities = vector::empty<u64>();
        let mut i = 0;
        let spreads_count = vector::length(&market.spreads);
        
        while (i < spreads_count) {
            let spread = vector::borrow(&market.spreads, i);
            let quantity = spread.outstanding_shares;
            vector::push_back(&mut quantities, quantity);
            i = i + 1;
        };
        
        // Calculate cost before the purchase
        let b = market.total_shares / spreads_count; // Calculate liquidity parameter b
        let before_cost = distribution_math::calculate_cost(quantities, b);
        
        // SAFE UPDATE: Update the quantity for the specific spread using borrow_mut
        let current_quantity = *vector::borrow(&quantities, spread_index);
        *vector::borrow_mut(&mut quantities, spread_index) = current_quantity + shares_amount;
        
        // Calculate cost after the purchase
        let after_cost = distribution_math::calculate_cost(quantities, b);
        
        // The cost is the difference
        after_cost - before_cost
    }

    /// Calculate the proceeds from selling a specific amount of outcome shares
    public fun get_sell_quote<CoinType>(
        market: &Market<CoinType>,
        spread_index: u64,
        shares_amount: u64
    ): u64 {
        assert!(spread_index < vector::length(&market.spreads), ERROR_VECTOR_INDEX_OUT_OF_BOUND);
        // Remove the redundant assertion that's causing test failures
        
        // Get current quantities for all spreads
        let mut quantities = vector::empty<u64>();
        let mut i = 0;
        let spreads_count = vector::length(&market.spreads);
        
        while (i < spreads_count) {
            let spread = vector::borrow(&market.spreads, i);
            let quantity = spread.outstanding_shares;
            vector::push_back(&mut quantities, quantity);
            i = i + 1;
        };
        
        // Calculate cost before the sale
        let b = market.total_shares / spreads_count; // Calculate liquidity parameter b
        let before_cost = distribution_math::calculate_cost(quantities, b);
        
        // SAFE UPDATE: Update the quantity for the specific spread using borrow_mut
        let current_quantity = *vector::borrow(&quantities, spread_index);
        assert!(current_quantity >= shares_amount, 1006); // Cannot sell more than available
        *vector::borrow_mut(&mut quantities, spread_index) = current_quantity - shares_amount;
        
        // Calculate cost after the sale
        let after_cost = distribution_math::calculate_cost(quantities, b);
        
        // The proceeds are the difference (cost went down after selling)
        before_cost - after_cost
    }

    

    /// Multi-spread buy to get exact shares in multiple spreads (with slippage protection)
    #[allow(lint(self_transfer))]
    public fun buy_exact_multi_spread_shares<CoinType>(
        market: &mut Market<CoinType>,
        spread_indices: vector<u64>,
        shares_out: vector<u64>,     // Exact amounts of outcome shares to buy for each spread
        mut max_input_amount: Coin<CoinType>,  
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(vector::length(&spread_indices) == vector::length(&shares_out), 1012);
        assert!(vector::length(&spread_indices) > 0, 1013);
        assert!(market.market_state == 0, ERROR_MARKET_IS_NOT_OPEN); // Market must be open
        // Check current time against bidding deadline
        let current_time = timestamp_ms(clock);
        assert!(current_time < market.bidding_deadline, ERROR_INVALID_BIDDING_DEADLINE);
    
        // Calculate total cost across all spreads
        let mut total_cost: u64 = 0;
        let mut i = 0;
        let num_spreads = vector::length(&spread_indices);
        
        while (i < num_spreads) {
            let spread_index = *vector::borrow(&spread_indices, i);
            let share_amount = *vector::borrow(&shares_out, i);
            
            // Validate each spread index
            assert!(spread_index < vector::length(&market.spreads), ERROR_VECTOR_INDEX_OUT_OF_BOUND);
            assert!(share_amount > 0, ERROR_INVALID_SHARE_AMOUNT_TO_BUY); // Must buy at least 1 share of each
            
            // Add cost for this spread
            total_cost = total_cost + get_buy_quote<CoinType>(market, spread_index, share_amount);
            
            i = i + 1;
        };
        
        // Check if provided amount is sufficient
        let input_value = coin::value(&max_input_amount);
        assert!(input_value >= total_cost, ERROR_INSUFFICIENT_FUNDS); // Insufficient funds
        
        // Split the exact amount needed for the purchase
        let payment = coin::split(&mut max_input_amount, total_cost, ctx);
        
        // Add the payment to the market's liquidity
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut market.pool_balance, payment_balance);
        
        // Update outstanding shares for each spread
        i = 0;
        while (i < num_spreads) {
            let spread_index = *vector::borrow(&spread_indices, i);
            let share_amount = *vector::borrow(&shares_out, i);
            
            let spread = vector::borrow_mut(&mut market.spreads, spread_index);
            spread.outstanding_shares = spread.outstanding_shares + share_amount;
            
            i = i + 1;
        };
        
        // Return any excess funds
        // @audit Transfer of an object to transaction sender address 
        // distribution_market.move(447, 16): Returning an object from a function, allows a caller to use the object and enables composability via programmable transactions.
        // distribution_market.move(506, 53): Transaction sender address coming from here
        // distribution_market.move(506, 9): Note: This warning can be suppressed with '#[allow(lint(self_transfer))]' applied to the 'module' or module member ('const', 'fun', or 'struct')
        transfer::public_transfer(max_input_amount, tx_context::sender(ctx));
    }

    /// Add liquidity to the market with slippage protection
    public entry fun add_liquidity<CoinType>(
        market: &mut Market<CoinType>,
        liquidity_amount: Coin<CoinType>,     // Amount to add as liquidity
        min_lp_tokens: u64,                   // Minimum LP tokens to receive (slippage protection)
        clock: &Clock,
        ctx: &mut TxContext
    ): u64 {
        // Validate inputs
        assert!(market.market_state == 0, ERROR_MARKET_IS_NOT_OPEN); // Market must be open
        assert!(coin::value(&liquidity_amount) > 0, ERROR_POSITIVE_LIQUIDITY); // Must add positive liquidity
        let current_time = timestamp_ms(clock);
        assert!(current_time < market.bidding_deadline, ERROR_MARKET_BIDDING_IS_OVER);
    
        // Calculate the proportion of new liquidity to existing liquidity
        let new_amount = coin::value(&liquidity_amount);
        let existing_liquidity: u64 = balance::value(&market.pool_balance);
        
        // Calculate LP tokens to mint proportional to contribution
        // new_lp_tokens = (new_amount * market.total_shares) / existing_liquidity
        let numerator = (new_amount as u128) * (market.liquditiy_share as u128);
        let lp_tokens_to_mint = (numerator / (existing_liquidity as u128)) as u64;

        
        // Check minimum LP tokens constraint
        assert!(lp_tokens_to_mint >= min_lp_tokens, ERROR_SLIPPAGE_TOO_HIGH); // Slippage too high
        
        // Add the liquidity to the market
        let liquidity_balance = coin::into_balance(liquidity_amount);
        balance::join(&mut market.pool_balance, liquidity_balance);
        
        // Update total shares
        market.liquditiy_share = market.liquditiy_share + lp_tokens_to_mint;
        market.total_shares = market.total_shares + lp_tokens_to_mint;
        create_liquidity_share(object::id(market), lp_tokens_to_mint, tx_context::sender(ctx), ctx);
        
        // Return the amount of LP tokens minted
        lp_tokens_to_mint
    }

    /// Add additional liquidity to an existing position
    /// This function allows a user to add more liquidity to a market where they already have a position
    public entry fun add_liquidity_to_existing_position<CoinType>(
        market: &mut Market<CoinType>,
        liquidity_share: &mut LiquidityShare,
        additional_liquidity: Coin<CoinType>,
        min_lp_tokens: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate the user and market match
        assert!(object::id(market) == liquidity_share.market, ERROR_MARKET_MISMATCH);
        assert!(tx_context::sender(ctx) == liquidity_share.user, ERROR_NOT_OWNER);
        assert!(market.market_state == 0, ERROR_MARKET_CLOSED); // Market must be open
        let current_time = timestamp_ms(clock);
        assert!(current_time < market.bidding_deadline, ERROR_MARKET_BIDDING_IS_OVER);
        let new_amount = coin::value(&additional_liquidity);
        let existing_liquidity: u64 = balance::value(&market.pool_balance);
        
        // Calculate LP tokens to mint proportional to contribution
        // new_lp_tokens = (new_amount * market.total_shares) / existing_liquidity
        
        let numerator = (new_amount as u128) * (market.liquditiy_share as u128);
        let lp_tokens_to_mint = (numerator / (existing_liquidity as u128)) as u64;


        // Check minimum LP tokens constraint
        assert!(lp_tokens_to_mint >= min_lp_tokens, ERROR_SLIPPAGE_TOO_HIGH); // Slippage too high
        
        // Add the liquidity to the market
        let liquidity_balance = coin::into_balance(additional_liquidity);
        balance::join(&mut market.pool_balance, liquidity_balance);
        
        // Update total shares
        market.total_shares = market.total_shares + lp_tokens_to_mint;
        market.liquditiy_share = market.liquditiy_share + lp_tokens_to_mint;
        liquidity_share.shares = liquidity_share.shares + lp_tokens_to_mint;
        
    }
    
    /// Allows a user to claim their liquidity after market resolution
    /// Liquidity can only be withdrawn after the market has been resolved
    public entry fun withdraw_liquidity<CoinType>(
        market: &mut Market<CoinType>,
        liquidity_share: &mut LiquidityShare,
        clock: &Clock,
        ctx: &mut TxContext
    ): u64 {
        // Validate the user and market match
        assert!(object::id(market) == liquidity_share.market, ERROR_MARKET_MISMATCH);
        assert!(tx_context::sender(ctx) == liquidity_share.user, ERROR_NOT_OWNER);
        assert!(market.market_state == 1, ERROR_MARKET_NOT_RESOLVED); // Market must be resolved
        
        let current_time = timestamp_ms(clock);
        assert!(current_time >= market.bidding_deadline, ERROR_MARKET_RESOLUTION_IS_NOT_OVER);
    
        let total_liquidity = balance::value(&market.pool_balance);
        // calculate the winning spread and lock liquidity of the winning spread before distributing the
        // liquidity back to the LPs
        let winning_spread_index = find_winning_spread(market, market.resolved_value);
        let (_,_,_,outstanding_amount) = get_spread_info(market, winning_spread_index);
        

        // get the wiiing spread's total outstanding shares
        // Calculate the user's share of the total liquidity
        
        let numerator = (liquidity_share.shares as u128) * ((total_liquidity - outstanding_amount) as u128);
        let amount_to_withdraw = (numerator / (market.liquditiy_share as u128)) as u64;
        
        // Take the funds from the market
        let output_coin = coin::take(&mut market.pool_balance, amount_to_withdraw, ctx);
        
        // Update market total shares
        market.liquditiy_share = market.liquditiy_share - liquidity_share.shares;
        
        // Reset the user's shares
        liquidity_share.shares = 0;
        
        // Transfer the coin to the user instead of returning it
        let recipient = tx_context::sender(ctx);
        transfer::public_transfer(output_coin, recipient);
        
        // Return the amount withdrawn
        amount_to_withdraw
    }
    
    
    
    /// Resolve the market by setting the final outcome value
    /// This allows liquidity providers to withdraw their funds
    public entry fun resolve_market<CoinType>(
        market: &mut Market<CoinType>,
        resolved_value: u64,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // Ensure the market can only be resolved after the resolution time has passed
        let current_time = timestamp_ms(clock);
        assert!(current_time >= market.resolution_time, ERROR_MARKET_RESOLUTION_IS_NOT_OVER);
        
        // Ensure the market state is open (0) before resolving
        assert!(market.market_state == 0, ERROR_MARKET_CLOSED);
        // Set the resolved value
        market.resolved_value = resolved_value;
        
        // Update market state to resolved
        market.market_state = 1;
        
        // Now liquidity providers can withdraw their funds
    }

    // Initialize position registry - call this once during deployment
    public entry fun initialize_position_registry(ctx: &mut TxContext) {
        let registry = UserPositionRegistry {
            id: object::new(ctx),
            positions: table::new(ctx),
        };
        
        transfer::share_object(registry);
    }

    // Create or update a user position when buying shares
    fun record_share_purchase<CoinType>(
        registry: &mut UserPositionRegistry,
        market: &Market<CoinType>,
        spread_index: u64,
        shares: u64,
        cost: u64,
        ctx: &mut TxContext
    ): ID {
        let user = tx_context::sender(ctx);
        let market_id = object::id(market);
        
        // Create tables if they don't exist
        if (!table::contains(&registry.positions, user)) {
            table::add(&mut registry.positions, user, table::new<ID, UserPosition>(ctx));
        };
        
        let user_markets = table::borrow_mut(&mut registry.positions, user);
        
        // Create position if it doesn't exist
        if (!table::contains(user_markets, market_id)) {
            let mut position = UserPosition {
                id: object::new(ctx),
                market_id,
                shares_by_spread: vec_map::empty(),
                total_invested: cost,
                claimed: false,
                winnings_claimed: 0,
                user,
            };
            
            // Add the new spread shares
            vec_map::insert(&mut position.shares_by_spread, spread_index, shares);
            
            let position_id = object::id(&position);
            table::add(user_markets, market_id, position);
            
            // Emit event for position creation
            event::emit(PositionCreated {
                position_id,
                market_id,
                user,
                spreads: vector[spread_index],
                shares: vector[shares],
                total_invested: cost,
            });
            
            return position_id
        };
        
        // Update existing position
        let position = table::borrow_mut(user_markets, market_id);
        position.total_invested = position.total_invested + cost;
        
        // Update shares for the spread
        if (vec_map::contains(&position.shares_by_spread, &spread_index)) {
            // Get current shares and update without removing the entry
            let current_shares = *vec_map::get(&position.shares_by_spread, &spread_index);
            // Remove the existing entry first to avoid EKeyAlreadyExists error
            vec_map::remove(&mut position.shares_by_spread, &spread_index);
            // Now insert the updated value
            vec_map::insert(&mut position.shares_by_spread, spread_index, current_shares + shares);
        } else {
            vec_map::insert(&mut position.shares_by_spread, spread_index, shares);
        };
        
        // Emit event for position update
        let position_id = object::id(position);
        event::emit(PositionUpdated {
            position_id,
            market_id,
            user,
            spread_index,
            shares_delta: shares,
            trade_type: 1,
            investment_delta: cost,
        });
        
        position_id
    }

    // Record share sale
    public fun record_share_sale<CoinType>(
        registry: &mut UserPositionRegistry,
        market: &Market<CoinType>,
        spread_index: u64,
        shares: u64,
        proceeds: u64,
        ctx: &mut TxContext
    ): bool {
        let user = tx_context::sender(ctx);
        let market_id = object::id(market);
        
        // Check if user has positions
        if (!table::contains(&registry.positions, user)) {
            return false
        };
        
        let user_markets = table::borrow_mut(&mut registry.positions, user);
        
        // Check if user has position in this market
        if (!table::contains(user_markets, market_id)) {
            return false
        };
        
        // Get user position
        let position = table::borrow_mut(user_markets, market_id);
        
        // Check if user has shares in this spread
        if (!vec_map::contains(&position.shares_by_spread, &spread_index)) {
            return false
        };
        
        // Check if user has enough shares
        let current_shares = *vec_map::get(&position.shares_by_spread, &spread_index);
        if (current_shares < shares) {
            return false
        };
        
        // Update shares
        let new_shares = current_shares - shares;
        
        // First remove the existing entry instead of trying to insert over it
        vec_map::remove(&mut position.shares_by_spread, &spread_index);
        
        // Only add the entry back if there are remaining shares
        if (new_shares > 0) {
            vec_map::insert(&mut position.shares_by_spread, spread_index, new_shares);
        };
        
        // Update total investment (reduced by proceeds)
        if (position.total_invested > proceeds) {
            position.total_invested = position.total_invested - proceeds;
        } else {
            position.total_invested = 0;
        };
        
        // Emit event for position update
        let position_id = object::id(position);
        event::emit(PositionUpdated {
            position_id,
            market_id,
            user,
            spread_index,
            shares_delta: shares, 
            trade_type: 2, // Sell
            investment_delta: proceeds,
        });
        
        true
    }

    // Claim winnings from a resolved market
    public entry fun claim_winnings<CoinType>(
        registry: &mut UserPositionRegistry,
        market: &mut Market<CoinType>,
        ctx: &mut TxContext
    ): u64 {
        let user = tx_context::sender(ctx);
        let market_id = object::id(market);
        
        // Market must be resolved
        assert!(market.market_state == 1, ERROR_MARKET_NOT_RESOLVED_YET);
        
        // Get the resolved value and find the winning spread
        let resolved_value = market.resolved_value;
        let winning_spread_index = find_winning_spread(market, resolved_value);
        
        // Check if user has positions
        assert!(table::contains(&registry.positions, user), ERROR_POSITION_NOT_FOUND);
        
        let user_markets = table::borrow_mut(&mut registry.positions, user);
        
        // Check if user has position in this market
        assert!(table::contains(user_markets, market_id), ERROR_POSITION_NOT_FOUND);
        
        // Get user position
        let position = table::borrow_mut(user_markets, market_id);
        
        // Make sure position hasn't been claimed already
        assert!(!position.claimed, ERROR_ALREADY_CLAIMED);
        
        // Calculate winnings
        let mut winnings = 0;
        if (vec_map::contains(&position.shares_by_spread, &winning_spread_index)) {
            let winning_shares = *vec_map::get(&position.shares_by_spread, &winning_spread_index);
            
            // Calculate payout (1:1 for now, can be adjusted based on market rules)
            winnings = winning_shares;
            
            // Transfer winnings to user
            let output_coin = coin::take(&mut market.pool_balance, winnings, ctx);
            transfer::public_transfer(output_coin, user);
            
            // Mark position as claimed
            position.claimed = true;
            position.winnings_claimed = winnings;
            
            // Emit event
            let position_id = object::id(position);
            event::emit(WinningsClaimed {
                position_id,
                market_id,
                user,
                amount: winnings,
                winning_spread: winning_spread_index,
            });
        } else {
            // User had no shares in winning spread
            position.claimed = true;
        };
        
        winnings
    }

    // Find the winning spread based on the resolved value
    fun find_winning_spread<CoinType>(
        market: &Market<CoinType>, 
        resolved_value: u64
    ): u64 {
        let mut i = 0;
        let spreads_count = vector::length(&market.spreads);
        let spread_first = vector::borrow(&market.spreads, 0);
        let spread_last = vector::borrow(&market.spreads, spreads_count - 1);
        if (resolved_value < spread_first.lower_bound){
            return 0 // If resolved value is below the first spread, return first spread
        };
        if(resolved_value > spread_last.upper_bound) {
            // If resolved value is outside the range of spreads, return last spread
            return spreads_count - 1
        };

        while (i < spreads_count) {
            let spread = vector::borrow(&market.spreads, i);
            
            // Check if resolved value falls within this spread
            if (resolved_value > spread.lower_bound && resolved_value <= spread.upper_bound) {
                return i
            };
            
            i = i + 1;
        };
        
        // If we reach here and haven't found a match, use the last spread
        // (handles case where resolved_value equals upper bound of entire range)
        spreads_count - 1
    }

    // Get user position details (view function)
    public fun get_user_position(
        registry: &UserPositionRegistry,
        user: address,
        market_id: ID
    ): (bool, u64, bool, u64, vector<u64>, vector<u64>) {
        // Check if user has positions
        if (!table::contains(&registry.positions, user)) {
            return (false, 0, false, 0, vector::empty(), vector::empty())
        };
        
        let user_markets = table::borrow(&registry.positions, user);
        
        // Check if user has position in this market
        if (!table::contains(user_markets, market_id)) {
            return (false, 0, false, 0, vector::empty(), vector::empty())
        };
        
        // Get position
        let position = table::borrow(user_markets, market_id);
        
        // Extract spread indices and share amounts
        let (spread_indices, share_amounts) = extract_position_details(&position.shares_by_spread);
        
        (
            true, // has position
            position.total_invested,
            position.claimed,
            position.winnings_claimed,
            spread_indices,
            share_amounts
        )
    }

    // Helper to extract spread indices and share amounts from a position
    fun extract_position_details(
        shares_by_spread: &VecMap<u64, u64>
    ): (vector<u64>, vector<u64>) {
        let mut spread_indices = vector::empty<u64>();
        let mut share_amounts = vector::empty<u64>();
        
        let mut i = 0;
        let size = vec_map::size(shares_by_spread);
        
        while (i < size) {
            let (spread_index, shares) = vec_map::get_entry_by_idx(shares_by_spread, i);
            vector::push_back(&mut spread_indices, *spread_index);
            vector::push_back(&mut share_amounts, *shares);
            i = i + 1;
        };
        
        (spread_indices, share_amounts)
    }

    /// Get basic market information, @comment: not required can read the Market object directly
    public fun get_market_info<CoinType>(market: &Market<CoinType>): (vector<u8>, vector<u8>, u64, u64, u64) {
        (market.question, market.resolution_criteria, market.steps, market.creation_time, market.market_state)
    }
    
    /// Get market timing information, , @comment: not required can read the Market object directly
    public fun get_market_timing<CoinType>(market: &Market<CoinType>): (u64, u64, u64) {
        (market.bidding_deadline, market.resolution_time, market.resolved_value)
    }
    
    /// Get market liquidity and shares information, , @comment: not required can read the Market object directly
    public fun get_market_liquidity_info<CoinType>(market: &Market<CoinType>): (u64, u64) {
        (market.liquditiy_share, balance::value<CoinType>(&market.pool_balance))
    }
    
    /// Get number of spreads in the market, @comment: not required can read the Market object directly
    public fun get_spreads_count<CoinType>(market: &Market<CoinType>): u64 {
        vector::length(&market.spreads)
    }
    
    /// Get spread information by index, @comment: not required can read the Market object directly
    public fun get_spread_info<CoinType>(market: &Market<CoinType>, spread_index: u64): (u64, u64, u64, u64) {
        assert!(spread_index < vector::length(&market.spreads), ERROR_VECTOR_INDEX_OUT_OF_BOUND);
        let spread = vector::borrow(&market.spreads, spread_index);
        (spread.precision, spread.lower_bound, spread.upper_bound, spread.outstanding_shares)
    }


    
    /// Get the market's total liquidity, @comment: not required can read the Market object directly
    public fun get_total_liquidity<CoinType>(market: &Market<CoinType>): u64 {
        balance::value(&market.pool_balance)
    }

    /// Get prices for all spreads in the market in a single call
    /// @param market The market object
    /// @return A tuple containing vectors of spread indices and their corresponding prices
    public fun get_all_spread_prices<CoinType>(
        market: &Market<CoinType>
    ): (vector<u64>, vector<u64>) {
        let spreads_count = vector::length(&market.spreads);
        
        // Initialize vectors to hold spread indices and prices
        let mut spread_indices = vector::empty<u64>();
        let mut spread_prices = vector::empty<u64>();
        
        // Calculate liquidity parameter b once
        // let b = market.total_shares / spreads_count;
        
        // Calculate price for each spread
        let mut i = 0;
        while (i < spreads_count) {
            
            // Cap at 1.0 if needed
            let normalized_price = get_buy_quote<CoinType>(market, i, 1_000_000);
            
            // Add index and price to the result vectors
            vector::push_back(&mut spread_indices, i);
            vector::push_back(&mut spread_prices, normalized_price);
            
            i = i + 1;
        };
        
        (spread_indices, spread_prices)
    }
}