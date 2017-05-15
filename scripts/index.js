var blocksOnBoard = [];
var selectedBlock = undefined;

$(function () {
    $("#blok-startowy").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#blok-procesu").draggable({ //TODO: pozmieniać id innych bloków jak wyżej
        helper: "clone",
        cursor: 'move'
    });
    $("#blok-decyzyjny").draggable({
        helper: "clone",
        cursor: 'move'
    });
     $("#blok-wejscia-wyjscia").draggable({
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
                if ($canvasElement.hasClass('blok-wejscia-wyjscia')) {
                  insertIOBlock($canvasElement);
                }
            }
        }
    });
});

function insertIOBlock($canvasElement) {
  $canvasElement.html("<p>pusty</p>");
  blocksOnBoard.push($canvasElement);
}

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

  //poszczególne menu
  if ($div.hasClass('blok-startowy')) {
    openStartAndEndBlockMenu($div);
    return;
  }
  if($div.hasClass('blok-wejscia-wyjscia')) {
    openIOBlockMenu($div);
    return;
  }
  if($div.hasClass('blok-procesu')) {

  }
  if ($div.hasClass('blok-decyzyjny')){

  }

  $('#pressedBlockInfo').html("<p><button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button></p>");
  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });
  });
}

function openIOBlockMenu($div) {
  var html = "";
  var header = "Blok wejścia/wyjścia";
  var description = "Umożliwia m.in. wczytywanie danych od użytkownika.";
  var saveButton = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";
  var rows = 1;

  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wypisz/Wczytaj daną"+"</h4>"+
    "<p>"+"Umieść tekst w cudzysłowiu jeśli chcesz go wypisać zamiast zmiennej"+"</p>"+
    "<table class='table table-hover'>"+
      "<thead>"+
        "<tr>"+
          "<th>Nazwa zmiennej</th>"+
          "<th>Działanie</th>"+
        "</tr>"+
      "</thead>"+
      "<tbody id='table-body'>"+
        "<tr>"+
          "<td>"+
          "<div class='form-group'>"+
              "<input id='var-"+rows+"' type='text' pattern='^[a-zA-Z0-9 ]' class='form-control'>"+
          "</div>"+
          "</td>"+
          "<td>"+
            "<div class='form-group'>"+
              "<select id='value-"+rows+"' class='form-control'>"+
                "<option>wypisz</option>"+
                "<option>wczytaj</option>"+
              "</select>"+
            "</div>"+
          "</td>"+
        "</tr>"+
      "</tbody>"+
    "</table>"+
    "<p><button id='addRowButton' type='button' class='btn btn-primary'>"+
      "<span class='glyphicon glyphicon-plus'></span>  Dodaj wiersz"+
    "</button></p>"+
    "<div class='btn-group'>"+
      ""+saveButton+
      ""+deleteButton+
    "</div>"+
  "<div>";

  rows++;
  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    //dodawanie wiersza
    $('#addRowButton').click(function(){
      var html = $("#table-body").html()+
      "<tr>"+
        "<td>"+
        "<div class='form-group'>"+
            "<input id='var-"+rows+"' type='text' pattern='^[a-zA-Z0-9 ]' class='form-control'>"+
        "</div>"+
        "</td>"+
        "<td>"+
          "<div class='form-group'>"+
            "<select id='value-"+rows+"' class='form-control'>"+
              "<option value='wypisz'>wypisz</option>"+
              "<option value='wczytaj'>wczytaj</option>"+
            "</select>"+
          "</div>"+
        "</td>"+
      "</tr>";

      rows++;
      $("#table-body").html(html);
    });

    $('#saveDivButton').click(function() {
      var i = 1;
      var blockContent = "<div class='bubble'><p><br/>";
      var errors = "";

      for (i = 1; i < rows; i++) {

        var varname = $('#var-'+i).val();
        var value = $('#value-'+i).find('option:selected').text();

        if (value == 'wczytaj') {
          if (properVariableName(varname)) {
            blockContent += "wczytaj("+varname+");<br/>";
            continue;
          }
          errors += "Nazwa zmiennej niedozwolona ("+varname+")";
          continue;
        }

        if (value == 'wypisz') {
          //sprawdzanie czy to tekst do wypisania
          if ((varname.charAt(0) == '\"') && (varname.charAt(varname.length-1) == '\"')) {
            blockContent += "wypisz("+varname+");<br/>";
            continue;
          }

          if (properVariableName(varname)) {
            blockContent += "wypisz("+varname+");<br/>";
            continue;
          } else {
            errors += "Nazwa zmiennej niedozwolona ("+varname+")";
          }
        }
      }
      blockContent += "<br/></p></div>";
      var lines = blockContent.split("<br/>").length;
      $div.height(lines * 15);
      $div.width($div.height() + 80);
      $div.html(blockContent);

      console.log(errors);

    });


  });
}

function properVariableName(varname) {
  //TODO: sprawdzanie czy nazwa zmiennej jest poprawna
  return true;
}

function openStartAndEndBlockMenu($div) {
  var html = "";
  var header = "";
  var description = "";
  var deleteButton = "";
  if ($div.text() == "START") {
    header = "Blok START";
    description = "Stanowi początek algorytmu, może być tylko jeden";
  } else {
    header = "Blok KONIEC";
    description = "Stanowi koniec algorytmu";
  }
  deleteButton = "<p><button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button></p>";

  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    ""+deleteButton+
  "<div>";

  $('#pressedBlockInfo').html(html);

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
