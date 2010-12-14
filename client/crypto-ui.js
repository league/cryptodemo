$(document).ready(function(){

    $("#poolRemaining").text(TARGET - pool.length)

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

    $(document).mousemove(function(e){
        if(pool.length < TARGET) {
            eventEntropy(e)
            $("#poolRemaining").text(TARGET - pool.length)
            if(pool.length >= TARGET) {
                $("#log").append("target reached<br>")
                $("#generateKey").attr('disabled', false)
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
