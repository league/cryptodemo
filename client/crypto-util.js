/* crypto-util.js -- randomness, primes, and crypto utilities in javascript
 *
 * Copyright (c) 2010-2011 Christopher League
 * http://contrapunctus.net/
 *
 * Portions copyright (c) 2009 Jacob Christian Munch-Andersen
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


/* The following functions are (c) 2000 by John M Hanna and are
 * released under the terms of the Gnu Public License.
 * You must freely redistribute them with their source -- see the
 * GPL for details.
 *  -- Latest version found at http://sourceforge.net/projects/shop-js
 */

// ---------------------- Arbitrary Precision Math
// badd(a,b), bsub(a,b), bmul(a,b), bdiv(a,b), bmod(a,b),
// brshift(a), beq(a,b)

// set the base... 32bit cpu -> bs=16, 64bit -> bs=32
// bm is the mask, bs is the shift
//bm=0xf; bs=4;  // low base useful for testing if digits handled ok
bs=28;
bx2=1<<bs; bm=bx2-1; bx=bx2>>1; bd=bs>>1; bdm=(1 << bd) -1
log2=Math.log(2)


function badd(a,b) { // binary add
 var al=a.length, bl=b.length
 if(al < bl) return badd(b,a)
 var c=0, r=[], n=0
 for(; n<bl; n++) {
  c+=a[n]+b[n]
  r[n]=c & bm
  c>>>=bs
 }
 for(; n<al; n++) {
  c+=a[n]
  r[n]=c & bm
  c>>>=bs
 }
 if(c) r[n]=c
 return r
}
function beq(a,b) { // returns 1 if a == b
 if(a.length != b.length) return 0
 for(var n=a.length-1; n>=0; n--)
  if(a[n] != b[n]) return 0
 return 1
}
function bsub(a,b) { // binary subtract
 var al=a.length, bl=b.length, c=0, r=[]
 if(bl > al) {return []}
 if(bl == al) {
  if(b[bl-1] > a[bl-1]) return []
  if(bl==1) return [a[0]-b[0]]
 }
 for(var n=0; n<bl; n++) {
  c+=a[n]-b[n]
  r[n]=c & bm
  c>>=bs
 }
 for(;n<al; n++) {
  c+=a[n]
  r[n]=c & bm
  c>>=bs
 }
 if(c) {return []}
 if(r[n-1]) return r
 while(n>1 && r[n-1]==0) n--;
 return r.slice(0,n)
}
function bmul(a,b) { // binary multiply
 b=b.concat([0])
 var al=a.length, bl=b.length, r=[], n,nn,aa, c, m
 var g,gg,h,hh, ghhb

 for(n=al+bl; n>=0; n--) r[n]=0
 for(n=0; n<al; n++) {
  if(aa=a[n]) {
   c=0
   hh=aa>>bd; h=aa & bdm
   m=n
   for(nn=0; nn<bl; nn++, m++) {
    g = b[nn]; gg=g>>bd; g=g & bdm
    //(gg*2^15 + g) * (hh*2^15 + h) = (gghh*2^30 + (ghh+hgg)*2^15 +hg)
    ghh = g * hh + h * gg
    ghhb= ghh >> bd; ghh &= bdm
    c += r[m] + h * g + (ghh << bd)
    r[m] = c & bm
    c = (c >> bs) + gg * hh + ghhb
   }
  }
 }
 n=r.length
 if(r[n-1]) return r
 while(n>1 && r[n-1]==0) n--;
 return r.slice(0,n)
}

