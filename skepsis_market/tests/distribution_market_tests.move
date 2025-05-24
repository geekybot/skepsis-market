// #[test_only]
module skepsis_market::distribution_market_tests {
    use sui::test_scenario::{next_tx, ctx};
    use sui::coin::{mint_for_testing as mint};
    use sui::clock;
    use std::debug::print;

    public struct TestCoin {}

    #[test]
    fun test_market_creation_and_liquidity() {
        let owner = @0x1;
        let mut scenario_val = sui::test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        next_tx(scenario, owner);
        {
            let liquidity = mint<TestCoin>(1_000_000_000, ctx(scenario));
            let question = vector[77, 97, 114, 107, 101, 116, 32, 67, 114, 101, 97, 116, 105, 111, 110]; // "Market Creation"
            let resolution_criteria = vector[82, 101, 115, 111, 108, 117, 116, 105, 111, 110]; // "Resolution"
            let lower_bound = 0;
            let upper_bound = 100;
            let steps = 10;
            let resolution_time = 2000;
            let bidding_deadline = 1500;
            let mut clock_obj = clock::create_for_testing(ctx(scenario));
            clock::set_for_testing(&mut clock_obj, 1000);
            let _market_id = skepsis_market::distribution_market::create_market<TestCoin>(
                question,
                resolution_criteria,
                lower_bound,
                upper_bound,
                steps,
                resolution_time,
                bidding_deadline,
                liquidity,
                &clock_obj,
                ctx(scenario)
            );
            clock::destroy_for_testing(clock_obj);
            // If no abort, test passes
            assert!(true, 0);
        };
        
        // Next transaction to verify market state and liquidity shares
        next_tx(scenario, owner);
        {
            // Take the created market from shared objects
            let market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            
            // Test market data - verify the market was created with correct parameters
            let (question, resolution_criteria, steps, creation_time, market_state) = skepsis_market::distribution_market::get_market_info(&market);
            assert!(vector::length(&question) > 0, 2); // Question should not be empty
            assert!(vector::length(&resolution_criteria) > 0, 3); // Resolution criteria should not be empty
            assert!(steps == 10, 4); // Should have 10 steps
            assert!(creation_time == 1000, 5); // Should match clock time
            assert!(market_state == 0, 6); // Should be open (0)
            
            // Test market timing information
            let (bidding_deadline, resolution_time, resolved_value) = skepsis_market::distribution_market::get_market_timing(&market);
            assert!(bidding_deadline == 1500, 7);
            assert!(resolution_time == 2000, 8);
            assert!(resolved_value == 0, 9); // Should be 0 for unresolved market
            
            // Test market liquidity information
            let (total_shares, cumulative_shares_sold) = skepsis_market::distribution_market::get_market_liquidity_info(&market);
            assert!(total_shares == 1_000_000_000, 10); // Should equal initial liquidity
            assert!(cumulative_shares_sold == 0, 11); // No shares sold yet
            
            // Test that spreads were created correctly
            let spreads_count = skepsis_market::distribution_market::get_spreads_count(&market);
            assert!(spreads_count == 10, 12); // Should have 10 spreads
            
            // Test first spread (0-10 range)
            let (precision, lower_bound, upper_bound, outstanding_shares) = skepsis_market::distribution_market::get_spread_info(&market, 0);
            assert!(precision == 1000000, 13); // Default precision
            assert!(lower_bound == 0, 14); // First spread starts at 0
            assert!(upper_bound == 10, 15); // First spread ends at 10 (100/10 = 10)
            assert!(outstanding_shares == 0, 16); // No outstanding shares initially
            
            // Test last spread (90-100 range)
            let (precision2, lower_bound2, upper_bound2, outstanding_shares2) = skepsis_market::distribution_market::get_spread_info(&market, 9);
            assert!(precision2 == 1000000, 17);
            assert!(lower_bound2 == 90, 18); // Last spread starts at 90
            assert!(upper_bound2 == 100, 19); // Last spread ends at 100
            assert!(outstanding_shares2 == 0, 20); // No outstanding shares initially
            
            // Test that liquidity shares were created for the owner
            let liquidity_share = sui::test_scenario::take_from_sender<skepsis_market::distribution_market::LiquidityShare>(scenario);
            
            // Verify liquidity share amount (should equal initial liquidity)
            let shares = skepsis_market::distribution_market::get_liquidity_shares(&liquidity_share);
            assert!(shares == 1_000_000_000, 21);
            
            // Verify market ID matches in liquidity share
            let market_id = sui::object::id(&market);
            let liquidity_market_id = skepsis_market::distribution_market::get_liquidity_share_market_id(&liquidity_share);
            assert!(market_id == liquidity_market_id, 22);
            
            // Verify liquidity share user is the owner
            let liquidity_user = skepsis_market::distribution_market::get_liquidity_share_user(&liquidity_share);
            assert!(liquidity_user == owner, 23);
            
            // Return objects back to scenario
            sui::test_scenario::return_to_sender(scenario, liquidity_share);
            sui::test_scenario::return_shared(market);
        };
        
        sui::test_scenario::end(scenario_val);
    }

