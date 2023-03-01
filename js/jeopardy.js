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
                $("#player-1-name").empty().text(playerTranslation[1]);
                $("#player-2-name").empty().text(playerTranslation[2]);
                $("#player-3-name").empty().text(playerTranslation[3]);
                loadBoard();
                var boardFillSound = new Audio('./sounds/board_fill.mp3');
                boardFillSound.play();
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
        var endRoundSound = new Audio('./sounds/end_of_round.mp3');
        endRoundSound.play();
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
            var dailyDoubleSound = new Audio('./sounds/daily_double.mp3');
            dailyDoubleSound.play();
            $('#daily-double-modal-title').empty().text(currentBoard[category].name + ' - ' + value);
            $('#daily-double-wager-input').val('');
            $('#daily-double-modal').modal('show');
        }
        else {
            // Candidate for refactoring.
            $('#modal-answer-title').empty().text(currentBoard[category].name + ' - ' + value);
            $('#question').empty().text(currentBoard[category].questions[question].question);
            if (questionMedia){
                if (questionMedia.startsWith("http")) {
                    console.log('web link');
                    srcPrefix = ''
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
        }
        handleAnswer();
    });
    $(document).on('click', '#final-jeopardy-question-button', function(){
        $(this).hide();
        $('#final-jeopardy-question').show();
        var revealSound = new Audio('./sounds/final_jeopardy.mp3');
        revealSound.play();
        $('#final-image').show();
        $('#final-jeopardy-logo-img').hide();
        $('#final-jeopardy-music-button').show();
        // console.log('30 seconds, good luck'); Cue music
    });
    $(document).on('click', '#final-jeopardy-music-button',function(){
        $(this).hide();
        var thinkMusicSound = new Audio('./sounds/think_music.mp3');
        thinkMusicSound.play();

        setTimeout(function(){
            $('#final-jeopardy-answer-button').show();
        }, 30000);
    });
    $(document).on('click', '#final-jeopardy-answer-button',function(){
        $(this).hide();
        $('#final-jeopardy-modal-answer').text(currentBoard['answer']);
        $('#final-jeopardy-modal-answer').hide();
        $('#final-jeopardy-modal').modal('show');
        handleFinalAnswer();
    });
});

var score_player_1 = 0;
var score_player_2 = 0;
var score_player_3 = 0;
var control = 1;
var rounds = ['jeopardy', 'double-jeopardy', 'final-jeopardy'];
var playerTranslation = {1: 'Red', 2: 'Blue', 3: 'Green'};
var currentBoard;
var currentRound = 0;
var isTimerActive = false;
var timerMaxCount = 5;
var timerObject;
var timerCount;
var gameDataFile;

function runTimer() {
    timerObject = setTimeout(function(){
        timerCount++;
        $('.timer-set-' + timerCount).css('background-color', 'black');
        if (timerCount < timerMaxCount) {
            runTimer();
        }
        else {
            var timeUpAudio = new Audio('./sounds/time_up.mp3');
            timeUpAudio.play();
            // Doo doo doo
            resetTimer();
        }
    }, 1000);
}

function resetTimer() {
    clearTimeout(timerObject);
    isTimerActive = false;
    timerCount = 0;
    $('.timer-square').css('background-color', 'black');
}


