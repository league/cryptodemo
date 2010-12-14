
var userNameOk = false
var messageTemplate = null

$(document).ready(function(){
    $("#allMessageLink").click(showMessages)
    $("#copyPrivateKey").attr("disabled", true)
    $("#draft").keyup(maybeEnableSend)
    $("#generateKey").attr("disabled", true)
    $("#generateKey").click(generateKeyUI)
    $("#inboxLink").click(showMessages)
    $("#poolRemaining").text(poolRemaining())
    $("#readLink").click(initializeReader)
    $("#recipient").change(maybeEnableSend)
    $("#recipient").focus(loadRecipients)
    $("#sendButton").click(sendMessage)
    $("#sendLink").click(initializeSendForm)
    $("#userName").keyup(validateUserName)
    entropyHooks()
    initializePaging()
    synchronizePrivateKeyInputs()
    validateUserName() // in case it's pre-populated on reload
    messageTemplate = $("#messageList .message:first-child").detach()
})

/* Need two sychronized input boxes, so we can reveal private key.
   The obscured one will be canonical (used in calculations) so we
   must update it as the clear one changes. */
function synchronizePrivateKeyInputs() {
    $("#privateKeyClear").val("")
    $("#privateKeyObscure").val("")

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

function generateKeyUI() {
    $("#generateKey").attr("disabled", true)
    $("#pleaseWait").show(function() {
        var r = generateKey($("#bits").val())
        var priv = stringify(r.priv)
        var pub = stringify(r.pub)
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

function initializeSendForm() {
    var u = $("#userName").val()
    $("#sender").val(u).attr('disabled', true)
    $("#draft").val("").attr('disabled', false)
    $("#sendButton").attr('disabled', true)
    $("#sendResult").hide()
    $("#encryptOption").attr('checked', true)
}

function loadRecipients() {
    $.getJSON("/cryptoserv/users/", function(users){
        var prompt = $("#recipient option:first-child").detach()
        $("#recipient option").remove()
        $("#recipient").append(prompt)
        $.each(users, function(i,u) {
            $("#recipient").append(prompt.clone().attr("value", u).text(u))
        })
            })
}

function maybeEnableSend() {
    $("#sendButton").attr('disabled',
                          !$("#recipient").val() || !$("#draft").val())
}

function sendMessage() {
    $("#sendButton, #draft").attr('disabled', true);
    /* fetch public key for recipient */
    var s = $("#sender").val()
    var r = $("#recipient").val()
    if($("#encryptOption").attr('checked')) {
        $.getJSON("/cryptoserv/users/"+encodeURI(r), function(pub){
            $("#draft").val(rsaEncode(pub.e, pub.pq, $("#draft").val()))
            submitMessage(s,r)
        })
    }
    else {
        submitMessage(s,r)
    }
}

function submitMessage(s,r) {
    $.ajax({
        url: "/cryptoserv/messages/from/"+encodeURI(s)+
            "/to/"+encodeURI(r),
        type: "POST",
        data: $("#draft").val(),
        processData: false,
        success: function() {
            $("#sendResult").removeClass("error").addClass("okay").
                text("Message sent").show()
        },
        error: function() {
            $("#sendResult").removeClass("okay").addClass("error").
                text("error").show()
        }
    })
}

function initializeReader() {
    $("#inboxLink").click()
}

function showMessages(e) {
    $("#messageNav .set").removeClass("selected")
    $("#"+e.target.id).addClass("selected")
    $("#messageList *").remove()
    var url = "/cryptoserv/messages/"
    if(e.target.id == "inboxLink") {
        url += "to/" + encodeURI($("#userName").val())
    }
    $.getJSON(url, function(ms) {
        $.each(ms, function(i,m) {
            var h = messageTemplate.clone().attr('id', 'message'+i)
            $("#messageList").append(h)
            $("#message"+i+" .fromHeader span").text(m.sender)
            $("#message"+i+" .toHeader span").text(m.recipient)
            $("#message"+i+" .dateHeader span").text(m.date)
            $("#message"+i+" .messageBody pre").text(m.text)
            $("#message"+i+" .decryptLink").click(decryptMessage).
                attr('id', 'decryptLink'+i)
            $("#message"+i+" .undoLink").click(restoreMessage).
                attr('id', 'undoLink'+i)
        })
            })
}

function decryptMessage(e) {
    var i = e.target.id.replace(/decryptLink/, '')
    var t = $("#message"+i+" .messageBody pre.text")
    var priv = $.parseJSON($("#privateKeyObscure").val())
    if(!priv) {
        $("#message"+i+" .decryptResult").removeClass("okay").
            addClass("error").text("No private key provided.").show()
        return
    }
    var m = rsaDecode([priv.d, priv.p, priv.q], t.text())
    t.text(m)
    $("#message"+i+" .decryptResult").hide()
    $("#message"+i+" .decryptLink").hide()
    $("#message"+i+" .undoLink").show()
}

function restoreMessage(e) {
    var i = e.target.id.replace(/undoLink/, '')
    $("#message"+i+" .messageBody pre.text").
        text($("#message"+i+" .messageBody pre.backup").text())
    $("#message"+i+" .decryptLink").show()
    $("#message"+i+" .undoLink").hide()
}
