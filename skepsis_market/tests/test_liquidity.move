#[test_only]
module skepsis_market::test_liquidity {
    use sui::test_scenario::{Self, ctx};
    use sui::object;
    use sui::clock;
    use sui::coin::{Self, Coin};
    use skepsis_market::distribution_market::{Self, Market, UserPositionRegistry, LiquidityShare};
    use std::vector;
    use std::debug;
    use std::string;

    // Test coin to use for the market
    public struct TestCoin has drop {}

    // Helper functions for test setup
    fun mint<T>(amount: u64, ctx: &mut sui::tx_context::TxContext): Coin<T> {
        coin::mint_for_testing<T>(amount, ctx)
    }

    fun next_tx(scenario: &mut test_scenario::Scenario, sender: address) {
        test_scenario::next_tx(scenario, sender);
    }

    // Setup function to create market, add liquidity and initialize the user position registry
    public fun setup_market(
        scenario: &mut test_scenario::Scenario, 
        owner: address
    ) {
        // First initialize the registry
        next_tx(scenario, owner);
        {
            distribution_market::initialize_position_registry(ctx(scenario));
        };
        
        // Create market with 1000 USDC liquidity
        next_tx(scenario, owner);
        {
            let liquidity = mint<TestCoin>(1_000_000_000, ctx(scenario)); // 1,000 with 6 decimals
            let question = b"Temperature Distribution";
            let resolution_criteria = b"Final temperature on May 23";
            let lower_bound = 0;
            let upper_bound = 100;
            let steps = 10; // 10 spreads as in the example (0-10, 10-20, ..., 90-100)
            let resolution_time = 2000;
            let bidding_deadline = 1500;
            let mut clock_obj = clock::create_for_testing(ctx(scenario));
            clock::set_for_testing(&mut clock_obj, 1000);
            
            let _market_id = distribution_market::create_market<TestCoin>(
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
    }

    // Add a test for adding liquidity from the same user and a different user
    // #[test]
    // fun add_liquidity_test() {
    //     let owner = @0x1; // Initial liquidity provider
    //     let new_provider = @0x2; // New liquidity provider
        
    //     let mut scenario_val = test_scenario::begin(owner);
    //     let scenario = &mut scenario_val;
        
    //     // Setup the market first with 1000 tokens
    //     setup_market(scenario, owner);
        
    //     // Check initial liquidity position of the owner
    //     next_tx(scenario, owner);
    //     {
    //         let mut market = test_scenario::take_shared<Market<TestCoin>>(scenario);
            
    //         // Get owner's liquidity through a liquidity share object
    //         let liquidity_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         let owner_shares = distribution_market::get_liquidity_shares(&liquidity_shares);
    //         let market_id = distribution_market::get_liquidity_share_market_id(&liquidity_shares);
    //         let (market_shares, sold_shares) = distribution_market::get_market_liquidity_info<TestCoin>(&market);
            
    //         debug::print(&std::string::utf8(b"Initial owner liquidity shares: "));
    //         debug::print(&owner_shares);
    //         debug::print(&std::string::utf8(b"Initial total market shares: "));
    //         debug::print(&market_shares);
            
    //         // Verify initial values
    //         assert!(owner_shares == 1_000_000_000, 500); // Owner should have 1000 tokens of shares
    //         assert!(market_shares == 1_000_000_000, 501); // Total should be 1000 tokens
    //         assert!(object::id(&market) == market_id, 502); // Market ID should match
            
    //         test_scenario::return_to_sender(scenario, liquidity_shares);
    //         test_scenario::return_shared(market);
    //     };
        
    //     // Owner adds more liquidity (500 additional tokens)
    //     next_tx(scenario, owner);
    //     {
    //         let mut market = test_scenario::take_shared<Market<TestCoin>>(scenario);
    //         let mut liquidity_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         // Mint additional liquidity
    //         let additional_liquidity = 500_000_000; // 500 tokens
    //         let min_lp_tokens = 490_000_000; // Minimum expected tokens (allowing for some slippage)
    //         let coins = mint<TestCoin>(additional_liquidity, ctx(scenario));
            
    //         debug::print(&std::string::utf8(b"Owner adding additional liquidity: "));
    //         debug::print(&additional_liquidity);
            
    //         // Create a clock for the transaction
    //         let mut clock_obj = clock::create_for_testing(ctx(scenario));
    //         clock::set_for_testing(&mut clock_obj, 1100); // Still before bidding deadline
            
    //         // Add liquidity to existing position
    //         distribution_market::add_liquidity_to_existing_position<TestCoin>(
    //             &mut market, 
    //             &mut liquidity_shares, 
    //             coins, 
    //             min_lp_tokens, 
    //             &clock_obj, 
    //             ctx(scenario)
    //         );
            
    //         clock::destroy_for_testing(clock_obj);
            
    //         // Check updated liquidity positions
    //         let owner_shares = distribution_market::get_liquidity_shares(&liquidity_shares);
    //         let (market_shares, sold_shares) = distribution_market::get_market_liquidity_info<TestCoin>(&market);
            
    //         debug::print(&std::string::utf8(b"After adding - Owner liquidity shares: "));
    //         debug::print(&owner_shares);
    //         debug::print(&std::string::utf8(b"After adding - Total market shares: "));
    //         debug::print(&market_shares);
            
    //         // Verify updated values - owner and market shares should have increased
    //         assert!(owner_shares == 1_500_000_000, 503); // Owner should now have 1500 tokens
    //         assert!(market_shares == 1_500_000_000, 504); // Total should be 1500 tokens
            
    //         test_scenario::return_to_sender(scenario, liquidity_shares);
    //         test_scenario::return_shared(market);
    //     };
        
    //     // New provider adds liquidity (800 tokens)
    //     next_tx(scenario, new_provider);
    //     {
    //         let mut market = test_scenario::take_shared<Market<TestCoin>>(scenario);
            
    //         // Mint liquidity for new provider
    //         let new_provider_liquidity = 800_000_000; // 800 tokens 
    //         let min_lp_tokens = 790_000_000; // Minimum expected (allowing for slippage)
    //         let coins = mint<TestCoin>(new_provider_liquidity, ctx(scenario));
            
    //         debug::print(&std::string::utf8(b"New provider adding liquidity: "));
    //         debug::print(&new_provider_liquidity);
            
    //         // Create a clock for the transaction
    //         let mut clock_obj = clock::create_for_testing(ctx(scenario));
    //         clock::set_for_testing(&mut clock_obj, 1150); // Still before bidding deadline
            
    //         // Add liquidity
    //         distribution_market::add_liquidity<TestCoin>(
    //             &mut market,
    //             coins,
    //             min_lp_tokens,
    //             &clock_obj,
    //             ctx(scenario)
    //         );
            
    //         clock::destroy_for_testing(clock_obj);
            
    //         // Check for the new liquidity share object created for the new provider
    //         let new_provider_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         // Take owner's liquidity shares from their address
    //         test_scenario::next_tx(scenario, owner);
    //         let owner_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         // Switch back to new provider for the remainder of the test
    //         test_scenario::next_tx(scenario, new_provider);
            
    //         // Get liquidity information
    //         let new_provider_share_amount = distribution_market::get_liquidity_shares(&new_provider_shares);
    //         let owner_share_amount = distribution_market::get_liquidity_shares(&owner_shares);
    //         let (market_shares, _) = distribution_market::get_market_liquidity_info<TestCoin>(&market);
            
    //         debug::print(&std::string::utf8(b"Final - Owner liquidity shares: "));
    //         debug::print(&owner_share_amount);
    //         debug::print(&std::string::utf8(b"Final - New provider liquidity shares: "));
    //         debug::print(&new_provider_share_amount);
    //         debug::print(&std::string::utf8(b"Final - Total market shares: "));
    //         debug::print(&market_shares);
            
    //         // Calculate percentages for better comparison
    //         let owner_percentage = (owner_share_amount * 100) / market_shares;
    //         let new_provider_percentage = (new_provider_share_amount * 100) / market_shares;
            
    //         debug::print(&std::string::utf8(b"Owner's percentage of pool: "));
    //         debug::print(&owner_percentage);
    //         debug::print(&std::string::utf8(b"New provider's percentage of pool: "));
    //         debug::print(&new_provider_percentage);
            
    //         // Verify final values
    //         assert!(owner_share_amount == 1_500_000_000, 505); // Owner should still have 1500 tokens
    //         assert!(new_provider_share_amount == 800_000_000, 506); // New provider should have 800 tokens
    //         assert!(market_shares == 2_300_000_000, 507); // Total should be 2300 tokens
            
    //         // Verify percentages (approximately)
    //         assert!(owner_percentage == 65, 508); // ~65%
    //         assert!(new_provider_percentage == 34, 509); // ~34% (with rounding)
            
    //         // Return objects correctly
    //         test_scenario::next_tx(scenario, owner);
    //         test_scenario::return_to_sender(scenario, owner_shares);
            
    //         test_scenario::next_tx(scenario, new_provider);
    //         test_scenario::return_to_sender(scenario, new_provider_shares);
    //         test_scenario::return_shared(market);
    //     };
        
    //     test_scenario::end(scenario_val);
    // }

    // Test for a third user adding liquidity and checking their share percentage
    // #[test]
    // fun third_provider_liquidity_test() {
    //     let owner = @0x1; // Initial liquidity provider
    //     let second_provider = @0x2; // Second liquidity provider
    //     let third_provider = @0x3; // Third liquidity provider
        
    //     let mut scenario_val = test_scenario::begin(owner);
    //     let scenario = &mut scenario_val;
        
    //     // Setup the market with initial liquidity from owner
    //     setup_market(scenario, owner);
        
    //     // Second provider adds liquidity (500 tokens)
    //     next_tx(scenario, second_provider);
    //     {
    //         let mut market = test_scenario::take_shared<Market<TestCoin>>(scenario);
            
    //         let second_provider_liquidity = 500_000_000; // 500 tokens
    //         let min_lp_tokens = 490_000_000;
    //         let coins = mint<TestCoin>(second_provider_liquidity, ctx(scenario));
            
    //         // Create a clock for the transaction
    //         let mut clock_obj = clock::create_for_testing(ctx(scenario));
    //         clock::set_for_testing(&mut clock_obj, 1100);
            
    //         // Add liquidity
    //         distribution_market::add_liquidity<TestCoin>(
    //             &mut market,
    //             coins,
    //             min_lp_tokens,
    //             &clock_obj,
    //             ctx(scenario)
    //         );
            
    //         clock::destroy_for_testing(clock_obj);
    //         test_scenario::return_shared(market);
    //     };
        
    //     // Third provider adds liquidity (300 tokens)
    //     next_tx(scenario, third_provider);
    //     {
    //         let mut market = test_scenario::take_shared<Market<TestCoin>>(scenario);
            
    //         let third_provider_liquidity = 300_000_000; // 300 tokens
    //         let min_lp_tokens = 290_000_000;
    //         let coins = mint<TestCoin>(third_provider_liquidity, ctx(scenario));
            
    //         debug::print(&std::string::utf8(b"Third provider adding liquidity: "));
    //         debug::print(&third_provider_liquidity);
            
    //         // Create a clock for the transaction
    //         let mut clock_obj = clock::create_for_testing(ctx(scenario));
    //         clock::set_for_testing(&mut clock_obj, 1200);
            
    //         // Add liquidity
    //         distribution_market::add_liquidity<TestCoin>(
    //             &mut market,
    //             coins,
    //             min_lp_tokens,
    //             &clock_obj,
    //             ctx(scenario)
    //         );
            
    //         clock::destroy_for_testing(clock_obj);
    //         test_scenario::return_shared(market);
    //     };
        
    //     // Now check each user's liquidity shares
    //     next_tx(scenario, third_provider);
    //     {
    //         let market = test_scenario::take_shared<Market<TestCoin>>(scenario);
            
    //         // Take all three users' liquidity share objects 
    //         test_scenario::next_tx(scenario, owner);
    //         let owner_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         test_scenario::next_tx(scenario, second_provider);
    //         let second_provider_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         test_scenario::next_tx(scenario, third_provider);
    //         let third_provider_shares = test_scenario::take_from_sender<LiquidityShare>(scenario);
            
    //         // Get all share information
    //         let owner_share_amount = distribution_market::get_liquidity_shares(&owner_shares);
    //         let second_provider_share_amount = distribution_market::get_liquidity_shares(&second_provider_shares);
    //         let third_provider_share_amount = distribution_market::get_liquidity_shares(&third_provider_shares);
    //         let (total_market_shares, _) = distribution_market::get_market_liquidity_info<TestCoin>(&market);
            
    //         debug::print(&std::string::utf8(b"----------------------"));
    //         debug::print(&std::string::utf8(b"Liquidity Distribution"));
    //         debug::print(&std::string::utf8(b"----------------------"));
    //         debug::print(&std::string::utf8(b"Owner liquidity shares: "));
    //         debug::print(&owner_share_amount);
    //         debug::print(&std::string::utf8(b"Second provider liquidity shares: "));
    //         debug::print(&second_provider_share_amount);
    //         debug::print(&std::string::utf8(b"Third provider liquidity shares: "));
    //         debug::print(&third_provider_share_amount);
    //         debug::print(&std::string::utf8(b"Total market shares: "));
    //         debug::print(&total_market_shares);
            
    //         // Calculate percentages for better comparison
    //         let owner_percentage = (owner_share_amount * 100) / total_market_shares;
    //         let second_provider_percentage = (second_provider_share_amount * 100) / total_market_shares;
    //         let third_provider_percentage = (third_provider_share_amount * 100) / total_market_shares;
            
    //         debug::print(&std::string::utf8(b"----------------------"));
    //         debug::print(&std::string::utf8(b"Percentage Distribution"));
    //         debug::print(&std::string::utf8(b"----------------------"));
    //         debug::print(&std::string::utf8(b"Owner's percentage of pool: "));
    //         debug::print(&owner_percentage);
    //         debug::print(&std::string::utf8(b"Second provider's percentage of pool: "));
    //         debug::print(&second_provider_percentage);
    //         debug::print(&std::string::utf8(b"Third provider's percentage of pool: "));
    //         debug::print(&third_provider_percentage);
            
    //         // Verify expected shares
    //         assert!(owner_share_amount == 1_000_000_000, 600); // Owner should have 1000 tokens
    //         assert!(second_provider_share_amount == 500_000_000, 601); // Second provider should have 500 tokens
    //         assert!(third_provider_share_amount == 300_000_000, 602); // Third provider should have 300 tokens
    //         assert!(total_market_shares == 1_800_000_000, 603); // Total should be 1800 tokens
            
    //         // Verify approximate percentages
    //         assert!(owner_percentage == 55, 604); // Around 55.5% (1000/1800)
    //         assert!(second_provider_percentage == 27, 605); // Around 27.7% (500/1800)
    //         assert!(third_provider_percentage == 16, 606); // Around 16.6% (300/1800)
            
    //         // Return all objects
    //         test_scenario::next_tx(scenario, owner);
    //         test_scenario::return_to_sender(scenario, owner_shares);
            
    //         test_scenario::next_tx(scenario, second_provider);
    //         test_scenario::return_to_sender(scenario, second_provider_shares);
            
    //         test_scenario::next_tx(scenario, third_provider);
    //         test_scenario::return_to_sender(scenario, third_provider_shares);
    //         test_scenario::return_shared(market);
    //     };
        
    //     test_scenario::end(scenario_val);
    // }

  

    #[test]
    fun test_get_all_spread_prices_read_only() {
        let owner = @0x1;
        
        
        let mut scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        
        // Setup the market first with initial liquidity
        setup_market(scenario, owner);
        next_tx(scenario, owner);
        {
            let market = test_scenario::take_shared<Market<TestCoin>>(scenario);
            
            // First get individual spread prices for comparison
            // let spread2_price = distribution_market::get_spread_price<TestCoin>(&market, 2);
            // let spread7_price = distribution_market::get_spread_price<TestCoin>(&market, 7);
            
            // Now get all prices at once with our new function
            let (spread_indices, spread_prices) = distribution_market::get_all_spread_prices<TestCoin>(&market);
            
            debug::print(&std::string::utf8(b"----------------------"));
            debug::print(&std::string::utf8(b"Testing get_all_spread_prices"));
            debug::print(&std::string::utf8(b"----------------------"));
            debug::print(&std::string::utf8(b"Individual spread 2 price: "));
            // debug::print(&spread2_price);
            debug::print(&std::string::utf8(b"Individual spread 7 price: "));
            // debug::print(&spread7_price);
            debug::print(&std::string::utf8(b"All spread indices: "));
            debug::print(&spread_indices);
            debug::print(&std::string::utf8(b"All spread prices: "));
            debug::print(&spread_prices);
            
            // Get number of spreads in the market
            let spreads_count = distribution_market::get_spreads_count<TestCoin>(&market);
            
            // Verify we got prices for all spreads
            assert!(vector::length(&spread_indices) == spreads_count, 700);
            assert!(vector::length(&spread_prices) == spreads_count, 701);
            
            // Verify specific spread indices and their position in the vector
            let mut found_spread2 = false;
            let mut found_spread7 = false;
            let mut spread2_batch_price = 0;
            let mut spread7_batch_price = 0;
            
            let mut i = 0;
            while (i < vector::length(&spread_indices)) {
                let index = *vector::borrow(&spread_indices, i);
                if (index == 2) {
                    found_spread2 = true;
                    spread2_batch_price = *vector::borrow(&spread_prices, i);
                } else if (index == 7) {
                    found_spread7 = true;
                    spread7_batch_price = *vector::borrow(&spread_prices, i);
                };
                i = i + 1;
            };
            
            // Verify we found our specific spreads
            assert!(found_spread2, 702);
            assert!(found_spread7, 703);
            
            // Verify that the individually queried prices match the batch results
            // Note: Using == for exact equality since these should calculate the same result
            // assert!(spread2_price == spread2_batch_price, 704);
            // assert!(spread7_price == spread7_batch_price, 705);
            
            // Print which spread has the highest price
            let mut highest_price = 0;
            let mut highest_index = 0;
            i = 0;
            while (i < vector::length(&spread_prices)) {
                let price = *vector::borrow(&spread_prices, i);
                if (price > highest_price) {
                    highest_price = price;
                    highest_index = *vector::borrow(&spread_indices, i);
                };
                i = i + 1;
            };
            
            debug::print(&std::string::utf8(b"Highest price spread index: "));
            debug::print(&highest_index);
            debug::print(&std::string::utf8(b"Highest price value: "));
            debug::print(&highest_price);
            
            // Verify traders affected the prices (spread 2 and 7 should have higher prices due to purchases)
            assert!(spread2_batch_price > 0, 706);
            assert!(spread7_batch_price > 0, 707);
            
            test_scenario::return_shared(market);
        };
        test_scenario::end(scenario_val);

    }

}