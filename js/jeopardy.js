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
        console.log('modal show');
    });
    $('#question-modal').on('hidden.bs.modal', function (e) {
        console.log('modal close');
        $('#question-media').show();
        $('#question').show();
    });
    $('#input-file').click(function(){
        $('#game-title').removeClass("blink");
    });
    
    $(document).on('click', '.unanswered', function(){
        //event bound to clicking on a tile. it grabs the data from the click event, populates the modal, fires the modal, and binds the answer method
        var category = $(this).parent().data('category');
        var question = $(this).data('question');
        var answer = currentBoard[category].questions[question].answer;
        var value = currentBoard[category].questions[question].value;
        var questionMedia = currentBoard[category].questions[question].media;
        var isDailyDouble = 'daily-double' in currentBoard[category].questions[question] ?
            currentBoard[category].questions[question]['daily-double'] : false;

        if (isDailyDouble) { 
            $('#daily-double-modal').modal('show');
        }

        $('#modal-answer-title').empty().text(currentBoard[category].name + ' - ' + value);
        $('#question').empty().text(currentBoard[category].questions[question].question);
        if (questionMedia){
            if (questionMedia.startsWith("http")) {
                console.log('web link');
                // srcPrefix = ''
                $('#question-media').empty().append(`<iframe src=" ` + questionMedia.replace("watch?v=", "embed/") + `"> </iframe>`).show();
            } else if(questionMedia.endsWith(".mp4")) {
                console.log('video');
                srcPrefix = './'
                $('#question-media').empty().append("<video src=" + srcPrefix + questionMedia + ` "type="video/mp4" controls> </video>"`).show();

            } else if(questionMedia.endsWith(".png")) {
                console.log('image');
                srcPrefix = './'
                $('#question-media').empty().append("<img src=" + srcPrefix + questionMedia + ">").show();
            } else {
                srcPrefix = './'
            }

            $('#question').addClass("caption");
        }
        else {
            $('#question-media').empty().hide();
        }
        $('#answer-text').text(answer).hide();
        $('#question-modal').modal('show');
        $('#answer-close-button').data('question', question).data('category', category);
        $('#answer-show-button').show();
        handleAnswer();
    });
    $(document).on('click', '#final-jeopardy-question-button', function(){
        $(this).hide();
        $('#final-jeopardy-question').show();
        $('#final-image').show();
        $('#final-jeopardy-logo-img').hide();
        $('#final-jeopardy-answer-button').show();
    });
    $(document).on('click', '#final-jeopardy-answer-button',function(){
        $(this).hide();
        $('#final-jeopardy-question').text(currentBoard['answer']);
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
        finalquestionMedia = currentBoard['image'];
        $('#end-round').hide();
        $('#main-board-categories').append('<div class="text-center  col-md-6 col-md-offset-3"><h2 class="category-text">' +
            currentBoard['category'] + '</h2></div>').css('background-color', '#F9C203');
        finalImage = '<div id="final-image" class="text-center"></div>';
        board.append('<div class="text-center final-panel col-md-6 col-md-offset-3"><h2><img src="./images/final-jeopardy-img.jpg" id="final-jeopardy-logo-img"></h2>'+
        	finalImage + '<h2 id="final-jeopardy-question" class="question-text">' +
            currentBoard['question'] + '</h2><div id="show-question-box"><button class="btn" id="final-jeopardy-question-button">Show Question</button></div>' +
            '<button class="btn" id="final-jeopardy-answer-button">Show Final Answer</button>');
            $('#main-board').css('background-color', '#F9C203');
            $('#final-jeopardy-question').hide();
        $('#final-jeopardy-answer-button').hide();
        if (finalquestionMedia){
            if (finalquestionMedia.startsWith("http") || finalquestionMedia.startsWith("data")) {
                srcPrefix = ''
            }
            else {
                srcPrefix = './'
            }
           $('#final-image').empty().append("<img src=" + srcPrefix + finalquestionMedia + ">").hide();
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
        $(this).hide();
        $('#question-media').hide();
        $('#question').hide();
        $('#answer-text').show();
    });
    $('#answer-close-button').click(function(){
        var tile = $('div[data-category="' + $(this).data('category') + '"]>[data-question="' +
            $(this).data('question') + '"]')[0];
        $(tile).empty().append('&nbsp;<div class="clearfix"></div>').removeClass('unanswered').unbind().css('cursor','not-allowed');
        $('#question').removeClass("caption");
        $('#question-modal').modal('hide');
    });
}