    #[test]
    fun test_buy_sell_shares() {
        use std::debug;
        let owner = @0x1; // Liquidity provider
        let trader_a = @0x2;
        let trader_b = @0x3;
        let trader_c = @0x4;
        let mut scenario_val = sui::test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        
        // First initialize the registry
        next_tx(scenario, owner);
        {
            skepsis_market::distribution_market::initialize_position_registry(ctx(scenario));
        };
        
        // Create market with 1000 USDC liquidity (following example in specs)
        next_tx(scenario, owner);
        {
            let liquidity = mint<TestCoin>(1_000_000_000, ctx(scenario)); // 1,000 with 6 decimals
            let question = b"Temperature Distribution";
            let resolution_criteria = b"Final temperature on May 23";
            let lower_bound = 0;
            let upper_bound = 100;
            let steps = 10; // 10 spreads as in the example
            let resolution_time = 2000;
            let bidding_deadline = 1500;
            let mut clock_obj = clock::create_for_testing(ctx(scenario));
            clock::set_for_testing(&mut clock_obj, 1000);
            let _market_id = skepsis_market::distribution_market::create_market<TestCoin>(
                question,
                resolution_criteria,
                lower_bound,
                upper_bound,
                steps,
                resolution_time,
                bidding_deadline,
                liquidity,
                &clock_obj,
                ctx(scenario)
            );
            clock::destroy_for_testing(clock_obj);
        };
        
        // Trader A buys 10 tokens in Spread 3 (should cost ~1.5 USDC according to specs)
        next_tx(scenario, trader_a);
        {
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut registry = sui::test_scenario::take_shared<skepsis_market::distribution_market::UserPositionRegistry>(scenario);
            
            // Get initial price quote for buying 10 tokens
            let spread_index = 3; // Spread 3 (30-40 range)
            let shares_amount = 10_000_000; // 10 with 6 decimals precision
            
            // Get quote first to debug
            let cost = skepsis_market::distribution_market::get_buy_quote<TestCoin>(&market, spread_index, shares_amount);
            
            // Mint coins for the purchase with extra for slippage
            let coins = mint<TestCoin>(cost + 1_000_000, ctx(scenario)); // Add 1 token extra for slippage
            
            // Buy the shares
            let excess = skepsis_market::distribution_market::buy_exact_shares_with_max_input(
                &mut registry,
                &mut market,
                spread_index,
                shares_amount,
                coins,
                ctx(scenario)
            );
            
            sui::transfer::public_transfer(excess, trader_a);
            
            // Check user position
            let (has_position, total_invested, _, _, spread_indices, share_amounts) = 
                skepsis_market::distribution_market::get_user_position(&registry, trader_a, sui::object::id(&market));
            
            assert!(has_position, 107); // User should have a position
            
            sui::test_scenario::return_shared(registry);
            sui::test_scenario::return_shared(market);
        };
        
        // Trader B buys 20 tokens in Spread 5 (should cost ~3 USDC according to specs)
        next_tx(scenario, trader_b);
        {
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut registry = sui::test_scenario::take_shared<skepsis_market::distribution_market::UserPositionRegistry>(scenario);
            
            // Get initial price quote for buying 20 tokens
            let spread_index = 5; // Spread 5 (50-60 range)
            let shares_amount = 20_000_000; // 20 with 6 decimals precision
            
            // Get quote first to debug
            let cost = skepsis_market::distribution_market::get_buy_quote<TestCoin>(&market, spread_index, shares_amount);
            
            // Mint coins for the purchase with extra for slippage
            let coins = mint<TestCoin>(cost + 1_000_000, ctx(scenario)); // Add 1 token extra for slippage
            
            // Buy the shares
            let excess = skepsis_market::distribution_market::buy_exact_shares_with_max_input(
                &mut registry,
                &mut market,
                spread_index,
                shares_amount,
                coins,
                ctx(scenario)
            );
            
            sui::transfer::public_transfer(excess, trader_b);
            
            // Check user position
            let (has_position, total_invested, _, _, spread_indices, share_amounts) = 
                skepsis_market::distribution_market::get_user_position(&registry, trader_b, sui::object::id(&market));
            
            assert!(has_position, 150); // User should have a position
            
            sui::test_scenario::return_shared(registry);
            sui::test_scenario::return_shared(market);
        };
        // Trader A sells all remaining tokens to realize profits
        next_tx(scenario, trader_a);
        {
            //// // debug::print(&b"Trader C selling all remaining tokens");
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut registry = sui::test_scenario::take_shared<skepsis_market::distribution_market::UserPositionRegistry>(scenario);
            
            // Sell all remaining shares
            let spread_index = 3; // Spread 7 (70-80 range)
            // let sell_amount = 5_000_000; // 5 tokens with 6 decimals
            let (_,_,_,_,spread_indices, spread_amount) = skepsis_market::distribution_market::get_user_position(&registry, trader_a, object::id(&market)); // Get all shares
            let mut x = 0;
            while (x < vector::length(&spread_indices)) {
                if (*vector::borrow(&spread_indices, x) == spread_index) {
                    break;
                };
                x = x + 1;
            };
            let sell_amount = *vector::borrow(&spread_amount, 0); // Get amount of shares in spread 7
            debug::print(&b"Debug: Trader C selling shares in spread 7: ");
            debug::print(&sell_amount);
            
            // let sell_amount = *vector::borrow(&spread_amount, x); // Get amount of shares in spread 0
            // Get current sell quote for debugging
            let quote = skepsis_market::distribution_market::get_sell_quote<TestCoin>(&market, spread_index, sell_amount);
            //// // debug::print(&b"Debug: Expected proceeds for selling 5 tokens: ");
            //// // debug::print(&quote);
            
            // Set min output to 90% of expected to account for slippage
            let min_output = (quote * 90) / 100; // 90% of expected proceeds
            //// // debug::print(&b"Debug: Minimum output amount (with 10% slippage): ");
            //// // debug::print(&min_output);
            
            // Sell the shares
            let proceeds = skepsis_market::distribution_market::sell_exact_shares_for_min_output(
                &mut registry,
                &mut market,
                spread_index,
                sell_amount,
                min_output,
                ctx(scenario)
            );
            
            // Verify proceeds
            let proceeds_amount = sui::coin::value(&proceeds);
            //// // debug::print(&b"Debug: Actual proceeds received: ");
            //// // debug::print(&proceeds_amount);
            
            // Check if proceeds are at least the min_output amount
            assert!(proceeds_amount >= min_output, 250);
            
            sui::transfer::public_transfer(proceeds, trader_a);
            
            // Check user position after selling
            let (_, _, _, _, _, share_amounts) = 
                skepsis_market::distribution_market::get_user_position(&registry, trader_a, sui::object::id(&market));
            
            //// // debug::print(&b"Debug: Trader C remaining shares: ");
            //// // debug::print(vector::borrow(&share_amounts, 0));
            
            // Check that all shares have been sold
            // assert!(*vector::borrow(&share_amounts, 0) == 0, 251);
            
            sui::test_scenario::return_shared(registry);
            sui::test_scenario::return_shared(market);
        };

        sui::test_scenario::end(scenario_val);
    }
    
