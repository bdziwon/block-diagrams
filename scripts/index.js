var blocksOnBoard = [];
var selectedBlock = undefined;

$(function () {
    $("#blok-startowy").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#draggable1").draggable({ //TODO: pozmieniać id innych bloków jak wyżej
        helper: "clone",
        cursor: 'move'
    });
    $("#draggable2").draggable({
        helper: "clone",
        cursor: 'move'
    });
     $("#draggable3").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#container").droppable({
        drop: function (event, ui) {
            var $canvas = $(this);
            if (!ui.draggable.hasClass('canvas-element')) {
                var $canvasElement = ui.draggable.clone();

                //sprawdzanie czy dodawany blok jest dozwolony
                if ($canvasElement.hasClass('disabled-div')) {
                  return;
                }

                $canvasElement.addClass('canvas-element');
                $canvasElement.draggable({
                    containment: '#container'
                });
                $canvas.append($canvasElement);
                $canvasElement.css({
                    left: (ui.position.left),
                    top: (ui.position.top + 60),
                    position: 'absolute'
                });

                //otwieranie prawego menu po nacisnięciu
                $canvasElement.click(function(){
                  openDivMenu($canvasElement);
                });

                //dodawanie bloku start/koniec
                if ($canvasElement.hasClass('blok-startowy')) {
                  insertStartAndEndBlock($canvasElement);
                }
            }
        }
    });
});

function insertStartAndEndBlock($canvasElement) {
  var sameBlocks = 0;
  var text;

  //sprawdzanie istniejących bloków start/koniec
  $(blocksOnBoard).each(function(i, div) {
    if (div.hasClass('blok-startowy')) {
      sameBlocks++;
      text = div.text();
    }
  });

  //jeśli istnieją dwa bloki start/koniec to nie dodajemy
  if (sameBlocks >= 2) {
    removeDiv($canvasElement);
    return;
  }

  //jeśli istnieje już jeden blok, to znaczy że po operacji będą dwa
  //więc blokujemy dodawanie bloków start/koniec
  if (sameBlocks == 1) {
    $('#blok-startowy').addClass('disabled-div');
    $('#blok-startowy').removeClass('enabled-div');
  }

  //jeśli nie ma żadnego bloku to tworzymy blok startu
  if (sameBlocks == 0) {
    $canvasElement.text('START');
    blocksOnBoard.push($canvasElement);
    return;
  }

  //jeśli jest już blok startu to tworzymy blok końca
  if (text == 'START') {
    $canvasElement.text('KONIEC');
    blocksOnBoard.push($canvasElement);
    return;
  } else {
    //w przeciwnym wypadku blok startu
    $canvasElement.text('START');
    blocksOnBoard.push($canvasElement);
    return;
  }
}

//usuwa diva
function removeDiv($div) {
  //jeśli usunięto diva start/koniec to odblokowuje dodawanie
  if ($div.hasClass('blok-startowy')) {
    $('#blok-startowy').addClass('enabled-div');
    $('#blok-startowy').removeClass('disabled-div');

  }
  //usuwanie diva z tablicy
  blocksOnBoard.splice($.inArray($div, blocksOnBoard), 1 );

  //usuwanie diva z widoku
  $div.remove();
}

function openDivMenu($div) {
  //zamykanie poprzednio wybranego diva
  closeDivMenu(selectedBlock);

  //oznaczanie aktualnego diva jako wybrany
  selectedBlock = $div;
  $div.addClass('selectedBlok');

  //TODO: więcej opcji na prawym pasku
  $('#pressedBlockInfo').html('<button id="removeDivButton" type="button">Usuń blok</button>');
  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });
  });
}

//zamyka menu dla wybranego diva
function closeDivMenu($div) {
  if ($div != undefined) {
    $div.addClass('blok');
    $div.removeClass('selectedBlok');

    $('#pressedBlockInfo').html(
    '<div class="jumbotron">'+
      '<h3>Naciśnij na blok po dodaniu aby zobaczyć więcej informacji</h3>'+
    '</div>'
  );

  }
}