function blshift(a,b) {
 var n, c=0, r=[]
 for(n=0; n<a.length; n++) {
  c|= (a[n]<<b) 
  r[n]= c & bm
  c>>=bs
 }
 if(c) r[n]=c
 return r
}
function brshift(a) {
 var c=0,n,cc, r=[]
 for(n=a.length-1; n>=0; n--) {
  cc=a[n]; c<<=bs
  r[n]=(cc | c)>>1
  c=cc & 1
 }
 while(r.length > 1 && r[r.length-1]==0) {
  r=r.slice(0,-1)
 }
 this.a=r; this.c=c
 return this
}
function zeros(n) {var r=[]; while(n-->0) r[n]=0; return r}
function toppart(x,start,len) { var n=0
 while(start >= 0 && len-->0) n=n*bx2+x[start--]
 return n
}
//14.20 Algorithm Multiple-precision division from HAC
function bdiv(x,y) {
 var n=x.length-1, t=y.length-1, nmt=n-t
 // trivial cases; x < y
 if(n < t || n==t && (x[n]<y[n] || n>0 && x[n]==y[n] && x[n-1]<y[n-1])) {
  this.q=[0]; this.mod=x; return this
 }
 // trivial cases; q < 4
 if(n==t && toppart(x,t,2)/toppart(y,t,2) <4) {
  var q=0, xx
  for(;;) {
   xx=bsub(x,y)
   if(xx.length==0) break
   x=xx; q++
  }
  this.q=[q]; this.mod=x; return this
 }
 var shift, shift2
 // normalize
 shift2=Math.floor(Math.log(y[t])/log2)+1
 shift=bs-shift2
 if(shift) {
  x=x.concat(); y=y.concat()
  for(i=t; i>0; i--) y[i]=((y[i]<<shift) & bm) | (y[i-1] >> shift2); y[0]=(y[0]<<shift) & bm
  if(x[n] & ((bm <<shift2) & bm)) { x[++n]=0; nmt++; }
  for(i=n; i>0; i--) x[i]=((x[i]<<shift) & bm) | (x[i-1] >> shift2); x[0]=(x[0]<<shift) & bm
 }
 var i, j, x2, y2,q=zeros(nmt+1)

 y2=zeros(nmt).concat(y)
 for(;;) {
  x2=bsub(x,y2)
  if(x2.length==0) break
  q[nmt]++
  x=x2
 }
 var yt=y[t], top=toppart(y,t,2)
 for(i=n; i>t; i--) {
  m=i-t-1
  if(i >= x.length)
   q[m]=1
  else if(x[i] == yt)
   q[m]=bm
  else
   q[m]=Math.floor(toppart(x,i,2)/yt)

  topx=toppart(x,i,3)
  while(q[m] * top > topx)
   q[m]--
  //x-=q[m]*y*b^m
  y2=y2.slice(1)
  x2=bsub(x,bmul([q[m]],y2))
  if(x2.length==0) {
   q[m]--
   x2=bsub(x,bmul([q[m]],y2))
  }
  x=x2
 }
 // de-normalize
 if(shift) {
  for(i=0; i<x.length-1; i++) x[i]=(x[i]>>shift) | ((x[i+1] << shift2) & bm); x[x.length-1]>>=shift
 }
 while(q.length > 1 && q[q.length-1]==0) q=q.slice(0,q.length-1)
 while(x.length > 1 && x[x.length-1]==0) x=x.slice(0,x.length-1)
 this.mod=x
 this.q=q
 return this
}

function bmod(p,m) { // binary modulo
 if(m.length==1) {
  if(p.length==1) return [p[0] % m[0]]
  if(m[0] < bdm) return [simplemod(p,m[0])]
 }

 var r=bdiv(p,m)
 return r.mod
}
function simplemod(i,m) {
 // returns the mod where m < 2^bd
 if(m>bdm)
  return mod(i,[m])
 var c=0, v
 for(var n=i.length-1; n>=0; n--) {
  v=i[n]
  c=((v >> bd) + (c<<bd)) % m
  c=((v & bdm) + (c<<bd)) % m
 }
 return c
}
function bmodexp(xx,y,m) { // binary modular exponentiation
 var r=[1], n, an,a, x=xx.concat()
 var mu=[]
 n=m.length*2;  mu[n--]=1;  for(; n>=0; n--) mu[n]=0; mu=bdiv(mu,m).q

 for(n=0; n<y.length; n++) {
  for(a=1, an=0; an<bs; an++, a<<=1) {
   if(y[n] & a) r=bmod2(bmul(r,x),m,mu)
   x=bmod2(bmul(x,x),m,mu)
  }
 }
 return r
}
function bmod2(x,m,mu) { // Barrett's modular reduction from HAC, 14.42, CRC Press
 var xl=x.length - (m.length << 1)
 if(xl > 0) {
  return bmod2(x.slice(0,xl).concat(bmod2(x.slice(xl),m,mu)),m,mu)
 }
 var ml1=m.length+1, ml2=m.length-1,rr
 //var q1=x.slice(ml2)
 //var q2=bmul(q1,mu)
 var q3=bmul(x.slice(ml2),mu).slice(ml1)
 var r1=x.slice(0,ml1)
 var r2=bmul(q3,m).slice(0,ml1)
 var r=bsub(r1,r2)
 //var s=('x='+x+'\nm='+m+'\nmu='+mu+'\nq1='+q1+'\nq2='+q2+'\nq3='+q3+'\nr1='+r1+'\nr2='+r2+'\nr='+r); 
 if(r.length==0) {
  r1[ml1]=1
  r=bsub(r1,r2)
 }
 for(var n=0;;n++) {
  rr=bsub(r,m)
  if(rr.length==0) break
  r=rr
  if(n>=3) return bmod2(r,m,mu)
 }
 return r
}

