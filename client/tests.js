
$(document).ready(function(){
    module("Prime numbers")
    test("nextPrime in table", 2, function(){
        equal(nextPrime(839), 853)
        equal(nextPrime(1009), 1013)
    })
    test("nextPrime outside table", 2, function(){
        equal(nextPrime(1031), 1033)
        equal(nextPrime(3373), 3389)
    })
    test("primeAt original", 3, function(){
        equal(primeAt(4), 11)
        equal(primeAt(21), 79)
        equal(primeAt(367), 2503)
    })
})
