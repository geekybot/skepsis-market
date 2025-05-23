// #[test_only]
module skepsis_market::excess_shares_tests {
    use sui::test_scenario::{next_tx, ctx};
    use sui::coin::{mint_for_testing as mint};
    use sui::clock;

    public struct TestCoin {}

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
            let cost = skepsis_market::distribution_market::get_buy_quote_with_premium<TestCoin>(&market, spread_index, shares_amount);
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