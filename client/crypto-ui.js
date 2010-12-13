$(document).ready(function(){
    $("#gen").attr('disabled', true)
    $(document).mousemove(function(e){
        if(pool.length < TARGET) {
            eventEntropy(e)
            $("#log").text(TARGET - pool.length)
            if(pool.length >= TARGET) {
                $("#log").append("target reached<br>")
                $("#gen").attr('disabled', false)
                $(document).unbind('mousemove')
            }
        }
    })
    $("#gen").click(function() {
        randInit()
        for(i = 0; i < 100; i++) {
            $("#log").append(" "+rand(100))
            if(i%10 == 9) $("#log").append("<br>")
        }
    })
})