function bPowOf2(pow) { // return a bigint
 var r=[], n, m=Math.floor(pow/bs)
 for(n=m-1; n>=0; n--) r[n]=0;
 r[m]= 1<<(pow % bs)
 return r
}

function sub2(a,b) {
 var r=bsub(a,b)
 if(r.length==0) {
  this.a=bsub(b,a)
  this.sign=1
 } else {
  this.a=r
  this.sign=0
 }
 return this
}
function signedsub(a,b) {
 if(a.sign) {
  if(b.sign) {
   return sub2(b,a)
  } else {
   this.a=badd(a,b)
   this.sign=1
  }
 } else {
  if(b.sign) {
   this.a=badd(a,b)
   this.sign=0
  } else {
   return sub2(a,b)
  }
 }
 return this
}

function modinverse(x,n) { // returns x^-1 mod n
// from  Bryan Olson <bryanolson@my-deja.com> 
 var y=n.concat(), t, r, bq, a=[1], b=[0], ts
 a.sign=0; b.sign=0
 while( y.length > 1 || y[0]) {
  t=y.concat()
  r=bdiv(x,y)
  y=r.mod
  q=r.q
  x=t
  t=b.concat(); ts=b.sign
  bq=bmul(b,q)
  bq.sign=b.sign
  r=signedsub(a,bq)
  b=r.a; b.sign=r.sign
  a=t; a.sign=ts
 }
 if(beq(x,[1])==0) return [0] // No inverse; GCD is x
 if(a.sign) {
  a=bsub(n,a)
 }
 return a
}

function crt_RSA(m, d, p, q) {
 // Compute m**d mod p*q for RSA private key operations. -- Bryan Olson via deja.com
 var xp = bmodexp(bmod(m,p), bmod(d,bsub(p,[1])), p)
 var xq = bmodexp(bmod(m,q), bmod(d,bsub(q,[1])), q)
 var t=bsub(xq,xp);
 if(t.length==0) {
  t=bsub(xp,xq)
  t = bmod(bmul(t, modinverse(p, q)), q);
  t=bsub(q,t)
 } else {
  t = bmod(bmul(t, modinverse(p, q)), q);
 } 
 return badd(bmul(t,p), xp)
}

// conversion functions:
// text to binary and binary to text, text to base64 and base64 to text
// OK, so this isn't exactly base64 -- fix it if you care

function t2b(s) {
 var bits=s.length*8, bn=1, r=[0], rn=0, sn=0, sb=1;
 var c=s.charCodeAt(0)
 for(var n=0; n<bits; n++) {
  if(bn > bm) {bn=1; r[++rn]=0; }
  if(c & sb)  r[rn]|=bn;
  bn<<=1
  if((sb<<=1) > 255) {sb=1; c=s.charCodeAt(++sn); }
 }
 return r;
}
function b2t(b) {
 var bits=b.length*bs, bn=1, bc=0, r=[0], rb=1, rn=0
 for(var n=0; n<bits; n++) {
  if(b[bc] & bn) r[rn]|=rb;
  if((rb<<=1) > 255) {rb=1; r[++rn]=0; }
  if((bn<<=1) > bm) {bn=1; bc++; }
 }
 while(r[rn]==0) {rn--;}
 var rr=''
 for(var n=0; n<=rn; n++) rr+=String.fromCharCode(r[n]);
 return rr;
}
b64s='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"'
function textToBase64(t) {
 var r=''; var m=0; var a=0; var tl=t.length-1; var c
 for(n=0; n<=tl; n++) {
  c=t.charCodeAt(n)
  r+=b64s.charAt((c << m | a) & 63)
  a = c >> (6-m)
  m+=2
  if(m==6 || n==tl) {
   r+=b64s.charAt(a)
   if((n%45)==44) {r+="\n"}
   m=0
   a=0
  }
 }
 return r
}
function base64ToText(t) {
 var r=''; var m=0; var a=0; var c
 for(n=0; n<t.length; n++) {
  c=b64s.indexOf(t.charAt(n))
  if(c >= 0) {
   if(m) {
    r+=String.fromCharCode((c << (8-m))&255 | a)
   }
   a = c >> m
   m+=2
   if(m==8) { m=0 }
  }
 }
 return r
}

