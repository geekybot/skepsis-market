// #[test_only]
// module skepsis_market::distribution_market_factory_tests {
//     use sui::tx_context;
//     use sui::clock;
//     use sui::coin;
//     use skepsis_market::distribution_market_factory;
//     use skepsis_market::distribution_market_factory::{AdminCap};
//     use skepsis_market::distribution_market;
//     use std::vector;

//     #[test]
//     public fun test_initialize_factory_and_create_market() {
//         let ctx = &mut tx_context::dummy();
//         let clock = &clock::new_for_testing(1000);
//         // Mint AdminCap
//         let admin_cap = AdminCap { id: 0 }; // Dummy UID for test
//         // Initialize factory
//         distribution_market_factory::initialize_factory<u64>(&admin_cap, ctx);
//         // Prepare market params
//         let question = b"Test Market".to_vec();
//         let resolution_criteria = b"Test Criteria".to_vec();
//         let lower_bound = 0;
//         let upper_bound = 100;
//         let steps = 10;
//         let resolution_time = 2000;
//         let bidding_deadline = 1500;
//         let initial_liquidity = coin::zero<u64>();
//         // Create market via factory
//         distribution_market_factory::create_market_and_add_liquidity<u64>(
//             &admin_cap,
//             question,
//             resolution_criteria,
//             steps,
//             resolution_time,
//             bidding_deadline,
//             initial_liquidity,
//             clock,
//             lower_bound,
//             upper_bound,
//             ctx
//         );
//         // If no abort, test passes
//         assert!(true, 0);
//     }
// }
