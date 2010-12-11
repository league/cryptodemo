
$(document).ready(function(){
    module("Prime numbers")
    test("nextPrime in table", function(){
        equal(nextPrime(839), 853) // in table
        equal(nextPrime(1009), 1013)
        equal(nextPrime(1031), 1033) // not in table
        equal(nextPrime(3373), 3389)
    })
    test("primeAt original", function(){
        equal(primeAt(0), 2)
        equal(primeAt(4), 11)
        equal(primeAt(21), 79)
        equal(primeAt(367), 2503)
    })
})