    #[test]
    fun test_lp_rewards_and_edge_cases() {
        use std::debug;
        
        let owner = @0x1; // Liquidity provider
        let trader_a = @0x2;
        let mut scenario_val = sui::test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        
        // First initialize the registry
        next_tx(scenario, owner);
        {
           //// // debug::print(&b"Initializing position registry");
            skepsis_market::distribution_market::initialize_position_registry(ctx(scenario));
        };
        
        // Create market with 1000 USDC liquidity
        next_tx(scenario, owner);
        {
           //// // debug::print(&b"Creating market with 1000 USDC liquidity");
            let liquidity = mint<TestCoin>(1_000_000_000, ctx(scenario)); // 1,000 with 6 decimals
            let question = b"Temperature Distribution";
            let resolution_criteria = b"Final temperature on May 23";
            let lower_bound = 0;
            let upper_bound = 100;
            let steps = 10; // 10 spreads as in the example
            let resolution_time = 2000;
            let bidding_deadline = 1500;
            let mut clock_obj = clock::create_for_testing(ctx(scenario));
            clock::set_for_testing(&mut clock_obj, 1000);
            let _market_id = skepsis_market::distribution_market::create_market<TestCoin>(
                question,
                resolution_criteria,
                lower_bound,
                upper_bound,
                steps,
                resolution_time,
                bidding_deadline,
                liquidity,
                &clock_obj,
                ctx(scenario)
            );
            clock::destroy_for_testing(clock_obj);
           // // debug::print(&b"Market created successfully");
        };
        
        // Add additional liquidity to the market from owner
        next_tx(scenario, owner);
        {
           // // debug::print(&b"Adding additional liquidity to the market");
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut liquidity_share = sui::test_scenario::take_from_sender<skepsis_market::distribution_market::LiquidityShare>(scenario);
            
            // Initial shares owned by the LP
            let initial_shares = skepsis_market::distribution_market::get_liquidity_shares(&liquidity_share);
           // // debug::print(&b"Initial LP shares: ");
           // // debug::print(&initial_shares);
            
            // Add additional 500 tokens as liquidity
            let additional_liquidity = mint<TestCoin>(500_000_000, ctx(scenario)); // 500 with 6 decimals
            let min_lp_tokens = 400_000_000; // Expect at least 400 LP tokens (80% of input)
            
            // Add liquidity to existing position
            skepsis_market::distribution_market::add_liquidity_to_existing_position<TestCoin>(
                &mut market,
                &mut liquidity_share,
                additional_liquidity,
                min_lp_tokens,
                ctx(scenario)
            );
            
            // Check new LP share balance
            let new_shares = skepsis_market::distribution_market::get_liquidity_shares(&liquidity_share);
           // // debug::print(&b"New LP shares after adding liquidity: ");
           // // debug::print(&new_shares);
            
            // Verify shares increased by approximately the provided liquidity
            // Since no trades happened yet, LP shares should increase roughly proportionally
            assert!(new_shares > initial_shares, 101);
            assert!(new_shares - initial_shares >= min_lp_tokens, 102);
            
            sui::test_scenario::return_to_sender(scenario, liquidity_share);
            sui::test_scenario::return_shared(market);
        };
        
        // Trader A buys a large amount of shares in Spread 3 (almost hitting the cap)
        next_tx(scenario, trader_a);
        {
           // // debug::print(&b"Trader A buying large amount of tokens in spread 3");
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut registry = sui::test_scenario::take_shared<skepsis_market::distribution_market::UserPositionRegistry>(scenario);
            
            // Check market share cap
            let (total_shares, _) = skepsis_market::distribution_market::get_market_liquidity_info(&market);
           // // debug::print(&b"Market total shares (cap): ");
           // // debug::print(&total_shares);
            
            // Buy shares up to 40% of the cap to demonstrate slippage
            let spread_index = 3; // Spread 3 (30-40 range)
            let shares_amount = total_shares * 40 / 100; // 40% of total shares
           // // debug::print(&b"Attempting to buy shares amount: ");
           // // debug::print(&shares_amount);
            
            // Get quote to see the price impact
            let trade_cost = skepsis_market::distribution_market::get_buy_quote<TestCoin>(&market, spread_index, shares_amount);
           // // debug::print(&b"Cost for large purchase: ");
           // // debug::print(&trade_cost);
            
            // Calculate effective price per token
            let price_per_token = trade_cost * 1_000_000 / shares_amount; // Using 6 decimal precision
           // // debug::print(&b"Effective price per token (slippage impact): ");
           // // debug::print(&price_per_token);
            
            // Mint coins for the purchase with extra for slippage
            let coins = mint<TestCoin>(trade_cost + 10_000_000, ctx(scenario)); // Add 10 token extra for safety
            
            // Buy the shares
            let excess = skepsis_market::distribution_market::buy_exact_shares_with_max_input(
                &mut registry,
                &mut market,
                spread_index,
                shares_amount,
                coins,
                ctx(scenario)
            );
            
            sui::transfer::public_transfer(excess, trader_a);
            
            // Check cumulative shares sold after the large purchase
            let (_, cumulative_shares_sold) = skepsis_market::distribution_market::get_market_liquidity_info(&market);
           // // debug::print(&b"Cumulative shares sold after large purchase: ");
           // // debug::print(&cumulative_shares_sold);
            assert!(cumulative_shares_sold == shares_amount, 103);
            
            sui::test_scenario::return_shared(registry);
            sui::test_scenario::return_shared(market);
        };
        
        // Resolve the market to check LP rewards
        next_tx(scenario, owner);
        {
           // // debug::print(&b"Resolving market");
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut clock_obj = clock::create_for_testing(ctx(scenario));
            
            // Set the time past the resolution deadline
            clock::set_for_testing(&mut clock_obj, 2100);
            
            // Resolve the market with a temperature of 35 degrees (spread 3 - 30-40 degrees)
            // This makes Trader A the winner
            skepsis_market::distribution_market::resolve_market<TestCoin>(&mut market, 35, ctx(scenario));
            
            clock::destroy_for_testing(clock_obj);
            sui::test_scenario::return_shared(market);
        };
        
        // Trader A claims their winnings
        next_tx(scenario, trader_a);
        {
           // // debug::print(&b"Trader A claiming winnings");
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut registry = sui::test_scenario::take_shared<skepsis_market::distribution_market::UserPositionRegistry>(scenario);
            
            let winnings = skepsis_market::distribution_market::claim_winnings<TestCoin>(
                &mut registry,
                &mut market,
                ctx(scenario)
            );
            
           // // debug::print(&b"Trader A claimed winnings: ");
           // // debug::print(&winnings);
            
            // Get total shares and verify the winnings amount matches their share purchase
            let (total_shares, _) = skepsis_market::distribution_market::get_market_liquidity_info(&market);
            let expected_winnings = total_shares * 40 / 100; // 40% of total shares
            assert!(winnings == expected_winnings, 104);
            
            sui::test_scenario::return_shared(registry);
            sui::test_scenario::return_shared(market);
        };
        
        // LP withdraws remaining liquidity after market resolution
        next_tx(scenario, owner);
        {
           // // debug::print(&b"LP withdrawing liquidity");
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut liquidity_share = sui::test_scenario::take_from_sender<skepsis_market::distribution_market::LiquidityShare>(scenario);
            
            // Withdraw liquidity
            let amount_withdrawn = skepsis_market::distribution_market::withdraw_liquidity(
                &mut market,
                &mut liquidity_share,
                ctx(scenario)
            );
            
           // // debug::print(&b"LP withdrew amount: ");
           // // debug::print(&amount_withdrawn);
            
            // Verify LP received some funds when withdrawing
            assert!(amount_withdrawn > 0, 105);
            
            // Verify liquidity share was reset to 0 after withdrawal
            let remaining_shares = skepsis_market::distribution_market::get_liquidity_shares(&liquidity_share);
            assert!(remaining_shares == 0, 106);
            
            sui::test_scenario::return_to_sender(scenario, liquidity_share);
            sui::test_scenario::return_shared(market);
        };
        
        sui::test_scenario::end(scenario_val);
    }
    
