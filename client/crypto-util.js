/* crypto-util.js -- randomness, primes, and crypto utilities in javascript
 *
 * Copyright (c) 2010 Christopher League
 * http://contrapunctus.net/
 *
 * Portions copyright (c) 2009 Jacob Christian MunchAndersen
 * http://ebusiness.hopto.org/generator.htm
 *
 * Portions copyright (c) 2000 John M Hanna
 * http://sourceforge.net/projects/shop-js
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Fonudation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it well be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 * http://www.gnu.org/licenses/gpl.html
 */


            /////////////////////////////
            ////    Prime numbers    ////
            /////////////////////////////

Primes=[3, 5, 7, 11, 13, 17, 19,
	23, 29, 31, 37, 41, 43, 47, 53,
	59, 61, 67, 71, 73, 79, 83, 89,
	97, 101, 103, 107, 109, 113, 127, 131,
	137, 139, 149, 151, 157, 163, 167, 173,
	179, 181, 191, 193, 197, 199, 211, 223,
	227, 229, 233, 239, 241, 251, 257, 263,
	269, 271, 277, 281, 283, 293, 307, 311,
	313, 317, 331, 337, 347, 349, 353, 359,
	367, 373, 379, 383, 389, 397, 401, 409,
	419, 421, 431, 433, 439, 443, 449, 457,
	461, 463, 467, 479, 487, 491, 499, 503,
	509, 521, 523, 541, 547, 557, 563, 569,
	571, 577, 587, 593, 599, 601, 607, 613,
	617, 619, 631, 641, 643, 647, 653, 659,
	661, 673, 677, 683, 691, 701, 709, 719,
	727, 733, 739, 743, 751, 757, 761, 769,
	773, 787, 797, 809, 811, 821, 823, 827,
	829, 839, 853, 857, 859, 863, 877, 881,
	883, 887, 907, 911, 919, 929, 937, 941,
	947, 953, 967, 971, 977, 983, 991, 997,
	1009, 1013, 1019, 1021]


sieveSize=4000
sieve0=-1* sieveSize
sieve=[]

lastPrime=0

primes=Primes.concat()

function nextPrime(p) { // returns the next prime > p
    var n
    if(p == Primes[lastPrime] && lastPrime <Primes.length-1) {
        return Primes[++lastPrime]
    }
    if(p<Primes[Primes.length-1]) {
        for(n=Primes.length-2; n>0; n--) {
            if(Primes[n] <= p) {
                lastPrime=n+1
                return Primes[n+1]
            }
        }
    }
    // use sieve and find the next one
    var pp,m
    // start with p
    p++; if((p & 1)==0) p++
    for(;;) {
        // new sieve if p is outside of this sieve's range
        if(p-sieve0 > sieveSize || p < sieve0) {
            // start new sieve
            for(n=sieveSize-1; n>=0; n--) sieve[n]=0
            sieve0=p
            primes=Primes.concat()
        } 
        // next p if sieve hit
        if(sieve[p-sieve0]==0) { // sieve miss
            // update sieve if p divisable
            // find a prime divisor
            for(n=0; n<primes.length; n++) {
                if((pp=primes[n]) && p % pp ==0) {
                    for(m=p-sieve0; m<sieveSize; m+=pp) sieve[m]=pp
                    p+=2;
                    primes[n]=0
                    break
                }
            }
            if(n >= primes.length) {
                // possible prime
                return p
            }
        } else {
            p+=2;
        }
    }
}

/* This is an adaptation of prime() function from ebusiness
 * generator.htm, which returns the Nth prime, where index zero is
 * two.
 */
function primeAt(index){
    if(index == 0) {
        return 2
    }
    index--; // Primes starts with 3, not 2
    var n = Primes.length
    if(index < n) {
        return Primes[index]
    }
    var lp = Primes[n-1]
    while(n <= index) {
        lp = nextPrime(lp)
        n++
    }
    return lp
}