// RC4 stream encryption
// adapted from www.cpan.org crypt::rc4 -- thanks!
function rc4(key, text) {
 var i, x, y, t, x2, kl=key.length;
 s=[];

 for (i=0; i<256; i++) s[i]=i
 y=0
 for(j=0; j<2; j++) {
  for(x=0; x<256; x++) {
   y=(key.charCodeAt(x%kl) + s[x] + y) % 256
   t=s[x]; s[x]=s[y]; s[y]=t
  }
 }
 var z=""
 for (x=0; x<text.length; x++) {
  x2=x & 255
  y=( s[x2] + y) & 255
  t=s[x2]; s[x2]=s[y]; s[y]=t
  z+= String.fromCharCode((text.charCodeAt(x) ^ s[(s[x2] + s[y]) % 256]))
 }
 return z
}

function ror(a,n) {n&=7; return n?((a>>n) | ((a<<(8-n))&255)):a;}
function hash(s,l) {
 var sl=s.length,r=[],rr='',v=1,lr=4;
 for(var n=0; n<l; n++) r[n]=(v=((v*v*5081+n) & 255));
 while(sl--) {
  lr = r[sl % l] ^= ror(s.charCodeAt(sl),lr) ^ r[r[(sl * 5081) % l] % l];
 }
 for(var n=0; n<l; n++)
  rr+=String.fromCharCode(r[n] ^
   ror(r[r[(n * 171) % l] % l],r[n]));
 return rr
}

// tie it all together with rsa encrypt and decrypt
function rsaEncode(key,mod,text) {
 // create a good random session key
 var keylen=Math.floor((mod.length+1)*bs/8)
 var sessionkey=hash(text+Date()+Math.random(),keylen)

 // sessionkey must be less than modulo
 sessionkey=bmod(t2b(sessionkey),mod)

 // convert it from arbitrary precision representation into text for RC4
 var sk2=b2t(sessionkey)

 // rsa encrypt the key
 var ske=bmodexp(sessionkey,key,mod)

 // to pack it in with the text we need its length
 var skeText=b2t(ske)

  // return the rsa encoded key and the encrypted text
 // pack up the completed encoded package with base64
 return textToBase64(
  String.fromCharCode(skeText.length)+skeText+
  rc4(sk2,text))
}
function rsaDecode(key,text) {
 // separate the session key from the text
 text=base64ToText(text)
 var sessionKeyLength=text.charCodeAt(0)
 var sessionKeyEncryptedText=text.substr(1,sessionKeyLength)
 text=text.substr(sessionKeyLength+1)
 var sessionKeyEncrypted=t2b(sessionKeyEncryptedText)

 // un-rsa the session key
 sessionkey=crt_RSA(sessionKeyEncrypted,key[0],key[1],key[2])
 sessionkey=b2t(sessionkey)

 text=rc4(sessionkey,text)
 return text
}


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

/* Return a factor of n if n is divisible by a prime less than max,
 * else return 0.
 */
function divisible(n,max) {
    if((n[0] & 1) == 0) return 2
    for(c=0; c<Primes.length; c++) {
        if(Primes[c] >= max) return 0
        if(simplemod(n,Primes[c])==0)
            return Primes[c]
    }
    c=Primes[Primes.length-1]
    for(;;) {
        c=nextPrime(c)
        if(c >= max) return 0
        if(simplemod(n,c)==0)
            return c
    }
}


            //////////////////////////////
            ////    Random numbers    ////
            //////////////////////////////

pool = []
TARGET = 256
rp = []
rs = randJS(256)
rx = 0
ry = 0
bits = 0
nbits = 0

function poolFull() {
    return pool.length >= TARGET
}

function poolRemaining() {
    return TARGET - pool.length
}

function randJS(n) {
    return Math.floor(Math.random()*n)
}

function eventEntropy(e) {
    if(!poolFull()) {
        if(e.originalEvent.touches && e.originalEvent.touches.length) {
            e = e.originalEvent.touches[0];
        } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
            e = e.originalEvent.changedTouches[0];
        }

        var x = e.clientX || e.screenX || e.pageX || 1
        var y = e.clientY || e.screenY || e.pageY || 1
        var t = new Date().getTime()
        var s = t + primeAt(46)*x + primeAt(45)*y
        pool[pool.length] = s % 256
    }
}

