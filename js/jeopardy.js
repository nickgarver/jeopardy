$(function(){
    $('#game-load-modal').modal('show');
    $('#game-load-input-button').click(function(){
        var file = $('#input-file').prop('files')[0];
        if ($('#input-file').val() !== '') {
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(){
                var fileText = reader.result;
                var data = $.parseJSON(fileText);
                jsonData = data;
                currentBoard = jsonData[rounds[currentRound]];
                loadBoard();
                $('#game-load-modal').modal('hide');
            }
            reader.onerror = function(e){
                $('#game-load-error').text("Error: "+ e).show();
            };

        }
    });
    $('#next-round').unbind('click').click(function(e){
        e.stopPropagation();
        currentRound++;
        if (currentRound == rounds.length) {
            $(this).prop('disabled', true);
            window.location.reload();
        }
        else if (currentRound >= rounds.length - 1) {
            $(this).text('New Game');
            $(this).hide();
        }
        currentBoard = jsonData[rounds[currentRound]];
        $('.panel-heading').empty();
        $('#main-board').empty();
        loadBoard();
    });
    $('#end-round').unbind('click').click(function(e){
        e.stopPropagation();
        $('.unanswered').removeClass('unanswered').unbind().css('cursor','not-allowed');
    });
    $('#question-modal').on('show.bs.modal', function (e) {
    });
    $('#question-modal').on('hidden.bs.modal', function (e) {
        $('#question-media').show();
        $('#question').show();
    });
    $('#input-file').click(function(){
        $('#game-title').removeClass("blink");
    });
    $("#input-file").change(function(){
        $('#game-load-input-button').show();
    });
    
    $(document).on('click', '.unanswered', function(){
        //event bound to clicking on a tile. it grabs the data from the click event, populates the modal, fires the modal, and binds the answer method
        var category = $(this).parent().data('category');
        var question = $(this).data('question');
        var answer = currentBoard[category].questions[question].answer;
        var value = currentBoard[category].questions[question].value;
        var questionMedia = currentBoard[category].questions[question].media;
        var answerMedia = currentBoard[category].questions[question].answerMedia;
        var isDailyDouble = 'daily-double' in currentBoard[category].questions[question] ?
            currentBoard[category].questions[question]['daily-double'] : false;

        if (isDailyDouble) { 
            $('#daily-double-modal').modal('show');
        }
        
        $('#modal-answer-title').empty().text(currentBoard[category].name + ' - ' + value);
        $('#question').empty().text(currentBoard[category].questions[question].question);
        if (questionMedia){
            loadMedia(questionMedia, '#question-media')
            $('#question').addClass("caption");
        }
        else {
            $('#question-media').empty().hide();
        }
        $('#answer-text').text(answer).hide();
        $('#answer-media').hide();
        $('#question-modal').modal('show');
        $('#answer-close-button').data('question', question).data('category', category);
        $('#answer-show-button').data('media', answerMedia);
        $('#answer-show-button').show();
        handleAnswer();
    });
    $(document).on('click', '#final-jeopardy-question-button', function(){
        $(this).hide();
        $('#final-jeopardy-question').show();
        $('#final-image').show();
        $('#final-jeopardy-logo-img').hide();
        $('#show-question-box').hide();
        $('#final-jeopardy-answer-button').show();
    });
    $(document).on('click', '#final-jeopardy-answer-button',function(){
        $(this).hide();
        finalquestionAnswer = currentBoard['answerMedia'];
        if (finalquestionAnswer){
            loadMedia(finalquestionAnswer, '#final-image')
            $('#final-jeopardy-question').addClass("caption");
        }
        else {
            $('#final-jeopardy-question').removeClass("caption");
            $('#final-image').hide();
        }        
        $('#final-jeopardy-question').text(currentBoard['answer']);
        $('#next-round').show();
    });
    $(document).on('click', '#daily-double-wager',function(){
        $('#daily-double-modal').modal('hide');
    });
});

var rounds = ['jeopardy', 'double-jeopardy', 'final-jeopardy'];
var currentBoard;
var currentRound = 0;
var gameDataFile;

