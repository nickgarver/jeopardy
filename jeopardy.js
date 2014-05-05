$(function(){
    $.ajax({//ajax method to load the board.json and call the loadBoard() function on success 
        'async': false,
        'global': false,
        type:'GET',
        dataType:'json',
        url:'board_pretty.json',
        success:function(data){
            map = data;
            loadBoard();
        }
    });
    $('.unanswered').click(function(){
        //event bound to clicking on a tile. it grabs the data from the click event, populates the modal, fires the modal, and binds the answer method
        var category = $(this).parent().data('category');
        var question = $(this).data('question');
        var answer = map[category].questions[question].answer;
        var value = map[category].questions[question].value;

        $('.modal-title').empty().text(map[category].name + ' - $' + value);
        $('#question').empty().text(map[category].questions[question].question);
        $('#answer-text').text(answer).hide();
        $('#question-modal').modal('show'); //fire modal
        $('#answer-close-button').hide().data('question', question).data('category', category);
        $('#answer-show-button').show();
        $('#question-modal .score-button').prop('disabled', false);
        $('#question-modal .score-button').data('value', value);
        // console.log(category, question);
        // console.log(map[category].questions[question]);
        handleAnswer();
    });

});

var score_player_1 = 0;
var score_player_2 = 0;
var score_player_3 = 0;
var map;

function loadBoard() {
    //function that turns the board.json (loaded in the the map variable) into a jeopardy board
    var board = $('#main-board');
    var columns = map.length;
    var column_width = parseInt(12/columns); //get the width/12 rounded down, to use the bootstrap column width appropriate for the number of categories
    console.log(columns);
    $.each(map, function(i,category){
        //load category name
        var header_class = 'text-center col-md-' + column_width; 
        if (i === 0 && columns % 2 != 0){ //if the number of columns is odd, offset the first one by one to center them

            header_class += ' col-md-offset-1';
        }
        $('.panel-heading').append(
            '<div class="'+header_class+'"><h4>'+category.name+'</h4></div>'
        );
        //add column
        var div_class = 'category col-md-' + column_width;
        if (i === 0 && columns % 2 != 0){
            div_class += ' col-md-offset-1';
        }
        board.append('<div class="'+div_class+'" id="cat-'+i+'" data-category="'+i+'"></div>');
        var column = $('#cat-'+i);
        $.each(category.questions, function(n,question){
            //add questions
            column.append('<div class="well question unanswered text-center" data-question="'+n+'">$'+question.value+'</div>')
        });
    });
    $('.panel-heading').append('<div class="clearfix"></div>')

}

function updateScore(){
    $('#player-1-score').empty().text(score_player_1);
    $('#player-2-score').empty().text(score_player_2);
    $('#player-3-score').empty().text(score_player_3);
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
        // console.log(buttonID + " " + answerValue + " " + scoreVariable + " " + window[scoreVariable]);
        $(this).prop('disabled', true);
        var otherButton = '#p' + playerNumber + '-' + (buttonAction === 'right' ? 'wrong' : 'right') + '-button';
        $(otherButton).prop('disabled', true);
        // Possible behavior of disabling all scoring after a right answer?
        updateScore();
    });
    
    $('#answer-show-button').click(function(){
        $(this).hide();
        $('#answer-text').show();
        $('#answer-close-button').show();
    });
    $('#answer-close-button').click(function(){
        var tile = $('div[data-category="'+$(this).data('category')+'"]>[data-question="'+$(this).data('question')+'"]')[0];
        $(tile).text('---').removeClass('unanswered').unbind().css('cursor','not-allowed');
        $('#question-modal').modal('hide');
    });
}