function randInit() {
    if(!poolFull())
        throw new Error("Not enough entropy in pool yet.")
    var x, y, t
    for(x = 0; x < 256; x++) rp[x] = x;
    y = 0
    for(x = 0; x < 256; x++) {
        y = (pool[x] + rp[x] + y) % 256
        t = rp[x]; rp[x] = rp[y]; rp[y] = t
    }
    rs = randJS(256)
    rx = ry = 0
}

function randByte() {
    // this first bit is basically RC4
    rx = ++rx & 255;
    ry = (rp[rx] + ry) & 255;
    var t = rp[rx]; rp[rx] = rp[ry]; rp[ry]=t;
    rs ^= rp[(rp[rx] + rp[ry]) & 255];
    rs ^= randJS(256)
    rs ^= ror(pool[randJS(pool.length)], randJS(8))
    rs ^= ror(pool[randJS(pool.length)], randJS(8))
    return rs;
}

function randBit() {
    if(!nbits) {
        nbits = 8
        bits = randByte()
    }
    nbits--
    var r = bits & 1
    bits >>= 1
    return r
}

function rand(n) {
    if(n == 2) return randBit()
    var m = 1, r = 0
    while(n > m && m > 0) {
        m <<= 8; r = (r<<8) | randByte()
    }
    if(r < 0) r ^= 0x80000000
    return r % n
}

function randTest() {
    for(i = 0; i < TARGET; i++) {
        eventEntropy({'clientX': randJS(640), 'clientY': randJS(480)})
    }
    randInit()
    histo = [0,0,0,0]
    for(i = 0; i < TARGET; i++) {
        histo[randByte()%4]++
    }
    alert(histo)
}


            //////////////////////////////
            ////    Key generation    ////
            //////////////////////////////

function bgcd(uu,vv) { // return greatest common divisor
 // algorythm from http://algo.inria.fr/banderier/Seminar/Vallee/index.html
 var d, t, v=vv.concat(), u=uu.concat()
 for(;;) {
  d=bsub(v,u)
  if(beq(d,[0])) return u
  if(d.length) {
   while((d[0] & 1) ==0)
    d=brshift(d).a // v=(v-u)/2^val2(v-u)
   v=d
  } else {
   t=v; v=u; u=t // swap u and v
  }
 }
}

function rnum(bits) {
 var n,b=1,c=0
 var a=[]
 if(bits==0) bits=1
 for(n=bits; n>0; n--) {
  if(rand(2)) {
   a[c]|=b
  }
  b<<=1
  if(b==bx2) {
   b=1; c++
  }
 }
 return a
}

/* Return a Maurer Provable Prime. See HAC chap 4 (c) CRC press */
function mpp(bits) {
    if(bits < 10) return [Primes[rand(Primes.length)]]
    if(bits <=20) return [nextPrime(rand(1<<bits))]
    var c=10, m=20, B=bits*bits/c, r, q, I, R, n, a, b, d, R2, nMinus1
    if(bits > m*2) {
        for(;;) {
            r=Math.pow(2,Math.random()-1)
            if(bits - r * bits > m) break
        }
    } else {
        r=0.5
    }
    q=mpp(Math.floor(r*bits)+1)
    I=bPowOf2(bits-2)
    I=bdiv(I,q).q
    Il=I.length
    for(;;) {
        // generate R => I < R < 2I
        R=[]; for(n=0; n<Il; n++) R[n]=rand(bx2);
        R[Il-1] %= I[Il-1]; R=bmod(R,I);
        if(! R[0]) R[0]|=1 // must be greater or equal to 1
        R=badd(R,I)
        n=blshift(bmul(R,q),1) // 2Rq+1
        n[0]|=1
        if(!divisible(n,B)) {
            a=rnum(bits-1)
            a[0]|=2 // must be greater than 2
            nMinus1=bsub(n,[1])
            var x=bmodexp(a,nMinus1,n)
            if(beq(x,[1])) {
                R2=blshift(R,1)
                b=bsub(bmodexp(a,R2,n),[1])
                d=bgcd(b,n)
                if(beq(d,[1])) return n
            }
        }
    }
}

function generateKey(bits) {
    var p = mpp(bits)
    var q = mpp(bits)
    var pq = bmul(p, q)
    var p1q1 = bmul(bsub(p, [1]), bsub(q, [1]))
    var c, d, e
    for(c = 5; c < Primes.length; c++) {
        e = [Primes[c]]
        d = modinverse(e, p1q1)
        if(d.length != 1 || d[0] != 0) break
    }
    return {pub: {pq: pq, e: e},
            priv: {p: p, q: q, d: d}}
}