function loadBoard() {
    //function that turns the board.json (loaded in the the currentBoard variable) into a jeopardy board
    var board = $('#main-board');
    if (rounds[currentRound] === "final-jeopardy") {
        finalquestionMedia = currentBoard['media'];
        $('#end-round').hide();
        $('#main-board-categories').append('<div class="text-center"><h2 class="category-text">' +
            currentBoard['category'] + '</h2></div>').css('background-color', '#F9C203');
        finalImage = '<div id="final-image" class="text-center"></div>';
        board.append('<div class="text-center final-panel"><h2><img class="shake-img" src="./images/final-jeopardy-img.jpg" id="final-jeopardy-logo-img"></h2>'+
        	finalImage + '<h2 id="final-jeopardy-question" class="question-text">' +
            currentBoard['question'] + '</h2><div id="show-question-box"><button class="btn" id="final-jeopardy-question-button">Show Question</button></div>' +
            '<button class="btn" id="final-jeopardy-answer-button">Show Final Answer</button>');
            $('#main-board').css('background-color', '#F9C203');
            $('#final-jeopardy-question').hide();
        $('#final-jeopardy-answer-button').hide();
        if (finalquestionMedia){ 
            loadMedia(finalquestionMedia,'#final-image')
            $('#final-jeopardy-question').addClass("caption");
            $('#final-image').hide();
        }
        else {
            $('#final-image').empty().hide();
        }
    }
    else {
        $('#end-round').show();
        board.css('background-color', 'black');
        var columns = currentBoard.length;

        // Floor of width/12, for Bootstrap column width appropriate for the number of categories
        var column_width = parseInt(12/columns);
        $.each(currentBoard, function(i,category){
            // Category
            var header_class = 'col-md-' + column_width;
            if (i === 0 && columns % 2 != 0){ //if the number of columns is odd, offset the first one by one to center them
                header_class += ' col-md-offset-1';
            }
            $('#main-board-categories').append('<div class="category ' + header_class
                + '"><div class="text-center well"><div class="category-title category-text text-center">' + category.name
                 + '</div></div><div class="clearfix"></div></div>').css('background-color', 'black');

            // Column
            var div_class = 'category col-md-' + column_width;
            if (i === 0 && columns % 2 != 0){
                div_class += ' col-md-offset-1';
            }
            board.append('<div class="' + div_class + '" id="cat-' +
                i + '" data-category="' + i + '"></div>');
            var column = $('#cat-'+i);

            $.each(category.questions, function(n,question){
                // Questions
                column.append('<div class="well question unanswered text-center" data-question="' +
                    n + '">' + question.value + '</div>');
            });
        });
    }
    $('#main-board-categories').append('<div class="clearfix"></div>');
    var textHeight = Math.max.apply(null, ($('.category-title').map(function(){return $(this).height();})));
    var width = Math.max.apply(null, ($('.category-title').map(function(){return $(this).parent().width();})));
    // If possible to keep aspect ratio, switch to it.
    //var aspectRatioHeight = width * .75;
    var aspectRatioHeight = width * (9 / 16);
    var height = Math.max(textHeight, aspectRatioHeight);
    $('.category-title').height(height).width(width);
}

function handleAnswer(){
    $('#answer-show-button').click(function(){
        var answerMedia = $('#answer-show-button').data('media');
        $(this).hide();
        $('#question-media').hide();
        $('#question').hide();
        if (answerMedia){
            loadMedia(answerMedia,'#answer-media')
            $('#answer-media').show()
            $('#answer-text').addClass("caption");
        } else {
            $('#answer-media').hide()
        }
        $('#answer-text').show();
    });

    $('#answer-close-button').click(function(){
        var tile = $('div[data-category="' + $(this).data('category') + '"]>[data-question="' +
            $(this).data('question') + '"]')[0];
        $(tile).empty().append('&nbsp;<div class="clearfix"></div>').removeClass('unanswered').unbind().css('cursor','not-allowed');
        $('#question').removeClass("caption");
        $('#answer-media').hide()
        $('#answer-show-button').data('media', null);
        $('#answer-text').removeClass("caption");
        $('#question-modal').modal('hide');
    });
}

function loadMedia(media, elementID){
    if (media.startsWith("http")) {
        // srcPrefix = ''
        $(elementID).empty().append(`<iframe frameborder="0"
            scrolling="no" 
            style="overflow:hidden;
            height:100%;width:100%"
            height="100%" 
            width="100%" 
            src=" ` + media.replace("watch?v=", "embed/") + `"> </iframe>`).show();
    } else if(media.endsWith(".mp4")) {
        srcPrefix = './'
        $(elementID).empty().append("<video src=" + srcPrefix + media + ` 
        "type="video/mp4" controls> </video>"`).show();
    } else if(media.endsWith(".png")) {
        srcPrefix = './'
        $(elementID).empty().append("<img src=" + srcPrefix + media + ">").show();
    } else {
        srcPrefix = './'
    }
}