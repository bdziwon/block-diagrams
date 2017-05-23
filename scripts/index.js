var blocksOnBoard = [];
var selectedBlock = undefined;

$(function () {
    $("#blok-startowy").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#blok-procesu").draggable({
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
      if (div.text() == "START") {
        sameBlocks++;
        text = div.text();
      }
    }
  });

  //jeśli istnieje już blok start to nie dodajemy to nie dodajemy
  if (sameBlocks >= 2 && canvasElement.text() == "START") {
    removeDiv($canvasElement);
    return;
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

  //przesuwanie diva na szczyt
  $div.parent().append($div);


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
    openProcessBlockMenu($div);
    return;
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

function openProcessBlockMenu($div) {
  var html    = "";
  var header  = "Blok procesu";
  var description   = "Umożliwia takie działania jak deklaracja zmiennych, przypisywanie, oraz działania arytmetyczno-logiczne"
  var saveButton    = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton  = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";
  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wpisz kod"+"</h4>"+
    "<p>"+"Każdą linię zakończ średnikiem"+"</p>"+
    "<textarea class='codeTextArea'></textarea>"+
    "<div class='btn-group'>"+
      ""+saveButton+
      ""+deleteButton+
    "</div>"+
  "</div>"

  $('#pressedBlockInfo').html(html);



  $(document).ready(function(){

    var blockContent = $div.text();
    if (blockContent != undefined) {
        $(".codeTextArea").text(blockContent);
    }
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    $('#saveDivButton').click(function() {
      saveProcessBlock($div);
    });
  });

}

function openIOBlockMenu($div) {
  var html = "";
  var header = "Blok wejścia/wyjścia";
  var description = "Umożliwia m.in. wczytywanie danych od użytkownika.";
  var saveButton = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";

  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wypisz/Wczytaj daną"+"</h4>"+
    "<p>"+"Umieść tekst w cudzysłowiu jeśli chcesz go wypisać zamiast zmiennej"+"</p>"+
    "<table id='table' class='table table-hover'>"+
      "<th>"+
        "<tr>"+
          "<th>Nazwa zmiennej</th>"+
          "<th>Działanie</th>"+
        "</tr>"+
      "</th>"+
    "</table>"+
    "<p><button id='addRowButton' type='button' class='btn btn-primary'>"+
      "<span class='glyphicon glyphicon-plus'></span>  Dodaj wiersz"+
    "</button></p>"+
    "<div class='btn-group'>"+
      ""+saveButton+
      ""+deleteButton+
    "</div>"+
  "<div>";

  var blockContent = $div.text().split(";");
  $(document).ready(function(){
    if (blockContent.length > 1) {

      for (var i = 0; i < blockContent.length; i++) {
        var content = blockContent[i].split("(");
        if (content.length >= 2) {
          var value = content[0];
          var varname = content[1].replace(")","");
        } else {
          continue;
        }
        var table = document.getElementById('table');
        addIOTableRow(table,varname,value);
      }
    }
  });

  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    //dodawanie wiersza
    $('#addRowButton').click(function(){
      var table = document.getElementById('table');
      addIOTableRow(table);

    });

    $('#saveDivButton').click(function() {
      saveIOBlock($div);
    });
  });
}


function saveProcessBlock($div) {
  var blockContent = "<div class='bubble'><p><br/>";
  var errors = "";
  blockContent += $(".codeTextArea").val();
  blockContent += "<br/></p></div>";
  var lines = blockContent.split(";").length;
  $div.height(10 + lines * 15);
  $div.html(blockContent);
}

function saveIOBlock($div) {
  var blockContent = "<div class='bubble process-skewx'><p><br/>";
  var errors = "";

  $("tr.move").each(function() {
    $this = $(this);
    var varname = $this.find("input.var").val();
    var value = $this.find("select.value").val();

    if (value == 'wczytaj') {
      if (properVariableName(varname)) {
        blockContent += "wczytaj("+varname+");<br/>";
        return true;
      }
      errors += "Nazwa zmiennej niedozwolona ("+varname+")";
      return true;
    }

    if (value == 'wypisz') {
      //sprawdzanie czy to tekst do wypisania
      if ((varname.charAt(0) == '\"') && (varname.charAt(varname.length-1) == '\"')) {
        blockContent += "wypisz("+varname+");<br/>";
        return true;
      }

      if (properVariableName(varname)) {
        blockContent += "wypisz("+varname+");<br/>";
        return true;
      } else {
        errors += "Nazwa zmiennej niedozwolona ("+varname+")";
      }
    }
  });

  blockContent += "<br/></p></div>";
  var lines = blockContent.split("<br/>").length;
  $div.height(lines * 15);
  $div.width($div.height() + 80);
  $div.html(blockContent);
  console.log(errors);
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


function move(sender) {
  console.log('test');
  var row = $(sender).closest('tr');
  if ($(sender).hasClass('up')) {
    if (row.prev().hasClass('move')) {
      row.prev().before(row);
    }
  } else {
    row.next().after(row);
  }
}

function addIOTableRow(table, varname, value) {
  var row = table.insertRow(table.rows.length);
  row.className += " move";
  var inputCell = row.insertCell(0);
  var optionCell = row.insertCell(1);

  if (varname == undefined) {
    varname = "";
  }
  if (value == undefined) {
    value = 'wypisz';
  }
  inputCell.innerHTML =
  "<div class='form-group'>"+
      "<input type='text' value='"+varname+"' pattern='^[a-zA-Z0-9 ]' class='var form-control'>"+
      "<div class='btn-group'>"+
        "<input type='button' value='W górę' class='btn btn-primary move up' onclick='move(this)'/>"+
        "<input type='button' value='W dół' class='btn btn-primary move down' onclick='move(this)'/>"+
      "</div>"
  "</div>";

  optionCell.innerHTML =
  "<div class='form-group'>"+
      "<select class='form-control value'>"+
        "<option value='wypisz'>wypisz</option>"+
        "<option value='wczytaj'>wczytaj</option>"+
      "</select>"+
      "<input type='button' value='Usuń' class='btn btn-danger move' onclick='deleteRow(this)'/>"+

    "</div>";

    $(optionCell).find("select option[value='"+value+"']").attr("selected","selected");

}

function deleteRow(r) {
    var i = r.parentNode.parentNode.parentNode.rowIndex;
    document.getElementById("table").deleteRow(i);
}
