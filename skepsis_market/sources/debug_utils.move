module skepsis_market::debug_utils {
    use std::debug;
    use std::string;

    /// Print a label and a value with proper formatting
    public fun print_value(label: vector<u8>, value: u64) {
        debug::print(&string::utf8(label));
        debug::print(&value);
    }

    /// Print a message with proper formatting
    public fun print_message(message: vector<u8>) {
        debug::print(&string::utf8(message));
    }
}