
$(document).ready(function(){

    module("Arbitrary precision arithmetic")

    test("settings sanity-check", function(){
        equal(bx2, 0x10000000)
        equal(bm, 0xFFFFFFF)
        equal(bx, 0x8000000)
        equal(bd, 0xE)
        equal(bdm, 0x3FFF)
    })

    test("simplemod", function(){
        equal(simplemod([0xBEEF, 0xCAFE], 0x1000), 0xEEF)
    })

    test("beq", function() {
        ok(beq([32,99], [32,99]))
        ok(!beq([32,99], [32,98,99]))
        ok(!beq([32,98,97], [32,98,99]))
    })

    test("bpow2", function() {
        ok(beq(bpow2(9), [0x200]))
        ok(beq(bpow2(37), [0x0, 0x200]))
    })

    module("Prime numbers")

    test("nextPrime", function(){
        equal(nextPrime(839), 853) // in table
        equal(nextPrime(1009), 1013)
        equal(nextPrime(1031), 1033) // not in table
        equal(nextPrime(3373), 3389)
    })

    test("primeAt", function(){
        equal(primeAt(0), 2)
        equal(primeAt(4), 11)
        equal(primeAt(21), 79)
        equal(primeAt(367), 2503)
    })

    test("divisible", function(){
        equal(divisible([2501],100), 41)
        equal(divisible([1031],100), 0)
    })

    module("Random numbers")

    module("Key generation")

    test("maurer provable primes", function(){
//        equal(mpp(24), 0)
//        equal(mpp(31), 0)
    })
})
