
var userNameOk = false

$(document).ready(function(){

    $("#poolRemaining").text(poolRemaining())
    $("#generateKey").attr("disabled", "true")

    /* Need two sychronized input boxes, so we can reveal private key.
       The obscured one will be canonical (used in calculations) so we
       must update it as the clear one changes. */

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

    /* Paging mechanism */

    $("#registerLink").click(function(){
        $(".page").hide()
        $("#registerPage").show("fast")
        $("#navbar li").removeClass("selected")
        $("#registerLink").addClass("selected")
    })

    $("#loginLink").click(function(){
        $(".page").hide()
        $("#loginPage").show("fast")
        $("#navbar li").removeClass("selected")
        $("#loginLink").addClass("selected")
    })

    $("#sendLink").click(function(){
        $(".page").hide()
        $("#sendPage").show("fast")
        $("#navbar li").removeClass("selected")
        $("#sendLink").addClass("selected")
    })

    $("#readLink").click(function(){
        $(".page").hide()
        $("#readPage").show("fast")
        $("#navbar li").removeClass("selected")
        $("#readLink").addClass("selected")
    })

    validateUserName()
    $("#userName").keyup(validateUserName)

    $(document).mousemove(function(e){
        if(!poolFull()) {
            eventEntropy(e)
            $("#poolRemaining").text(poolRemaining())
            if(poolFull()) {
                maybeEnableGenerateKey()
                $(document).unbind('mousemove')
            }
        }
    })

    $("#generateKey").click(function() {
        $("#pleaseWait").show()
        randInit()
        for(i = 0; i < 100; i++) {
            $("#log").append(" "+rand(100))
            if(i%10 == 9) $("#log").append("<br>")
        }
    })
})

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
