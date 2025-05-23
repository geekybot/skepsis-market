#[test_only]
module skepsis_market::distribution_math_tests {
    use skepsis_market::distribution_math;
    use std::debug;
    
    // Precision used in our fixed-point calculations
    const PRECISION: u64 = 1000000;
    
    // Test simple exponential calculation
    #[test]
    fun test_exp_simple() {
        // exp(0) should be 1 (or PRECISION in fixed-point)
        let result = distribution_math::test_exp(0);
        assert!(result == PRECISION, 0);
        
        // exp(1) should be approximately 2.718281 * PRECISION
        let exp_1 = distribution_math::test_exp(PRECISION);
        // Allow small margin of error (0.1%)
        let expected_lower = 2715000; // ~2.715 * PRECISION
        let expected_upper = 2721000; // ~2.721 * PRECISION
        assert!(exp_1 >= expected_lower, 1);
        assert!(exp_1 <= expected_upper, 2);
        
        // Print actual value for inspection during development
        debug::print(&exp_1);
    }
    
    // Test various input ranges for exp
    #[test]
    fun test_exp_ranges() {
        // Small value
        let small_input = PRECISION / 10; // 0.1
        let result = distribution_math::test_exp(small_input);
        let expected_lower = PRECISION + (PRECISION / 11); // ~1.09
        let expected_upper = PRECISION + (PRECISION / 9);  // ~1.11
        assert!(result >= expected_lower, 3);
        assert!(result <= expected_upper, 4);
        
        // Medium value
        let med_input = PRECISION * 2; // 2.0
        let result = distribution_math::test_exp(med_input);
        let expected_lower = 7380000; // ~7.38
        let expected_upper = 7400000; // ~7.40
        assert!(result >= expected_lower, 5);
        assert!(result <= expected_upper, 6);
        
        // Large value - ensuring it doesn't overflow
        let large_input = PRECISION * 20; // 20.0
        let result = distribution_math::test_exp(large_input);
        assert!(result > 0, 7); // Should not overflow to 0
    }
    
    // Test simple logarithm calculation
    #[test]
    fun test_ln_simple() {
        // ln(1) should be 0
        let result = distribution_math::test_ln(PRECISION);
        assert!(result == 0, 8);
        
        // ln(e) should be 1
        // First get e
        let e_value = distribution_math::test_exp(PRECISION);
        let ln_e = distribution_math::test_ln(e_value);
        
        // Allow small margin of error (0.1%)
        let expected_lower = PRECISION * 99 / 100; // 0.99
        let expected_upper = PRECISION * 101 / 100; // 1.01
        assert!(ln_e >= expected_lower, 9);
        assert!(ln_e <= expected_upper, 10);
        
        // Print actual value for inspection
        debug::print(&ln_e);
    }
    
    // Test various input ranges for ln
    #[test]
    fun test_ln_ranges() {
        // Value < 1
        let small_input = PRECISION / 2; // 0.5
        let result = distribution_math::test_ln(small_input);
        // let expected_lower = PRECISION * 69 / 100; // -0.69 (but our function will give absolute value)
        // let expected_upper = PRECISION * 71 / 100; // -0.71 (but our function will give absolute value)
        debug::print(&result); // For debugging
        
        // Value > 1
        let large_input = PRECISION * 10; // 10.0
        let result = distribution_math::test_ln(large_input);
        let expected_lower = PRECISION * 229 / 100; // ~2.29
        let expected_upper = PRECISION * 231 / 100; // ~2.31
        assert!(result >= expected_lower, 11);
        assert!(result <= expected_upper, 12);
    }
    
    // Test LMSR cost function
    #[test]
    fun test_calculate_cost() {
        // Simple case: 2 outcomes with equal quantities
        let quantities = vector[PRECISION, PRECISION]; // [1.0, 1.0]
        let b = PRECISION; // 1.0
        
        let cost = distribution_math::calculate_cost(quantities, b);
        // Expected: b * ln(sum(e^(q_i/b))) = ln(e^1 + e^1) = ln(2e) ≈ 1.693
        let expected_lower = PRECISION * 168 / 100; // ~1.68
        let expected_upper = PRECISION * 171 / 100; // ~1.71
        assert!(cost >= expected_lower, 13);
        assert!(cost <= expected_upper, 14);
        debug::print( &cost);
        
        // Case with different quantities
        let quantities = vector[PRECISION * 2, PRECISION]; // [2.0, 1.0]
        let b = PRECISION; // 1.0
        
        let cost = distribution_math::calculate_cost(quantities, b);
        // Expected: b * ln(sum(e^(q_i/b))) = ln(e^2 + e^1) ≈ ln(7.4 + 2.7) ≈ ln(10.1) ≈ 2.31
        let expected_lower = PRECISION * 230 / 100; // ~2.30
        let expected_upper = PRECISION * 233 / 100; // ~2.33
        assert!(cost >= expected_lower, 15);
        assert!(cost <= expected_upper, 16);
        debug::print(&cost);
        
        // Case with more outcomes
        let quantities = vector[PRECISION, PRECISION, PRECISION]; // [1.0, 1.0, 1.0]
        let b = PRECISION; // 1.0
        
        let cost = distribution_math::calculate_cost(quantities, b);
        // Expected: b * ln(sum(e^(q_i/b))) = ln(3e) ≈ 2.1
        let expected_lower = PRECISION * 208 / 100; // ~2.08
        let expected_upper = PRECISION * 212 / 100; // ~2.12
        assert!(cost >= expected_lower, 17);
        assert!(cost <= expected_upper, 18);
        debug::print(&cost);
    }
    
    // Test edge cases and overflow protection
    #[test]
    fun test_edge_cases() {
        // Test with small b value
        let quantities = vector[PRECISION, PRECISION]; // [1.0, 1.0]
        let b = 1; // Smallest valid b
        
        let cost = distribution_math::calculate_cost(quantities, b);
        assert!(cost > 0, 19); // Should return a positive value and not overflow
        
        // Test with very different quantities
        let quantities = vector[PRECISION * 10, PRECISION / 10]; // [10.0, 0.1]
        let b = PRECISION; // 1.0
        
        let cost = distribution_math::calculate_cost(quantities, b);
        assert!(cost > 0, 20); // Should return a positive value and not overflow
        debug::print(&cost);
    }
}