    #[test]
    #[expected_failure(abort_code = skepsis_market::distribution_market::ERROR_SHARE_CAP_EXCEEDED)]
    fun test_excessive_share_purchase_fails() {
        use std::debug;
        
        let owner = @0x1; // Liquidity provider
        let trader = @0x2;
        let mut scenario_val = sui::test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        
        // Initialize registry
        next_tx(scenario, owner);
        {
            skepsis_market::distribution_market::initialize_position_registry(ctx(scenario));
        };
        
        // Create market with 1000 USDC liquidity
        next_tx(scenario, owner);
        {
            let liquidity = mint<TestCoin>(1_000_000_000, ctx(scenario)); // 1,000 with 6 decimals
            let question = b"Temperature Distribution";
            let resolution_criteria = b"Final temperature on May 23";
            let lower_bound = 0;
            let upper_bound = 100;
            let steps = 10; // 10 spreads as in the example
            let resolution_time = 2000;
            let bidding_deadline = 1500;
            let mut clock_obj = clock::create_for_testing(ctx(scenario));
            clock::set_for_testing(&mut clock_obj, 1000);
            let _market_id = skepsis_market::distribution_market::create_market<TestCoin>(
                question,
                resolution_criteria,
                lower_bound,
                upper_bound,
                steps,
                resolution_time,
                bidding_deadline,
                liquidity,
                &clock_obj,
                ctx(scenario)
            );
            clock::destroy_for_testing(clock_obj);
        };
        
        // Trader attempts to buy more shares than the share cap allows
        next_tx(scenario, trader);
        {
            let mut market = sui::test_scenario::take_shared<skepsis_market::distribution_market::Market<TestCoin>>(scenario);
            let mut registry = sui::test_scenario::take_shared<skepsis_market::distribution_market::UserPositionRegistry>(scenario);
            
            // Get the total shares (cap)
            let (total_shares, _) = skepsis_market::distribution_market::get_market_liquidity_info(&market);
           // // debug::print(&b"Market total shares (cap): ");
           // // debug::print(&total_shares);
            
            // Try to buy more than the share cap
            let spread_index = 3;
            let shares_amount = total_shares + 1_000_000; // Exceed the cap by 1 token
           // // debug::print(&b"Attempting to buy shares exceeding cap: ");
           // // debug::print(&shares_amount);
            
            // This will get the quote but should fail on the actual purchase
            let cost = skepsis_market::distribution_market::get_buy_quote<TestCoin>(&market, spread_index, shares_amount);
            let coins = mint<TestCoin>(cost + 100_000_000, ctx(scenario)); // Plenty of funds
            
            // NOTE: For an #[expected_failure] test, we need a variable to receive the return value,
            // but we'll never reach the code after this function call anyway due to the expected abort
            let excess = skepsis_market::distribution_market::buy_exact_shares_with_max_input(
                &mut registry,
                &mut market,
                spread_index,
                shares_amount,
                coins,
                ctx(scenario)
            );
            
            // We won't reach here due to expected failure, but we need to handle the return value
            // to satisfy the Move type system
            sui::transfer::public_transfer(excess, trader);
            
            sui::test_scenario::return_shared(registry);
            sui::test_scenario::return_shared(market);
        };
        
        sui::test_scenario::end(scenario_val);
    }
}
