
var userNameOk = false

$(document).ready(function(){
    $("#copyPrivateKey").attr("disabled", true)
    $("#generateKey").attr("disabled", true)
    $("#generateKey").click(generateKey)
    $("#poolRemaining").text(poolRemaining())
    $("#userName").keyup(validateUserName)
    entropyHooks()
    initializePaging()
    synchronizePrivateKeyInputs()
    validateUserName() // in case it's pre-populated on reload
})

/* Need two sychronized input boxes, so we can reveal private key.
   The obscured one will be canonical (used in calculations) so we
   must update it as the clear one changes. */
function synchronizePrivateKeyInputs() {
    $("#privateKeyClear").change(function(){
        $("#privateKeyObscure").val($(this).val())
    })

    $("#privateKeyObscure").change(function(){
        $("#privateKeyClear").val($(this).val())
    })

    $("#revealPrivateKey").click(function(){
        $(".hideWhenClear").hide()
        $(".hideWhenObscure").show()
    })

    $("#hidePrivateKey").click(function(){
        $(".hideWhenObscure").hide()
        $(".hideWhenClear").show()
    })
}

function initializePaging() {
    $("#registerLink").click({page: "register"}, selectPage)
    $("#loginLink").click({page: "login"}, selectPage)
    $("#sendLink").click({page: "send"}, selectPage)
    $("#readLink").click({page: "read"}, selectPage)
}

function selectPage(e) {
    $(".page").hide()
    $("#"+e.data.page+"Page").show("fast")
    $("#navbar li").removeClass("selected")
    $("#"+e.data.page+"Link").addClass("selected")
}

function entropyHooks() {
    $(document).keydown({kind: 'keydown'}, gatherEntropy)
    $(document).keyup({kind: 'keyup'}, gatherEntropy)
    $(document).mousemove({kind: 'mousemove'}, gatherEntropy)
}

function gatherEntropy(e){
    if(!poolFull()) {
        eventEntropy(e)
        $("#poolRemaining").text(poolRemaining())
        if(poolFull()) {
            maybeEnableGenerateKey()
            randInit()
            $(document).unbind(e.data.kind)
        }
    }
}

function maybeEnableGenerateKey() {
    $("#generateKey").attr('disabled', !poolFull() || !userNameOk)
}

function validateUserName() {
    var u = $("#userName").val()
    if(!u) {
        $("#nameCheck").hide()
        userNameOk = false
        maybeEnableGenerateKey()
    }
    else {
        $.ajax({
            url: "/cryptoserv/users/"+encodeURI(u),
            success: function(){
                $("#nameCheck").text("Already in use").
                    removeClass("okay").addClass("error").show()
                userNameOk = false
                maybeEnableGenerateKey()
            },
            error: function(){
                $("#nameCheck").text("OK").
                    removeClass("error").addClass("okay").show()
                userNameOk = true
                maybeEnableGenerateKey()
            }})
    }
}

function stringify(d) {
    return JSON.stringify(d).replace(/,/g, ", ")
}

function generateKey() {
    $("#generateKey").attr("disabled", true)
    $("#pleaseWait").show(function() {
        var bits = $("#bits").val()
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
        var priv = stringify({p: p, q: q, d: d})
        var pub = stringify({pq: pq, e: e})
        /* Now let's try to save it. */
        var u = $("#userName").val()
        $.ajax({
            url: "/cryptoserv/users/"+encodeURI(u),
            type: "POST",
            data: pub,
            processData: false,
            success: function() {
                $("#userName").attr("disabled", true)
                $("#privateKeyObscure").val(priv).change()
                $("#publicKey").val(pub).show()
                $("#generateResult").removeClass("error").addClass("okay").
                    text("Saved public key:").show()
                $("#copyPrivateKey").attr("disabled", false)
                $("#sendLink").addClass("enabled")
                $("#readLink").addClass("enabled")
                $("#pleaseWait").hide()
            },
            error: function() {
                $("generateResult").removeClass("okay").addClass("error").
                    text("Some error saving.").show()
            }})
    })
}
