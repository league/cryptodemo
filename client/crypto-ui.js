
var userNameOk = false

$(document).ready(function(){
    $("#poolRemaining").text(poolRemaining())
    $("#generateKey").attr("disabled", "true")
    synchronizePrivateKeyInputs()
    initializePaging()
    $("#userName").keyup(validateUserName)
    validateUserName() // in case it's populated on reload

    $(document).mousemove({kind: 'mousemove'}, gatherEntropy)
    $(document).keyup({kind: 'keyup'}, gatherEntropy)
    $(document).keydown({kind: 'keydown'}, gatherEntropy)

    $("#generateKey").click(function() {
        $("#pleaseWait").show()
        randInit()
        for(i = 0; i < 100; i++) {
            $("#log").append(" "+rand(100))
            if(i%10 == 9) $("#log").append("<br>")
        }
    })
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

function gatherEntropy(e){
    if(!poolFull()) {
        eventEntropy(e)
        $("#poolRemaining").text(poolRemaining())
        if(poolFull()) {
            maybeEnableGenerateKey()
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