function loadBoard() {
    //function that turns the board.json (loaded in the the currentBoard variable) into a jeopardy board
    var board = $('#main-board');
    if (rounds[currentRound] === "final-jeopardy") {
        finalquestionMedia = currentBoard['image'];
        $('#end-round').hide();
        $('#control-info').hide();
        $('#main-board-categories').append('<div class="text-center col-md-6 col-md-offset-3"><h2 class="category-text">' +
            currentBoard['category'] + '</h2></div>').css('background-color', 'navy');
        finalImage = '<div id="final-image" class="text-center"></div>';
        board.append('<div class="text-center col-md-6 col-md-offset-3"><h2><img src="./images/final_jeopardy.png" id="final-jeopardy-logo-img"></h2>'+
        	finalImage + '<h2 id="final-jeopardy-question" class="question-text">' +
            currentBoard['question'] + '</h2><button class="btn btn-primary" id="final-jeopardy-question-button">Show Question</button>' +
            '<button class="btn btn-primary" id="final-jeopardy-music-button">30 Seconds, Good Luck</button>' +
            '<button class="btn btn-primary" id="final-jeopardy-answer-button">Show Answer</button></div>').css('background-color', 'navy');
        $('#final-jeopardy-question').hide();
        $('#final-jeopardy-music-button').hide();
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
        $('#wager-player-1-input').attr("placeholder", playerTranslation[1] + " Wager");
        $('#wager-player-2-input').attr("placeholder", playerTranslation[2] + " Wager");
        $('#wager-player-3-input').attr("placeholder", playerTranslation[3] + " Wager");
    }
    else {
	    if (rounds[currentRound] === "double-jeopardy") {
		    if (score_player_1 <= score_player_2 && score_player_1 <= score_player_3) {
			    control = 1;
		    }
		    else if (score_player_2 <= score_player_3) {
			    control = 2;
		    }
		    else {
			    control = 3;
		    }
	    }
        $('#control-player').empty().text(playerTranslation[control]);
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
    $('.score-button').unbind("click").click(function(e){
        e.stopPropagation();
        var buttonID = $(this).attr("id");
        var answerValue = parseInt($(this).data('value'));
        var buttonAction = buttonID.substr(3, 5);
        var playerNumber = buttonID.charAt(1);
        var scoreVariable = 'score_player_' + playerNumber;

        buttonAction === 'right' ? window[scoreVariable] += answerValue
            : window[scoreVariable] -= answerValue;
        $(this).prop('disabled', true);
        var otherButtonID = '#p' + playerNumber + '-' + (buttonAction === 'right' ? 'wrong' : 'right') + '-button';
        $(otherButtonID).prop('disabled', true);
        resetTimer();

        // Possible behavior of disabling all scoring after a right answer?
        if (buttonAction === 'right') {
            var tile = $('div[data-category="' + $(this).data('category') + '"]>[data-question="' +
                $(this).data('question') + '"]')[0];
            //console.log(tile);
            $('#question-modal .score-button').prop('disabled', true);
            control = playerNumber;

            $(tile).empty().append('&nbsp;<div class="clearfix"></div>').removeClass('unanswered').unbind().css('cursor','not-allowed');
            $('#question-modal').modal('hide');

        }
    });

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

    $('#timer-grid').unbind("click").click(function(e){
        e.stopPropagation();
        if (isTimerActive) {
            resetTimer();
        }
        else {
            $('.timer-square').css('background-color', 'red');
            isTimerActive = true;
            timerCount = 0;
            runTimer();
        }
        //isTimerActive = isTimerActive ? false : true;
    });
}

function handleFinalAnswer(){
    $('.final-score-button').unbind('click').click(function(e){
        e.stopPropagation();
        var buttonID = $(this).attr("id");
        var buttonAction = buttonID.substr(9,5);
        var playerNumber = buttonID.charAt(7);
        var wagerID = '#wager-player-' + playerNumber + '-input';
        var wager = $(wagerID).val() == '' ? 0 : parseInt($(wagerID).val());
        var scoreVariable = 'score_player_' + playerNumber;
        var otherButtonID = '#final-p' + playerNumber + '-' +
            (buttonAction === 'right' ? 'wrong' : 'right') + '-button';

        buttonAction === 'right' ? window[scoreVariable] += wager : window[scoreVariable] -= wager;

        $(this).prop('disabled', true);
        $(otherButtonID).prop('disabled', true);
        $(wagerID).prop('disabled', true).val('$' + window[scoreVariable]);
    });


    $('#final-answer-show-button').click(function(){
        $(this).hide();
        $('#final-jeopardy-modal-answer').show();
    });

}
